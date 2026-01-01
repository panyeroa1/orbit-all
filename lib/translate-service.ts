import { supabase } from "@/lib/supabase";

export interface TranslationEntry {
  id?: string;
  user_id: string;
  meeting_id: string;
  source_lang: string;
  target_lang: string;
  original_text: string;
  translated_text: string;
  created_at?: string;
}

/**
 * Call the translation API to get the translated text
 */
export async function getTranslation(
  text: string, 
  targetLang: string, 
  sourceLang: string = "auto"
): Promise<string | null> {
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        target_lang: targetLang,
        source_lang: sourceLang,
      }),
    });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[TranslateAPI] Route Call Failed (${response.status}):`, errText.slice(0, 200));
          throw new Error(`Translation API error: ${response.statusText}`);
        }

    const data = await response.json();
    return data.translated_text;
  } catch (error) {
    console.error("Failed to get translation:", error);
    return null;
  }
}

/**
 * Save a translation entry to Supabase
 */
export async function saveTranslation(
  entry: Omit<TranslationEntry, "id" | "created_at">
): Promise<{ success: boolean; error?: string }> {
  // console.log("[saveTranslation] Processing entry:", entry);
  
  if (!entry.meeting_id || !entry.user_id) {
    console.warn("[saveTranslation] Missing meeting_id or user_id, skipping save.");
    return { success: false, error: "Missing required IDs" };
  }

  try {
    // 1. Check if a record exists for this user + meeting + target_lang
    const { data: existingRows, error: fetchError } = await supabase
      .from("translations")
      .select("id, original_text, translated_text")
      .eq("meeting_id", entry.meeting_id)
      .eq("user_id", entry.user_id)
      .eq("target_lang", entry.target_lang)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("[saveTranslation] Error checking existing rows:", fetchError);
      // We don't return here; we fall back to insert attempt if check fails, 
      // though ideally we should probably just proceed carefully.
    }

    // 2. If exists, Update (Append)
    if (existingRows && existingRows.length > 0) {
      const existing = existingRows[0];
      const newOriginal = (existing.original_text || "") + " " + entry.original_text;
      const newTranslated = (existing.translated_text || "") + " " + entry.translated_text;

      const { error: updateError } = await supabase
        .from("translations")
        .update({ 
          original_text: newOriginal, 
          translated_text: newTranslated 
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("[saveTranslation] Update failed:", updateError);
        return { success: false, error: updateError.message };
      }
      
      // console.log("[saveTranslation] Successfully appended to row:", existing.id);
      return { success: true };
    }

    // 3. If not exists, Insert New
    const { data, error } = await supabase.from("translations").insert([entry]).select();

    if (error) {
      console.error("[saveTranslation] Insert failed:", error);
      return { success: false, error: error.message };
    }

    console.log("[saveTranslation] Created new row:", data?.[0]?.id);
    return { success: true };

  } catch (e) {
    console.error("[saveTranslation] Unexpected exception:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
