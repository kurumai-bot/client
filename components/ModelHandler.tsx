"use client";

import { FormEvent, useState } from "react";
import ThreeJSModel from "./ThreeJSModel";
import suspend from "@/lib/suspend";

export default function ModelHandler() {
  const [modelData, setModelData] = useState<ArrayBuffer | string | File>("");

  if (modelData instanceof File) {
    setModelData(suspend(() => modelData.arrayBuffer(), [modelData]));
  }

  function onInputChange(ev: FormEvent) {
    const input = ev.target as HTMLInputElement;
    setModelData(input.files![0]);
  }

  return (
    <>
      {
        modelData !== "" &&  !(modelData instanceof File)
          ? <ThreeJSModel modelData={modelData} />
          : <div className="flex-center flex-col">
              <label>Choose model file</label>
              <input type="file" onChange={onInputChange} accept=".gltf" />
            </div>
      }
    </>
  );
}