// src/app/(app)/layout.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useChatStore } from "@/store/chatStore";
import { useUserStore } from "@/store/userStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useChat } from "@/hooks/useChat";
import { AI_AGENTS, FREE_MAX_AGENTS } from "@/lib/ai-agents";
import { AgentId } from "@/types/ai";

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

function groupThreads(threads: ThreadItem[]) {
  const now = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

// ─── Tooltip ───────────────────────────────────────────────────────────────
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
      onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div style={{ position: "absolute", left: "calc(100% + 10px)", top: "50%", transform: "translateY(-50%)", background: "var(--tooltip-bg, #1a1a1a)", color: "var(--tooltip-text, #fff)", fontSize: 12, fontWeight: 500, padding: "5px 10px", borderRadius: 7, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 200, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
          {label}
          <div style={{ position: "absolute", right: "100%", top: "50%", transform: "translateY(-50%)", borderWidth: "5px 6px 5px 0", borderStyle: "solid", borderColor: "transparent var(--tooltip-bg, #1a1a1a) transparent transparent" }} />
        </div>
      )}
    </div>
  );
}

// ─── Rail icon button ──────────────────────────────────────────────────────
function RailBtn({ label, onClick, href, active, children }: {
  label: string; onClick?: () => void; href?: string; active?: boolean; children: React.ReactNode;
}) {
  const baseStyle: React.CSSProperties = { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", background: active ? "var(--bg-hover)" : "none", color: active ? "var(--text-primary)" : "var(--text-muted)", transition: "background 0.13s, color 0.13s", flexShrink: 0 };
  const hoverIn  = (e: any) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; };
  const hoverOut = (e: any) => { e.currentTarget.style.background = active ? "var(--bg-hover)" : "none"; e.currentTarget.style.color = active ? "var(--text-primary)" : "var(--text-muted)"; };
  return (
    <Tooltip label={label}>
      {href ? (
        <Link href={href} style={{ ...baseStyle, textDecoration: "none" }} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>{children}</Link>
      ) : (
        <button style={baseStyle} onClick={onClick} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>{children}</button>
      )}
    </Tooltip>
  );
}

// ─── 折叠面板 ──────────────────────────────────────────────────────────────
function SideSection({ label, icon, defaultOpen = true, children }: {
  label: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 10px", borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", transition: "background 0.1s" }}
        onMouseEnter={(e: any) => e.currentTarget.style.background = "var(--bg-hover)"}
        onMouseLeave={(e: any) => e.currentTarget.style.background = "none"}
      >
        <span style={{ display: "flex", opacity: 0.6 }}>{icon}</span>
        <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.18s", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div style={{ marginTop: 2 }}>{children}</div>}
    </div>
  );
}

