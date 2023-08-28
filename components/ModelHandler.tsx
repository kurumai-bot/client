"use client";

import { FormEvent, useRef, useState } from "react";
import ThreeJSModel from "./ThreeJSModel";
import { suspend } from "@/lib/utils";

export default function ModelHandler() {
  const [modelData, setModelData] = useState<ArrayBuffer | string>("");
  const filePromise = useRef<Promise<ArrayBuffer> | undefined>();

  if (filePromise.current !== undefined) {
    const buffer = suspend(filePromise.current);
    filePromise.current = undefined;
    setModelData(buffer);
  }

  function onInputChange(ev: FormEvent) {
    const input = ev.target as HTMLInputElement;
    filePromise.current = input.files![0].arrayBuffer();
    // Need to cause rerender
    setModelData(new ArrayBuffer(0));
  }

  return (
    <>
      {
        modelData !== ""
          ? <ThreeJSModel modelData={modelData} />
          : <div className="h-full flex justify-center items-center">
              <input type="file" onChange={onInputChange} accept=".gltf" />
            </div>
      }
    </>
  );
}