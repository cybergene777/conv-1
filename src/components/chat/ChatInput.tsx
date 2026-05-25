// src/components/chat/ChatInput.tsx
"use client";

import { useRef, useEffect, KeyboardEvent } from "react";

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  value, onChange, onSend, disabled = false,
  placeholder = "给 AI 发消息",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  }

  const canSend = !disabled && value.trim().length > 0;

  return (
    <div style={{
      position: "relative",
      borderRadius: 16,
      background: "var(--input-bg, var(--bg-secondary, #f4f4f4))",
      border: "1px solid var(--border)",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
      transition: "box-shadow 0.15s, border-color 0.15s",
    }}
      onFocusCapture={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)";
        e.currentTarget.style.borderColor = "var(--border-focus, var(--accent))";
      }}
      onBlurCapture={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)";
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      {/* 文本输入区 */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        style={{
          display: "block",
          width: "100%",
          padding: "14px 52px 14px 18px",
          background: "transparent",
          border: "none",
          outline: "none",
          resize: "none",
          fontSize: 15,
          lineHeight: 1.6,
          color: "var(--text-primary)",
          maxHeight: 200,
          minHeight: 52,
          fontFamily: "inherit",
          boxSizing: "border-box",
        }}
      />

      {/* 底部工具栏 */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 10px 10px 14px",
      }}>
        {/* 左侧提示 */}
        <span style={{ fontSize: 11, color: "var(--text-muted)", opacity: 0.7 }}>
          Enter 发送 · Shift+Enter 换行
        </span>

        {/* 发送按钮 */}
        <button
          onClick={onSend}
          disabled={!canSend}
          title="发送 (Enter)"
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: canSend ? "pointer" : "not-allowed",
            flexShrink: 0,
            transition: "background 0.15s, transform 0.1s, opacity 0.15s",
            background: canSend ? "var(--text-primary)" : "var(--bg-hover)",
            opacity: canSend ? 1 : 0.45,
            transform: "scale(1)",
          }}
          onMouseEnter={(e) => {
            if (canSend) (e.currentTarget as HTMLElement).style.transform = "scale(1.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          }}
        >
          {disabled ? (
            <span style={{ display: "flex", gap: 3, alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: "var(--text-muted)",
                  animation: "inputDot 1.2s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                }} />
              ))}
            </span>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={canSend ? "var(--bg-primary)" : "var(--text-muted)"}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"/>
              <polyline points="5 12 12 5 19 12"/>
            </svg>
          )}
        </button>
      </div>

      <style>{`
        @keyframes inputDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
