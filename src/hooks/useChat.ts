// src/hooks/useChat.ts
// 对话核心 Hook：组合 SSE + store，提供 sendMessage / loadThread / deleteThread
"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/store/chatStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useSSE } from "./useSSE";
import { AgentId } from "@/types/ai";

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

export function useChat() {
  const router = useRouter();
  const { currentThread, setCurrentThread, setThreads, resetStreaming, setLoading } =
    useChatStore();
  const { selectedAgents } = useSettingsStore();

  const { startStream, abort } = useSSE({
    onMeta: (threadId) => {
      // 流开始时如果是新对话，跳转到对应路由
      if (!currentThread) {
        router.push(`/chat/${threadId}`);
      }
    },
    onFinished: () => {
      // 流结束后刷新 thread 列表（更新侧边栏预览）
      loadThreads();
    },
  });

  /** 发送消息 */
  const sendMessage = useCallback(
    async (message: string, agents?: AgentId[]) => {
      const activeAgents = agents ?? selectedAgents;
      if (!activeAgents.length || !message.trim()) return;

      resetStreaming(activeAgents);

      const token = getToken();
      await startStream(activeAgents, message, currentThread?.id, token ?? undefined);
    },
    [currentThread, selectedAgents, resetStreaming, startStream]
  );

  /** 加载 Thread 详情（进入 /chat/[id] 时调用） */
  const loadThread = useCallback(async (threadId: string) => {
    try {
      const res = await authFetch(`/api/chat/${threadId}`);
      const data = await res.json();
      if (data.success) {
        setCurrentThread(data.data.thread);
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
        // 如果删的是当前 thread，清空并跳转
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
  };
}

