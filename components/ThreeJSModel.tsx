"use client";

import { AnimationAction, AnimationClip, AnimationMixer, Bone, Mesh, NumberKeyframeTrack, Vector3 } from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useClient, useGLTF } from "@/lib/hooks";
import { useEffect, useRef } from "react";
import GenericEvent from "@/lib/genericEvent";
import Speaker from "@/lib/speaker";
import { TTSMessage } from "@/lib/api/models";

// This is needed because the internal component cant access ThreeJS hooks without being in a canvas
export default function ThreeJSModel({
  modelData = ""
}: {
  modelData: string | ArrayBuffer
}) {
  return (
    <Canvas>
      <ThreeJSModelInternal modelData={modelData} />
      <ambientLight />
    </Canvas>
  );
}

export function ThreeJSModelInternal({
  modelData = ""
}: {
  modelData: string | ArrayBuffer
}) {
  const model = useGLTF(modelData);
  const camera = useThree((state) => state.camera);

  const mixersRef = useRef(new Array<AnimationMixer>);
  const visemeMapRef = useRef(new Map<VisemeEnum, Map<string, number>>);
  const currentExpressionRef = useRef<{ index: number, absoluteStartTime: number } | null>(null);
  const ttsQueueRef = useRef(new Array<[Uint8Array, Array<AnimationAction>]>);
  const lastPlayedRef = useRef<[Uint8Array, Array<AnimationAction>]>();

  const client = useClient();

  const speakerRef = useRef<Speaker>(undefined!);
  if (speakerRef.current === undefined) {
    speakerRef.current = new Speaker;
    speakerRef.current.addEventListener("finish", handleSpeakerFinish);
  }

  useEffect(() => {
    mixersRef.current = [];
    visemeMapRef.current.clear();
    currentExpressionRef.current = null;
    ttsQueueRef.current = [];

    // Loop through nodes and find necessary info
    const headPos = new Vector3;
    for (let key in model.nodes) {
      // Filter non bones and non meshes
      const node = model.nodes[key];
      if (node instanceof Bone) {
        // Find head bone and it's position
        const bone = node as Bone;
        if (bone.name.toLowerCase() !== "head") {
          continue;
        }

        bone.getWorldPosition(headPos);
      } else if (node instanceof Mesh) {
        const mesh = node as Mesh;
        mixersRef.current.push(new AnimationMixer(mesh));
        getMeshVisemes(mesh);
      }
    }

    const camPos = headPos.add(new Vector3(0, 0, 0.25));
    camera.position.set(camPos.x, camPos.y, camPos.z);
  }, [modelData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    client.addEventListener("finish_gen", handleFinishGen);

    return () => {
      client.removeEventListener("finish_gen", handleFinishGen);
    };
  }, [client]);

  useFrame((_, delta) => {
    for (let mixer of mixersRef.current) {
      mixer.update(delta);
    }

    // if (ttsMessageQueueRef.current.length === 0) {
    //   return;
    // }
    // const ttsMessage = ttsMessageQueueRef.current[0];
    // const nowSeconds = Date.now() / 1_000;

    // // Check if we're at the beginning of the tts message
    // if (currentExpressionRef.current === null) {
    //   speakerRef.current.play(ttsMessage.data);
    //   currentExpressionRef.current = { index: 0, absoluteStartTime: nowSeconds };
    // }
    // const currExpression = currentExpressionRef.current;

    // if (ttsMessage.expressions.length === 0) {
    //   ttsMessageQueueRef.current.shift();
    // }

    // const expression = ttsMessage.expressions[currExpression.index];
    // // If we're at the last expression then use a silent viseme
    // const nextExpression = ttsMessage.expressions.at(currExpression.index + 1)
    //   ?? {
    //     visemes: [{ index: VisemeEnum.sil as number, weight: 1 }],
    //     startTime: expression.startTime + 0.1
    //   };

    // // Check how far into the expression we are to linearly interpolate between expressions
    // const expressionDuration = nextExpression.startTime - expression.startTime;
    // const blendVal = MathUtils.clamp(
    //   (nowSeconds - currExpression.absoluteStartTime) / expressionDuration,
    //   0,
    //   1
    // );

    // // Check if we've past the start of the next expression
    // if (blendVal >= 1) {
    //   currExpression.index++;
    //   currExpression.absoluteStartTime = nowSeconds;

    //   // Check if we've past the last expression of the current message
    //   if (currExpression.index >= ttsMessage.expressions.length) {
    //     ttsMessageQueueRef.current.shift();
    //     currentExpressionRef.current = null;
    //   }
    // }
    // const lerpValue = MathUtils.lerp(1, 0, blendVal);
    // const nextLerpValue = MathUtils.lerp(0, 1, blendVal);

    // const blendedVisemes = new Map<VisemeEnum, number>;
    // for (let viseme of expression.visemes) {
    //   blendedVisemes.set(viseme.index, viseme.weight * lerpValue);
    // }
    // for (let viseme of nextExpression.visemes) {
    //   blendedVisemes.set(
    //     viseme.index,
    //     blendedVisemes.get(viseme.index) ?? 0 + viseme.weight * nextLerpValue
    //   );
    // }

    // // Loop through meshes and apply visemes
    // for (let [viseme, weight] of blendedVisemes.entries()) {
    //   for (let mesh of meshesRef.current) {
    //     mesh.updateMorphTargets();

    //     const meshMap = visemeMapRef.current.get(viseme);
    //     if (meshMap === undefined) {
    //       continue;
    //     }

    //     const morphIndex = meshMap.get(mesh.id);
    //     if (morphIndex === undefined) {
    //       continue;
    //     }

    //     mesh.morphTargetInfluences![morphIndex] = weight * lerpValue;
    //   }
    // }
  });

  function getMeshVisemes(mesh: Mesh) {
    // Get viseme shapekeys
    for (let shapeKey in mesh.morphTargetDictionary) {
      const shapeKeyLower = shapeKey.toLowerCase();
      for (let visemeString in VisemeEnum) {
        // Enums in typescript are a little weird, so looping like this will include the int
        // values assigned to each string. So, let's skip them
        if (!isNaN(Number(visemeString))) {
          continue;
        }

        const viseme = VisemeEnum[visemeString as keyof typeof VisemeEnum];
        if (!shapeKeyLower.endsWith(visemeString.toLowerCase())) {
          continue;
        }

        const meshMap = visemeMapRef.current.get(viseme);
        if (meshMap !== undefined) {
          meshMap.set(mesh.uuid, mesh.morphTargetDictionary[shapeKey]);
        } else {
          const map = new Map;
          visemeMapRef.current.set(viseme, map);
          map.set(mesh.uuid, mesh.morphTargetDictionary[shapeKey]);
        }
      }
    }
  }

  function handleFinishGen(ev: GenericEvent<TTSMessage>) {
    // Each track represents a single blendshape
    const duration = ev.data.expressions.at(-1)!.startTime + 0.1;
    const tracks = new Map<VisemeEnum, [Array<number>, Array<number>]>;
    let lastTrack: [Array<number>, Array<number>] | undefined = undefined;
    for (let expression of ev.data.expressions) {
      for (let viseme of expression.visemes) {
        if (!tracks.has(viseme.index)) {
          tracks.set(viseme.index, [[0, duration], [0, 0]]);
        }
        const [times, values] = tracks.get(viseme.index)!;

        if (lastTrack !== undefined) {
          // Add keyframe to start current expression
          times.splice(-1, 0, lastTrack[0].at(-2)!);
          values.splice(-1, 0, 0);

          // Add keyframe to end last expression
          lastTrack[0].splice(-1, 0, expression.startTime);
          lastTrack[1].splice(-1, 0, 0);
        }

        times.splice(-1, 0, expression.startTime);
        values.splice(-1, 0, viseme.weight);

        lastTrack = [times, values];
      }
    }

    // Create clips to be played and add to queue
    const actions = new Array<AnimationAction>;
    for (let mixer of mixersRef.current) {
      const root = mixer.getRoot();
      const clip = new AnimationClip(undefined, duration, []);

      for (let [viseme, [times, values]] of tracks) {
        const shapeIndex = visemeMapRef.current.get(viseme)?.get(root.uuid);
        if (shapeIndex === undefined) {
          continue;
        }

        clip.tracks.push(new NumberKeyframeTrack(
          `.morphTargetInfluences[${shapeIndex}]`,
          times,
          values
        ));
      }

      const action = mixer.clipAction(clip);
      action.repetitions = 0;
      actions.push(action);
    }

    // If nothing is playing then just play this one else add it to the queue
    if (!speakerRef.current.isPlaying) {
      speakerRef.current.play(ev.data.data);
      for (let action of actions) {
        action.play();
      }
      lastPlayedRef.current = [ev.data.data, actions];
    } else {
      ttsQueueRef.current.push([ev.data.data, actions]);
    }
  }

  function handleSpeakerFinish() {
    // Remove old clips from cache
    if (lastPlayedRef.current !== undefined) {
      for (let action of lastPlayedRef.current[1]) {
        action.stop();
        action.getMixer().uncacheAction(action.getClip());
      }
    }

    if (ttsQueueRef.current.length === 0) {
      return;
    }

    // Play next thing
    const next = ttsQueueRef.current.shift()!;
    speakerRef.current.play(next[0]);
    for (let action of next[1]) {
      action.play();
    }
    lastPlayedRef.current = next;
  }

  return (
    <primitive object={model.scene} />
  );
}

enum VisemeEnum {
  "sil" = 0,
  "PP" = 1,
  "FF" = 2,
  "TH" = 3,
  "DD" = 4,
  "kk" = 5,
  "CH" = 6,
  "SS" = 7,
  "nn" = 8,
  "RR" = 9,
  "aa" = 10,
  "E" = 11,
  "I" = 12,
  "O" = 13,
  "U" = 14
}