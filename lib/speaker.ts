import { GenericEventTarget } from "./genericEvent";

// A simple wrapper to play raw wav data through speakers
type SpeakerEventMap = {
  "finish": Event
}

interface SpeakerProps {
  sampleRate?: number
}

export default class Speaker extends GenericEventTarget<Speaker, SpeakerEventMap> {
  readonly context: AudioContext;
  private readonly queue = new Array<Uint8Array>;
  private sourceNode?: AudioBufferSourceNode;
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

    this.sourceNode?.stop();
    this.sourceNode?.disconnect();

    this.sourceNode = this.context.createBufferSource();
    this.sourceNode.buffer = audioBuffer;
    this.sourceNode.connect(this.context.destination);
    this.sourceNode.addEventListener("ended", () => this.onBufferEnded());
    this.isSourcePlaying = true;
    this.sourceNode.start(0);
  }

  stop() {
    this.queue.length = 0;
    if (this.sourceNode !== undefined && this.isSourcePlaying) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
    }
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