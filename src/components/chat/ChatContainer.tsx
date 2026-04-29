// src/components/chat/ChatContainer.tsx
// 对话主容器：组合 AISelector + ChatInput + MessageGroup 列表
// 同时处理滚动锁定、空状态、次数用尽等边界情况
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
  /** 用户计划（决定 AI 选择上限）*/
  isPro?: boolean;
  /** 今日剩余次数（免费用户） */
  remaining?: number | null;
}

export default function ChatContainer({
  threadId,
  isPro = false,
  remaining,
}: ChatContainerProps) {
  const router = useRouter();
  const { currentThread, streaming, isLoading, setCurrentThread } = useChatStore();
  const { selectedAgents } = useSettingsStore();
  const { sendMessage, loadThread, abort } = useChat();

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // 加载已有 Thread
  useEffect(() => {
    if (threadId) {
      loadThread(threadId);
    } else {
      setCurrentThread(null);
    }
  }, [threadId, loadThread, setCurrentThread]);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [streaming, currentThread?.turns, autoScroll]);

  // 检测用户是否手动上滚（暂停自动滚动）
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAutoScroll(atBottom);
  }, []);

  async function handleSend() {
    if (!input.trim() || isLoading) return;
    if (!isPro && remaining === 0) return;

    const msg = input;
    setInput("");
    setAutoScroll(true);
    await sendMessage(msg);
  }

  // 取出当前 thread 的所有 turns
  const turns = (currentThread?.turns as Turn[]) ?? [];
  const activeAgents = (currentThread?.agents ?? selectedAgents) as AgentId[];

  // 判断流式是否还在进行（任意 AI 未完成）
  const hasOngoingStream = isLoading || Object.values(streaming).some((s) => !s.done);

  // 确认是否有一个 "最新流式 turn"（即用户刚发出的那条）
  // 流式期间 turns 里已经有最新的 turn（后端已写入），streaming 里有对应内容
  const latestTurnId = hasOngoingStream ? turns[turns.length - 1]?.id : null;

  const isOutOfQuota = !isPro && remaining === 0;

  return (
    <div className="flex flex-col h-full">
      {/* ── 顶部 AI 选择器 ── */}
      <div
        className="px-6 py-3 flex items-center gap-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span className="text-xs font-medium flex-shrink-0" style={{ color: "var(--text-muted)" }}>
          对比
        </span>
        <AISelector isPro={isPro} disabled={isLoading} />
        {isLoading && (
          <button
            onClick={abort}
            className="ml-auto flex-shrink-0 text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: "var(--bg-hover)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            停止
          </button>
        )}
      </div>

      {/* ── 消息区 ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-8"
      >
        {turns.length === 0 && !hasOngoingStream ? (
          /* 空状态 */
          <EmptyState agents={activeAgents} />
        ) : (
          turns.map((turn, idx) => (
            <MessageGroup
              key={turn.id}
              turn={turn as Turn}
              agents={activeAgents}
              streaming={turn.id === latestTurnId ? streaming : undefined}
              isLatest={turn.id === latestTurnId}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── 底部输入区 ── */}
      <div
        className="px-6 py-4 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {isOutOfQuota ? (
          <OutOfQuotaBanner />
        ) : (
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            disabled={isLoading}
            placeholder={
              selectedAgents.length === 0
                ? "请先选择至少一个 AI…"
                : `同时向 ${activeAgents.length} 个 AI 提问…`
            }
          />
        )}
        <p className="mt-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          AI 回答可能不准确，请自行判断
        </p>
      </div>
    </div>
  );
}

// ── 空状态 ─────────────────────────────────────────────────
function EmptyState({ agents }: { agents: AgentId[] }) {
  const AGENT_COLORS: Record<string, string> = {
    deepseek: "#4D6BFE",
    kimi: "#FF6B35",
    qwen: "#6B4FBB",
    doubao: "#00B4D8",
    glm: "#06D6A0",
  };
  const AGENT_NAMES: Record<string, string> = {
    deepseek: "DeepSeek",
    kimi: "Kimi",
    qwen: "千问",
    doubao: "豆包",
    glm: "智谱 GLM",
  };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[40vh] gap-6 text-center">
      {/* AI 圆点阵列 */}
      <div className="flex gap-3">
        {agents.map((id) => (
          <div
            key={id}
            className="flex flex-col items-center gap-2"
          >
            <div
              className="w-10 h-10 rounded-full opacity-90"
              style={{ background: `${AGENT_COLORS[id] ?? "#ccc"}22`, border: `2px solid ${AGENT_COLORS[id] ?? "#ccc"}` }}
            />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {AGENT_NAMES[id] ?? id}
            </span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          向 {agents.length} 个 AI 同时提问
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          对比不同 AI 的回答，发现最优解
        </p>
      </div>
    </div>
  );
}

// ── 次数用尽提示 ────────────────────────────────────────────
function OutOfQuotaBanner() {
  return (
    <div
      className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
      }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          今日免费次数已用完
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          明天零点重置，或升级 Pro 无限使用
        </p>
      </div>
      <Link
        href="/pricing"
        className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        升级 Pro
      </Link>
    </div>
  );
}
