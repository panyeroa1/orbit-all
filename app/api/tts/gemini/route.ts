import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const { text, voiceName } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Gemini TTS using the generativelanguage API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Please read this text aloud: "${text}"`,
                },
              ],
            },
          ],
          generationConfig: {
            response_modalities: ["AUDIO"],
            speech_config: {
              voice_config: {
                prebuilt_voice_config: {
                  voice_name: voiceName || "Kore",
                },
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Gemini TTS] Error:", errorText);
      return NextResponse.json({ error: `Gemini Error: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    
    // Extract audio data from Gemini response
    const audioData = data?.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data;
    const mimeType = data?.candidates?.[0]?.content?.parts?.[0]?.inline_data?.mime_type || "audio/wav";

    if (!audioData) {
      return NextResponse.json({ error: "No audio data in Gemini response" }, { status: 500 });
    }

    // Decode base64 audio
    const audioBuffer = Buffer.from(audioData, "base64");
    
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[Gemini TTS] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
