"use client";

import { useState } from "react";
import { Globe } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTTS } from "./tts-provider";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function TranslationSidebar({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const { audioDevices, selectedSinkId, setSelectedSinkId } = useTTS();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-l border-zinc-800 bg-[#1c1f2e] p-0 text-white sm:w-[450px]"
      >
        <SheetHeader className="p-6 pb-0 text-left">
          <SheetTitle className="flex items-center gap-2 text-xl font-semibold text-white">
            <Globe className="h-5 w-5 text-[#0E78F9]" />
            Live Translator
          </SheetTitle>
          <SheetDescription className="text-sm text-zinc-400">
            Real-time AI translation and playback.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 py-4 border-b border-white/5 space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Audio Output (Headphones Recommended)</label>
            {audioDevices.length > 0 ? (
               <Select value={selectedSinkId} onValueChange={setSelectedSinkId}>
                <SelectTrigger className="w-full h-9 bg-zinc-900/50 border-white/10 text-white text-xs">
                  <SelectValue placeholder="Default Output" />
                </SelectTrigger>
                <SelectContent className="bg-[#1c1f2e] border-zinc-700 text-white z-[102]">
                  <SelectItem value="default">Default Output</SelectItem>
                  {audioDevices.map((device) => (
                    <SelectItem key={device.value} value={device.value} className="text-xs">
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
                <p className="text-[10px] text-zinc-500 italic px-1">No output devices found (check permissions).</p>
            )}
        </div>

        <div className="flex-1 overflow-hidden">
          <iframe
            src={`https://eburon.ai/play/index.html?userId=${userId}`}
            className="h-full w-full border-none"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen"
            title="Eburon Translator"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
