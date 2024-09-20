"use client";

import { AvailableModels, BotUser } from "@/lib/api/models";
import Select, { StylesConfig } from "react-select";
import { useContext, useEffect, useState } from "react";
import { ConversationContext } from "./ContextProviders";
import LimitedTextArea from "./LimitedTextArea";
import LoadingSpinner from "./LoadingSpinner";
import SliderInput from "./SliderInput";
import { Tooltip } from "react-tooltip";
import { useClient } from "@/lib/hooks";


// TODO: maybe switch to css instead of this config
// TODO: also maybe scss?
// TODO: Expand on the initial context tooltip, probably with an faq of somekind
const selectStyle: StylesConfig = {
  container: (baseStyles, { isDisabled }) => ({
    ...baseStyles,
    opacity: isDisabled ? 0.38 : 1
  }),
  control: (baseStyles, { isFocused }) => ({
    ...baseStyles,
    backgroundColor: isFocused ? "var(--color-surface-container-high)" : "var(--color-surface-container)",
    borderColor: "var(--color-outline)",
    borderRadius: "0.5rem",
    boxShadow: isFocused ? "0 0 1px 1px var(--color-primary)" : "",
    ":hover": {
      borderColor: isFocused ? "inherit" : "var(--on-surface)"
    }
  }),
  indicatorSeparator: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: "var(--color-outline)"
  }),
  placeholder: (baseStyles) => ({
    ...baseStyles,
    color: "var(--color-on-surface-variant)"
  }),
  singleValue: (baseStyles) => ({
    ...baseStyles,
    color: "var(--color-on-surface)"
  }),
  menu: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: "var(--color-surface-container)",
    filter: "drop-shadow(0 0 0.75rem black)",
    borderRadius: "0.5rem"
  }),
  option: (baseStyles, { isFocused, isSelected }) => ({
    ...baseStyles,
    backgroundColor: isSelected ? "var(--color-secondary-container)" : isFocused ? "var(--color-surface-container-high)" : "inherit",
    color: isSelected ? "var(--color-on-secondary-container)" : "inherit",
    ":active": {
      backgroundColor: "var(--color-secondary-container)",
      color: "var(--color-on-secondary-container)"
    }
  })
};


export default function SettingsMenu() {
  const client = useClient();
  const [currentConversation, _] = useContext(ConversationContext);
  const [botUser, setBotUser] = useState<BotUser | undefined>(undefined);
  const [availableModels, setAvailableModels] = useState<AvailableModels | undefined>(undefined);

  useEffect(() => {
    client.getAvailableModels().then(setAvailableModels);

    if (currentConversation !== undefined) {
      client.getBotUser(currentConversation.botUserId).then(setBotUser);
    }
  }, [client, currentConversation]);

  if (botUser === undefined || availableModels === undefined) {
    return (<LoadingSpinner />);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="-mx-2 flex-1 overflow-y-auto overflow-x-visible px-2">
        <h1 className="mb-5 border-b border-[color:var(--color-outline)] text-2xl font-semibold">
          Bot Settings
        </h1>

        <div data-tooltip-id="text-gen-model-tooltip">
          <label className="block">Text Generation AI Model</label>
          <Select
            defaultValue={{ value: botUser.textGenModelName, label: botUser.textGenModelName }}
            options={availableModels.textGen.map((model) => ({ value: model, label: model }))}
            styles={selectStyle}
            classNamePrefix="react-select"
          />
          <br />
        </div>
        <Tooltip id="text-gen-model-tooltip" className="tooltip" delayShow={500}>
          The text generation model to use<br />
          Change &quot;Initial Context&quot; over this to customize responses
        </Tooltip>

        <div data-tooltip-id="context-tooltip">
          <label className="block">Initial Context</label>
          <LimitedTextArea
            className="block w-full"
            defaultValue={botUser.textGenStartingContext}
            maxLength={4096}
            rows={3}
            placeholder="Enter instructions for your AI here!"
          />
          <br />
        </div>
        <Tooltip id="context-tooltip" className="tooltip" delayShow={500}>
          The starting context or instructions for the text generation AI
        </Tooltip>

        <div className="flex flex-col gap-5 xl:flex-row">
          <div className="flex-1" data-tooltip-id="temperature-tooltip">
            <SliderInput label="Temperature" min={0} max={2} defaultValue={1} step={0.01} />
          </div>
          <Tooltip id="temperature-tooltip" className="tooltip" delayShow={500}>
            The randomness of the text generation
          </Tooltip>

          <div className="flex-1" data-tooltip-id="tokens-tooltip" >
            <SliderInput label="Max Tokens" min={0} max={4096} defaultValue={2048} step={1} />
          </div>
          <Tooltip id="tokens-tooltip" className="tooltip" delayShow={500}>
            The max length of the text generation in tokens<br />
            More tokens will slow down responses<br />
            Three tokens is about four words
          </Tooltip>
        </div>
        <br />

        <div className="flex flex-col gap-5 xl:flex-row">
          <div className="flex-1" data-tooltip-id="tts-model-tooltip">
            <label className="block">Text-to-Speech AI Model</label>
            <Select
              defaultValue={{ value: botUser.ttsModelName, label: botUser.ttsModelName }}
              options={Object.keys(availableModels.tts).map((model) => ({ value: model, label: model }))}
              styles={selectStyle}
              classNamePrefix="react-select"
            />
          </div>
          <Tooltip id="tts-model-tooltip" className="tooltip" delayShow={500}>
            The text-to-speech model to use to generate speech
          </Tooltip>

          <div className="flex-1" data-tooltip-id="tts-speaker-tooltip">
            <label className="block">Text-to-Speech AI Model Speaker</label>
            <Select
              defaultValue={{ value: botUser.ttsSpeakerName, label: botUser.ttsSpeakerName }}
              options={Object.values(availableModels.tts[botUser.ttsModelName]).map((speaker) => ({ value: speaker, label: speaker  }))}
              styles={selectStyle}
              classNamePrefix="react-select"
            />
          </div>
          <Tooltip id="tts-speaker-tooltip" className="tooltip" delayShow={500}>
            The specific voice of the text-to-speech model, if available
          </Tooltip>
        </div>
        <br />
      </div>
      <div className="basis-10">
        <hr />
        <div className="flex justify-between py-5">
          <button className="raised-button">Cancel</button>
          <button className="filled-button">Save</button>
        </div>
      </div>
    </div>
  );
}