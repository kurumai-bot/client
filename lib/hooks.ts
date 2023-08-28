import { useContext, useMemo } from "react";
import { ClientContext } from "@/components/ClientProvider";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import suspend from "./suspend";
import { useGraph } from "@react-three/fiber";

// Used over three react fiber's `UseLoader` because it doesn't have support for raw data streams
// Otherwise, this function is mostly equivalent to `UseLoader`
export function useGLTF(data: ArrayBuffer | string) {
  const model = useMemo(() => {
    const loader = new GLTFLoader;
    if (typeof data === "string") {
      return suspend(() => loader.loadAsync(data), [data]);
    } else {
      return suspend(() => loader.parseAsync(data, ""), [data]);
    }
  }, [data]);

  return Object.assign(model, useGraph(model.scene));
}

export function useClient() {
  const client = useContext(ClientContext);

  if (client === undefined) {
    throw new Error("API client has not been initialized");
  }

  return client;
}