"use client";

import { ConversationContext, SettingsOpenContext } from "./ContextProviders";
import Image from "next/image";
import { useContext } from "react";

export default function ChatHeader() {
  const [currentConversation, _] = useContext(ConversationContext);
  const [isSettingsOpen, setIsSettingsOpen] = useContext(SettingsOpenContext);

  return (
    <div className="h-12 border-b border-[color:var(--color-outline-variant)]">
      <div className="float-left ml-5 flex h-full items-center text-lg font-light">
        {currentConversation === undefined ? "Loading..." : currentConversation.name}
      </div>
      <div className="float-right mr-5 h-full">
        <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="h-full opacity-75 hover:opacity-90">
          <Image
            src="/settings-icon"
            width={64}
            height={64}
            alt="Settings Icon"
            className="h-full w-auto rounded-full p-2"
          />
        </button>
      </div>
    </div>
  );
}