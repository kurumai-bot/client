import { UUID } from "crypto";

export interface ApiObject {
  id: UUID
  createdAt: Date
}

export interface Conversation extends ApiObject {
  name: string
  userId: UUID
  botUserId: UUID
}

export interface Message extends ApiObject {
  userId: UUID
  conversationId: UUID
  content: string
}

export interface User extends ApiObject {
  username: string
  isBot: boolean
}

export interface StartMessage {
  type: string
  details: string
}

export interface TTSMessage {
  message: Message
  expressions: Expression[]
  data: Uint8Array;
}

export interface Expression {
  visemes: Viseme[]
  startTime: number
}

export interface Viseme {
  index: number
  weight: number
}

export interface SocketEvent {
  event: string
  id: UUID
  ttsMessage?: TTSMessage
  message?: Message
  startMessage?: StartMessage
  conversation?: Conversation
}