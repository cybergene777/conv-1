// src/components/chat/AIBubble.tsx
// 单个 AI 的回复气泡：支持流式 markdown 渲染 + 打字光标 + 错误状态
"use client";

import { useEffect, useRef } from "react";
import { AGENT_MAP } from "@/lib/ai-agents";
import { AgentId } from "@/types/ai";

interface AIBubbleProps {
  agentId: AgentId;
  content: string;
  done: boolean;
  error?: string;
  /** 是否来自历史记录（非流式，直接全量展示） */
  isHistory?: boolean;
}

/** 极简 markdown → HTML 转换（无外部依赖） */
function renderMarkdown(text: string): string {
  return text
    // 代码块
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code class="language-${lang || "text"}">${escHtml(code.trim())}</code></pre>`
    )
    // 行内代码
    .replace(/`([^`]+)`/g, (_, c) => `<code>${escHtml(c)}</code>`)
    // 加粗
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // 斜体
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // 标题
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // 无序列表
    .replace(/^[*-] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]+?<\/li>)(\n(?!<li>)|$)/g, "<ul>$1</ul>$2")
    // 有序列表
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // 引用
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // 段落（两个换行）
    .replace(/\n{2,}/g, "</p><p>")
    // 单换行
    .replace(/\n/g, "<br/>")
    // 包裹段落
    .replace(/^(?!<[hupbolir])(.+)/gm, (m) => (m.trim() ? m : ""))
    ;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default function AIBubble({ agentId, content, done, error, isHistory = false }: AIBubbleProps) {
  const agent = AGENT_MAP.get(agentId);
  const contentRef = useRef<HTMLDivElement>(null);

  // 流式时自动滚动到最新内容
  useEffect(() => {
    if (!done && contentRef.current) {
      contentRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [content, done]);

  const isEmpty = !content && !error;
  const isStreaming = !done && !error && !isHistory;

  return (
    <div className="flex flex-col gap-2 min-w-0">
      {/* AI 标签头 */}
      <div className="flex items-center gap-1.5">
        {/* 颜色圆点 */}
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: agent?.color ?? "#ccc" }}
        />
        <span
          className="text-xs font-semibold"
          style={{ color: agent?.color ?? "var(--text-muted)" }}
        >
          {agent?.name ?? agentId}
        </span>
        {/* 流式加载中的跳动点 */}
        {isEmpty && isStreaming && (
          <span className="flex gap-0.5 ml-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
                style={{
                  background: agent?.color ?? "var(--text-muted)",
                  animationDelay: `${i * 0.16}s`,
                }}
              />
            ))}
          </span>
        )}
      </div>

      {/* 气泡主体 */}
      <div
        className="rounded-2xl px-4 py-3 text-sm leading-relaxed min-h-[2.5rem]"
        style={{
          background: "var(--bg-secondary)",
          border: error ? "1px solid #fca5a5" : "1px solid var(--border)",
          color: error ? "#dc2626" : "var(--text-primary)",
        }}
      >
        {error ? (
          <p className="flex items-center gap-2">
            <span>⚠</span>
            <span>{error}</span>
          </p>
        ) : isEmpty ? (
          // 占位空状态
          <span style={{ color: "var(--text-muted)" }}>…</span>
        ) : (
          <div
            ref={contentRef}
            className={`prose-chat${isStreaming ? " typing-cursor" : ""}`}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        )}
      </div>
    </div>
  );
}
