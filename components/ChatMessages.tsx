"use client";

import { useContext, useEffect, useState } from "react";
import ChatMessage from "./ChatMessage";
import { ConversationContext } from "@/app/(home)/page";
import GenericEvent from "@/lib/genericEvent";
import { Message } from "@/lib/api/models";
import { useClient } from "@/lib/hooks";

export default function ChatMessages() {
  // TODO: this project desperately needs more comments
  const client = useClient();
  const [currentConversation, _] = useContext(ConversationContext);
  const [messages, setMessages] = useState<Array<Message>>([]);

  useEffect(() => {
    client.addEventListener("message", handleMessage);

    return () => {
      client.removeEventListener("message", handleMessage);
    };
  }, [client]);

  useEffect(() => {
    if (currentConversation === undefined) {
      return;
    }

    client.getMessageHistory(currentConversation.id).then(setMessages);
  }, [client, currentConversation]);

  function handleMessage(ev: GenericEvent<Array<Message>>) {
    setMessages(ev.data);
  }

  return (
    <div className="flex max-h-full flex-1 flex-col-reverse overflow-y-auto">
      {[...messages].map((val, _) => {
        const side = val.userId === client.currentUser.id ? "right" : "left";
        const color = val.userId === client.currentUser.id
          ? "var(--color-primary-container)"
          : "var(--color-surface-container-high)";
        const textColor = val.userId === client.currentUser.id
          ? "var(--color-on-primary-container)"
          : "var(--color-on-surface-container";

        return (
          <ChatMessage key={val.id} side={side} color={color} textColor={textColor}>
            {val.content}
          </ChatMessage>
        );
      })}
    </div>
  );
}