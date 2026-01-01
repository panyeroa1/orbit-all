"use client";

import { useState } from "react";
import { Check, Globe, ChevronsUpDown } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TARGET_LANGUAGES } from "@/constants/languages";
import { cn } from "@/lib/utils";
import { AutoPlayingTTS } from "./autoplaying-tts";
import { useTTS } from "./tts-provider";

interface TranslationSidebarProps {
  children: React.ReactNode;
  onLanguageSelect: (lang: string) => void;
  selectedLanguage: string;
  userId: string;
}

export function TranslationSidebar({
  children,
  onLanguageSelect,
  selectedLanguage,
  userId,
}: TranslationSidebarProps) {
  const [open, setOpen] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  
  const { audioDevices, selectedSinkId, setSelectedSinkId } = useTTS();

  const handleSelect = (value: string) => {
    onLanguageSelect(value);
    setComboboxOpen(false);
  };

  const selectedLabel = TARGET_LANGUAGES.find(
    (lang) => lang.value === selectedLanguage
  )?.label;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px] flex flex-col p-6 gap-6 border-l border-zinc-800 bg-[#1c1f2e] text-white">
        <SheetHeader className="text-left space-y-1">
          <SheetTitle className="text-xl font-semibold flex items-center gap-2 text-white">
            <Globe className="h-5 w-5 text-[#0E78F9]" />
            Translation Settings
          </SheetTitle>
          <SheetDescription className="text-zinc-400 text-sm">
            Configure your real-time translation preferences.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-2">
             <h3 className="text-sm font-medium text-zinc-300">Status</h3>
             <Button
              variant="outline"
              onClick={() => handleSelect("off")}
              className={cn(
                "w-full justify-between h-auto py-3 px-4 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-colors",
                selectedLanguage === "off" && "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400"
              )}
            >
              <span className="font-medium">
                {selectedLanguage === "off" ? "Translation Disabled" : "Translation Active"}
              </span>
              {selectedLanguage === "off" && <Check className="h-4 w-4" />}
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-300">Target Language</h3>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between bg-zinc-900/50 border-white/10 text-white hover:bg-zinc-900 hover:text-white"
                >
                  {selectedLanguage !== "off" && selectedLabel
                    ? selectedLabel
                    : "Select language..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[340px] p-0 bg-[#1c1f2e] border-zinc-700 z-[101]">
                <Command className="bg-transparent text-white">
                  <CommandInput placeholder="Search language..." className="text-white placeholder:text-zinc-500" />
                  <CommandList>
                    <CommandEmpty className="py-6 text-center text-sm text-zinc-400">No language found.</CommandEmpty>
                    <CommandGroup>
                      {TARGET_LANGUAGES.map((lang) => (
                        <CommandItem
                          key={lang.value}
                          value={lang.label}
                          onSelect={() => handleSelect(lang.value)}
                          className="text-white aria-selected:bg-white/10 aria-selected:text-white cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedLanguage === lang.value ? "opacity-100 ring-[#0E78F9]" : "opacity-0"
                            )}
                          />
                          {lang.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-zinc-500">
              Select the language you want to read.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-300">Audio Output</h3>
            {audioDevices.length > 0 ? (
               <Select value={selectedSinkId} onValueChange={setSelectedSinkId}>
                <SelectTrigger className="w-full bg-zinc-900/50 border-white/10 text-white">
                  <SelectValue placeholder="Default Output" />
                </SelectTrigger>
                <SelectContent className="bg-[#1c1f2e] border-zinc-700 text-white z-[102]">
                  <SelectItem value="default">Default Output</SelectItem>
                  {audioDevices.map((device) => (
                    <SelectItem key={device.value} value={device.value}>
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
                <p className="text-xs text-zinc-500 italic">No output devices found (check permissions).</p>
            )}
             <p className="text-xs text-zinc-500">
              Route TTS audio to separate speakers to avoid echo.
            </p>
          </div>
          
          <div className="border-t border-white/10 pt-6">
             <AutoPlayingTTS userId={userId} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
