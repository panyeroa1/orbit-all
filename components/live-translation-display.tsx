"use client";

import { useTTS } from "./tts-provider";
import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";

export const LiveTranslationDisplay = () => {
  const { latestTranslatedText, status, statusType } = useTTS();

  return (
    <div className="flex flex-col gap-2 p-4 bg-black/40 backdrop-blur-md rounded-sm border border-white/10 shadow-xl max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Languages className="size-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/50">Live Translation</span>
        </div>
        <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-medium", 
          statusType === "error" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
        )}>
          <span className={cn("size-1.5 rounded-full", 
            statusType === "error" ? "bg-red-500 animate-pulse" : "bg-emerald-500 animate-pulse"
          )} />
          <span className="max-w-[120px] truncate">{status}</span>
        </div>
      </div>
      
      <div className="relative group">
        <input
          type="text"
          readOnly
          value={latestTranslatedText}
          placeholder="Waiting for translation..."
          className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
        />
        <div className="absolute inset-0 rounded-sm bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <p className="text-[10px] text-white/30 italic text-center">
        Auto-refreshes every 2 seconds from translations table
      </p>
    </div>
  );
};
