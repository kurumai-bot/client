import { ClientContext } from "@/components/ContextProviders";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import suspend from "./suspend";
import { useContext } from "react";
import { useGraph } from "@react-three/fiber";

// Used over three react fiber's `UseLoader` because it doesn't have support for raw data streams
// Otherwise, this function is mostly equivalent to `UseLoader`
export function useGLTF(data: ArrayBuffer | string) {
  const model = suspend(() => {
    const loader = new GLTFLoader;
    if (typeof data === "string") {
      return loader.loadAsync(data);
    } else {
      return loader.parseAsync(data, "");
    }
  // The useGLTF key won't change, but ensures the key isn't used by another component
  }, [data, "useGLTF"]);

  return Object.assign(model, useGraph(model.scene));
}

export function useClient() {
  const client = useContext(ClientContext);

  if (client === undefined) {
    throw new Error("API client has not been initialized");
  }

  return client;
}