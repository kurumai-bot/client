import { Conversation, Expression, Message, OpCodes, StartMessage, TTSMessage, User } from "./models";
import GenericEvent, { GenericEventTarget } from "../genericEvent";
import { Socket, io } from "socket.io-client";
import { ApiError } from "./errors";
import { UUID } from "crypto";
// TODO: Consider switching to swr

export const apiUrl = "http://localhost:8080/";

export type ClientEventMap = {
  "message": GenericEvent<Message[]>
  "start": GenericEvent<StartMessage>
  "finish_asr": GenericEvent<Message | undefined>
  "finish_gen": GenericEvent<TTSMessage>
  "finish": Event
}
export class Client extends GenericEventTarget<Client, ClientEventMap> {
  private static _socketio: Socket;
  private static _textDecoder: TextDecoder = new TextDecoder();

  // Conversation and message objects shouldn't change, so a permanent cache should work
  readonly conversationCache = new Map<UUID, Conversation>();
  readonly messageCache = new Map<UUID, Message[]>();
  readonly pendingProcesses = new Set<UUID>();
  readonly pendingWAVs = new Map<UUID, Uint8Array | [Message, Expression[]]>();

  readonly socketio: Socket;

  private _currentUser: User | undefined;

  private constructor() {
    super();

    // To make this a pure function, disconnect from any existing socket before initializing a new
    // one.
    if (Client._socketio !== undefined && !Client._socketio.disconnected) {
      Client._socketio.disconnect();
    }

    Client._socketio = io(
      "http://localhost:8080/",
      { path: "", withCredentials: true }
    );
    this.socketio = Client._socketio;

    this.socketio.on((OpCodes.RECEIVE_MESSAGE as number).toString(), (buffer: ArrayBuffer) => {
      const socketEvent = objSnakeToCamel(JSON.parse(Client._textDecoder.decode(buffer)));
      console.log("receive_message", socketEvent);
      if (socketEvent.message !== undefined)
        this.addMessage(socketEvent.message);
    });

    // TODO: expose pipeline id
    this.socketio.on((OpCodes.START as number).toString(), (buffer: ArrayBuffer) => {
      const socketEvent = objSnakeToCamel(JSON.parse(Client._textDecoder.decode(buffer)));
      console.log("start", socketEvent);
      this.pendingProcesses.add("00000000-0000-0000-0000-000000000000");
      this.dispatchEvent(new GenericEvent<StartMessage>(
        OpCodes[OpCodes.START].toLowerCase(),
        socketEvent as StartMessage
      ));
    });

    this.socketio.on((OpCodes.FINISH_ASR as number).toString(), (buffer: ArrayBuffer) => {
      const socketEvent = objSnakeToCamel(JSON.parse(Client._textDecoder.decode(buffer)));
      console.log("finish_asr", socketEvent);
      if (socketEvent.message === undefined) {
        this.pendingProcesses.delete("00000000-0000-0000-0000-000000000000");
        this.dispatchEvent(new GenericEvent<Message | undefined>(
          OpCodes[OpCodes.FINISH_ASR].toLowerCase(), undefined
        ));
        return;
      }

      this.addMessage(socketEvent.message);
      this.dispatchEvent(new GenericEvent<Message | undefined>(
        OpCodes[OpCodes.FINISH_ASR].toLowerCase(), socketEvent.message
      ));
    });

    this.socketio.on((OpCodes.FINISH_GEN as number).toString(), (buffer: ArrayBuffer) => {
      const socketEvent = objSnakeToCamel(JSON.parse(Client._textDecoder.decode(buffer)));
      console.log("finish_gen", socketEvent);
      this.addMessage(socketEvent.message);

      // Send event if wav was already receieved. Add it to cache if it wasn't yet
      const wav = this.pendingWAVs.get(socketEvent.wavId);
      if (wav !== undefined) {
        this.dispatchEvent(new GenericEvent<TTSMessage>(OpCodes[OpCodes.FINISH_GEN].toLowerCase(), {
          "message": socketEvent.message,
          "expressions": socketEvent.expressions,
          "data": wav as Uint8Array
        }));
        this.pendingWAVs.delete(socketEvent.wavId);
      }
      else {
        this.pendingWAVs.set(socketEvent.wavId, [socketEvent.message, socketEvent.expressions]);
      }
    });

    this.socketio.on((OpCodes.FINISH_GEN_WAV as number).toString(), (buffer: ArrayBuffer) => {
      const wavId = bytesToUUID(buffer);
      const wav = new Uint8Array(buffer, 16);
      console.log("finish_gen_wav", wavId, wav);

      // Send event if message was already receieved. Add it to cache if it wasn't yet
      const data = this.pendingWAVs.get(wavId) as [Message, Expression[]];
      if (data !== undefined) {
        this.dispatchEvent(new GenericEvent<TTSMessage>(OpCodes[OpCodes.FINISH_GEN].toLowerCase(), {
          "message": data[0],
          "expressions": data[1],
          "data": wav as Uint8Array
        }));
        this.pendingWAVs.delete(wavId);
      }
      else {
        this.pendingWAVs.set(wavId, wav);
      }
    });

    this.socketio.on((OpCodes.FINISH as number).toString(), (buffer: ArrayBuffer) => {
      const socketEvent = objSnakeToCamel(JSON.parse(Client._textDecoder.decode(buffer)));
      console.log("finish", socketEvent);
      this.pendingProcesses.delete("00000000-0000-0000-0000-000000000000");
      this.dispatchEvent(new Event(OpCodes[OpCodes.FINISH].toLowerCase()));
    });
  }

