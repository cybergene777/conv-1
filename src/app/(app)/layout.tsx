// src/app/(app)/layout.tsx
// App 根布局：左侧边栏（历史列表 + 用户信息）+ 右侧主内容区
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useChatStore } from "@/store/chatStore";
import { useChat } from "@/hooks/useChat";
import { formatTime } from "@/lib/utils";

interface UserInfo {
  id: string;
  email: string;
  plan: "FREE" | "PRO";
  remaining: number | null;
  freeLimit: number;
}

interface ThreadItem {
  id: string;
  title: string;
  agents: string[];
  updatedAt: string;
  turns?: { content: string; role: string }[];
}

/** 从 cookie 中读取 JWT token */
function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? match[1] : null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { threads, setThreads } = useChatStore();
  const { logout, deleteThread } = useChat();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 鉴权检查 + 加载用户信息
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    fetch("/api/user", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUser(d.data);
        else router.push("/login");
      })
      .catch(() => router.push("/login"));
  }, [router]);

  // 加载历史列表
  const loadThreads = useCallback(() => {
    const token = getToken();
    if (!token) return;
    fetch("/api/chat", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setThreads(d.data.threads);
      });
  }, [setThreads]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const handleDelete = async (e: React.MouseEvent, threadId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleteConfirm !== threadId) {
      setDeleteConfirm(threadId);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }
    setDeleteConfirm(null);
    await deleteThread(threadId);
    loadThreads();
  };

  const AGENT_COLORS: Record<string, string> = {
    deepseek: "#4D6BFE",
    kimi: "#FF6B35",
    qwen: "#6B4FBB",
    doubao: "#00B4D8",
    glm: "#06D6A0",
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      {/* ─── 侧边栏 ─── */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-200 overflow-hidden"
        style={{
          width: sidebarOpen ? 240 : 0,
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <div className="flex flex-col h-full" style={{ width: 240 }}>
          {/* 顶部：Logo + 新对话 */}
          <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-sm"
              style={{ color: "var(--accent)" }}
            >
              <span className="text-base">⟨/⟩</span>
              <span>Conv:1</span>
            </Link>
            <Link
              href="/chat"
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors text-sm"
              title="新对话"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-hover)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              ✎
            </Link>
          </div>

          {/* 历史对话列表 */}
          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {(threads as ThreadItem[]).length === 0 ? (
              <p className="px-3 py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                暂无历史对话
              </p>
            ) : (
              (threads as ThreadItem[]).map((thread) => {
                const isActive = pathname === `/chat/${thread.id}`;
                const isDeletePending = deleteConfirm === thread.id;
                return (
                  <Link
                    key={thread.id}
                    href={`/chat/${thread.id}`}
                    className="group flex items-start gap-2 px-3 py-2.5 rounded-xl mb-0.5 transition-colors relative"
                    style={{
                      background: isActive ? "var(--bg-hover)" : "transparent",
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* AI 颜色点 */}
                    <div className="flex gap-0.5 mt-1 flex-shrink-0">
                      {thread.agents.slice(0, 3).map((agentId) => (
                        <span
                          key={agentId}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: AGENT_COLORS[agentId] ?? "#ccc" }}
                        />
                      ))}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate leading-5">{thread.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {formatTime(new Date(thread.updatedAt))}
                      </p>
                    </div>

                    {/* 删除按钮（hover 才显示） */}
                    <button
                      onClick={(e) => handleDelete(e, thread.id)}
                      className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-xs mt-0.5"
                      title={isDeletePending ? "再次点击确认删除" : "删除"}
                      style={{
                        color: isDeletePending ? "#dc2626" : "var(--text-muted)",
                      }}
                    >
                      {isDeletePending ? "!" : "×"}
                    </button>
                  </Link>
                );
              })
            )}
          </nav>

          {/* 底部：用户信息 + 设置 */}
          <div
            className="px-3 py-3 space-y-1"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {user && (
              <>
                {/* 免费用量条 */}
                {user.plan === "FREE" && user.remaining !== null && (
                  <div className="px-1 pb-2">
                    <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                      <span>今日剩余</span>
                      <span>{user.remaining}/{user.freeLimit} 次</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(user.remaining / user.freeLimit) * 100}%`,
                          background: "var(--accent)",
                        }}
                      />
                    </div>
                    {user.remaining === 0 && (
                      <Link
                        href="/pricing"
                        className="mt-1.5 block text-center text-xs py-1 rounded-lg font-medium"
                        style={{ background: "var(--accent)", color: "#fff" }}
                      >
                        升级 Pro →
                      </Link>
                    )}
                  </div>
                )}

                <SidebarNavItem href="/history" label="历史记录" icon="◷" active={pathname === "/history"} />
                <SidebarNavItem href="/settings" label="设置" icon="⚙" active={pathname === "/settings"} />

                {/* 用户行 */}
                <div className="flex items-center gap-2 px-2 py-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    {user.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {user.email}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {user.plan === "PRO" ? "✦ Pro 会员" : "免费版"}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    className="text-xs transition-colors px-1.5 py-1 rounded"
                    title="退出登录"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                  >
                    ⏻
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ─── 主内容区 ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 折叠侧边栏按钮 */}
        <div className="absolute top-3 left-3 z-20">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-sm transition-colors"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              ☰
            </button>
          )}
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-sm transition-colors opacity-0 hover:opacity-100"
              style={{
                color: "var(--text-muted)",
              }}
            >
              ←
            </button>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}

function SidebarNavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs transition-colors"
      style={{
        background: active ? "var(--bg-hover)" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
