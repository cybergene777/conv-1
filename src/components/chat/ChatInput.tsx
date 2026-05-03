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
  placeholder = "输入消息… (Enter 发送，Shift+Enter 换行)",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  }

  const canSend = !disabled && value.trim().length > 0;

  return (
    <div className="flex items-end gap-3 rounded-xl px-4 py-3 transition-all"
      style={{
        background: "var(--input-bg)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        className="flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed placeholder:text-sm"
        style={{
          color: "var(--text-primary)",
          maxHeight: 160,
          minHeight: 24,
        }}
      />

      <button onClick={onSend} disabled={!canSend}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all mb-0.5"
        style={{
          background: canSend ? "var(--text-primary)" : "var(--bg-hover)",
          color: canSend ? "var(--bg-primary)" : "var(--text-muted)",
          cursor: canSend ? "pointer" : "not-allowed",
        }}
        title="发送 (Enter)">
        {disabled ? (
          <span className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1 h-1 rounded-full animate-pulse-dot"
                style={{ background: "var(--text-muted)", animationDelay: `${i * 0.15}s` }} />
            ))}
          </span>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
          </svg>
        )}
      </button>
    </div>
  );
}