  static async authenticate(auth: { username: string, password: string }) {
    const res = await makeRequest(
      apiUrl + "auth", "post",
      undefined,
      { "username": auth.username, "password": auth.password }
    );

    return (objSnakeToCamel(await res.json())) as User;
  }

  static async connect(auth?: { username: string, password: string }) {
    // Auth before connecting to the socket
    let res;
    if (auth === undefined) {
      res = await makeRequest(apiUrl + "auth", "get");
    } else {
      res = await makeRequest(
        apiUrl + "auth", "post",
        undefined,
        { "username": auth.username, "password": auth.password }
      );
    }

    const client = new Client;

    client._currentUser = (objSnakeToCamel(await res.json())) as User;

    return client;
  }

  disconnect() {
    this.socketio.disconnect();
  }

  get currentUser() {
    return this._currentUser!;
  }

  async sendMessage(conversationId: UUID, content: string) {
    const res = await makeRequest(
      apiUrl + `conversations/${conversationId}/messages`,
      "post",
      undefined,
      { content: content }
    );

    // TODO: Add util to do this for all json objs
    const messageObj = objSnakeToCamel(await res.json());
    messageObj["createdAt"] = new Date(messageObj["createdAt"]);
    const message = messageObj as Message;

    this.addMessage(message);

    return message;
  }

  async getMessageHistory(
    conversationId: UUID,
    before: Date = new Date(0),
    after: Date = new Date(Date.now()),
    limit: number = 100
  ) {
    const res = await makeRequest(
      apiUrl + `conversations/${conversationId}/messages`,
      "get",
      { before: before.toISOString(), after: after.toISOString(), limit: limit }
    );

    const messages = objSnakeToCamel(await res.json()) as Message[];
    this.messageCache.set(conversationId, messages);

    return messages;
  }

  async getConversations() {
    const res = await makeRequest(
      apiUrl + "conversations",
      "get",
    );

    const conversations = objSnakeToCamel(await res.json()) as Conversation[];
    for (let conversation of conversations) {
      this.conversationCache.set(conversation.id, conversation);
    }

    return conversations;
  }

  sendMicData(data: ArrayBuffer) {
    this.socketio.emit((OpCodes.SEND_VOICE_DATA as number).toString(), data);
  }

  private addMessage(message: Message) {
    if (!this.messageCache.has(message.conversationId)) {
      this.messageCache.set(message.conversationId, []);
    }

    const messages = this.messageCache.get(message.conversationId)!;

    if (messages.findIndex((val) => val.id === message.id) !== -1)
      return;

    messages.unshift(message);
    if (messages.length > 100) {
      messages.pop();
    }

    this.dispatchEvent(new GenericEvent<Message[]>("message", [...messages]));
  }
}

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

const snakeCaseRegex = /(?<=.)_+./gm;
function objSnakeToCamel(object: any) {
  for (let key in object) {
    // Remove key and convert it to camel, then readd the key to the object
    const val = object[key];
    delete object[key];

    key = key.replaceAll(snakeCaseRegex,
      (substr: string) => substr.slice(-1).toUpperCase()
    );

    // Change keys recursively (this will also handle arrays)
    if (val instanceof Object) {
      objSnakeToCamel(val);
    }

    object[key] = val;
  }

  return object;
}

export function bytesToUUID(buffer: ArrayBuffer, offset: number = 0) {
  const hex = Buffer.from(buffer, offset, 16).toString("hex");
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}` as UUID
}

export function UUIDToBytes(uuid: UUID) {
  const bytes = uuid.match(/[a-fA-F0-9]{1,2}/g)!.map(hex => parseInt(hex, 16));
  return Uint8Array.from(bytes);
}