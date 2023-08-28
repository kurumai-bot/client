import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Message } from "protobufjs";
import { useGraph } from "@react-three/fiber";
import { useMemo } from "react";

// TODO: reconsider whether this file needs to exist

// A class whose generic is a map that maps an event type name to an event.
export class GenericEventTarget<ThisType, Map extends Record<string, Event>> extends EventTarget {
  addEventListener<K extends keyof Map>(type: K, listener: null | ((this: ThisType, ev: Map[K]) => any) | { handleEvent(this: ThisType, ev: Map[K]): any }, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    super.addEventListener(type, listener, options);
  }

  removeEventListener<K extends keyof Map>(type: K, listener: null | ((this: ThisType, ev: Map[K]) => any) | { handleEvent(this: ThisType, ev: Map[K]): any }, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) {
    super.removeEventListener(type, listener, options);
  }
}

export class GenericEvent<T> extends Event {
  data: T;

  constructor(type: string, data: T, eventInitDict?: EventInit) {
    super(type, eventInitDict);

    this.data = data;
  }
}

// A simple wrapper to play raw wav data through speakers
type SpeakerEventMap = {
  "finish": Event
}

interface SpeakerProps {
  sampleRate?: number
}

export class Speaker extends GenericEventTarget<Speaker, SpeakerEventMap> {
  readonly context: AudioContext;
  private readonly queue = new Array<Uint8Array>;
  private isSourcePlaying = false;

  public get isPlaying(): boolean {
    return this.isSourcePlaying;
  }

  constructor({
    sampleRate = 24_000
  }: SpeakerProps = {}) {
    super();

    this.context = new AudioContext({ sampleRate: sampleRate });
  }

  play(bytes: Uint8Array) {
    if (this.isSourcePlaying) {
      this.queue.push(bytes);
      return;
    }

    const wav = new Float32Array(bytes.buffer.slice(bytes.byteOffset));
    const audioBuffer = this.context.createBuffer(
      1,
      wav.length,
      this.context.sampleRate
    );
    audioBuffer.copyToChannel(wav, 0);

    const sourceNode = this.context.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(this.context.destination);
    sourceNode.addEventListener("ended", () => this.onBufferEnded());
    this.isSourcePlaying = true;
    sourceNode.start(0);
    console.log("aksdjfa;skjdf");
  }

  private onBufferEnded() {
    this.isSourcePlaying = false;
    this.dispatchEvent(new Event("finish"));

    const next = this.queue.shift();
    if (next === undefined) {
      return;
    }

    this.play(next);
  }
}

// A simple wrapper for getting data from microphone
type MicrophoneEventMap = {
  "data": GenericEvent<Float32Array>
  "start": Event
  "stop": Event
}

interface MicrophoneProps {
  channelCount?: number
  sampleRate?: number
  chunkSize?: number
}

type MicrophoneState = "stopped" | "running";

export class Microphone extends GenericEventTarget<Microphone, MicrophoneEventMap> {
  context?: AudioContext;
  private stream?: MediaStream;
  channelCount: number;
  sampleRate: number;
  chunkSize: number;

  constructor({
    channelCount = 1,
    sampleRate = 16_000,
    chunkSize = 2048
  }: MicrophoneProps = {}) {
    super();

    this.channelCount = channelCount;
    this.sampleRate = sampleRate;
    this.chunkSize = chunkSize;
  }

  get state(): MicrophoneState {
    if (this.context === undefined) {
      return "stopped";
    }

    switch (this.context.state) {
      case undefined:
      case "closed":
      case "suspended":
        return "stopped";
      default:
        return this.context.state;
    }
  }

  start() {
    // TODO: figure out how much next and react help with unsupported browsers
    this.context = new AudioContext({ sampleRate: this.sampleRate });

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          channelCount: this.channelCount,
          sampleRate: this.sampleRate,
          deviceId: "default"
        },
        video: false,
        preferCurrentTab: false
      })
      .then((stream) => {
        this.stream = stream;
        if (this.context === undefined || this.context.state === "closed") {
          this.stop();
          return;
        }

        const streamNode = this.context.createMediaStreamSource(stream);

        // This is deprecated but the alternative (Worklets) and is hard to work
        // with when using a bundler, requiring extra steps and A LOT more code.
        // See more:
        // https://stackoverflow.com/questions/67444578/next-js-10-2-audio-worklet-support
        // https://github.com/webpack/webpack/issues/11543
        const scriptNode = this.context.createScriptProcessor(
          this.chunkSize,
          this.channelCount,
          this.channelCount
        );
        scriptNode.onaudioprocess = (ev) => {
          const data = ev.inputBuffer.getChannelData(0);
          this.dispatchEvent(new GenericEvent("data", data));
        };
        streamNode.connect(scriptNode);

        scriptNode.connect(this.context.destination);
      }).catch((err) => {
        // TODO: actually handle error
        console.log(err);
      });
  }

  stop() {
    // Close the audio context instead of pausing to release the browser's hold
    // of the microphone
    this.stream?.getTracks().forEach((track) => track.stop());

    this.context?.close().then(
      () => this.dispatchEvent(new Event("stop"))
    );
  }
}

