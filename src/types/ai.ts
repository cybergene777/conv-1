// src/types/ai.ts

export interface AIAgent {
  id: string;
  name: string;
  baseURL: string;
  model: string;
  color: string;
  apiKeyEnv: string; // 对应的环境变量名
}

export type AgentId = "deepseek" | "kimi" | "qwen" | "doubao" | "glm";

export interface AIChunk {
  agentId: AgentId;
  chunk: string;
  done: boolean;
  error?: string; // 出错时填入错误描述
}

export interface AIStreamEvent {
  type: "chunk" | "done" | "error";
  agentId: AgentId;
  content?: string;
  error?: string;
}
