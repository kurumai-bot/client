"use client";

import { useEffect, useState } from "react";
import ChatMessage from "./ChatMessage";
import { GenericEvent } from "@/lib/utils";
import { Message } from "@/lib/api/models";
import { useClient } from "./ClientProvider";

export default function ChatMessages() {
  // TODO: possible abstract this into hook that just does this all in one
  // TODO: this project desperately needs more comments
  const client = useClient();
  const [messages, setMessages] = useState<Array<Message>>([]);

  useEffect(() => {
    client.addEventListener("message", handleMessage);
    client.getConversations().then((conversations) => {
      client.getMessageHistory(conversations[0].id).then(setMessages);
    });

    return () => {
      client.removeEventListener("message", handleMessage);
    };
  }, [client]);

  function handleMessage(ev: GenericEvent<Array<Message>>) {
    setMessages(ev.data);
  }

  return (
    <div className="flex max-h-full flex-1 overflow-y-auto flex-col-reverse">
      {[...messages].map((val, _) => {
        const side = val.userId === client.currentUser.id ? "right" : "left";
        const color = val.userId === client.currentUser.id
          ? "rgb(var(--accent-rgb))"
          : "rgb(var(--tertiary-rgb))";

        return (
          <ChatMessage key={val.id} side={side} color={color}>
            {val.content}
          </ChatMessage>
        );
      })}
    </div>
  );
}