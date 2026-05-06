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
  const activePendingMsg = pendingMessage || pendingMessageRef.current;
  const streamingTurn: Turn | null = hasOngoingStream
    ? {
        id: STREAMING_TURN_ID,
        userMessage: { id: STREAMING_TURN_ID, role: "user", content: activePendingMsg, createdAt: new Date() },
        agentReplies: {},
      }
    : null;

  const displayTurns = streamingTurn ? [...turns, streamingTurn] : turns;
  const latestTurnId = hasOngoingStream ? STREAMING_TURN_ID : null;
  const isOutOfQuota = !isPro && remaining === 0;
  const isEmpty = displayTurns.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── 顶部 AI 选择器 ── */}
      <div
        style={{
          padding: "10px 24px 10px 56px",
          display: "flex", alignItems: "center", gap: 12,
          flexShrink: 0,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}>对比</span>
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

      {/* ── 消息区 / 空状态 ──
          修改6: 空对话时整体垂直居中（flex-1 + flex col + justify-center）
          有消息时正常滚动 */}
      {isEmpty ? (
        // 修改6: 空状态——输入区垂直居中，参考 claude.ai
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px 32px",
          gap: 32,
        }}>
          <EmptyState agents={activeAgents} />
          {/* 输入框直接在空状态中央 */}
          <div style={{ width: "100%", maxWidth: 680 }}>
            {isOutOfQuota ? (
              <OutOfQuotaBanner />
            ) : (
              <ChatInput
                value={input} onChange={setInput} onSend={handleSend} disabled={isLoading}
                placeholder={selectedAgents.length === 0 ? "请先选择至少一个 AI…" : `向 ${activeAgents.length} 个 AI 同时提问…`}
              />
            )}
            <p style={{ marginTop: 10, textAlign: "center", fontSize: 11, color: "var(--text-muted)" }}>
              AI 回答仅供参考，请自行判断
            </p>
          </div>
        </div>
      ) : (
        // 有消息：正常消息列表 + 底部固定输入
        <>
          <div ref={scrollRef} onScroll={handleScroll}
            style={{ flex: 1, overflowY: "auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 40 }}>
            {displayTurns.map((turn) => (
              <MessageGroup key={turn.id} turn={turn as Turn} agents={activeAgents}
                streaming={turn.id === latestTurnId ? streaming : undefined}
                isLatest={turn.id === latestTurnId} />
            ))}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: "12px 24px 16px", flexShrink: 0, borderTop: "1px solid var(--border)" }}>
            {isOutOfQuota ? (
              <OutOfQuotaBanner />
            ) : (
              <ChatInput
                value={input} onChange={setInput} onSend={handleSend} disabled={isLoading}
                placeholder={selectedAgents.length === 0 ? "请先选择至少一个 AI…" : `向 ${activeAgents.length} 个 AI 同时提问…`}
              />
            )}
            <p style={{ marginTop: 8, textAlign: "center", fontSize: 11, color: "var(--text-muted)" }}>
              AI 回答仅供参考，请自行判断
            </p>
          </div>
        </>
      )}
    </div>
  );
}

const AGENT_META: Record<string, { color: string; name: string }> = {
  deepseek: { color: "#4D6BFE", name: "DeepSeek" },
  kimi:     { color: "#FF6B35", name: "Kimi"     },
  qwen:     { color: "#7C4DFF", name: "千问"     },
  doubao:   { color: "#13C2E8", name: "豆包"     },
  glm:      { color: "#00C896", name: "智谱 GLM" },
};

// 修改5+6: EmptyState 使用官方 SVG 图标，居中排布
function EmptyState({ agents }: { agents: AgentId[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
      {agents.length > 0 && (
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
          {agents.map((id, i) => {
            const meta = AGENT_META[id];
            const sizes = [44, 52, 44]; // 中间稍大
            const size = agents.length === 3 ? sizes[i] : 48;
            return (
              <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                {/* 修改5: 使用官方 SVG */}
                <img
                  src={`/ai-avatars/${id}.png`}
                  alt={meta?.name ?? id}
                  width={size}
                  height={size}
                  style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}
                />
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                  {meta?.name ?? id}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {agents.length > 0 ? (
        <div>
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", margin: "0 0 4px" }}>
            向 {agents.length} 个 AI 同时提问
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            对比不同 AI 的回答，发现最优解
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>请先在上方选择至少一个 AI</p>
      )}
    </div>
  );
}

function OutOfQuotaBanner() {
  return (
    <div style={{
      borderRadius: 12, padding: "14px 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      background: "var(--bg-secondary)", border: "1px solid var(--border)",
    }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 2px" }}>今日免费次数已用完</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>明天零点重置，或升级 Pro 无限使用</p>
      </div>
      <Link href="/pricing"
        style={{
          flexShrink: 0, padding: "7px 16px", borderRadius: 8,
          fontSize: 13, fontWeight: 500,
          background: "var(--text-primary)", color: "var(--bg-primary)",
          textDecoration: "none",
        }}>
        升级 Pro
      </Link>
    </div>
  );
}
