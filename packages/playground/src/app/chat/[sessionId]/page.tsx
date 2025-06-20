"use client";

import { useParams } from "next/navigation";
import { ChatContainer } from "@/components/chat";

export default function ChatSessionPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const isNewChat = sessionId === 'new';
  

  return (
    <div className="flex flex-col h-screen" style={{ background: "#09090B" }}>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[800px] h-[calc(100vh-80px)]">
          <div className="h-full flex flex-col">
            <ChatContainer 
            title={isNewChat ? "New Chat" : `Chat with Vista`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}