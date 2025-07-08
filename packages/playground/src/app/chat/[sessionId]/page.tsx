"use client";

import React from "react";
import { useParams } from "next/navigation";
import { EnhancedChatContainer } from "@/components/chat";

export default function ChatPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;

  return (
    <div className="h-screen w-full bg-[#14161D]">
      <EnhancedChatContainer 
        sessionId={sessionId}
        enableSessionManagement={true}
        showHeader={true}
        className="h-full"
      />
    </div>
  );
}