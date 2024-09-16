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
  emotion: Emotion
  data: Uint8Array
}

export interface Expression {
  visemes: Viseme[]
  startTime: number
}

export interface Viseme {
  index: number
  weight: number
}

export enum OpCodes {
  ERROR = 0,
  SET_PRESET,
  REMOVE_PRESET,
  SEND_VOICE_DATA,
  SEND_TEXT_DATA,
  START,
  FINISH_ASR,
  FINISH_GEN,
  FINISH_GEN_WAV,
  FINISH,
  RECEIVE_MESSAGE,
  SET_CONVERSATION
}

export type Emotion = "happy" | "sad" | "angry" | "neutral"