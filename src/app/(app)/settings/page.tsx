// src/app/(app)/settings/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSettingsStore } from "@/store/settingsStore";
import { useChat } from "@/hooks/useChat";
import { AI_AGENTS, FREE_MAX_AGENTS } from "@/lib/ai-agents";
import { AgentId } from "@/types/ai";
import ModelSelector from "@/components/chat/ModelSelector";

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? match[1] : null;
}

interface UserInfo {
  id: string;
  email: string;
  plan: "FREE" | "PRO";
  remaining: number | null;
  freeLimit: number;
  createdAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme, conversationMode, setConversationMode, selectedAgents } =
    useSettingsStore();
  const { logout } = useChat();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch("/api/user", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUser(d.data);
      });
  }, []);

  // 主题切换副作用
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // system
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      isDark ? root.classList.add("dark") : root.classList.remove("dark");
    }
  }, [theme]);

  // 获取已选模型的显示名称
  const selectedModelNames = selectedAgents
    .map((id) => AI_AGENTS.find((a) => a.id === id)?.name)
    .filter(Boolean)
    .join(", ");

  const maxModels = user?.plan === "PRO" ? AI_AGENTS.length : FREE_MAX_AGENTS;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div
        className="px-8 py-5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: "var(--text-muted)",
              padding: 0,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            设置
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-8 py-8 max-w-xl space-y-8">
        {/* 外观 */}
        <Section title="外观">
          <div className="flex gap-2">
            {(["system", "light", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className="flex-1 py-2 rounded-xl text-sm transition-all"
                style={{
                  background: theme === t ? "var(--accent)" : "var(--bg-secondary)",
                  color: theme === t ? "#fff" : "var(--text-secondary)",
                  border: `1.5px solid ${theme === t ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                {{ system: "🔄 跟随系统", light: "☀️ 浅色", dark: "🌙 深色" }[t]}
              </button>
            ))}
          </div>
        </Section>

        {/* 模型选择 */}
        <Section title="默认模型">
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--input-bg)",
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                fontSize: 13,
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
              }}
            >
              <span>
                {selectedModelNames || "选择模型..."}
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginLeft: 8,
                  }}
                >
                  ({selectedAgents.length}/{maxModels})
                </span>
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: showModelSelector ? "rotate(180deg)" : "none",
                  transition: "transform 0.15s",
                  color: "var(--text-muted)",
                }}
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>

            {/* Model Selector Card */}
            {showModelSelector && (
              <div ref={selectorRef}>
                <ModelSelector
                  isPro={user?.plan === "PRO"}
                  onClose={() => setShowModelSelector(false)}
                  direction="down"
                />
              </div>
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, margin: "8px 0 0 0" }}>
            💡 这些模型将用于新对话。可在对话中随时修改。
          </p>
        </Section>

        {/* 对话模式 */}
        <Section title="对话模式">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* 对比模式 */}
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px",
                borderRadius: 8,
                border: "1.5px solid transparent",
                background: conversationMode === "compare" ? "var(--bg-hover)" : "transparent",
                cursor: "pointer",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => {
                if (conversationMode !== "compare") {
                  (e.currentTarget as HTMLLabelElement).style.borderColor = "var(--border)";
                }
              }}
              onMouseLeave={(e) => {
                if (conversationMode !== "compare") {
                  (e.currentTarget as HTMLLabelElement).style.borderColor = "transparent";
                }
              }}
            >
              <input
                type="radio"
                name="mode"
                value="compare"
                checked={conversationMode === "compare"}
                onChange={() => setConversationMode("compare")}
                style={{
                  marginTop: 2,
                  cursor: "pointer",
                  accentColor: "var(--accent)",
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 4,
                  }}
                >
                  对比模式
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: "1.5" }}>
                  所有选中的模型同时独立回复同一问题，可对比不同回答。
                </div>
              </div>
            </label>

            {/* 群聊模式 */}
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px",
                borderRadius: 8,
                border: "1.5px solid transparent",
                background: conversationMode === "chat" ? "var(--bg-hover)" : "transparent",
                cursor: "pointer",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => {
                if (conversationMode !== "chat") {
                  (e.currentTarget as HTMLLabelElement).style.borderColor = "var(--border)";
                }
              }}
              onMouseLeave={(e) => {
                if (conversationMode !== "chat") {
                  (e.currentTarget as HTMLLabelElement).style.borderColor = "transparent";
                }
              }}
            >
              <input
                type="radio"
                name="mode"
                value="chat"
                checked={conversationMode === "chat"}
                onChange={() => setConversationMode("chat")}
                style={{
                  marginTop: 2,
                  cursor: "pointer",
                  accentColor: "var(--accent)",
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 4,
                  }}
                >
                  群聊模式
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: "1.5" }}>
                  模型按顺序依次回复，第一个模型回复后，第二个模型接着回复，形成对话链。
                </div>
              </div>
            </label>
          </div>
        </Section>

        {/* 其他 */}
        <Section title="其他">
          <button
            onClick={logout}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              width: "100%",
            }}
          >
            退出登录
          </button>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        className="text-xs font-semibold uppercase tracking-widest mb-4"
        style={{ color: "var(--text-muted)" }}
      >
        {title}
      </h2>
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
      >
        {children}
      </div>
    </div>
  );
}
