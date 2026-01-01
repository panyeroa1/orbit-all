"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface DeepgramTranscript {
  text: string;
  isFinal: boolean;
  timestamp: number;
  confidence: number;
}

interface UseDeepgramSTTOptions {
  language?: string;
  model?: string;
  sourceType?: "microphone" | "system" | "both";
}

interface UseDeepgramSTTReturn {
  transcript: DeepgramTranscript | null;
  isListening: boolean;
  start: () => Promise<void>;
  stop: () => void;
  error: string | null;
}

export function useDeepgramSTT(
  options: UseDeepgramSTTOptions = {},
  audioStream: MediaStream | null = null
): UseDeepgramSTTReturn {
  const { language = "en", model = "nova-2", sourceType = "microphone" } = options;

  const [transcript, setTranscript] = useState<DeepgramTranscript | null>(null);
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
      // Get temporary token from our API
      const tokenResponse = await fetch("/api/deepgram");
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error || "Failed to get Deepgram token");
      }
      const { key } = await tokenResponse.json();

      let stream: MediaStream;

      if (sourceType === "both") {
        // Mix microphone and system audio
        let micStream = audioStream;
        if (!micStream) {
            micStream = await navigator.mediaDevices.getUserMedia({ 
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
            });
        }
        
        const systemStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        
        if (systemStream.getAudioTracks().length === 0) {
          if (!audioStream) micStream.getTracks().forEach(t => t.stop()); // Only stop if we created it
          systemStream.getTracks().forEach(t => t.stop());
          throw new Error("No system audio detected. Please check 'Share Audio' checkbox.");
        }

        // Use Web Audio API to mix both streams
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const destination = audioContext.createMediaStreamDestination();

        const micSource = audioContext.createMediaStreamSource(micStream);
        const systemSource = audioContext.createMediaStreamSource(new MediaStream(systemStream.getAudioTracks()));

        micSource.connect(destination);
        systemSource.connect(destination);

        // Keep result stream
        stream = destination.stream;
        // Store for cleanup (but don't stop passed audioStream!)
        streamRef.current = new MediaStream([
            ...(audioStream ? [] : micStream.getTracks()), 
            ...systemStream.getTracks(), 
            ...stream.getTracks()
        ]);

      } else if (sourceType === "system") {
        // Capture System Audio
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        if (stream.getAudioTracks().length === 0) {
          stream.getTracks().forEach(t => t.stop());
          throw new Error("No system audio detected. Please check 'Share Audio' checkbox.");
        }
        streamRef.current = stream;
      } else {
        // Default Microphone (or provided stream)
        if (audioStream) {
            stream = audioStream;
            // Do NOT set streamRef.current if we don't want to stop it on cleanup! 
            // OR we handle cleanup carefully.
            // If we set streamRef.current, stop() will called tracks.stop().
            // generally we shouldn't stop the main call stream.
        } else {
            stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
            });
            streamRef.current = stream;
        }
      }

      // Connect to Deepgram WebSocket
      const wsUrl = `wss://api.deepgram.com/v1/listen?model=${model}&language=${language}&smart_format=true&interim_results=true`;
      const socket = new WebSocket(wsUrl, ["token", key]);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("Deepgram WebSocket connected");
        setIsListening(true);

        // Start recording and sending audio
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
          if (data.channel?.alternatives?.[0]) {
            const alternative = data.channel.alternatives[0];
            if (alternative.transcript) {
              setTranscript({
                text: alternative.transcript,
                isFinal: data.is_final || false,
                timestamp: Date.now(),
                confidence: alternative.confidence || 0,
              });
            }
          }
        } catch (e) {
          console.error("Error parsing Deepgram message:", e);
        }
      };

      socket.onerror = (event) => {
        console.error("Deepgram WebSocket error:", event);
        setError("Deepgram connection error");
        stop();
      };

      socket.onclose = () => {
        console.log("Deepgram WebSocket closed");
        setIsListening(false);
      };
    } catch (e) {
      console.error("Failed to start Deepgram STT:", e);
      setError(e instanceof Error ? e.message : "Failed to start Deepgram");
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, model, sourceType, stop, audioStream]);

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
