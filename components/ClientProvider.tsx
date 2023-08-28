"use client";

import { createContext, useContext, useMemo, useRef, useState } from "react";
import { Client } from "@/lib/api/client";
import { suspend } from "@/lib/utils";

export const ClientContext = createContext<Client | undefined>(undefined);

export default function ClientProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [client, _] = useState(() => suspend(() => Client.connect(), []));
  console.log(client);
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