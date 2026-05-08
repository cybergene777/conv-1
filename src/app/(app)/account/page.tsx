// src/app/(app)/account/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? match[1] : null;
}

interface UserInfo {
  id: string;
  email: string;
  nickname?: string;
  avatar?: string;
  plan: "FREE" | "PRO";
  remaining: number | null;
  freeLimit: number;
  createdAt: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameMsg, setNicknameMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [nicknameSaving, setNicknameSaving] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取用户信息
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("/api/user", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setUser(d.data);
          setNickname(d.data.nickname || "");
          setAvatarPreview(d.data.avatar || null);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  // 保存昵称
  async function handleSaveNickname() {
    if (nickname.trim().length === 0) {
      setNicknameMsg({ type: "err", text: "昵称不能为空" });
      return;
    }
    if (nickname.length > 20) {
      setNicknameMsg({ type: "err", text: "昵称最多 20 个字符" });
      return;
    }

    setNicknameSaving(true);
    setNicknameMsg(null);

    try {
      const token = getToken();
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setNicknameMsg({ type: "ok", text: "昵称已更新" });
        setEditingNickname(false);
        if (user) setUser({ ...user, nickname: nickname.trim() });
      } else {
        setNicknameMsg({ type: "err", text: data.error ?? "更新失败" });
      }
    } catch {
      setNicknameMsg({ type: "err", text: "网络错误" });
    } finally {
      setNicknameSaving(false);
    }
  }

  // 处理头像上传
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件");
      return;
    }

    // 检查文件大小 (最大 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("图片大小不能超过 5MB");
      return;
    }

    // 本地预览
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 上传到服务器
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = getToken();
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setAvatarPreview(data.url);
        if (user) setUser({ ...user, avatar: data.url });
      } else {
        alert("上传失败: " + (data.error ?? "未知错误"));
        setAvatarPreview(user?.avatar || null);
      }
    } catch (error) {
      alert("上传出错");
      setAvatarPreview(user?.avatar || null);
    }
  }

  // 修改密码
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p style={{ color: "var(--text-muted)" }}>加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div
        className="px-8 py-5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
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
            账户信息
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-8 py-8 max-w-xl space-y-8">
        {user && (
          <>
            {/* 头像区域 */}
            <Section title="头像">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                {/* Avatar Display */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: avatarPreview ? "none" : "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "transform 0.2s",
                    border: "2px solid var(--border)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as any).style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as any).style.transform = "scale(1)";
                  }}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="用户头像"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{ fontSize: 36, fontWeight: 600, color: "#fff" }}>
                      {user.email[0].toUpperCase()}
                    </span>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: "none" }}
                />

                <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                  点击头像更改或上传新头像
                </p>
              </div>
            </Section>

            {/* 昵称编辑 */}
            <Section title="昵称">
              <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                {!editingNickname ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, color: "var(--text-primary)" }}>
                      {nickname || "（未设置）"}
                    </span>
                    <button
                      onClick={() => setEditingNickname(true)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        fontSize: 12,
                        background: "var(--accent)",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      编辑
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="输入昵称（最多 20 个字符）"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                      maxLength={20}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{
                        background: "var(--input-bg)",
                        border: "1px solid var(--input-border)",
                        color: "var(--text-primary)",
                      }}
                      autoFocus
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={handleSaveNickname}
                        disabled={nicknameSaving}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: 6,
                          fontSize: 12,
                          background: "var(--accent)",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 500,
                          opacity: nicknameSaving ? 0.7 : 1,
                        }}
                      >
                        {nicknameSaving ? "保存中..." : "保存"}
                      </button>
                      <button
                        onClick={() => setEditingNickname(false)}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: 6,
                          fontSize: 12,
                          background: "var(--bg-secondary)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border)",
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >
                        取消
                      </button>
                    </div>
                    {nicknameMsg && (
                      <p
                        style={{
                          fontSize: 12,
                          padding: "8px 12px",
                          borderRadius: 6,
                          background: nicknameMsg.type === "ok" ? "#d1fae5" : "#fee2e2",
                          color: nicknameMsg.type === "ok" ? "#065f46" : "#dc2626",
                          margin: 0,
                        }}
                      >
                        {nicknameMsg.text}
                      </p>
                    )}
                  </>
                )}
              </div>
            </Section>

            {/* 账户信息 */}
            <Section title="账户">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Row label="邮箱" value={user.email} />
                <Row
                  label="计划"
                  value={
                    user.plan === "PRO" ? (
                      <span style={{ color: "var(--accent)" }}>✦ Pro 会员</span>
                    ) : (
                      <span>
                        免费版{" "}
                        <Link href="/pricing" style={{ color: "var(--accent)", textDecoration: "none" }}>
                          升级 →
                        </Link>
                      </span>
                    )
                  }
                />
                {user.plan === "FREE" && user.remaining !== null && (
                  <Row label="今日剩余" value={`${user.remaining} / ${user.freeLimit} 次`} />
                )}
                <Row label="注册时间" value={new Date(user.createdAt).toLocaleDateString("zh-CN")} />
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
                      margin: 0,
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
                    border: "none",
                    cursor: "pointer",
                    width: "100%",
                    opacity: pwLoading ? 0.7 : 1,
                  }}
                >
                  {pwLoading ? "更新中…" : "更新密码"}
                </button>
              </form>
            </Section>
          </>
        )}
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
