// src/components/chat/MessageGroup.tsx
// 一个 Turn 的完整渲染：用户消息 + 多列 AI 回复并排
"use client";

import { Turn } from "@/types/chat";
import { AgentId } from "@/types/ai";
import { StreamingState } from "@/types/chat";
import AIBubble from "./AIBubble";
import { formatTime } from "@/lib/utils";

interface MessageGroupProps {
  turn: Turn;
  /** 当前流式状态（仅最新一条 turn 会有值） */
  streaming?: StreamingState;
  /** 参与本次对话的 AI 列表 */
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

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ── 用户消息 ── */}
      <div className="flex justify-end">
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
      {agents.length === 1 ? (
        // 单 AI：全宽展示
        <SingleAgentReply
          agentId={agents[0]}
          turn={turn}
          streaming={streaming}
          isLatest={isLatest}
        />
      ) : (
        // 多 AI：并排网格
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${Math.min(agents.length, 3)}, minmax(0, 1fr))`,
          }}
        >
          {agents.map((agentId) => (
            <AgentReplyCell
              key={agentId}
              agentId={agentId}
              turn={turn}
              streaming={streaming}
              isLatest={isLatest}
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
}: {
  agentId: AgentId;
  turn: Turn;
  streaming?: StreamingState;
  isLatest?: boolean;
}) {
  const streamState = isLatest ? streaming?.[agentId] : undefined;
  const historyMsg = turn.agentReplies?.[agentId];

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
}: {
  agentId: AgentId;
  turn: Turn;
  streaming?: StreamingState;
  isLatest?: boolean;
}) {
  const streamState = isLatest ? streaming?.[agentId] : undefined;
  const historyMsg = turn.agentReplies?.[agentId];

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
    />
  );
}
