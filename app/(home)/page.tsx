import React, { Suspense } from "react";
import ChatInput from "@/components/ChatInput";
import ChatMessages from "@/components/ChatMessages";
import LoadingSpinner from "@/components/LoadingSpinner";
import ModelLoader from "@/components/ModelHandler";


export default function Page() {
  return (
    <div className="main-wrapper">
      <div className="h-full p-5 lg:p-20">
        <main className="lg:flex lg:flex-row-reverse lg:h-full border border-[color:rgb(var(--secondary-rgb))] rounded-lg">
          <div className="flex min-w-0 max-h-[90svh] flex-1 flex-col p-2.5 lg:p-10">
            <ChatMessages />
            <ChatInput />
          </div>
          <div className="shrink-0 grow-0 basis-[60%] border-t lg:border-t-0 lg:border-r border-[color:rgb(var(--secondary-rgb))]">
            <Suspense fallback={<div className="flex-center"><LoadingSpinner radius={60} strokeWidth={10} /></div>}>
              <ModelLoader />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
