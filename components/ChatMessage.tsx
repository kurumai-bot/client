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
    <div className={`float-${side} my-5 max-w-[75%] ${alignSelf} break-words`}> { /* eslint-disable-line tailwindcss/no-custom-classname */ }
      <div className={"rounded-lg p-3"} style={{"backgroundColor": color}}>
        {children}
      </div>
    </div>
  );
}
