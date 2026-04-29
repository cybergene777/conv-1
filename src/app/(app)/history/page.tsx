// src/app/(app)/history/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatTime } from "@/lib/utils";

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? match[1] : null;
}

interface ThreadItem {
  id: string;
  title: string;
  agents: string[];
  updatedAt: string;
  createdAt: string;
  turns: { content: string; role: string }[];
}

const AGENT_COLORS: Record<string, string> = {
  deepseek: "#4D6BFE",
  kimi: "#FF6B35",
  qwen: "#6B4FBB",
  doubao: "#00B4D8",
  glm: "#06D6A0",
};
const AGENT_NAMES: Record<string, string> = {
  deepseek: "DeepSeek",
  kimi: "Kimi",
  qwen: "千问",
  doubao: "豆包",
  glm: "GLM",
};

export default function HistoryPage() {
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch("/api/chat?limit=50", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setThreads(d.data.threads);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = threads.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(id: string) {
    const token = getToken();
    if (!token) return;
    await fetch(`/api/chat/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setThreads((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="flex flex-col h-full">
      {/* 顶部 */}
      <div
        className="px-8 py-5 flex items-center gap-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          历史记录
        </h1>
        <div className="flex-1 max-w-xs">
          <input
            type="text"
            placeholder="搜索…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
          共 {filtered.length} 条
        </span>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl animate-pulse"
                style={{ background: "var(--bg-secondary)" }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-3">
            <span className="text-3xl">◷</span>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {search ? "没有匹配的对话" : "暂无历史记录"}
            </p>
            {!search && (
              <Link
                href="/chat"
                className="text-sm px-4 py-2 rounded-xl mt-1"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                开始第一次对话
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((thread) => (
              <div
                key={thread.id}
                className="group flex items-center gap-4 px-5 py-4 rounded-xl transition-colors"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                {/* AI 颜色点 */}
                <div className="flex gap-1 flex-shrink-0">
                  {thread.agents.map((id) => (
                    <span
                      key={id}
                      className="w-2 h-2 rounded-full"
                      title={AGENT_NAMES[id] ?? id}
                      style={{ background: AGENT_COLORS[id] ?? "#ccc" }}
                    />
                  ))}
                </div>

                {/* 标题 + 预览 */}
                <Link href={`/chat/${thread.id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {thread.title}
                  </p>
                  {thread.turns?.[0]?.content && (
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {thread.turns[0].content}
                    </p>
                  )}
                </Link>

                {/* 时间 */}
                <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                  {formatTime(new Date(thread.updatedAt))}
                </span>

                {/* 删除 */}
                <button
                  onClick={() => handleDelete(thread.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-sm px-2 py-1 rounded-lg"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
