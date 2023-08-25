import React from "react";

export interface ChatMessageProps {
  color?: string
  side?: "left" | "right"
  children?: React.ReactNode
}

export default function ChatMessage({
  color = "#121212",
  side = "right",
  children = null
}: ChatMessageProps = {}) {
  const alignSelf = side == "right" ? "self-end" : "self-start";

  return (
    <div className={`max-w-[75%] float-${side} ${alignSelf} my-5 break-words`}>
      <div className={"p-3 rounded-lg"} style={{"backgroundColor": color}}>
        {children}
      </div>
    </div>
  );
}
