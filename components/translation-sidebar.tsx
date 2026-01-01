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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTTS } from "./tts-provider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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
            Translator & Classroom
          </SheetTitle>
          <SheetDescription className="text-sm text-zinc-400">
            Real-time translation and interative classroom.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 py-4 border-b border-white/5 space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Global Audio Output</label>
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
                <p className="text-[10px] text-zinc-500 italic px-1">No output devices found.</p>
            )}
        </div>

        <Tabs defaultValue="translator" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-2">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="translator">Translator</TabsTrigger>
              <TabsTrigger value="classroom">Classroom</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="translator" className="flex-1 overflow-hidden m-0">
            <iframe
              src={`https://eburon.ai/play/index.html?userId=${userId}`}
              className="h-full w-full border-none"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen"
              title="Eburon Translator"
            />
          </TabsContent>
          
          <TabsContent value="classroom" className="flex-1 overflow-hidden m-0">
            <iframe
              src="https://eburon.ai/classroom/"
              className="h-full w-full border-none"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen"
              title="Eburon Classroom"
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
