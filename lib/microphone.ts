import GenericEvent, { GenericEventTarget } from "./genericEvent";

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

export default class Microphone extends GenericEventTarget<Microphone, MicrophoneEventMap> {
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