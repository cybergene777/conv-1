// src/hooks/useChat.ts
// 对话核心 Hook：组合 SSE + store，提供 sendMessage / loadThread / deleteThread
"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/store/chatStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useSSE } from "./useSSE";
import { AgentId } from "@/types/ai";
import { Turn, Thread } from "@/types/chat";

/** 从 cookie 中读取 JWT token */
function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? match[1] : null;
}

/** 带 Authorization 的 fetch 封装 */
async function authFetch(url: string, options: RequestInit = {}) {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}

/** flat turns 数组 → 前端 Turn 结构 */
function convertTurns(rawTurns: any[]): Turn[] {
  const turnsMap = new Map<string, Turn>();
  const turnOrder: string[] = [];

  for (const t of rawTurns) {
    if (t.role === "USER") {
      turnsMap.set(t.id, {
        id: t.id,
        userMessage: { ...t, role: "user" as const, createdAt: new Date(t.createdAt) },
        agentReplies: {},
      });
      turnOrder.push(t.id);
    }
  }

  for (const t of rawTurns) {
    if (t.role === "ASSISTANT") {
      const lastUserTurnId = [...turnOrder].reverse().find((id) => {
        const userTurn = turnsMap.get(id);
        return userTurn && new Date(userTurn.userMessage.createdAt) <= new Date(t.createdAt);
      });
      if (lastUserTurnId) {
        const turn = turnsMap.get(lastUserTurnId)!;
        turn.agentReplies[t.agentId as AgentId] = {
          ...t,
          role: "assistant" as const,
          createdAt: new Date(t.createdAt),
        };
      }
    }
  }

  return turnOrder.map((id) => turnsMap.get(id)!);
}

export function useChat() {
  const router = useRouter();
  const { currentThread, setCurrentThread, setThreads, resetStreaming, setLoading } =
    useChatStore();
  
  // 虽然这里解构了 selectedAgents，但仅用于 UI 响应式显示
  const { selectedAgents } = useSettingsStore();

  // 用 ref 追踪当前 threadId，避免闭包过期
  const currentThreadIdRef = useRef<string | null>(null);
  currentThreadIdRef.current = currentThread?.id ?? null;

  const { startStream, abort } = useSSE({
    onMeta: (threadId) => {
      if (!currentThreadIdRef.current) {
        router.push(`/chat/${threadId}`);
        currentThreadIdRef.current = threadId;
      }
    },
    onFinished: () => {
      loadThreads();
      // 流结束后重新加载当前 thread，把 AI 回复写入 turns
      const tid = currentThreadIdRef.current;
      if (tid) loadThread(tid);
    },
  });

  /** 发送消息 */
  const sendMessage = useCallback(
    async (message: string, agents?: AgentId[]) => {
      /** 
       * 修复点：直接通过 getState() 获取最新的 selectedAgents。
       * 这样即使本函数被 useCallback 缓存，内部读取到的永远是执行那一刻的最新的模型列表。
       */
      const activeAgents = agents ?? useSettingsStore.getState().selectedAgents;
      
      if (!activeAgents.length || !message.trim()) {
        console.warn("No active agents or empty message");
        return;
      }

      // 重置流状态
      resetStreaming(activeAgents);

      const token = getToken();
      
      // 调用 SSE 开始传输，确保传入的是最新的 activeAgents
      await startStream(activeAgents, message, currentThread?.id, token ?? undefined);
    },
    // 去掉对 selectedAgents 变量的依赖，改由内部实时抓取，增强稳定性[cite: 1]
    [currentThread?.id, resetStreaming, startStream]
  );

  /** 加载 Thread 详情（进入 /chat/[id] 时调用） */
  const loadThread = useCallback(async (threadId: string) => {
    try {
      const res = await authFetch(`/api/chat/${threadId}`);
      const data = await res.json();
      if (data.success) {
        const raw = data.data.thread;
        const thread: Thread = {
          ...raw,
          turns: convertTurns(raw.turns),
          createdAt: new Date(raw.createdAt),
          updatedAt: new Date(raw.updatedAt),
        };
        setCurrentThread(thread);
      }
    } catch {
      console.error("loadThread error");
    }
  }, [setCurrentThread]);

  /** 加载 Thread 列表（侧边栏） */
  const loadThreads = useCallback(async () => {
    try {
      const res = await authFetch("/api/chat");
      const data = await res.json();
      if (data.success) {
        setThreads(data.data.threads);
      }
    } catch {
      console.error("loadThreads error");
    }
  }, [setThreads]);

  /** 删除 Thread */
  const deleteThread = useCallback(
    async (threadId: string) => {
      try {
        await authFetch(`/api/chat/${threadId}`, { method: "DELETE" });
        if (currentThread?.id === threadId) {
          setCurrentThread(null);
          router.push("/chat");
        }
        loadThreads();
      } catch {
        console.error("deleteThread error");
      }
    },
    [currentThread, setCurrentThread, router, loadThreads]
  );

  /** 退出登录 */
  const logout = useCallback(async () => {
    await authFetch("/api/auth/logout", { method: "POST" });
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  }, [router]);

  return {
    currentThread,
    sendMessage,
    loadThread,
    loadThreads,
    deleteThread,
    logout,
    abort,
    setLoading,
    selectedAgents, // 返回它以便组件层做渲染参考
  };
}