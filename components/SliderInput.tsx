import { useRef, useState } from "react";
import Slider from "rc-slider";

export interface SliderInputProps {
  label: string
  min: number
  max: number
  defaultValue: number
  step: number
}

export default function SliderInput({
  label = "",
  min = 0,
  max = 100,
  defaultValue = 50,
  step = 1
}: SliderInputProps) {
  const inputRef = useRef<HTMLInputElement>(undefined!);
  const [value, setValue] = useState(defaultValue);

  function onSliderValueChange(value: number | number[]) {
    const valNumber = value as number;
    inputRef.current.value = valNumber.toString();
    setValue(valNumber);
  }

  function inputOnInput() {
    // Convert into number
    const val = Number.parseFloat(inputRef.current.value);

    // If it fails to convert, is out of range, or isn't divisible by steps, revert
    // Multiply by large number to deal with floating point errors. not ideal, but works for our use
    // cases.
    if (Number.isNaN(val) || val > max || val < min || ((val - min) * 1_000_000) % (step * 1_000_000) != 0) {
      return;
    }

    setValue(val);
  }

  function inputOnBlur() {
    // Set input value to whatever value we have stored, this prevents invalid inputs and 
    // normalizes all inputs to look the same
    inputRef.current.value = value.toString();
  }

  return (
    <>
      <div className="mb-1 flex items-center justify-between">
        <label className="float-left">{label}</label>
        <input
          className="float-right w-16 rounded px-1 py-0 text-right"
          type="text"
          defaultValue={defaultValue}
          onBlur={inputOnBlur}
          onInput={inputOnInput}
          ref={inputRef}
        />
      </div>
      <Slider min={min} max={max} defaultValue={defaultValue} step={step} onChange={onSliderValueChange} value={value} />
    </>
  );
}