// ─── 模型选择面板 ──────────────────────────────────────────────────────────
function ModelPanel({ isPro }: { isPro: boolean }) {
  const { selectedAgents, toggleAgent } = useSettingsStore();
  const maxAgents = isPro ? AI_AGENTS.length : FREE_MAX_AGENTS;
  const isAtLimit = selectedAgents.length >= maxAgents;

  return (
    <div style={{ padding: "4px 4px 8px" }}>
      {AI_AGENTS.map((agent) => {
        const isSelected = selectedAgents.includes(agent.id as AgentId);
        const isThisDisabled = !isSelected && isAtLimit;
        return (
          <button key={agent.id}
            onClick={() => { if (!isThisDisabled) toggleAgent(agent.id as AgentId, maxAgents); }}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "7px 10px", borderRadius: 8, background: isSelected ? `${agent.color}14` : "none", border: "none", cursor: isThisDisabled ? "not-allowed" : "pointer", opacity: isThisDisabled ? 0.45 : 1, transition: "background 0.12s", textAlign: "left" }}
            onMouseEnter={(e: any) => { if (!isThisDisabled) e.currentTarget.style.background = isSelected ? `${agent.color}1e` : "var(--bg-hover)"; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.background = isSelected ? `${agent.color}14` : "none"; }}
          >
            <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `2px solid ${isSelected ? agent.color : "var(--border)"}`, background: isSelected ? agent.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s" }}>
              {isSelected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
            </div>
            <img src={`/ai-avatars/${agent.avatar}`} alt={agent.name} width={20} height={20} style={{ borderRadius: 4, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? agent.color : "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {agent.name}
            </span>
            {isSelected && <div style={{ width: 5, height: 5, borderRadius: "50%", background: agent.color, flexShrink: 0 }} />}
          </button>
        );
      })}
      {!isPro && (
        <p style={{ margin: "6px 10px 0", fontSize: 11, color: "var(--text-muted)" }}>
          免费版最多选 {FREE_MAX_AGENTS} 个模型
        </p>
      )}
    </div>
  );
}

// ─── App Layout ────────────────────────────────────────────────────────────
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { threads, setThreads } = useChatStore();
  const { logout, deleteThread } = useChat();
  const { user, setUser } = useUserStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    fetch("/api/user", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setUser(d.data); else router.push("/login"); })
      .catch(() => router.push("/login"));
  }, [router, setUser]);

  const loadThreads = useCallback(() => {
    const token = getToken();
    if (!token) return;
    fetch("/api/chat", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setThreads(d.data.threads); });
  }, [setThreads]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const handleDelete = async (e: React.MouseEvent, threadId: string) => {
    e.preventDefault(); e.stopPropagation();
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
  const isPro = user?.plan === "PRO";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 35, background: "rgba(0,0,0,0.22)", backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)" }} />
      )}

      {/* ─── Collapsed rail ──────────────────────────────────────────────── */}
      {!sidebarOpen && (
        <div style={{ width: 54, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0", gap: 2, background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)", zIndex: 30, position: "relative" }}>
          <RailBtn label="展开侧边栏" onClick={() => setSidebarOpen(true)}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
          </RailBtn>
          <RailBtn label="新建对话" onClick={() => router.push("/chat")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </RailBtn>
          <RailModelBtn isPro={isPro} />
          <RailBtn label="历史记录" href="/history" active={pathname === "/history"}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </RailBtn>
          <div style={{ flex: 1 }} />
          {user && (
            <div style={{ marginBottom: 4 }}>
              <UserMenuBtn user={user} logout={logout} router={router} />
            </div>
          )}
        </div>
      )}

      {/* ─── Full sidebar ─────────────────────────────────────────────────── */}
      <aside style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 260, zIndex: 40, display: "flex", flexDirection: "column", background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)", transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 10px 8px", flexShrink: 0 }}>
          <button onClick={() => { router.push("/chat"); setSidebarOpen(false); }} title="新建对话" style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, letterSpacing: "-0.5px", flexShrink: 0 }}>C1</div>
            <span style={{ fontFamily: "'Satoshi', 'Source Serif 4', Georgia, serif", fontWeight: 900, fontSize: 15, color: "var(--text-primary)", whiteSpace: "nowrap", letterSpacing: "-0.8px" }}>
              Conv <span style={{ fontWeight: 300, opacity: 0.4 }}>::</span> 1
            </span>
          </button>
          <button onClick={() => setSidebarOpen(false)} title="收起" style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        </div>

        {/* 新建对话 */}
        <div style={{ padding: "0 8px 8px", flexShrink: 0 }}>
          <button
            onClick={() => { router.push("/chat"); setSidebarOpen(false); }}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "opacity 0.12s" }}
            onMouseEnter={(e: any) => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={(e: any) => e.currentTarget.style.opacity = "1"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            新建对话
          </button>
        </div>

        {/* 可滚动区域 */}
        <div className="sidebar-scroll" style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>

          {/* 模型选择 */}
          <SideSection label="选择模型" defaultOpen={true}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><line x1="14.15" y1="9.85" x2="17.2" y2="6.8"/><line x1="6.8" y1="17.2" x2="9.85" y2="14.15"/></svg>}
          >
            <ModelPanel isPro={isPro} />
          </SideSection>

          <div style={{ height: 1, background: "var(--border)", margin: "6px 4px" }} />

          {/* 历史对话 */}
          <SideSection label="历史对话" defaultOpen={true}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          >
            {grouped.length === 0 ? (
              <p style={{ padding: "16px 10px", textAlign: "center", fontSize: 12, color: "var(--text-muted)", margin: 0 }}>暂无历史对话</p>
            ) : grouped.map((group) => (
              <div key={group.label} style={{ marginBottom: 4 }}>
                <p style={{ margin: "8px 10px 4px", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {group.label}
                </p>
                {group.items.map((thread) => {
                  const isActive = pathname === `/chat/${thread.id}`;
                  const isPending = deleteConfirm === thread.id;
                  return (
                    <Link key={thread.id} href={`/chat/${thread.id}`}
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8, marginBottom: 1, background: isActive ? "var(--bg-hover)" : "transparent", color: isActive ? "var(--text-primary)" : "var(--text-secondary)", textDecoration: "none", fontSize: 13, transition: "background 0.1s" }}
                      onMouseEnter={(e: any) => { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                      onMouseLeave={(e: any) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: isActive ? 500 : 400, lineHeight: "20px" }}>
                        {thread.title}
                      </span>
                      <button onClick={(e) => handleDelete(e, thread.id)} title={isPending ? "再次点击确认删除" : "删除"}
                        style={{ flexShrink: 0, width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, background: "none", border: "none", cursor: "pointer", color: isPending ? "#ef4444" : "var(--text-muted)" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          {isPending ? <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></> : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
                        </svg>
                      </button>
                    </Link>
                  );
                })}
              </div>
            ))}
          </SideSection>

        </div>

        {/* Bottom user */}
        <div style={{ padding: "6px 8px 12px", flexShrink: 0, borderTop: "1px solid var(--border)" }}>
          {user && (
            <>
              {user.plan === "FREE" && user.remaining !== null && (
                <div style={{ padding: "6px 12px 8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 5 }}>
                    <span>今日剩余</span><span>{user.remaining} / {user.freeLimit}</span>
                  </div>
                  <div style={{ height: 2, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 2, background: "var(--accent)", width: `${(user.remaining / user.freeLimit) * 100}%`, transition: "width 0.3s" }} />
                  </div>
                </div>
              )}
              <UserMenuBtn user={user} logout={logout} router={router} expanded />
            </>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}

// ─── User menu ─────────────────────────────────────────────────────────────
function UserMenuBtn({ user, logout, router, expanded }: {
  user: { email: string; nickname?: string; avatar?: string; plan: "FREE" | "PRO"; remaining: number | null; freeLimit: number };
  logout: () => void;
  router: ReturnType<typeof import("next/navigation").useRouter>;
  expanded?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const displayName = user.nickname || user.email;
  const initial = (user.nickname || user.email)[0].toUpperCase();
  const Avatar = (size: number, fontSize: number) =>
    user.avatar ? (
      <img src={user.avatar} alt="avatar" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    ) : (
      <div style={{ width: size, height: size, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize, fontWeight: 600, flexShrink: 0 }}>{initial}</div>
    );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {expanded ? (
        <button onClick={() => setOpen(!open)}
          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px", borderRadius: 10, background: "var(--bg-hover)", border: "none", cursor: "pointer", textAlign: "left", transition: "filter 0.12s" }}
          onMouseEnter={(e: any) => e.currentTarget.style.filter = "brightness(0.95)"}
          onMouseLeave={(e: any) => e.currentTarget.style.filter = "none"}
        >
          {Avatar(26, 11)}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)", margin: 0 }}>{displayName}</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{user.plan === "PRO" ? "Pro 会员" : "免费版"}</p>
          </div>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
      ) : (
        <button onClick={() => setOpen(!open)}
          style={{ width: 32, height: 32, borderRadius: "50%", background: user.avatar ? "transparent" : "var(--accent)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.13s", overflow: "hidden" }}
          onMouseEnter={(e: any) => e.currentTarget.style.opacity = "0.75"}
          onMouseLeave={(e: any) => e.currentTarget.style.opacity = "1"}
        >{Avatar(32, 12)}</button>
      )}

      {open && (
        <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: expanded ? 0 : "calc(100% + 10px)", width: 240, background: "var(--bg-sidebar)", border: "1px solid var(--border)", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", zIndex: 300, overflow: "hidden", animation: "fadeSlideUp 0.15s ease" }}>
          <style>{`@keyframes fadeSlideUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }`}</style>
          <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {Avatar(36, 14)}
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</p>
                {user.nickname && <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>}
                <span style={{ display: "inline-block", marginTop: 3, fontSize: 11, fontWeight: 500, padding: "1px 7px", borderRadius: 20, background: user.plan === "PRO" ? "var(--accent)" : "var(--bg-hover)", color: user.plan === "PRO" ? "#fff" : "var(--text-muted)" }}>
                  {user.plan === "PRO" ? "Pro 会员" : "免费版"}
                </span>
              </div>
            </div>
            {user.plan === "FREE" && user.remaining !== null && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 5 }}>
                  <span>今日剩余用量</span><span>{user.remaining} / {user.freeLimit}</span>
                </div>
                <div style={{ height: 3, borderRadius: 3, background: "var(--border)" }}>
                  <div style={{ height: "100%", borderRadius: 3, background: "var(--accent)", width: `${(user.remaining / user.freeLimit) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
          <div style={{ padding: "6px 6px" }}>
            <MenuRow icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} label="账户信息" onClick={() => { setOpen(false); router.push("/account"); }} />
            <MenuRow icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>} label="设置" onClick={() => { setOpen(false); router.push("/settings"); }} />
            {user.plan === "FREE" && <MenuRow icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>} label="升级到 Pro" accent onClick={() => { setOpen(false); router.push("/settings"); }} />}
          </div>
          <div style={{ borderTop: "1px solid var(--border)", padding: "6px 6px 8px" }}>
            <MenuRow icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>} label="退出登录" danger onClick={() => { setOpen(false); logout(); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuRow({ icon, label, onClick, accent, danger }: {
  icon: React.ReactNode; label: string; onClick: () => void; accent?: boolean; danger?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 10px", borderRadius: 8, background: hovered ? "var(--bg-hover)" : "none", border: "none", cursor: "pointer", textAlign: "left", color: danger ? "#ef4444" : accent ? "var(--accent)" : "var(--text-primary)", fontSize: 13, fontWeight: accent ? 500 : 400, transition: "background 0.1s" }}>
      <span style={{ display: "flex", opacity: danger ? 1 : 0.7 }}>{icon}</span>
      {label}
    </button>
  );
}

// ─── 收拢状态下的模型选择按钮 ─────────────────────────────────────────────
function RailModelBtn({ isPro }: { isPro: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { selectedAgents, toggleAgent } = useSettingsStore();
  const maxAgents = isPro ? AI_AGENTS.length : FREE_MAX_AGENTS;
  const isAtLimit = selectedAgents.length >= maxAgents;

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <Tooltip label="选择模型">
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            width: 36, height: 36, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "none", cursor: "pointer",
            background: open ? "var(--bg-hover)" : "none",
            color: open ? "var(--text-primary)" : "var(--text-muted)",
            transition: "background 0.13s, color 0.13s",
          }}
          onMouseEnter={(e: any) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.background = open ? "var(--bg-hover)" : "none"; e.currentTarget.style.color = open ? "var(--text-primary)" : "var(--text-muted)"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/>
            <line x1="14.15" y1="9.85" x2="17.2" y2="6.8"/>
            <line x1="6.8" y1="17.2" x2="9.85" y2="14.15"/>
          </svg>
        </button>
      </Tooltip>

      {/* 弹出卡片 */}
      {open && (
        <div style={{
          position: "fixed",
          left: 62,
          top: "auto",
          width: 240,
          background: "var(--bg-sidebar)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          zIndex: 200,
          overflow: "hidden",
          animation: "fadeSlideRight 0.15s ease",
        }}>
          <style>{`@keyframes fadeSlideRight { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }`}</style>

          {/* Header */}
          <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>选择模型</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg-hover)", padding: "1px 7px", borderRadius: 6 }}>
              {selectedAgents.length}/{maxAgents}
            </span>
          </div>

          {/* 模型列表 */}
          <div style={{ padding: "6px 6px 8px", maxHeight: 320, overflowY: "auto" }}>
            {AI_AGENTS.map((agent) => {
              const isSelected = selectedAgents.includes(agent.id as AgentId);
              const isThisDisabled = !isSelected && isAtLimit;
              return (
                <button key={agent.id}
                  onClick={() => { if (!isThisDisabled) toggleAgent(agent.id as AgentId, maxAgents); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "7px 10px", borderRadius: 8, background: isSelected ? `${agent.color}14` : "none", border: "none", cursor: isThisDisabled ? "not-allowed" : "pointer", opacity: isThisDisabled ? 0.45 : 1, transition: "background 0.12s", textAlign: "left" }}
                  onMouseEnter={(e: any) => { if (!isThisDisabled) e.currentTarget.style.background = isSelected ? `${agent.color}1e` : "var(--bg-hover)"; }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.background = isSelected ? `${agent.color}14` : "none"; }}
                >
                  <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `2px solid ${isSelected ? agent.color : "var(--border)"}`, background: isSelected ? agent.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s" }}>
                    {isSelected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                  </div>
                  <img src={`/ai-avatars/${agent.avatar}`} alt={agent.name} width={20} height={20} style={{ borderRadius: 4, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? agent.color : "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {agent.name}
                  </span>
                  {isSelected && <div style={{ width: 5, height: 5, borderRadius: "50%", background: agent.color, flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>

          {!isPro && (
            <div style={{ padding: "4px 14px 10px", borderTop: "1px solid var(--border)" }}>
              <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>免费版最多选 {FREE_MAX_AGENTS} 个模型</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
