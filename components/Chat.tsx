import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import SettingsMenu from "./SettingsMenu";
import { SettingsOpenContext } from "./ContextProviders";
import { useContext } from "react";

export default function Chat() {
  const [isSettingsOpen, _] = useContext(SettingsOpenContext);
  return (
    <>
      <div className="flex max-h-full min-w-0 flex-col p-10" style={isSettingsOpen ? { display: "none" } : {}}>
        <ChatMessages />
        <ChatInput />
      </div>
      <div className="flex h-full min-w-0 flex-col p-10" style={isSettingsOpen ? {} : { display: "none" }}>
        <SettingsMenu />
      </div>
    </>
  );
}