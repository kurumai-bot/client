"use client";

import { Canvas } from "@react-three/fiber";
import ThreeModel from "./ThreeModel";

export default function Model() {
  // TODO: Create a better way to load models from the user locally.
  return (
    <Canvas>
      <ThreeModel modelUrl="CHANGE ME.gltf" />
      <ambientLight />
    </Canvas>
  );
}