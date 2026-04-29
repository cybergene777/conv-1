// src/hooks/useSSE.ts
// SSE 消费 Hook：解析多 AI 并发流式事件

import { useCallback, useRef } from "react";
import { useChatStore } from "@/store/chatStore";
import { AgentId } from "@/types/ai";

interface UseSSEOptions {
  onMeta?: (threadId: string) => void;
  onFinished?: () => void;
}

export function useSSE(options: UseSSEOptions = {}) {
  const { appendChunk, setAgentDone, setAgentError, setLoading } = useChatStore();
  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async (
      agents: AgentId[],
      message: string,
      threadId?: string,
      token?: string
    ) => {
      // 取消上一次未完成的请求
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ agents, message, threadId }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "请求失败");
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));
              handleEvent(event);
            } catch {
              // 忽略解析失败
            }
          }
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") return;
        console.error("SSE error:", e);
        setLoading(false);
      }
    },
    [appendChunk, setAgentDone, setAgentError, setLoading]
  );

  function handleEvent(event: Record<string, unknown>) {
    switch (event.type) {
      case "meta":
        options.onMeta?.(event.threadId as string);
        break;
      case "chunk":
        appendChunk(event.agentId as AgentId, event.chunk as string);
        break;
      case "done":
        setAgentDone(event.agentId as AgentId);
        break;
      case "error":
        setAgentError(event.agentId as AgentId, event.error as string);
        break;
      case "finished":
        setLoading(false);
        options.onFinished?.();
        break;
    }
  }

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
  }, [setLoading]);

  return { startStream, abort };
}
