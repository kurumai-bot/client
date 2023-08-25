"use client";

import { createContext, useContext } from "react";
import { Client } from "@/lib/api/client";
import { suspend } from "@/lib/utils";

export const ClientContext = createContext<Client | undefined>(undefined);

const clientPromise = Client.connect();
export default function ClientProvider({
  children
}: {
  children: React.ReactNode
}) {
  const client = suspend(clientPromise);
  return (
    <ClientContext.Provider value={client}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const client = useContext(ClientContext);

  if (client === undefined) {
    throw new Error("API client has not been initialized");
  }

  return client;
}