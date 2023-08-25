import ChatInput from "@/components/ChatInput";
import ChatMessages from "@/components/ChatMessages";
import Model from "@/components/Model";
import React from "react";


export default function Page() {
  return (
    <div className="main-wrapper">
      <div className="h-full p-20">
        <main className="flex h-full border border-[color:rgb(var(--secondary-rgb))] rounded-lg">
          <div className="shrink-0 grow-0 basis-[60%] border-r border-[color:rgb(var(--secondary-rgb))]">
            <Model />
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
