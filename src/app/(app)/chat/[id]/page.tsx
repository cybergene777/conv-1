// src/app/(app)/chat/[id]/page.tsx
// 已有对话页：读取 threadId，加载历史记录后渲染 ChatContainer
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function ChatDetailPage() {
  const params = useParams();
  const threadId = params?.id as string;
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
      threadId={threadId}
      isPro={user?.plan === "PRO"}
      remaining={user?.remaining}
    />
  );
}
