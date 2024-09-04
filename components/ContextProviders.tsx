"use client";

import { createContext, useEffect, useState } from "react";
import { Client } from "@/lib/api/client";
import { Conversation } from "@/lib/api/models";
import suspend from "@/lib/suspend";

type StateContextType<T> = [
  T,
  React.Dispatch<React.SetStateAction<T>>
]
export const ConversationContext = createContext<StateContextType<Conversation | undefined>>(undefined!);
export const SettingsOpenContext = createContext<StateContextType<boolean>>(undefined!);
export const ClientContext = createContext<Client | undefined>(undefined);

export default function ContextProviders({
  children
}: {
  children: React.ReactNode
}) {
  // TODO: Get settings from conversation on conversation change
  const conversationState = useState<Conversation | undefined>(undefined);
  const settingsOpenState = useState<boolean>(false);

  return (
    <ClientProvider>
      <ConversationContext.Provider value={conversationState}>
        <SettingsOpenContext.Provider value={settingsOpenState}>
          {children}
        </SettingsOpenContext.Provider>
      </ConversationContext.Provider>
    </ClientProvider>
  );
}

export function ClientProvider({
  children
}: {
  children: React.ReactNode
}) {
  const client = suspend(() => Client.connect(), []);

  useEffect(() => {
    window.addEventListener("beforeunload", () => client.disconnect());

    // Disable cleanup in dev environment since effect is double invoked and will disconnect client
    // as soon as connected
    if (process.env.NODE_ENV !== "development") {
      return () => {
        client.disconnect();
        window.removeEventListener("beforeunload", () => client.disconnect());
      };
    }
  }, [client]);

  return (
    <ClientContext.Provider value={client}>
      {children}
    </ClientContext.Provider>
  );
}