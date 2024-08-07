"use client";

import { createContext, useEffect } from "react";
import { Client } from "@/lib/api/client";
import suspend from "@/lib/suspend";

export const ClientContext = createContext<Client | undefined>(undefined);

export default function ClientProvider({
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