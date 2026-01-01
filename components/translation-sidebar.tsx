"use client";

import { useState } from "react";
import { Globe } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function TranslationSidebar({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) {
  const [open, setOpen] = useState(false);

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

        <div className="flex-1 overflow-hidden pt-4">
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