export class ApiError extends Error {
  cause?: Response;
}

// TODO: make this named params instead
export async function makeRequest(
  url: string,
  method: "delete" | "get" | "post" | "put",
  queryParams: any = undefined,
  body: any = undefined
) {
  const params: string[] = [];
  if (queryParams !== undefined) {
    for (let key in queryParams) {
      if (queryParams[key] === undefined) {
        continue;
      }

      params.push(`${key}=${queryParams[key]}`);
    }
  }

  const res = await fetch(
    url + "?" + params.join("&"),
    {
      method: method,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      cache: "no-cache"
    }
  );

  // TODO: Yea this is probably inadequate
  if (!res.ok) {
    throw new ApiError("Request failed with error: " + await res.text(), { cause: res });
  }

  return res;
}

export function protoToObject<T>(message: Message) {
  const type = message.$type;
  const messageObj = type.toObject(message);

  // Only need to convert timestamps
  for (let key in type.fields) {
    const field = type.fields[key];

    if (messageObj[key] === undefined || field.resolvedType === null) {
      continue;
    } else if (field.resolvedType!.parent?.name === "kurumai") {
      if (field.repeated) {
        const arr = (message as any)[key] as Array<any>;
        for (let i = 0; i < arr.length; i++) {
          arr[i] = protoToObject(arr[i]);
        }
      } else {
        messageObj[key] = protoToObject((message as any)[key]);
      }
    } else if (field.type === "google.protobuf.Timestamp") {
      const timestamp = messageObj[key];
      const seconds = timestamp["seconds"];
      const nanos = timestamp["nanos"];
      messageObj[key] = new Date(seconds * 1000 + Math.round(nanos / 1_000_000));
    }
  }

  return messageObj as T;
}

// This suspends a component while a promise is pending.
// The promise has to be the same inbetween calls, essentially meaning the promise has to be
// This is required for `Suspense` to work.
type SuspendPromise<T> = { _status: "fulfilled" | "pending" | "rejected", _res: T } & Promise<T>
export function suspend<T>(promise: Promise<T>) {
  const suspendPromise = promise as SuspendPromise<T>;

  switch (suspendPromise._status) {
    case "fulfilled":
      return suspendPromise._res;
    case "pending":
      throw suspendPromise;
    case "rejected":
      throw suspendPromise._res;
    default:
      suspendPromise._status = "pending";

      suspendPromise.then((val) => {
        suspendPromise!._status = "fulfilled";
        suspendPromise!._res = val;
      }).catch((err) => {
        suspendPromise!._status = "rejected";
        suspendPromise!._res = err;
      });
      throw suspendPromise;
  }
}

export const snakeCaseRegex = /(?<=.)_+./gm;
export function objSnakeToCamel(object: any) {
  for (let key in object) {
    // Remove key and convert it to camel, then readd the key to the object
    const val = object[key];
    delete object[key];

    let i = 0;
    for (let match of key.matchAll(snakeCaseRegex)) {
      key =
        key.slice(0, match.index! - i)
        + match[0][1].toUpperCase()
        + key.slice(match.index! + 2 - i++);
    }

    // Change keys recursively (this will also handle arrays)
    if (val instanceof Object) {
      objSnakeToCamel(val);
    }

    object[key] = val;
  }

  return object;
}

// Used over three react fiber's `UseLoader` because it doesn't have support for raw data streams
// Otherwise, this function is mostly equivalent to `UseLoader`
let loaderPromise: Promise<GLTF> | undefined;
export function useGLTF(data: ArrayBuffer | string) {
  const model = useMemo(() => {
    const loader = new GLTFLoader;
    if (loaderPromise !== undefined) {
      const retValue = suspend(loaderPromise);
      loaderPromise = undefined;
      return retValue;
    } else if (typeof data === "string") {
      loaderPromise = loader.loadAsync(data);
    } else {
      loaderPromise = loader.parseAsync(data, "");
    }
    return suspend(loaderPromise);
  }, [data]);

  console.log(model.scene);

  return Object.assign(model, useGraph(model.scene));
}