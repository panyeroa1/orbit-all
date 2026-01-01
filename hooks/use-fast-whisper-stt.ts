"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface FastWhisperTranscript {
  text: string;
  isFinal: boolean;
  timestamp: number;
  language?: string;
}

interface UseFastWhisperSTTOptions {
  language?: string;
  serverUrl?: string;
  sourceType?: "microphone" | "system" | "both";
}

interface UseFastWhisperSTTReturn {
  transcript: FastWhisperTranscript | null;
  isListening: boolean;
  start: () => Promise<void>;
  stop: () => void;
  error: string | null;
}

const DEFAULT_WHISPER_URL = process.env.NEXT_PUBLIC_FAST_WHISPER_WS_URL || "wss://whisper.eburon.ai/ws";

export function useFastWhisperSTT(
  options: UseFastWhisperSTTOptions = {},
  audioStream: MediaStream | null = null
): UseFastWhisperSTTReturn {
  const { language = "en", serverUrl = DEFAULT_WHISPER_URL, sourceType = "microphone" } = options;

  const [transcript, setTranscript] = useState<FastWhisperTranscript | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setIsListening(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);

    try {
      let stream: MediaStream;

      if (sourceType === "both") {
        let micStream = audioStream;
        if (!micStream) {
            micStream = await navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
            });
        }
        
        const systemStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        
        if (systemStream.getAudioTracks().length === 0) {
          if (!audioStream) micStream.getTracks().forEach(t => t.stop());
          systemStream.getTracks().forEach(t => t.stop());
          throw new Error("No system audio detected. Please check 'Share Audio' checkbox.");
        }

        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const destination = audioContext.createMediaStreamDestination();

        const micSource = audioContext.createMediaStreamSource(micStream);
        const systemSource = audioContext.createMediaStreamSource(new MediaStream(systemStream.getAudioTracks()));

        micSource.connect(destination);
        systemSource.connect(destination);

        stream = destination.stream;
        streamRef.current = new MediaStream([
            ...(audioStream ? [] : micStream.getTracks()),
            ...systemStream.getTracks(), 
            ...stream.getTracks()
        ]);

      } else if (sourceType === "system") {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        if (stream.getAudioTracks().length === 0) {
          stream.getTracks().forEach(t => t.stop());
          throw new Error("No system audio detected. Please check 'Share Audio' checkbox.");
        }
        streamRef.current = stream;
      } else {
        if (audioStream) {
            stream = audioStream;
        } else {
            stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
            });
            streamRef.current = stream;
        }
      }

      // Connect to Fast Whisper WebSocket
      const wsUrl = `${serverUrl}?language=${language}`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("[FastWhisper] WebSocket connected");
        setIsListening(true);

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm",
        });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        };

        mediaRecorder.start(250); // Send audio every 250ms
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Fast Whisper typically returns: { text: string, is_final: boolean, language: string }
          if (data.text) {
            setTranscript({
              text: data.text,
              isFinal: data.is_final || data.isFinal || false,
              timestamp: Date.now(),
              language: data.language,
            });
          }
        } catch (e) {
          console.error("[FastWhisper] Error parsing message:", e);
        }
      };

      socket.onerror = (event) => {
        console.error("[FastWhisper] WebSocket error:", event);
        setError("Fast Whisper connection error");
        stop();
      };

      socket.onclose = () => {
        console.log("[FastWhisper] WebSocket closed");
        setIsListening(false);
      };
    } catch (e) {
      console.error("[FastWhisper] Failed to start:", e);
      setError(e instanceof Error ? e.message : "Failed to start Fast Whisper");
      stop();
    }
  }, [language, serverUrl, sourceType, stop, audioStream]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    transcript,
    isListening,
    start,
    stop,
    error,
  };
}
