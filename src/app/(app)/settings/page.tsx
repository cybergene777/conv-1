// src/app/(app)/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSettingsStore } from "@/store/settingsStore";
import { useChat } from "@/hooks/useChat";

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
  const { theme, setTheme } = useSettingsStore();
  const { logout } = useChat();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch("/api/user", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setUser(d.data); });
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

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword.length < 8) {
      setPwMsg({ type: "err", text: "新密码至少 8 位" });
      return;
    }
    setPwLoading(true);
    try {
      const token = getToken();
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPwMsg({ type: "ok", text: "密码已更新" });
        setOldPassword("");
        setNewPassword("");
      } else {
        setPwMsg({ type: "err", text: data.error ?? "更新失败" });
      }
    } catch {
      setPwMsg({ type: "err", text: "网络错误" });
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div
        className="px-8 py-5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          设置
        </h1>
      </div>

      <div className="flex-1 px-8 py-8 max-w-xl space-y-8">

        {/* 账号信息 */}
        <Section title="账号">
          {user && (
            <div className="space-y-3">
              <Row label="邮箱" value={user.email} />
              <Row
                label="计划"
                value={
                  user.plan === "PRO" ? (
                    <span style={{ color: "var(--accent)" }}>✦ Pro 会员</span>
                  ) : (
                    <span>
                      免费版{" "}
                      <Link href="/pricing" style={{ color: "var(--accent)" }}>
                        升级 →
                      </Link>
                    </span>
                  )
                }
              />
              {user.plan === "FREE" && user.remaining !== null && (
                <Row label="今日剩余" value={`${user.remaining} / ${user.freeLimit} 次`} />
              )}
              <Row
                label="注册时间"
                value={new Date(user.createdAt).toLocaleDateString("zh-CN")}
              />
            </div>
          )}
        </Section>

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
                {{ system: "跟随系统", light: "浅色", dark: "深色" }[t]}
              </button>
            ))}
          </div>
        </Section>

        {/* 修改密码 */}
        <Section title="修改密码">
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <input
              type="password"
              placeholder="当前密码"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
            <input
              type="password"
              placeholder="新密码（至少 8 位）"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
            {pwMsg && (
              <p
                className="text-sm px-3 py-2 rounded-lg"
                style={{
                  background: pwMsg.type === "ok" ? "#d1fae5" : "#fee2e2",
                  color: pwMsg.type === "ok" ? "#065f46" : "#dc2626",
                }}
              >
                {pwMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={pwLoading}
              className="px-5 py-2 rounded-xl text-sm font-medium"
              style={{
                background: "var(--accent)",
                color: "#fff",
                opacity: pwLoading ? 0.7 : 1,
              }}
            >
              {pwLoading ? "更新中…" : "更新密码"}
            </button>
          </form>
        </Section>

        {/* 退出 */}
        <Section title="其他">
          <button
            onClick={logout}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}
