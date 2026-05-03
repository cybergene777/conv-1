// src/app/(app)/layout.tsx
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
}

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? match[1] : null;
}

const AGENT_COLORS: Record<string, string> = {
  deepseek: "#6366f1",
  kimi:     "#ec4899",
  qwen:     "#8b5cf6",
  doubao:   "#06b6d4",
  glm:      "#10b981",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { threads, setThreads } = useChatStore();
  const { logout, deleteThread } = useChat();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    fetch("/api/user", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setUser(d.data); else router.push("/login"); })
      .catch(() => router.push("/login"));
  }, [router]);

  const loadThreads = useCallback(() => {
    const token = getToken();
    if (!token) return;
    fetch("/api/chat", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setThreads(d.data.threads); });
  }, [setThreads]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

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

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>

      {/* ─── 侧边栏 ─── */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-200 overflow-hidden"
        style={{
          width: sidebarOpen ? 256 : 0,
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <div className="flex flex-col h-full" style={{ width: 256 }}>

          {/* 顶部 Logo + 新建 */}
          <div className="flex items-center justify-between px-4 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}>
            <Link href="/" className="flex items-center gap-2 font-semibold text-sm tracking-tight"
              style={{ color: "var(--text-primary)" }}>
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                style={{ background: "var(--accent)", color: "#fff" }}>C1</div>
              Conv:1
            </Link>
            <Link href="/chat"
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
              title="新对话"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e: any) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </Link>
          </div>

          {/* 历史列表 */}
          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {(threads as ThreadItem[]).length === 0 ? (
              <p className="px-3 py-10 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                暂无历史对话
              </p>
            ) : (
              (threads as ThreadItem[]).map((thread) => {
                const isActive = pathname === `/chat/${thread.id}`;
                const isPending = deleteConfirm === thread.id;
                return (
                  <Link key={thread.id} href={`/chat/${thread.id}`}
                    className="group flex items-start gap-2.5 px-3 py-2.5 rounded-lg mb-0.5 transition-all relative"
                    style={{
                      background: isActive ? "var(--bg-hover)" : "transparent",
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                    onMouseEnter={(e: any) => { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e: any) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>

                    {/* AI 颜色点 */}
                    <div className="flex gap-0.5 mt-1.5 flex-shrink-0">
                      {thread.agents.slice(0, 3).map((id) => (
                        <span key={id} className="w-1.5 h-1.5 rounded-full"
                          style={{ background: AGENT_COLORS[id] ?? "#ccc" }} />
                      ))}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate leading-5">{thread.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {formatTime(new Date(thread.updatedAt))}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, thread.id)}
                      className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                      title={isPending ? "再次点击确认删除" : "删除"}
                      style={{ color: isPending ? "#ef4444" : "var(--text-muted)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        {isPending
                          ? <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>
                          : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
                      </svg>
                    </button>
                  </Link>
                );
              })
            )}
          </nav>

          {/* 底部用户区 */}
          <div className="px-2 py-3 space-y-0.5" style={{ borderTop: "1px solid var(--border)" }}>
            {user && (
              <>
                {user.plan === "FREE" && user.remaining !== null && (
                  <div className="px-3 pb-3 pt-1">
                    <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                      <span>今日剩余</span>
                      <span>{user.remaining} / {user.freeLimit}</span>
                    </div>
                    <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${(user.remaining / user.freeLimit) * 100}%`, background: "var(--accent)" }} />
                    </div>
                  </div>
                )}

                <NavItem href="/history" label="历史记录" active={pathname === "/history"}
                  icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
                <NavItem href="/settings" label="设置" active={pathname === "/settings"}
                  icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>} />

                {/* 用户行 */}
                <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-lg"
                  style={{ background: "var(--bg-hover)" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ background: "var(--accent)", color: "#fff" }}>
                    {user.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{user.email}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {user.plan === "PRO" ? "Pro 会员" : "免费版"}
                    </p>
                  </div>
                  <button onClick={logout} title="退出登录"
                    className="flex-shrink-0 p-1 rounded transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e: any) => e.currentTarget.style.color = "var(--text-primary)"}
                    onMouseLeave={(e: any) => e.currentTarget.style.color = "var(--text-muted)"}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ─── 主内容区 ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* 侧边栏折叠按钮 */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-3.5 left-3.5 z-20 w-7 h-7 flex items-center justify-center rounded-lg transition-all"
          style={{ color: "var(--text-muted)", background: "transparent" }}
          onMouseEnter={(e: any) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}

function NavItem({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <Link href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors"
      style={{ background: active ? "var(--bg-hover)" : "transparent", color: active ? "var(--text-primary)" : "var(--text-secondary)" }}
      onMouseEnter={(e: any) => { if (!active) e.currentTarget.style.background = "var(--bg-hover)"; }}
      onMouseLeave={(e: any) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
      <span style={{ color: "var(--text-muted)" }}>{icon}</span>
      {label}
    </Link>
  );
}
