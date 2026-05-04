// src/app/(app)/chat/page.tsx
// 新对话入口页：无 threadId，直接展示空 ChatContainer
"use client";

import { useEffect, useState } from "react";
import ChatContainer from "@/components/chat/ChatContainer";

/**
 * 从 Cookie 中安全获取 Token
 *
 */
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

  // 1. 初始化时获取用户信息，以确定用户权限及剩余额度
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    fetch("/api/user", { 
      headers: { Authorization: `Bearer ${token}` } 
    })
      .then((r) => r.json())
      .then((d) => { 
        if (d.success) {
          setUser(d.data); 
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user info for chat page:", err);
      });
  }, []);

  // 2. 渲染 ChatContainer：在没有 threadId 的情况下，它将展示初始选择界面
  // 传入 isPro 和 remaining 以便 Container 内部处理额度校验
  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <ChatContainer
        isPro={user?.plan === "PRO"}
        remaining={user?.remaining}
      />
    </div>
  );
}