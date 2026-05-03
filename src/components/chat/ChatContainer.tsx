// src/components/chat/ChatContainer.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/store/chatStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useChat } from "@/hooks/useChat";
import AISelector from "./AISelector";
import ChatInput from "./ChatInput";
import MessageGroup from "./MessageGroup";
import { Turn } from "@/types/chat";
import { AgentId } from "@/types/ai";
import Link from "next/link";

interface ChatContainerProps {
  threadId?: string;
  isPro?: boolean;
  remaining?: number | null;
}

export default function ChatContainer({ threadId, isPro = false, remaining }: ChatContainerProps) {
  const router = useRouter();
  const { currentThread, streaming, isLoading, setCurrentThread } = useChatStore();
  const { selectedAgents } = useSettingsStore();
  const { sendMessage, loadThread, abort } = useChat();

  const [input, setInput] = useState("");
  // 用于在等待响应时暂存当前发送的消息内容（用 ref 保证与 isLoading 同帧可见）
  const [pendingMessage, setPendingMessage] = useState("");
  const pendingMessageRef = useRef("");
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (threadId) loadThread(threadId);
    else setCurrentThread(null);
  }, [threadId, loadThread, setCurrentThread]);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streaming, currentThread?.turns, autoScroll]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
  }, []);

  async function handleSend() {
    if (!input.trim() || isLoading) return;
    if (!isPro && remaining === 0) return;
    const msg = input;
    
    // 同时更新 ref 和 state，ref 在当前同步帧立即可读
    pendingMessageRef.current = msg;
    setPendingMessage(msg);
    setInput("");
    setAutoScroll(true);
    
    try {
      await sendMessage(msg);
    } finally {
      pendingMessageRef.current = "";
      setPendingMessage("");
    }
  }

  const turns = (currentThread?.turns as Turn[]) ?? [];
  const activeAgents = (currentThread?.agents ?? selectedAgents) as AgentId[];
  const hasOngoingStream = isLoading || Object.values(streaming).some((s) => !s.done);

  const STREAMING_TURN_ID = "__streaming__";
  
  // 用 ref 值构造 streamingTurn，确保与 isLoading 同帧可见
  const activePendingMsg = pendingMessage || pendingMessageRef.current;
  const streamingTurn: Turn | null = hasOngoingStream
    ? { 
        id: STREAMING_TURN_ID, 
        userMessage: { 
          id: STREAMING_TURN_ID, 
          role: "user", 
          content: activePendingMsg,
          createdAt: new Date() 
        }, 
        agentReplies: {} 
      }
    : null;

  const displayTurns = streamingTurn ? [...turns, streamingTurn] : turns;
  const latestTurnId = hasOngoingStream ? STREAMING_TURN_ID : null;
  const isOutOfQuota = !isPro && remaining === 0;

  return (
    <div className="flex flex-col h-full">

      {/* ── 顶部 AI 选择器 ── */}
      <div className="px-6 py-3 flex items-center gap-3 flex-shrink-0 pl-14"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>对比</span>
        <AISelector isPro={isPro} disabled={isLoading} />
        {isLoading && (
          <button onClick={abort}
            className="ml-auto flex-shrink-0 text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            style={{ background: "var(--bg-hover)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
            停止
          </button>
        )}
      </div>

      {/* ── 消息区 ── */}
      <div ref={scrollRef} onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-8 space-y-10">
        {displayTurns.length === 0 ? (
          <EmptyState agents={activeAgents} />
        ) : (
          displayTurns.map((turn) => (
            <MessageGroup key={turn.id} turn={turn as Turn} agents={activeAgents}
              streaming={turn.id === latestTurnId ? streaming : undefined}
              isLatest={turn.id === latestTurnId} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── 底部输入区 ── */}
      <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
        {isOutOfQuota ? (
          <OutOfQuotaBanner />
        ) : (
          <ChatInput
            value={input} onChange={setInput} onSend={handleSend} disabled={isLoading}
            placeholder={selectedAgents.length === 0 ? "请先选择至少一个 AI…" : `向 ${activeAgents.length} 个 AI 同时提问…`}
          />
        )}
        <p className="mt-2.5 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          AI 回答仅供参考，请自行判断
        </p>
      </div>
    </div>
  );
}

// ... 下方 EmptyState 和 OutOfQuotaBanner 代码保持不变 ...
const AGENT_META: Record<string, { color: string; name: string }> = {
  deepseek: { color: "#6366f1", name: "DeepSeek" },
  kimi:     { color: "#ec4899", name: "Kimi" },
  qwen:     { color: "#8b5cf6", name: "千问" },
  doubao:   { color: "#06b6d4", name: "豆包" },
  glm:      { color: "#10b981", name: "智谱 GLM" },
};

function EmptyState({ agents }: { agents: AgentId[] }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[50vh] gap-8 text-center">
      <div className="flex gap-3">
        {agents.map((id) => {
          const meta = AGENT_META[id];
          return (
            <div key={id} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold"
                style={{ background: (meta?.color ?? "#ccc") + "18", border: `1px solid ${meta?.color ?? "#ccc"}33`, color: meta?.color ?? "#ccc" }}>
                {meta?.name[0] ?? id[0].toUpperCase()}
              </div>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{meta?.name ?? id}</span>
            </div>
          );
        })}
      </div>
      {agents.length > 0 ? (
        <div>
          <p className="text-sm font-medium mb-1">向 {agents.length} 个 AI 同时提问</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>对比不同 AI 的回答，发现最优解</p>
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>请先在上方选择至少一个 AI</p>
      )}
    </div>
  );
}

function OutOfQuotaBanner() {
  return (
    <div className="rounded-xl px-5 py-4 flex items-center justify-between gap-4"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
      <div>
        <p className="text-sm font-medium">今日免费次数已用完</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>明天零点重置，或升级 Pro 无限使用</p>
      </div>
      <Link href="/pricing" className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all"
        style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}>
        升级 Pro
      </Link>
    </div>
  );
}