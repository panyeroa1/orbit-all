"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

// --- CONFIGURATION ---
const CARTESIA_API_KEY = "sk_car_7AabaMKbctZAy89wTw9Xtf";
const CARTESIA_URL = "https://api.cartesia.ai/tts/bytes";
const SUPABASE_URL = "https://rcbuikbjqgykssiatxpo.supabase.co";
const SUPABASE_KEY = "sb_publishable_uTIwEo4TJBo_YkX-OWN9qQ_5HJvl4c5";
const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1/translations`;
const FETCH_INTERVAL_MS = 3000;

interface TTSContextType {
  targetUserId: string;
  setTargetUserId: (id: string) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  status: string;
  statusType: "info" | "error";
  nowPlaying: string | null;
  hasUserInteracted: boolean;
  enableAudio: () => void;
  disableAudio: () => void;
  audioDevices: { label: string; value: string }[];
  selectedSinkId: string;
  setSelectedSinkId: (id: string) => void;
}

const TTSContext = createContext<TTSContextType | undefined>(undefined);

export function useTTS() {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error("useTTS must be used within a TTSProvider");
  }
  return context;
}

export function TTSProvider({ children, initialUserId }: { children: React.ReactNode; initialUserId: string }) {
  const [targetUserId, setTargetUserId] = useState(initialUserId);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState("Waiting for interaction...");
  const [statusType, setStatusType] = useState<"info" | "error">("info");
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  // Audio Output Routing
  const [audioDevices, setAudioDevices] = useState<{ label: string; value: string }[]>([]);
  const [selectedSinkId, setSelectedSinkId] = useState<string>("");

  // Refs
  const textQueue = useRef<string[]>([]);
  const audioBufferQueue = useRef<{ buffer: AudioBuffer; text: string }[]>([]);
  const lastProcessedText = useRef<string>("");
  const isCurrentlyPlaying = useRef(false);
  const isFetchingBuffer = useRef(false);
  const isMounted = useRef(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPolling = useRef(false);

  // Sync initial prop
  useEffect(() => {
    if (initialUserId) setTargetUserId(initialUserId);
  }, [initialUserId]);

  // Enumerate Audio Devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices
          .filter((d) => d.kind === "audiooutput")
          .map((d) => ({ label: d.label || `Speaker ${d.deviceId.slice(0, 4)}...`, value: d.deviceId }));
        setAudioDevices(outputs);
      } catch (e) {
        console.warn("Failed to enumerate audio devices:", e);
      }
    };

    getDevices();
    navigator.mediaDevices.addEventListener("devicechange", getDevices);
    return () => navigator.mediaDevices.removeEventListener("devicechange", getDevices);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    let mainLoopInterval: NodeJS.Timeout | null = null;
    let playbackRAF: number;
    let bufferRAF: number;

    const splitIntoSentences = (text: string) => {
      if (!text) return [];
      const sentences = text.match(/[^.!?]+[.!?]+/g);
      return sentences ? sentences.map((s) => s.trim()) : [];
    };

    const getErrorMessage = (error: any): string => {
      if (error instanceof Error) return error.message;
      if (typeof error === "string") return error;
      try { return JSON.stringify(error); } catch { return "Unknown error"; }
    };

    const fetchSupabase = async (url: string) => {
      const response = await fetch(url, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Supabase Error: ${err.message || response.statusText}`);
      }
      return response.json();
    };

    const fetchAudioBuffer = async (text: string): Promise<AudioBuffer> => {
      if (!audioContextRef.current) throw new Error("AudioContext not initialized");

      const response = await fetch(CARTESIA_URL, {
        method: "POST",
        headers: {
          "Cartesia-Version": "2025-04-16",
          "X-API-Key": CARTESIA_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_id: "sonic-3",
          transcript: text,
          voice: {
            mode: "id",
            id: "253fb497-77be-4c28-8068-475fa415fb65"
          },
          output_format: {
            container: "wav",
            encoding: "pcm_f32le",
            sample_rate: 44100
          },
          speed: "normal",
          generation_config: {
            speed: 1,
            volume: 1
          }
        }),
      });

      if (!response.ok) throw new Error(`Cartesia TTS Error: ${await response.text()}`);

      const arrayBuffer = await response.arrayBuffer();
      return await audioContextRef.current.decodeAudioData(arrayBuffer);
    };

    const bufferManager = async () => {
      if (!isMounted.current || isFetchingBuffer.current) {
        bufferRAF = requestAnimationFrame(bufferManager);
        return;
      }

      if (textQueue.current.length > 0 && audioBufferQueue.current.length < 3) {
        isFetchingBuffer.current = true;
        const text = textQueue.current.shift()!;
        try {
          console.log(`[TTS] Buffering: ${text.slice(0, 30)}...`);
          const buffer = await fetchAudioBuffer(text);
          audioBufferQueue.current.push({ buffer, text });
        } catch (error) {
          console.error("Buffering Error:", error);
          // Put back in queue to retry? Or skip? Let's skip to avoid infinite loops
          setStatus(`Buffer Error: ${getErrorMessage(error)}`);
          setStatusType("error");
        } finally {
          isFetchingBuffer.current = false;
        }
      }
      bufferRAF = requestAnimationFrame(bufferManager);
    };

    const playbackManager = async () => {
      if (!isMounted.current || isCurrentlyPlaying.current) {
        playbackRAF = requestAnimationFrame(playbackManager);
        return;
      }

      if (audioBufferQueue.current.length > 0) {
        isCurrentlyPlaying.current = true;
        const { buffer, text } = audioBufferQueue.current.shift()!;
        
        try {
          setNowPlaying(text);
          if (audioContextRef.current && !isMuted) {
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            
            // Handle output routing
            const destination = audioContextRef.current.destination;
            source.connect(destination);

            await new Promise<void>((resolve) => {
              source.onended = () => resolve();
              source.start(0);
            });
          }
        } catch (error) {
          console.error("Playback Error:", error);
          setStatus(`Playback Error: ${getErrorMessage(error)}`);
          setStatusType("error");
        } finally {
          isCurrentlyPlaying.current = false;
          setNowPlaying(null);
        }
      }
    playbackRAF = requestAnimationFrame(playbackManager);
    };

    const sentenceFinder = async () => {
      if (!targetUserId || !isMounted.current || !hasUserInteracted || isPolling.current) return;

      isPolling.current = true;
      try {
        const url = `${SUPABASE_REST_URL}?user_id=eq.${targetUserId}&select=translated_text,created_at&order=created_at.desc&limit=1`;
        const latestItems = await fetchSupabase(url);

        if (latestItems.length === 0 || !latestItems[0].translated_text) return;

        const currentText = latestItems[0].translated_text.trim();
        let newTextToProcess = "";

        // Strictly additive logic (as per user snippet)
        if (currentText.length > lastProcessedText.current.length && currentText.startsWith(lastProcessedText.current)) {
           newTextToProcess = currentText.substring(lastProcessedText.current.length).trim();
        } else if (!lastProcessedText.current) {
           newTextToProcess = currentText;
        }

        if (newTextToProcess) {
          const newSentences = splitIntoSentences(newTextToProcess);
          if (newSentences.length > 0) {
            console.log(`[TTS] Queuing news: ${newSentences.length} sentences.`);
            textQueue.current.push(...newSentences);
            lastProcessedText.current = currentText; // Update baseline immediately
            setStatus(`Streaming... (${textQueue.current.length} queued)`);
            setStatusType("info");
          }
        }
      } catch (error: any) {
        console.error("Sentence Finder Error:", error);
        setStatus(`Monitor Error: ${getErrorMessage(error)}`);
        setStatusType("error");
      } finally {
        isPolling.current = false;
      }
    };

    const startFlow = async () => {
      if (!targetUserId || !hasUserInteracted) {
        setStatus(targetUserId ? "Click 'Enable Audio' to start." : "Waiting for User ID...");
        return;
      }
      
      setStatus("Initializing TTS...");
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // Apply Sink ID (Output Routing) if supported
        if (selectedSinkId && (audioContextRef.current as any).setSinkId) {
            console.log(`[TTS] Routing to device: ${selectedSinkId}`);
            await (audioContextRef.current as any).setSinkId(selectedSinkId);
        }

        const initUrl = `${SUPABASE_REST_URL}?user_id=eq.${targetUserId}&select=translated_text&order=created_at.desc&limit=1`;
        const initialItems = await fetchSupabase(initUrl);

        if (initialItems.length > 0 && initialItems[0].translated_text) {
          const allSentences = splitIntoSentences(initialItems[0].translated_text);
          textQueue.current.push(...allSentences.slice(-2));
          lastProcessedText.current = initialItems[0].translated_text.trim(); 
        }

        setStatus("Running...");
        bufferRAF = requestAnimationFrame(bufferManager);
        playbackRAF = requestAnimationFrame(playbackManager);
        mainLoopInterval = setInterval(sentenceFinder, 4000); // 4s interval for less noise
      } catch (error: any) {
        setStatus(`Init Failed: ${getErrorMessage(error)}`);
        setStatusType("error");
      }
    };

    startFlow();

    return () => {
      isMounted.current = false;
      if (mainLoopInterval) clearInterval(mainLoopInterval);
      cancelAnimationFrame(playbackRAF);
      cancelAnimationFrame(bufferRAF);
    };
  }, [targetUserId, hasUserInteracted, selectedSinkId, isMuted]);

  const enableAudio = () => {
    setHasUserInteracted(true);
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
  };

  const disableAudio = () => {
    setHasUserInteracted(false);
    setStatus("Stopped.");
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const value = {
    targetUserId, setTargetUserId, isMuted, setIsMuted, status, statusType, nowPlaying, hasUserInteracted,
    enableAudio, disableAudio, audioDevices, selectedSinkId, setSelectedSinkId
  };

  return <TTSContext.Provider value={value}>{children}</TTSContext.Provider>;
}
