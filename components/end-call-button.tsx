"use client";

import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export const EndCallButton = () => {
  const call = useCall();
  const router = useRouter();

  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  
  if (!call) return null;

  const isMeetingOwner =
    localParticipant &&
    call?.state.createdBy &&
    localParticipant.userId === call.state.createdBy.id;

  return (
    <div>
      <Button
        onClick={async () => {
          if (isMeetingOwner) {
            await call.endCall();
          } else {
            await call.leave();
          }
          router.push("/");
        }}
        className={isMeetingOwner ? "bg-red-500 hover:bg-red-600 rounded-sm h-11 px-4 text-sm font-medium" : "bg-red-500 hover:bg-red-600 rounded-sm h-11 px-4 text-sm font-medium"}
      >
        {isMeetingOwner ? "End call for everyone" : "Leave"}
      </Button>
    </div>
  );
};
