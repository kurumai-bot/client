"use client";

import { Client } from "@/lib/api/client";
import { createContext } from "react";
import suspend from "@/lib/suspend";

export const ClientContext = createContext<Client | undefined>(undefined);

export default function ClientProvider({
  children
}: {
  children: React.ReactNode
}) {
  const client = suspend(() => Client.connect(), []);

  return (
    <ClientContext.Provider value={client}>
      {children}
    </ClientContext.Provider>
  );
}