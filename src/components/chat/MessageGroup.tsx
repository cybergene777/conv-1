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
  streaming?: StreamingState;
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
  const topRef = useRef<HTMLDivElement>(null);
  const scrollToTop = () =>
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const displayAgents = isLatest
    ? agents
    : (Object.keys(turn.agentReplies || {}) as AgentId[]);

  // 偶数：2列；奇数：3列
  const colCount = displayAgents.length % 2 === 0 ? 2 : 3;

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── 用户消息 ── */}
      <div ref={topRef} className="flex justify-end">
        <div style={{ maxWidth: "85%", minWidth: 0 }} className="space-y-1">
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

      {/* ── AI 回复 ── */}
      {displayAgents.length === 1 ? (
        /* 单个 AI：全宽显示 */
        <SingleAgentReply
          agentId={displayAgents[0]}
          turn={turn}
          streaming={streaming}
          isLatest={isLatest}
          onScrollToTop={scrollToTop}
        />
      ) : (
        /* 多个 AI：偶数2列，奇数3列，撑满父容器 */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
            gap: 16,
            width: "100%",
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
  const error =
    streamState?.error ?? (historyMsg?.isError ? historyMsg.content : undefined);

  return (
    <div style={{ width: "100%" }}>
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
  const error =
    streamState?.error ?? (historyMsg?.isError ? historyMsg.content : undefined);

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
