// src/components/chat/MessageGroup.tsx
"use client";

import { useRef } from "react";
import { Turn } from "@/types/chat";
import { AgentId } from "@/types/ai";
import { StreamingState } from "@/types/chat";
import AIBubble from "./AIBubble";
import { formatTime } from "@/lib/utils";

interface MessageGroupProps {
  turn: Turn;
  /** 当前流式状态（仅最新一条 turn 会有值） */
  streaming?: StreamingState;
  /** 
   * 参与本次对话的活跃 AI 列表（仅用于最新一条消息决定显示哪些流）
   * 对于历史消息，我们将直接读取 turn.agentReplies 里的数据
   */
  agents: AgentId[];
  isLatest?: boolean;
}

export default function MessageGroup({
  turn,
  streaming,
  agents,
  isLatest = false,
}: MessageGroupProps) {
  const createdAt = new Date(turn.userMessage.createdAt);
  // 用于"回到提问"滚动定位
  const topRef = useRef<HTMLDivElement>(null);
  const scrollToTop = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const displayAgents = isLatest 
    ? agents 
    : (Object.keys(turn.agentReplies || {}) as AgentId[]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ── 用户消息 ── */}
      <div ref={topRef} className="flex justify-end">
        <div className="max-w-[70%] space-y-1">
          <div
            className="px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed whitespace-pre-wrap"
            style={{
              background: "var(--bubble-user-bg)",
              color: "var(--bubble-user-fg)",
            }}
          >
            {turn.userMessage.content}
          </div>
          <p className="text-right text-xs" style={{ color: "var(--text-muted)" }}>
            {formatTime(createdAt)}
          </p>
        </div>
      </div>

      {/* ── AI 回复列 ── */}
      {displayAgents.length === 1 ? (
        <SingleAgentReply
          agentId={displayAgents[0]}
          turn={turn}
          streaming={streaming}
          isLatest={isLatest}
          onScrollToTop={scrollToTop}
        />
      ) : (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${Math.min(displayAgents.length, 3)}, minmax(0, 1fr))`,
          }}
        >
          {displayAgents.map((agentId) => (
            <AgentReplyCell
              key={agentId}
              agentId={agentId}
              turn={turn}
              streaming={streaming}
              isLatest={isLatest}
              onScrollToTop={scrollToTop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── 单 AI 全宽 ──────────────────────────────────────────────
function SingleAgentReply({
  agentId,
  turn,
  streaming,
  isLatest,
  onScrollToTop,
}: {
  agentId: AgentId;
  turn: Turn;
  streaming?: StreamingState;
  isLatest?: boolean;
  onScrollToTop?: () => void;
}) {
  const streamState = isLatest ? streaming?.[agentId] : undefined;
  const historyMsg = turn.agentReplies?.[agentId];

  if (!streamState && !historyMsg) return null;

  const content = streamState?.content ?? historyMsg?.content ?? "";
  const done = streamState ? streamState.done : true;
  const error = streamState?.error ?? (historyMsg?.isError ? historyMsg.content : undefined);

  return (
    <div className="max-w-3xl">
      <AIBubble
        agentId={agentId}
        content={error ? "" : content}
        done={done}
        error={error}
        isHistory={!streamState}
        onScrollToTop={onScrollToTop}
      />
    </div>
  );
}

// ── 多 AI 单格 ──────────────────────────────────────────────
function AgentReplyCell({
  agentId,
  turn,
  streaming,
  isLatest,
  onScrollToTop,
}: {
  agentId: AgentId;
  turn: Turn;
  streaming?: StreamingState;
  isLatest?: boolean;
  onScrollToTop?: () => void;
}) {
  const streamState = isLatest ? streaming?.[agentId] : undefined;
  const historyMsg = turn.agentReplies?.[agentId];

  if (!streamState && !historyMsg) return null;

  const content = streamState?.content ?? historyMsg?.content ?? "";
  const done = streamState ? streamState.done : true;
  const error = streamState?.error ?? (historyMsg?.isError ? historyMsg.content : undefined);

  return (
    <AIBubble
      agentId={agentId}
      content={error ? "" : content}
      done={done}
      error={error}
      isHistory={!streamState}
      onScrollToTop={onScrollToTop}
    />
  );
}