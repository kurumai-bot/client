"use client";

import { FormEvent, useState } from "react";
import ThreeJSModel from "./ThreeJSModel";
import { suspend } from "@/lib/utils";

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
          : <div className="h-full flex justify-center items-center">
              <input type="file" onChange={onInputChange} accept=".gltf" />
            </div>
      }
    </>
  );
}