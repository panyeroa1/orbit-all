"use client";

import { useUser } from "@clerk/nextjs";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import { useState, useEffect } from "react";

import { Loader } from "@/components/loader";
import { MeetingRoom } from "@/components/meeting-room";
import { MeetingSetup } from "@/components/meeting-setup";
import { useGetCallById } from "@/hooks/use-get-call-by-id";

type MeetingIdPageProps = {
  params: {
    id: string;
  };
};

const MeetingIdPage = ({ params }: MeetingIdPageProps) => {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const { user, isLoaded } = useUser();

  const { call, isCallLoading } = useGetCallById(params.id);

  useEffect(() => {
    if (!isCallLoading && call) {
      const hasSetup = sessionStorage.getItem(`Success Class-setup-complete-${params.id}`);
      if (hasSetup === "true") {
        call.join().then(() => {
            setIsSetupComplete(true);
        }).catch((err) => {
            console.error("Failed to auto-join call:", err);
            // If join fails (e.g. invalid permissions), maybe show setup? 
            // relying on default behavior: if join fails, we might want to stay on setup or retry.
            // But usually it just works. if it fails fatal, error boundary catches or UI shows error.
        });
      }
    }
  }, [isCallLoading, call, params.id]);

  const handleSetupComplete = () => {
      setIsSetupComplete(true);
      sessionStorage.setItem(`Success Class-setup-complete-${params.id}`, "true");
  };

  if (!isLoaded || isCallLoading) return <Loader />;

  return (
    <main className="min-h-screen w-full">
      <StreamCall call={call}>
        <StreamTheme>
          {!isSetupComplete ? (
            <MeetingSetup setIsSetupComplete={handleSetupComplete} />
          ) : (
            <MeetingRoom />
          )}
        </StreamTheme>
      </StreamCall>
    </main>
  );
};

export default MeetingIdPage;
