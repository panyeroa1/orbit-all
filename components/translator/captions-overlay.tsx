"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { useTranslatorStore } from "@/store/use-translator";

export const CaptionsOverlay = () => {
  const captions = useTranslatorStore((state) => state.captionBuffer);
  const enabled = useTranslatorStore((state) => state.enabled);
  const showOriginal = useTranslatorStore((state) => state.showOriginal);
  const autoTranslateEnabled = useTranslatorStore(
    (state) => state.autoTranslateEnabled
  );
  const targetLang = useTranslatorStore((state) => state.targetLang);

  const visibleCaptions = useMemo(() => {
    const sorted = [...captions].sort((a, b) => a.ts - b.ts);
    return sorted.slice(-1);
  }, [captions]);

  if (!enabled && visibleCaptions.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 w-full max-w-[min(920px,95vw)] -translate-x-1/2">
      {visibleCaptions.map((caption) => {
        const showTranslation =
          autoTranslateEnabled && Boolean(targetLang) && caption.translatedText;
        const primaryText = showTranslation ? caption.text : caption.text;
        return (
          <div
            key={caption.utteranceId}
            className={cn(
              "flex min-h-[44px] w-full items-center gap-2 overflow-hidden rounded-lg bg-black/70 px-4 py-2 text-white shadow-lg backdrop-blur-md"
            )}
          >
            {caption.speakerName && (
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-sky-400">
                {caption.speakerName}:
              </span>
            )}
            <div className="min-w-0 flex-1 text-sm font-medium">
              <span className="block truncate whitespace-nowrap">
                {primaryText}
              </span>
              {showTranslation ? (
                <span className="block truncate whitespace-nowrap text-lime-400">
                  {caption.translatedText}
                </span>
              ) : (
                showOriginal &&
                caption.translatedText && (
                  <span className="block truncate whitespace-nowrap text-white/50">
                    {caption.translatedText}
                  </span>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
