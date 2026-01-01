"use client";

import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { ClosedCaption, LayoutList, Users, ChevronDown, Languages, GraduationCap } from "lucide-react";
import { signInAnonymously } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Script from "next/script";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useWebSpeechSTT } from "@/hooks/use-web-speech-stt";
import { useDeepgramSTT } from "@/hooks/use-deepgram-stt";

import { EndCallButton } from "./end-call-button";
import { Loader } from "./loader";
import { TranscriptionOverlay } from "./transcription-overlay";
import { TranslationSidebar } from "./translation-sidebar";
import { TTSProvider } from "./tts-provider";

type CallLayoutType = "grid" | "speaker-left" | "speaker-right";
type STTProvider = "stream" | "webspeech" | "deepgram";

const controlButtonClasses =
  "flex size-11 items-center justify-center rounded-[5px] border border-white/10 bg-white/5 text-white transition hover:bg-white/15";

const STT_PROVIDER_LABELS: Record<STTProvider, string> = {
  stream: "Stream",
  webspeech: "Browser",
  deepgram: "Deepgram",
};

export const MeetingRoom = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showParticipants, setShowParticipants] = useState(false);
  const [layout, setLayout] = useState<CallLayoutType>("speaker-left");
  const [sttProvider, setSTTProvider] = useState<STTProvider>("stream");
  const [translationLanguage, setTranslationLanguage] = useState<string>("off");
  const [sbUserId, setSbUserId] = useState<string | null>(null);
  const [sttSource, setSttSource] = useState<"microphone" | "system">("microphone");
  const [isClassroomActive, setIsClassroomActive] = useState(false);

  // Initialize early anonymous auth
  useEffect(() => {
    signInAnonymously().then(({ success, user }) => {
      if (success && user) {
        console.log("[MeetingRoom] Pre-authenticated anonymously to Supabase:", user.id);
        setSbUserId(user.id);
      }
    });
  }, []);

  const [customTranscript, setCustomTranscript] = useState<{
    text: string;
    speaker: string;
    timestamp: number;
    isFinal: boolean;
  } | null>(null);

  const call = useCall();
  const { user } = useUser();

  const {
    useCallCallingState,
    useIsCallCaptioningInProgress,
    useLocalParticipant,
  } = useCallStateHooks();
  const callingState = useCallCallingState();
  const localParticipant = useLocalParticipant();
  const isStreamCaptionsEnabled = useIsCallCaptioningInProgress();

  // Web Speech API hook
  const webSpeech = useWebSpeechSTT({ language: "en-US", continuous: true });

  // Deepgram hook
  const deepgram = useDeepgramSTT({ language: "en", model: "nova-2", sourceType: sttSource });

  // Determine if any caption system is active
  const isCaptionsActive =
    sttProvider === "stream"
      ? isStreamCaptionsEnabled
      : sttProvider === "webspeech"
        ? webSpeech.isListening
        : deepgram.isListening;

  // Update custom transcript when Web Speech or Deepgram provides new text
  useEffect(() => {
    if (sttProvider === "webspeech" && webSpeech.transcript) {
      setCustomTranscript({
        text: webSpeech.transcript.text,
        speaker: user?.firstName || user?.username || "You",
        timestamp: webSpeech.transcript.timestamp,
        isFinal: webSpeech.transcript.isFinal,
      });
    }
  }, [webSpeech.transcript, sttProvider, user]);

  useEffect(() => {
    if (sttProvider === "deepgram" && deepgram.transcript) {
      setCustomTranscript({
        text: deepgram.transcript.text,
        speaker: user?.firstName || user?.username || "You",
        timestamp: deepgram.transcript.timestamp,
        isFinal: deepgram.transcript.isFinal,
      });
    }
  }, [deepgram.transcript, sttProvider, user]);

  const toggleCaptions = async () => {
    if (!call) return;

    try {
      if (sttProvider === "stream") {
        if (isStreamCaptionsEnabled) {
          await call.stopClosedCaptions();
          console.log("Stream captions stopped");
        } else {
          await call.startClosedCaptions();
          console.log("Stream captions started");
        }
      } else if (sttProvider === "webspeech") {
        if (webSpeech.isListening) {
          webSpeech.stop();
          console.log("Web Speech stopped");
        } else {
          webSpeech.start();
          console.log("Web Speech started");
        }
      } else if (sttProvider === "deepgram") {
        if (deepgram.isListening) {
          deepgram.stop();
          console.log("Deepgram stopped");
        } else {
          await deepgram.start();
          console.log("Deepgram started");
        }
      }
    } catch (error) {
      console.error("Failed to toggle captions:", error);
    }
  };

  const handleProviderChange = async (provider: STTProvider) => {
    // Stop current provider first
    if (sttProvider === "stream" && isStreamCaptionsEnabled) {
      try {
        await call?.stopClosedCaptions();
      } catch (e) {
        console.error(e);
      }
    } else if (sttProvider === "webspeech" && webSpeech.isListening) {
      webSpeech.stop();
    } else if (sttProvider === "deepgram" && deepgram.isListening) {
      deepgram.stop();
    }

    setSTTProvider(provider);
    setCustomTranscript(null);
  };

  const isPersonalRoom = !!searchParams.get("personal");

  const CallLayout = () => {
    switch (layout) {
      case "grid":
        return <PaginatedGridLayout />;
      case "speaker-right":
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  if (callingState !== CallingState.JOINED) return <Loader />;
  
  // Prioritize Clerk User ID if available, otherwise fallback to Anonymous Supabase ID
  const effectiveUserId = user?.id || sbUserId || "";

  return (
    <TTSProvider initialUserId={effectiveUserId}>
      <div className="relative min-h-screen w-full overflow-hidden text-white">
        <div className="relative flex size-full items-center justify-center px-4 pb-28 pt-4">
          <div className="flex size-full items-center">
            <CallLayout />
          </div>

          <div
            className={cn("ml-2 hidden h-[calc(100vh_-_120px)]", {
              "show-block": showParticipants,
            })}
          >
            <CallParticipantsList onClose={() => setShowParticipants(false)} />
          </div>
        </div>

        {/* D-ID Pinned AI Host */}
        {isClassroomActive && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
            <div 
              id="did-agent-host" 
              className="pointer-events-auto h-[70vh] w-[90vw] max-w-4xl rounded-3xl overflow-hidden border border-white/20 bg-black/80 shadow-2xl shadow-purple-500/20"
            />
            
            <Script
              id="did-agent-script"
              src="https://agent.d-id.com/v2/index.js"
              strategy="afterInteractive"
              data-mode="full"
              data-client-key="Z29vZ2xlLW9hdXRoMnwxMTY0Nzg2OTY4MDQ3OTI2NzA3MjA6Yzc1MHh2a1VIMGM0bUNuUE0zLUl1"
              data-agent-id="v2_agt_y8tLMf2c"
              data-name="did-agent"
              data-monitor="true"
              data-target-id="did-agent-host"
            />
          </div>
        )}

      <TranscriptionOverlay
        sttProvider={sttProvider}
        customTranscript={customTranscript}
        userId={user?.id}
        targetLanguage={translationLanguage}
        meetingId={call?.id || ""}
        sbUserId={effectiveUserId}
      />

      <div className="fixed bottom-0 left-0 right-0 z-50 flex w-full flex-wrap items-center justify-center gap-2 border-t border-white/10 bg-black/80 px-3 py-3 backdrop-blur-md">
        <CallControls onLeave={() => router.push("/")} />

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(controlButtonClasses, "cursor-pointer")}
            title="Call layout"
          >
            <LayoutList size={20} className="text-white" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border-white/10 bg-black/90 text-white">
            {["Grid", "Speaker Left", "Speaker Right"].map((item, i) => (
              <div key={item + "-" + i}>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() =>
                    setLayout(
                      item.toLowerCase().replace(" ", "-") as CallLayoutType
                    )
                  }
                >
                  {item}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="border-white/10" />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Caption toggle with provider selector */}
        <div className="flex items-center">
          <button
            onClick={toggleCaptions}
            title={isCaptionsActive ? "Disable Captions" : "Enable Captions"}
            className={cn(
              controlButtonClasses,
              "relative rounded-r-none border-r-0",
              isCaptionsActive &&
                "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
            )}
          >
            <ClosedCaption size={20} />
            {isCaptionsActive && (
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
              </span>
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                controlButtonClasses,
                "w-auto gap-1 rounded-l-none px-2",
                isCaptionsActive &&
                  "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
              )}
              title="Select STT Provider"
            >
              <span className="text-[10px] font-medium">
                {STT_PROVIDER_LABELS[sttProvider]}
              </span>
              <ChevronDown size={12} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-white/10 bg-black/90 text-white">
              <DropdownMenuItem
                className={cn(
                  "cursor-pointer",
                  sttProvider === "stream" && "bg-white/10"
                )}
                onClick={() => handleProviderChange("stream")}
              >
                Stream (Built-in)
              </DropdownMenuItem>
              <DropdownMenuSeparator className="border-white/10" />
              <DropdownMenuItem
                className={cn(
                  "cursor-pointer",
                  sttProvider === "webspeech" && "bg-white/10"
                )}
                onClick={() => handleProviderChange("webspeech")}
              >
                Browser (Web Speech)
                {!webSpeech.isSupported && (
                  <span className="ml-2 text-[10px] text-red-400">
                    Not Supported
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="border-white/10" />
              <DropdownMenuItem
                className={cn(
                  "cursor-pointer",
                  sttProvider === "deepgram" && "bg-white/10"
                )}
                onClick={() => handleProviderChange("deepgram")}
              >
                Deepgram (Cloud)
              </DropdownMenuItem>
              
              {/* Source Selection (Deepgram Only) */}
              {sttProvider === "deepgram" && (
                <>
                  <DropdownMenuSeparator className="border-white/10" />
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-400">
                      Audio Source
                  </div>
                  <DropdownMenuItem
                    className={cn(
                      "cursor-pointer pl-6",
                      sttSource === "microphone" && "text-emerald-400"
                    )}
                    onClick={() => setSttSource("microphone")}
                  >
                    Microphone
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "cursor-pointer pl-6",
                      sttSource === "system" && "text-emerald-400"
                    )}
                    onClick={() => setSttSource("system")}
                    title="Share tab/screen audio"
                  >
                    System Audio (Share Tab)
                  </DropdownMenuItem>
                </>
              )}

            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Translation Sidebar */}
        <TranslationSidebar 
          selectedLanguage={translationLanguage} 
          onLanguageSelect={setTranslationLanguage}
          userId={effectiveUserId}
        >
          <div
            className={cn(controlButtonClasses, "cursor-pointer flex items-center justify-center gap-1", {
              "bg-emerald-500/20 text-emerald-400 border-emerald-500/50": translationLanguage !== "off"
            })}
            title="Translator (Select Language)"
          >
            <Languages size={20} />
            <ChevronDown size={14} className={cn("text-white/50", {
              "text-emerald-400/50": translationLanguage !== "off"
            })} />
          </div>
        </TranslationSidebar>

        <CallStatsButton />

        <button
          onClick={() =>
            setShowParticipants((prevShowParticipants) => !prevShowParticipants)
          }
          title="Show participants"
        >
          <div className={cn(controlButtonClasses, "cursor-pointer")}>
            <Users size={20} className="text-white" />
          </div>
        </button>

        {/* Classroom Mode Toggle */}
        <button
          onClick={() => setIsClassroomActive(!isClassroomActive)}
          title={isClassroomActive ? "Exit Classroom Mode" : "Enter Classroom Mode"}
        >
          <div className={cn(controlButtonClasses, "cursor-pointer transition-all", {
            "bg-purple-500/20 text-purple-400 border-purple-500/50 shadow-lg shadow-purple-500/20": isClassroomActive
          })}>
            <GraduationCap size={20} />
          </div>
        </button>

        {!isPersonalRoom && <EndCallButton />}
      </div>
      </div>
    </TTSProvider>
  );
};
