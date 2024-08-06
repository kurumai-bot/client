"use client";

import { useEffect, useRef } from "react";
import GenericEvent from "@/lib/genericEvent";
import Microphone from "@/lib/microphone";
import { StartMessage } from "@/lib/api/models";
import { useClient } from "@/lib/hooks";

export default function ChatInput() {
  const client = useClient();

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
        // TODO: temp
        client.sendMessage("972878d5-3e81-490a-a19a-69c22f572160", content);
        inputRef.current.value = "";
        inputRef.current.style.height = "";

        setInputState(false);
      }

      return;
    }
  }

  function handleOnInput(_: React.FormEvent) {
    // Make text area expand when text overflows
    inputRef.current.style.height = "";
    inputRef.current.style.height = inputRef.current.scrollHeight + 3 + "px";
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
    <div className="flex max-h-[40%] basis-auto items-center gap-3">
      <textarea ref={inputRef} onKeyDown={handleInputKeyDown} onInput={handleOnInput} rows={1} placeholder="Say something" className="max-h-full flex-1"/>
      <div className="w-12 h-12 bg-green-100" onClick={handleMicrophoneButtonClick}>

      </div>
    </div>
  );
}