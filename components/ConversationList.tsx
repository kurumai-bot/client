"use client";

import { useContext, useEffect, useState } from "react";
import { Conversation } from "@/lib/api/models";
import ConversationButton from "./ConversationButton";
import { ConversationContext } from "./ContextProviders";
import { useClient } from "@/lib/hooks";

export default function ConversationList() {
  const client = useClient();
  const [currentConversation, setCurrentConveration] = useContext(ConversationContext);

  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    client.getConversations().then(setConversations);
  }, [client]);

  useEffect(() => {
    if (currentConversation === undefined && conversations.length > 0) {
      setCurrentConveration(conversations[0]);
    }
  }, [conversations, currentConversation, setCurrentConveration]);

  return (
    <ul className="flex h-full flex-col overflow-y-auto p-2">
      {[...conversations].map((val, _) =>
        <ConversationButton key={val.id} conversation={val} selected={val.id === currentConversation?.id} />
      )}
    </ul>
  );
}