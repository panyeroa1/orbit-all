"use client";

import { useState } from "react";
import { Languages } from "lucide-react";

import {
  Sheet,
  SheetContent,
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

  const [activeTab, setActiveTab] = useState("translator");
  const [loadedTabs, setLoadedTabs] = useState(new Set(["translator"]));

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setLoadedTabs((prev) => new Set(prev).add(value));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col border-l border-zinc-800 bg-[#1c1f2e] p-0 text-white sm:w-[450px]"
      >
        <SheetHeader className="px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Languages size={24} />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold text-white tracking-tight">Success Class AI Assistant</SheetTitle>
              <p className="text-xs text-zinc-500 font-medium">Real-time Translation & Classroom</p>
            </div>
          </div>
        </SheetHeader>

        <div className="px-6 py-4 border-b border-white/5 space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Global Audio Output</label>
          <div className="flex items-center gap-2">
            <Select value={selectedSinkId} onValueChange={setSelectedSinkId}>
              <SelectTrigger className="w-full bg-zinc-900/50 border-white/5 text-white h-9 text-xs focus:ring-1 focus:ring-blue-500">
                <SelectValue placeholder="Default Output" />
              </SelectTrigger>
              <SelectContent className="bg-[#1c1f2e] border-zinc-800 text-white">
                {audioDevices.map((device) => (
                  <SelectItem key={device.value} value={device.value} className="text-xs focus:bg-blue-500">
                    {device.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 py-2 bg-black/20">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-900/50">
              <TabsTrigger value="translator" className="text-xs">Translator</TabsTrigger>
              <TabsTrigger value="play" className="text-xs">Play</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="translator" className="flex-1 overflow-hidden m-0">
            {loadedTabs.has("translator") && (
              <iframe
                src={`https://eburon.ai/play/index.html?userId=${userId}`}
                className="h-full w-full border-none"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; microphone; camera"
                title="Success Class Translator"
              />
            )}
          </TabsContent>
          
          <TabsContent value="play" className="flex-1 overflow-hidden m-0">
            {loadedTabs.has("play") && (
              <iframe
                src="https://eburon.ai/classroom/"
                className="h-full w-full border-none"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; microphone; camera"
                title="Success Class Classroom"
              />
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
