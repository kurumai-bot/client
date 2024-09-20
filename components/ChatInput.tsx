"use client";

import { useContext, useEffect, useRef } from "react";
import { ConversationContext } from "./ContextProviders";
import GenericEvent from "@/lib/genericEvent";
import LimitedTextArea from "./LimitedTextArea";
import Microphone from "@/lib/microphone";
import { StartMessage } from "@/lib/api/models";
import { useClient } from "@/lib/hooks";

export default function ChatInput() {
  const client = useClient();
  const [currentConversation, _] = useContext(ConversationContext);

  const inputRef = useRef<HTMLTextAreaElement>(null!);

  const microphone = useRef(new Microphone);

  useEffect(() => {
    client.addEventListener("start", handleStart);
    client.addEventListener("finish", handleFinish);

    const microphoneVal = microphone.current;
    microphoneVal.addEventListener("data", handleMicrophoneData);

    return () => {
      client.removeEventListener("start", handleStart);
      client.removeEventListener("finish", handleFinish);

      microphoneVal.removeEventListener("data", handleMicrophoneData);
    };
  }, [client]); // eslint-disable-line react-hooks/exhaustive-deps

  // Only here in case start is called from another client
  function handleStart(_: GenericEvent<StartMessage>) {
    setInputState(false);
  }

  function handleFinish(_: Event) {
    if (microphone.current.state !== "running") {
      setInputState(true);
    }
  }

  function handleMicrophoneData(ev: GenericEvent<Float32Array>) {
    client.sendMicData(ev.data.buffer);
  }

  function handleInputKeyDown(ev: React.KeyboardEvent) {
    if (ev.key == "Enter" && !ev.shiftKey) {
      // If enter while not shifted isn't pressed, then send message
      // and clear textbox
      ev.preventDefault();
      ev.stopPropagation();

      if (inputRef.current.value != "") {
        const content = inputRef.current.value;
        client.sendMessage(currentConversation!.id, content);
        inputRef.current.value = "";
        inputRef.current.style.height = "";

        setInputState(false);
      }

      return;
    }
  }

  function setInputState(enabled: boolean) {
    inputRef.current.disabled = !enabled;
    inputRef.current.placeholder = enabled
      ? "Say something"
      : "Can't send messages while the server is processing or using microphone";
  };

  function handleMicrophoneButtonClick() {
    if (microphone.current.state === "stopped") {
      microphone.current.start();
      setInputState(false);
    } else {
      microphone.current.stop();

      if (client.pendingProcesses.size === 0) {
        setInputState(true);
      }
    }
  }

  return (
    <div className="flex max-h-[40%] items-center gap-3">
      <LimitedTextArea
        ref={inputRef}
        onKeyDown={handleInputKeyDown}
        rows={1}
        placeholder="Say something"
        divClassName="max-h-20 w-full"
        className="max-h-full w-full"
        maxLength={4096}
      />
      <div className="size-12 bg-green-100" onClick={handleMicrophoneButtonClick}>

      </div>
    </div>
  );
}