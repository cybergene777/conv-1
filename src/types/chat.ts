// src/types/chat.ts

import { AgentId } from "./ai";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentId?: AgentId; // assistant 消息专有
  isError?: boolean;
  createdAt: Date;
}

// 一个 Turn = 用户一条消息 + 各 AI 的回复集合
export interface Turn {
  id: string;
  userMessage: Message;
  agentReplies: Record<AgentId, Message>; // agentId -> 对应回复
}

export interface Thread {
  id: string;
  title: string;
  agents: AgentId[];
  turns: Turn[];
  createdAt: Date;
  updatedAt: Date;
}

// 前端流式状态
export interface StreamingState {
  [agentId: string]: {
    content: string;
    done: boolean;
    error?: string;
  };
}

export interface ChatRequest {
  threadId?: string; // 有则追加，无则新建
  agents: AgentId[];
  message: string;
}
