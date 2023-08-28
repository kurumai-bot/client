import { Conversation, Message, SocketEvent, StartMessage, TTSMessage, User } from "./models";
import GenericEvent, { GenericEventTarget } from "../genericEvent";
import { Socket, io } from "socket.io-client";
import protobuf, { Message as ProtoMessage, Root } from "protobufjs";
import { ApiError } from "./errors";
import { UUID } from "crypto";
// TODO: Consider switching to swr

export const apiUrl = "http://localhost:5000/";

export type ClientEventMap = {
  "message": GenericEvent<Message[]>
  "start": GenericEvent<StartMessage>
  "finish_asr": GenericEvent<Message | undefined>
  "finish_gen": GenericEvent<TTSMessage>
  "finish": Event
}
export class Client extends GenericEventTarget<Client, ClientEventMap> {
  private static _protoRoot: Root | undefined;

  private static _socketio: Socket;

  // Conversation and message objects shouldn't change, so a permanent cache should work
  readonly conversationCache = new Map<UUID, Conversation>();
  readonly messageCache = new Map<UUID, Message[]>();
  readonly pendingProcesses = new Set<UUID>();

  readonly socketio: Socket;

  private _currentUser: User | undefined;

  private constructor() {
    super();

    // To make this a pure function, disconnect from any existing socket before initializing a new
    // one.
    if (Client._socketio !== undefined && !Client._socketio.disconnected) {
      Client._socketio.disconnect();
    }

    Client._socketio = io(apiUrl, { withCredentials: true });
    this.socketio = Client._socketio;

    const socketEventType = Client._protoRoot!.lookupType("kurumai.SocketEvent");
    // TODO: expose pipeline id
    this.socketio.on("start", (buffer: ArrayBuffer) => {
      const socketEvent = protoToObject<SocketEvent>(
        socketEventType.decode(new Uint8Array(buffer))
      );
      console.log(`start ${socketEvent}`);
      this.pendingProcesses.add(socketEvent["id"] as UUID);
      this.dispatchEvent(new GenericEvent<StartMessage>(
        "start",
        socketEvent.startMessage as StartMessage
      ));
    });

    this.socketio.on("finish_asr", (buffer: ArrayBuffer) => {
      const socketEvent = protoToObject<SocketEvent>(
        socketEventType.decode(new Uint8Array(buffer))
      );
      if (socketEvent.message === undefined) {
        this.pendingProcesses.delete(socketEvent.id as UUID);
        this.dispatchEvent(new GenericEvent<Message | undefined>("finish_asr", undefined));
        return;
      }

      this.addMessage(socketEvent.message);
      this.dispatchEvent(new GenericEvent<Message | undefined>("finish_asr", socketEvent.message));
    });

    this.socketio.on("finish_gen", (buffer: ArrayBuffer) => {
      const socketEvent = protoToObject<SocketEvent>(
        socketEventType.decode(new Uint8Array(buffer))
      );
      this.addMessage(socketEvent.ttsMessage!.message);
      this.dispatchEvent(new GenericEvent<TTSMessage>("finish_gen", socketEvent.ttsMessage!));
    });

    this.socketio.on("finish", (buffer: ArrayBuffer) => {
      const socketEvent = protoToObject<SocketEvent>(
        socketEventType.decode(new Uint8Array(buffer))
      );
      this.pendingProcesses.delete(socketEvent.id as UUID);
      this.dispatchEvent(new Event("finish"));
      console.log("finish");
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
    if (Client._protoRoot === undefined) {
      Client._protoRoot = protobuf.Root.fromJSON(await import("./messages.json"));
    }

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

  async sendMessage(conversation_id: UUID, content: string) {
    const res = await makeRequest(
      apiUrl + `conversations/${conversation_id}/messages`,
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
    conversation_id: UUID,
    before: Date = new Date(0),
    after: Date = new Date(Date.now()),
    limit: number = 100
  ) {
    const res = await makeRequest(
      apiUrl + `conversations/${conversation_id}/messages`,
      "get",
      { before: before.toISOString(), after: after.toISOString(), limit: limit }
    );

    const messages = objSnakeToCamel(await res.json()) as Message[];
    this.messageCache.set(conversation_id, messages);

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
    const micPacketType = Client._protoRoot!.lookupType("MicPacket");
    const packet = micPacketType.encode({ data: new Uint8Array(data) });
    this.socketio.emit("mic_packet", packet.finish());
  }

  private addMessage(message: Message) {
    if (!this.messageCache.has(message.conversationId)) {
      this.messageCache.set(message.conversationId, []);
    }

    const messages = this.messageCache.get(message.conversationId)!;
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

export function protoToObject<T>(message: ProtoMessage) {
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