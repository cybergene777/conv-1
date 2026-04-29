// src/store/chatStore.ts
// Zustand store：管理对话状态和流式内容

import { create } from "zustand";
import { Thread, StreamingState } from "@/types/chat";
import { AgentId } from "@/types/ai";

interface ChatStore {
  // 当前激活的 Thread
  currentThread: Thread | null;
  // 历史 Thread 列表（侧边栏用）
  threads: Thread[];
  // 流式输出状态（每个 AI 的实时 chunk）
  streaming: StreamingState;
  // 是否正在等待响应
  isLoading: boolean;

  // Actions
  setCurrentThread: (thread: Thread | null) => void;
  setThreads: (threads: Thread[]) => void;
  appendChunk: (agentId: AgentId, chunk: string) => void;
  setAgentDone: (agentId: AgentId) => void;
  setAgentError: (agentId: AgentId, error: string) => void;
  resetStreaming: (agents: AgentId[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  currentThread: null,
  threads: [],
  streaming: {},
  isLoading: false,

  setCurrentThread: (thread) => set({ currentThread: thread }),
  setThreads: (threads) => set({ threads }),

  appendChunk: (agentId, chunk) =>
    set((state) => ({
      streaming: {
        ...state.streaming,
        [agentId]: {
          ...state.streaming[agentId],
          content: (state.streaming[agentId]?.content ?? "") + chunk,
          done: false,
        },
      },
    })),

  setAgentDone: (agentId) =>
    set((state) => ({
      streaming: {
        ...state.streaming,
        [agentId]: { ...state.streaming[agentId], done: true },
      },
    })),

  setAgentError: (agentId, error) =>
    set((state) => ({
      streaming: {
        ...state.streaming,
        [agentId]: {
          content: "",
          done: true,
          error,
        },
      },
    })),

  resetStreaming: (agents) => {
    const initial: StreamingState = {};
    agents.forEach((id) => { initial[id] = { content: "", done: false }; });
    set({ streaming: initial, isLoading: true });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
