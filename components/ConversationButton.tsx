import { Conversation } from "@/lib/api/models";
import { ConversationContext } from "@/app/(home)/page";
import Image from "next/image";
import { UUID } from "crypto";
import { useContext } from "react";

export interface ConversationButtonProps {
  conversation: Conversation
  selected?: boolean
}

export default function ConversationButton({
  conversation,
  selected = false
}: ConversationButtonProps) {
  const [_, setCurrentConveration] = useContext(ConversationContext);

  return (
    <button onClick={() => setCurrentConveration(conversation)} className={"mb-1 flex h-12 items-center rounded-lg  px-2 py-1 hover:opacity-70 " + (selected ? "bg-[rgb(var(--tertiary-rgb))]" : "bg-[var(--background-rgb)]")}>
      <div className="h-full">
        <Image
          src="/pfp-placeholder.png"
          width={64}
          height={64}
          alt=""
          className="size-full rounded-full"
        />
      </div>
      <p className="ml-2 truncate">
        {conversation.name}
      </p>
    </button>
  );
}