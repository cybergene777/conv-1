// src/components/chat/AIBubble.tsx
"use client";

import { useEffect, useRef, useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import katex from "katex";
import { AGENT_MAP } from "@/lib/ai-agents";
import { AgentId } from "@/types/ai";

interface AIBubbleProps {
  agentId: AgentId;
  content: string;
  done: boolean;
  error?: string;
  isHistory?: boolean;
  onScrollToTop?: () => void;
}

// 配置 marked：GFM + 换行即 <br>
marked.setOptions({ gfm: true, breaks: true });

/**
 * 渲染流程：
 * 1. 提取 LaTeX 公式替换为占位符（用不含特殊字符的格式避免 marked 误处理）
 * 2. marked 解析剩余 Markdown → HTML
 * 3. 把占位符替换回 KaTeX 渲染的 HTML
 * 4. DOMPurify 过滤 XSS，同时放行 KaTeX 所需标签和属性
 */
function renderMarkdown(text: string): string {
  const placeholders: string[] = [];

  // 占位符格式：纯字母数字，不含下划线，避免 marked 把 __ 当 <strong> 处理
  const makePlaceholder = (i: number) => `XMATHX${i}XMATHX`;

  // 先提取块级公式：$$...$$ 和 \[...\]
  const withBlockMath = text
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, formula) => {
      const idx = placeholders.length;
      placeholders.push(
        `<div class="math-block">${katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false, output: "html" })}</div>`
      );
      return makePlaceholder(idx);
    })
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, formula) => {
      const idx = placeholders.length;
      placeholders.push(
        `<div class="math-block">${katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false, output: "html" })}</div>`
      );
      return makePlaceholder(idx);
    });

  // 再提取行内公式：$...$ 和 \(...\)
  const withInlineMath = withBlockMath
    .replace(/(?<!\d)\$([^\n$]+?)\$(?!\d)/g, (_, formula) => {
      const idx = placeholders.length;
      placeholders.push(
        `<span class="math-inline">${katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false, output: "html" })}</span>`
      );
      return makePlaceholder(idx);
    })
    .replace(/\\\(([^\n]+?)\\\)/g, (_, formula) => {
      const idx = placeholders.length;
      placeholders.push(
        `<span class="math-inline">${katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false, output: "html" })}</span>`
      );
      return makePlaceholder(idx);
    });

  // marked 解析 Markdown
  let html = marked.parse(withInlineMath) as string;

  // 还原占位符（marked 不会动纯字母数字字符串）
  html = html.replace(/XMATHX(\d+)XMATHX/g, (_, idx) => placeholders[Number(idx)] ?? "");

  // DOMPurify：ADD_TAGS 放行 KaTeX 用到的标签，ALLOWED_ATTR 放行必要属性
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["annotation", "semantics", "math", "mrow", "mi", "mo", "mn", "msup", "msub", "mfrac", "mroot", "msqrt", "mtext", "mspace"],
    ALLOWED_ATTR: ["class", "style", "href", "target", "rel", "aria-hidden", "focusable", "role", "xmlns", "encoding"],
    ADD_ATTR: ["target", "aria-hidden"],
    FORCE_BODY: true,
  });
}

const AGENT_COLORS: Record<string, string> = {
  deepseek: "#6366f1",
  kimi:     "#ec4899",
  qwen:     "#8b5cf6",
  doubao:   "#06b6d4",
  glm:      "#10b981",
};

export default function AIBubble({ agentId, content, done, error, isHistory = false, onScrollToTop }: AIBubbleProps) {
  const agent = AGENT_MAP.get(agentId);
  const color = AGENT_COLORS[agentId] ?? agent?.color ?? "#ccc";
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!done && contentRef.current) {
      contentRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [content, done]);

  const isEmpty = !content && !error;
  const isStreaming = !done && !error && !isHistory;
  const showScrollTop = done && !error && !!content && !!onScrollToTop;

  // 用 useMemo 缓存渲染结果，content 不变则不重新解析
  const htmlContent = useMemo(
    () => (content ? renderMarkdown(content) : ""),
    [content]
  );

  return (
    <div className="flex flex-col gap-2.5 min-w-0 animate-fade-in">
      {/* AI 标签头 */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: color + "20", color }}>
          {(agent?.name ?? agentId)[0]}
        </div>
        <span className="text-xs font-semibold" style={{ color }}>
          {agent?.name ?? agentId}
        </span>
        {isEmpty && isStreaming && (
          <span className="flex gap-0.5 ml-0.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1 h-1 rounded-full animate-pulse-dot"
                style={{ background: color, animationDelay: `${i * 0.15}s` }} />
            ))}
          </span>
        )}
        {done && !error && content && (
          <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
        )}
      </div>

      {/* 气泡主体（relative 包裹，让选项卡按钮能绝对定位突出） */}
      <div className="relative">
        <div className="rounded-xl px-4 py-3 text-sm leading-relaxed min-h-[2.5rem] transition-all"
          style={{
            background: error ? "#fee2e215" : "var(--bg-secondary)",
            border: `1px solid ${error ? "#fca5a540" : "var(--border)"}`,
            color: error ? "#ef4444" : "var(--text-primary)",
            // 有按钮时右下角不圆，与选项卡无缝拼接
            borderBottomRightRadius: showScrollTop ? "0" : undefined,
          }}>
          {error ? (
            <p className="flex items-center gap-2 text-xs">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </p>
          ) : isEmpty ? (
            <span style={{ color: "var(--text-muted)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline" }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </span>
          ) : (
            <div ref={contentRef}
              className={`prose-chat${isStreaming ? " typing-cursor" : ""}`}
              dangerouslySetInnerHTML={{ __html: htmlContent }} />
          )}
        </div>

        {/* 选项卡式回到提问按钮：从气泡右下角突出 */}
        {showScrollTop && (
          <button
            onClick={onScrollToTop}
            title="回到提问处"
            className="absolute flex items-center gap-1 text-xs px-2.5 py-1 transition-all hover:opacity-80 active:scale-95"
            style={{
              right: 0,
              top: "100%",
              color: "var(--text-muted)",
              background: "var(--bg-secondary)",
              border: `1px solid var(--border)`,
              borderTop: "none",
              borderRadius: "0 0 8px 8px",
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
            回到提问
          </button>
        )}
      </div>
    </div>
  );
}
