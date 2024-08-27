"use client";

import React, { Suspense, createContext, useState } from "react";
import ChatInput from "@/components/ChatInput";
import ChatMessages from "@/components/ChatMessages";
import { Conversation } from "@/lib/api/models";
import ConversationList from "@/components/ConversationList";
import Image from "next/image";
import LoadingSpinner from "@/components/LoadingSpinner";
import ModelLoader from "@/components/ModelHandler";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import dynamic from "next/dynamic";

const ClientProvider = dynamic(() => import("@/components/ClientProvider"), { ssr: false });

type StateContextType<T> = [
  T,
  React.Dispatch<React.SetStateAction<T>>
]
export const ConversationContext = createContext<StateContextType<Conversation | undefined>>(undefined!);
export const SettingsOpenContext = createContext<StateContextType<boolean>>(undefined!);

export default function Page() {
  const conversationState = useState<Conversation | undefined>(undefined);
  const settingsOpenState = useState<boolean>(false);
  return (
    <ClientProvider>
      <ConversationContext.Provider value={conversationState}>
        <SettingsOpenContext.Provider value={settingsOpenState}>
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
                  className="float-right h-full w-auto rounded-full p-3 opacity-75 hover:opacity-90"
                />
              </a>
              <ThemeSwitcher />
              <a href="/faq" className="flex-center float-right px-2.5 py-2 text-lg">
                FAQ
              </a>
            </nav>
            <div className="h-[calc(100%-var(--header-height))] pb-3 pr-3">
              <main className="h-full rounded-lg border border-[color:var(--color-outline-variant)] bg-[var(--color-surface-container)]">
                <div className="h-12 border-b border-[color:var(--color-outline-variant)]">
                  <div className="float-left ml-5 flex h-full items-center text-lg font-light">
                    {conversationState[0] === undefined ? "AHAHHH OH GOD PLEASE MAKE IT STOP" : conversationState[0].name}
                  </div>
                  <button className="float-right mr-5 h-full opacity-75 hover:opacity-90">
                    <Image
                      src="/settings-icon"
                      width={64}
                      height={64}
                      alt="Settings Icon"
                      className="h-full w-auto rounded-full p-2"
                    />
                  </button>
                </div>
                <div className="h-[calc(100%-3rem)]">
                  <div className="float-left h-full w-3/5 border-r border-[color:var(--color-outline-variant)]">
                    <Suspense fallback={<div className="flex-center"><LoadingSpinner radius={60} strokeWidth={10} /></div>}>
                      <ModelLoader />
                    </Suspense>
                  </div>
                  <div className="flex max-h-full min-w-0 flex-col p-10">
                    <ChatMessages />
                    <ChatInput />
                  </div>
                </div>
              </main>
            </div>
          </div>
        </SettingsOpenContext.Provider>
      </ConversationContext.Provider>
    </ClientProvider>
  );
}
