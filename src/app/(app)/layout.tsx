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

// 修改2: 按时间段分组，参考 claude.ai 样式
function groupThreads(threads: ThreadItem[]) {
  const now = new Date();
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const lastWeek  = new Date(today.getTime() - 7  * 86400000);
  const lastMonth = new Date(today.getTime() - 30 * 86400000);

  const groups: { label: string; items: ThreadItem[] }[] = [
    { label: "今天",       items: [] },
    { label: "昨天",       items: [] },
    { label: "最近 7 天",  items: [] },
    { label: "最近 30 天", items: [] },
    { label: "更早",       items: [] },
  ];

  for (const t of threads) {
    const d = new Date(t.updatedAt);
    if      (d >= today)     groups[0].items.push(t);
    else if (d >= yesterday) groups[1].items.push(t);
    else if (d >= lastWeek)  groups[2].items.push(t);
    else if (d >= lastMonth) groups[3].items.push(t);
    else                     groups[4].items.push(t);
  }
  return groups.filter((g) => g.items.length > 0);
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { threads, setThreads } = useChatStore();
  const { logout, deleteThread } = useChat();

  const [user, setUser] = useState<UserInfo | null>(null);
  // 修改1: 默认不展开
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const grouped = groupThreads(threads as ThreadItem[]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>

      {/* 修改1: 遮罩层，点击关闭侧边栏 */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 35,
            background: "rgba(0,0,0,0.25)",
            backdropFilter: "blur(1px)",
            WebkitBackdropFilter: "blur(1px)",
          }}
        />
      )}

      {/* ─── 侧边栏 (修改1: overlay浮层, 默认折叠) ─── */}
      <aside
        style={{
          position: "fixed",
          top: 0, left: 0, bottom: 0,
          width: 260,
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border)",
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* 顶部: Logo + 操作按钮 — 修改4: 无分隔线 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 10px 8px" }}>

          {/* 修改3: Conv :: 1，加粗 Source Serif 4 */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "var(--accent)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, letterSpacing: "-0.5px", flexShrink: 0,
            }}>C1</div>
            <span style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontWeight: 700, fontSize: 15,
              color: "var(--text-primary)",
              letterSpacing: 0,
              whiteSpace: "nowrap",
            }}>
              Conv{" "}
              <span style={{ fontWeight: 300, opacity: 0.4 }}>::</span>
              {" "}1
            </span>
          </Link>

          <div style={{ display: "flex", gap: 2 }}>
            {/* 新建对话 */}
            <Link href="/chat" title="新对话" className="icon-btn"
              style={{
                width: 28, height: 28, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-muted)", transition: "background 0.12s, color 0.12s",
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </Link>
            {/* 收起侧边栏 */}
            <button onClick={() => setSidebarOpen(false)} title="收起" className="icon-btn"
              style={{
                width: 28, height: 28, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-muted)", background: "none", border: "none",
                cursor: "pointer", transition: "background 0.12s, color 0.12s",
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* 修改2: 对话历史 — 时间分组，仅标题，无时间戳，类 claude.ai */}
        <nav className="sidebar-scroll" style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
          {grouped.length === 0 ? (
            <p style={{ padding: "40px 12px", textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
              暂无历史对话
            </p>
          ) : (
            grouped.map((group) => (
              <div key={group.label} style={{ marginBottom: 4 }}>
                {/* 时间分组标签 */}
                <p className="thread-group-label">{group.label}</p>

                {group.items.map((thread) => {
                  const isActive = pathname === `/chat/${thread.id}`;
                  const isPending = deleteConfirm === thread.id;
                  return (
                    <Link key={thread.id} href={`/chat/${thread.id}`}
                      className="thread-item"
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "6px 12px", borderRadius: 8, marginBottom: 1,
                        background: isActive ? "var(--bg-hover)" : "transparent",
                        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                        textDecoration: "none", fontSize: 13,
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e: any) => { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                      onMouseLeave={(e: any) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>

                      <span style={{
                        flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        fontWeight: isActive ? 500 : 400,
                        lineHeight: "20px",
                      }}>
                        {thread.title}
                      </span>

                      <button
                        className="thread-del"
                        onClick={(e) => handleDelete(e, thread.id)}
                        title={isPending ? "再次点击确认删除" : "删除"}
                        style={{
                          flexShrink: 0, width: 18, height: 18,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: 4, background: "none", border: "none",
                          cursor: "pointer",
                          color: isPending ? "#ef4444" : "var(--text-muted)",
                        }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          {isPending
                            ? <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>
                            : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
                        </svg>
                      </button>
                    </Link>
                  );
                })}
              </div>
            ))
          )}
        </nav>

        {/* 底部用户区 — 修改4: 无分隔线，靠留白区分 */}
        <div style={{ padding: "6px 8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {user && (
            <>
              {user.plan === "FREE" && user.remaining !== null && (
                <div style={{ padding: "4px 12px 10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 5 }}>
                    <span>今日剩余</span>
                    <span>{user.remaining} / {user.freeLimit}</span>
                  </div>
                  <div style={{ height: 2, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 2, background: "var(--accent)",
                      width: `${(user.remaining / user.freeLimit) * 100}%`,
                      transition: "width 0.3s",
                    }} />
                  </div>
                </div>
              )}

              <NavItem href="/history" label="历史记录" active={pathname === "/history"}
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
              <NavItem href="/settings" label="设置" active={pathname === "/settings"}
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>} />

              {/* 用户行 */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", borderRadius: 10,
                background: "var(--bg-hover)", marginTop: 2,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: "var(--accent)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 600, flexShrink: 0,
                }}>
                  {user.email[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)", margin: 0 }}>{user.email}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{user.plan === "PRO" ? "Pro 会员" : "免费版"}</p>
                </div>
                <button onClick={logout} title="退出登录" className="icon-btn"
                  style={{
                    flexShrink: 0, padding: 4, borderRadius: 6,
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-muted)", transition: "color 0.12s",
                  }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* ─── 主内容区 ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* 修改1: 展开按钮 — claude.ai 面板图标样式，仅侧边栏关闭时显示 */}
        <button
          onClick={() => setSidebarOpen(true)}
          title="展开侧边栏"
          className="icon-btn"
          style={{
            position: "absolute", top: 11, left: 11, zIndex: 20,
            width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 8, background: "transparent", border: "none",
            cursor: "pointer", color: "var(--text-muted)",
            opacity: sidebarOpen ? 0 : 1,
            pointerEvents: sidebarOpen ? "none" : "auto",
            transition: "opacity 0.15s, background 0.15s, color 0.15s",
          }}>
          {/* 经典侧边栏面板图标，与 claude.ai 一致 */}
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
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
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "7px 12px", borderRadius: 8, fontSize: 13,
        background: active ? "var(--bg-hover)" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        textDecoration: "none", transition: "background 0.1s",
      }}
      onMouseEnter={(e: any) => { if (!active) e.currentTarget.style.background = "var(--bg-hover)"; }}
      onMouseLeave={(e: any) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
      <span style={{ color: "var(--text-muted)", display: "flex" }}>{icon}</span>
      {label}
    </Link>
  );
}
