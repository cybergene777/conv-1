// src/app/(app)/chat/page.tsx
// 新对话入口页：无 threadId，直接展示空 ChatContainer
"use client";

import { useEffect, useState } from "react";
import ChatContainer from "@/components/chat/ChatContainer";

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? match[1] : null;
}

interface UserInfo {
  plan: "FREE" | "PRO";
  remaining: number | null;
  freeLimit: number;
}

export default function ChatPage() {
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch("/api/user", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setUser(d.data); });
  }, []);

  return (
    <ChatContainer
      isPro={user?.plan === "PRO"}
      remaining={user?.remaining}
    />
  );
}
