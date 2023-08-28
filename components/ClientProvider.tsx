"use client";

import { createContext, useMemo } from "react";
import { Client } from "@/lib/api/client";
import suspend from "@/lib/suspend";

export const ClientContext = createContext<Client | undefined>(undefined);

export default function ClientProvider({
  children
}: {
  children: React.ReactNode
}) {
  const client = useMemo(() => suspend(() => Client.connect(), []), []);
  return (
    <ClientContext.Provider value={client}>
      {children}
    </ClientContext.Provider>
  );
}