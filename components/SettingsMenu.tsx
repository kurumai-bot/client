"use client";

import Select, { StylesConfig } from "react-select";
import LimitedTextArea from "./LimitedTextArea";
import SliderInput from "./SliderInput";


// TODO: maybe switch to css instead of this config
// TODO: also maybe scss?
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
  return (
    <div className="flex h-full flex-col">
      <div className="-mx-2 flex-1 overflow-y-auto overflow-x-visible px-2">
        <h1 className="mb-5 border-b border-[color:var(--color-outline)] text-2xl font-semibold">
          Bot Settings
        </h1>

        <label className="block">Text Generation AI Model</label>
        <Select options={[
          { value: "what", label: "what" },
          { value: "how", label: "how" },
          { value: "who", label: "who" }
        ]} styles={selectStyle} classNamePrefix="react-select" />
        <br />

        <label className="block">Initial Context</label>
        <LimitedTextArea className="block w-full" maxLength={4096} rows={3} placeholder="Enter instructions for your AI here!" />
        <br />

        <div className="flex flex-col gap-5 xl:flex-row">
          <div className="flex-1">
            <SliderInput label="Temperature" min={0} max={2} defaultValue={1} step={0.01} />
          </div>
          <div className="flex-1">
            <SliderInput label="Max Tokens" min={0} max={4096} defaultValue={2048} step={1} />
          </div>
        </div>
        <br />

        <div className="flex flex-col gap-5 xl:flex-row">
          <div className="flex-1">
            <label className="block">Text-to-Speech AI Model</label>
            <Select options={[
              { value: "what", label: "what" },
              { value: "how", label: "how" },
              { value: "who", label: "who" }
            ]} styles={selectStyle} classNamePrefix="react-select" />
          </div>

          <div className="flex-1">
            <label className="block">Text-to-Speech AI Model Speaker</label>
            <Select options={[
              { value: "what", label: "what" },
              { value: "how", label: "how" },
              { value: "who", label: "who" }
            ]} styles={selectStyle} classNamePrefix="react-select" />
          </div>
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