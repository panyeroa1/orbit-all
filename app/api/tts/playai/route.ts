import { NextRequest, NextResponse } from "next/server";

const PLAYAI_API_KEY = process.env.PLAYAI_API_KEY;
const PLAYAI_USER_ID = process.env.PLAYAI_USER_ID;
const PLAYAI_VOICE_URL = process.env.PLAYAI_VOICE_URL || "s3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json";

export async function POST(req: NextRequest) {
  try {
    if (!PLAYAI_API_KEY || !PLAYAI_USER_ID) {
      return NextResponse.json({ error: "Play.ai API credentials not configured" }, { status: 500 });
    }

    const { text, voiceUrl, model } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const response = await fetch("https://api.play.ai/api/v1/tts/stream", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PLAYAI_API_KEY}`,
        "X-USER-ID": PLAYAI_USER_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "Play3.0-mini",
        text,
        voice: voiceUrl || PLAYAI_VOICE_URL,
        outputFormat: "mp3",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Play.ai TTS] Error:", errorText);
      return NextResponse.json({ error: `Play.ai Error: ${errorText}` }, { status: response.status });
    }

    // Stream the audio response
    const audioData = await response.arrayBuffer();
    
    return new NextResponse(audioData, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[Play.ai TTS] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
