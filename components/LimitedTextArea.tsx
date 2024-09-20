import { FormEvent, TextareaHTMLAttributes, forwardRef, useCallback, useEffect, useRef, useState } from "react";

export type LimitedTextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "ref"> & {
  divClassName?: string
}

const LimitedTextArea = forwardRef<HTMLTextAreaElement, LimitedTextAreaProps>((props, ref) => {
  const [length, setLength] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const divRef = useRef<HTMLDivElement | null>(null);

  const onInput = useCallback(() => {
    if (inputRef.current === null || divRef.current === null) {
      return;
    }

    // Reset height so it can get smaller
    inputRef.current.style.height = "";

    // Make text area expand when text overflows
    const computedStyle = window.getComputedStyle(inputRef.current);
    const lineHeight = Number.parseInt(computedStyle.lineHeight);
    const paddingTop = Number.parseInt(computedStyle.paddingTop);
    const paddingBottom = Number.parseInt(computedStyle.paddingBottom);
    const rowsHeight = ((props.rows ?? 0) * lineHeight) + 3 + paddingTop + paddingBottom;
    const expandedHeight = inputRef.current.scrollHeight + 3;

    // Don't change height to be lower than row count
    inputRef.current.style.height = Math.max(expandedHeight, rowsHeight) + "px";

    divRef.current.style.height = inputRef.current.style.height;
    setLength(inputRef.current.textLength);
  }, [props.rows]);

  // Combine onInput callback passed in with our own
  const combinedOnInput = useCallback((ev: FormEvent<HTMLTextAreaElement>) => {
    onInput();
    props.onInput?.bind(ev);
  }, [props.onInput, onInput]);
  if (Object.hasOwn(props, "onInput")) {
    props.onInput = combinedOnInput;
  }

  // Make sure
  useEffect(() => {
    if (divRef.current !== null) {
      divRef.current.style.position = "relative";
    }
    onInput();
  }, [onInput]);

  const { divClassName: divClassName, ...textAreaProps } = props;
  return (
    <div className={divClassName} ref={divRef}>
      <textarea
        // Assign value to both refs
        ref={(node) => {
          inputRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        {...textAreaProps}
        {...Object.hasOwn(props, "onInput") ? {} : { onInput: combinedOnInput }}
       />
      {props.maxLength ? (
        <div className="absolute bottom-0 right-1 inline text-sm text-[var(--color-on-surface-variant)]">
          {length}/{props.maxLength}
        </div>
      ) : null
      }
    </div>
  );
});
LimitedTextArea.displayName = "LimitedTextArea";
export default LimitedTextArea;
