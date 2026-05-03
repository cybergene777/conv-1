// src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? "登录失败"); return; }
      document.cookie = `token=${data.data.token}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
      router.push("/chat");
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-primary)" }}>

      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }} />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: "var(--accent)", color: "#fff" }}>C1</div>
            Conv:1
          </Link>
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
            登录以继续
          </p>
        </div>

        <div className="rounded-2xl p-8"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                邮箱
              </label>
              <input
                type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--input-border)"}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                密码
              </label>
              <input
                type="password" required autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--input-border)"}
              />
            </div>

            {error && (
              <p className="text-xs px-3 py-2.5 rounded-lg"
                style={{ background: "#fee2e222", border: "1px solid #fca5a555", color: "#ef4444" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all mt-1"
              style={{
                background: loading ? "var(--bg-hover)" : "var(--text-primary)",
                color: loading ? "var(--text-muted)" : "var(--bg-primary)",
                cursor: loading ? "not-allowed" : "pointer",
              }}>
              {loading ? "登录中…" : "登录"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          还没有账号？{" "}
          <Link href="/register" className="font-medium transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e: any) => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={(e: any) => e.currentTarget.style.color = "var(--text-secondary)"}>
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}
