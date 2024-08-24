"use client";

import React, { Suspense, createContext, useState } from "react";
import ChatInput from "@/components/ChatInput";
import ChatMessages from "@/components/ChatMessages";
import { Conversation } from "@/lib/api/models";
import ConversationList from "@/components/ConversationList";
import Image from "next/image";
import LoadingSpinner from "@/components/LoadingSpinner";
import ModelLoader from "@/components/ModelHandler";
import dynamic from "next/dynamic";

const ClientProvider = dynamic(() => import("@/components/ClientProvider"), { ssr: false });

type ConversationContextType = [
  Conversation | undefined,
  React.Dispatch<React.SetStateAction<Conversation | undefined>>
]
export const ConversationContext = createContext<ConversationContextType>(undefined!);

export default function Page() {
  const conversationState = useState<Conversation | undefined>(undefined);
  return (
    <ClientProvider>
      <ConversationContext.Provider value={conversationState}>
        <div className="float-left h-full w-[--sidebar-width]">
          <ConversationList />
        </div>
        <div className="float-left h-full w-[calc(100svw-var(--sidebar-width))]">
          <nav className="h-[--header-height] w-full pr-2">
            <a href="https://github.com/kurumai-bot" target="_blank" title="Open project on github">
              <Image
                src="/github-mark-white.svg"
                width={64}
                height={64}
                alt="github project link"
                className="float-right h-full w-auto rounded-full p-3"
              />
            </a>
            <a href="/faq" className="flex-center float-right p-2 text-lg">
              FAQ
            </a>
          </nav>
          <div className="h-[calc(100%-var(--header-height))] pb-3 pr-3">
            <main className="rounded-lg border border-[color:rgb(var(--border-rgb))] bg-[rgb(var(--secondary-rgb))] lg:flex lg:h-full lg:flex-row-reverse">
              <div className="flex max-h-[90svh] min-w-0 flex-1 flex-col p-2.5 lg:p-10">
                <ChatMessages />
                <ChatInput />
              </div>
              <div className="shrink-0 grow-0 basis-3/5 border-t border-[color:rgb(var(--border-rgb))] lg:border-r lg:border-t-0">
                <Suspense fallback={<div className="flex-center"><LoadingSpinner radius={60} strokeWidth={10} /></div>}>
                  <ModelLoader />
                </Suspense>
              </div>
            </main>
          </div>
        </div>
      </ConversationContext.Provider>
    </ClientProvider>
  );
}
