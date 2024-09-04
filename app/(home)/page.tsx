"use client";

import React, { Suspense } from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatInput from "@/components/ChatInput";
import ChatMessages from "@/components/ChatMessages";
import ConversationList from "@/components/ConversationList";
import Image from "next/image";
import LoadingSpinner from "@/components/LoadingSpinner";
import ModelLoader from "@/components/ModelHandler";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import dynamic from "next/dynamic";

const ContextProviders = dynamic(() => import("@/components/ContextProviders"), { ssr: false });

export default function Page() {
  return (
    <ContextProviders>
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
            <ChatHeader />
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
    </ContextProviders>
  );
}
