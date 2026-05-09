// src/components/chat/ChatContainer.tsx
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  const { currentThread, streaming, isLoading, setCurrentThread } = useChatStore();
  const { selectedAgents, conversationMode } = useSettingsStore();
  const { sendMessage, loadThread, abort } = useChat();

  const [input, setInput] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (threadId) loadThread(threadId);
    else setCurrentThread(null);
  }, [threadId, loadThread, setCurrentThread]);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [streaming, currentThread?.turns, autoScroll]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
  }, []);

  async function handleSend() {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;
    if (!isPro && remaining === 0) return;

    setPendingMessage(trimmedInput);
    setInput("");
    setAutoScroll(true);
    
    try {
      await sendMessage(trimmedInput);
    } finally {
      setPendingMessage("");
    }
  }

  // 优化：使用 useMemo 统一处理类型转换和流状态逻辑
  const turns = (currentThread?.turns as Turn[]) ?? [];
  const activeAgents = (currentThread?.agents ?? selectedAgents) as AgentId[];
  const hasOngoingStream = isLoading || Object.values(streaming).some((s) => !s.done);

  const displayTurns = useMemo(() => {
    if (!hasOngoingStream) return turns;

    // 修复：使用 Partial 或类型断言解决 agentReplies 缺失属性的错误
    const streamingTurn: Turn = {
      id: "__streaming__",
      userMessage: { 
        id: "__streaming_msg__", 
        role: "user", 
        content: pendingMessage, 
        createdAt: new Date() 
      },
      // 这里的断言解决了你之前的 TS 报错
      agentReplies: {} as Turn['agentReplies'], 
    };

    return [...turns, streamingTurn];
  }, [turns, hasOngoingStream, pendingMessage]);

  const isOutOfQuota = !isPro && remaining === 0;
  const isEmpty = displayTurns.length === 0;

  // 提取输入区域组件以减少 JSX 嵌套冗余
  const renderInputSection = (isCenter: boolean) => (
    <div style={{ 
      width: "100%", 
      maxWidth: 680, 
      margin: isCenter ? "0 auto" : "0",
      padding: isCenter ? "0" : "12px 0 0" 
    }}>
      {isOutOfQuota ? (
        <OutOfQuotaBanner />
      ) : (
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isLoading}
          placeholder={selectedAgents.length === 0 ? "请先在侧边栏选择 AI…" : 
            conversationMode === "chat" 
              ? `向 ${activeAgents.length} 个 AI 群聊提问…` 
              : `向 ${activeAgents.length} 个 AI 同时提问…`}
        />
      )}
      <p style={{ marginTop: 10, textAlign: "center", fontSize: 11, color: "var(--text-muted)" }}>
        AI 回答仅供参考，请自行判断
      </p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* 顶部导航栏 */}
      <div style={{ padding: "0 20px", height: 52, display: "flex", alignItems: "center", flexShrink: 0 }}>
        <BrandLogo />
        {isLoading && (
          <button onClick={abort} className="ml-auto flex-shrink-0 text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            style={{ background: "var(--bg-hover)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
            停止
          </button>
        )}
      </div>

      {/* 主内容区 */}
      {isEmpty ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px 32px", gap: 32 }}>
          <EmptyState agents={activeAgents} />
          {renderInputSection(true)}
        </div>
      ) : (
        <>
          <div ref={scrollRef} onScroll={handleScroll}
            style={{ flex: 1, overflowY: "auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 40 }}>
            {displayTurns.map((turn) => (
              <MessageGroup 
                key={turn.id} 
                turn={turn} 
                agents={activeAgents}
                streaming={turn.id === "__streaming__" ? streaming : undefined}
                isLatest={turn.id === "__streaming__" || turn === turns[turns.length - 1]} 
              />
            ))}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: "0 24px 16px", flexShrink: 0, borderTop: "1px solid var(--border)" }}>
            {renderInputSection(false)}
          </div>
        </>
      )}
    </div>
  );
}

/** ── 抽离的子组件 ── **/

function BrandLogo() {
  return (
    <div style={{ display: "flex", alignItems: "baseline", fontSize: 22, fontWeight: 800, userSelect: "none" }}>
      <style>{`
        @keyframes breathe { 0%, 100% { opacity: 0.18; } 50% { opacity: 0.85; } }
        .c-1 { animation: breathe 2.5s ease-in-out infinite; }
        .c-2 { animation: breathe 2.5s ease-in-out infinite; animation-delay: 0.5s; }
      `}</style>
      <span style={{ color: "var(--text-primary)", fontWeight: 500, marginRight: "5px"}}>Conv</span>
      <span className="c-1" style={{ color: "var(--text-primary)", opacity: 0.18 }}>:</span>
      <span className="c-2" style={{ color: "var(--text-primary)", opacity: 0.18 }}>:</span>
      <span style={{ color: "var(--text-primary)", opacity: 0.7, fontWeight: 500, marginLeft: "3px" }}>1</span>
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

function EmptyState({ agents }: { agents: AgentId[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
      {agents.length > 0 ? (
        <>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
            {agents.map((id, i) => (
              <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <img
                  src={`/ai-avatars/${id}.png`}
                  alt={AGENT_META[id]?.name}
                  width={agents.length === 3 && i === 1 ? 52 : 44}
                  height={agents.length === 3 && i === 1 ? 52 : 44}
                  style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}
                />
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{AGENT_META[id]?.name}</span>
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", margin: "0 0 4px" }}>向 {agents.length} 个 AI 同时提问</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>对比不同 AI 的回答，发现最优解</p>
          </div>
        </>
      ) : (
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>请先选择至少一个 AI</p>
      )}
    </div>
  );
}

function OutOfQuotaBanner() {
  return (
    <div style={{ borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 2px" }}>今日免费次数已用完</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>明天零点重置，或升级 Pro 无限使用</p>
      </div>
      <Link href="/pricing" style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, background: "var(--text-primary)", color: "var(--bg-primary)", textDecoration: "none" }}>
        升级 Pro
      </Link>
    </div>
  );
}