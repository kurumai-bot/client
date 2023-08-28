import React, { Suspense } from "react";
import ChatInput from "@/components/ChatInput";
import ChatMessages from "@/components/ChatMessages";
import LoadingSpinner from "@/components/LoadingSpinner";
import ModelLoader from "@/components/ModelHandler";


export default function Page() {
  return (
    <div className="main-wrapper">
      <div className="h-full p-20">
        <main className="flex h-full border border-[color:rgb(var(--secondary-rgb))] rounded-lg">
          <div className="shrink-0 grow-0 basis-[60%] border-r border-[color:rgb(var(--secondary-rgb))]">
            <Suspense fallback={<div className="flex-center"><LoadingSpinner radius={60} strokeWidth={10} /></div>}>
              <ModelLoader />
            </Suspense>
          </div>
          <div className="flex min-w-0 flex-1 flex-col p-10">
            <ChatMessages />
            <ChatInput />
          </div>
        </main>
      </div>
    </div>
  );
}
