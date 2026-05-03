// src/proxy.ts
// JWT 鉴权 + 免费用户次数限制（代理层）
// 注意：次数原子扣减在 API Route 内用数据库事务完成，此处仅做快速拦截

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractToken } from "@/lib/jwt";

// 需要鉴权的路径
const PROTECTED_PATHS = ["/api/chat", "/api/user", "/api/payment"];
// 完全公开的路径（无需 token）
const PUBLIC_PATHS = ["/api/auth/login", "/api/auth/register"];

/**
 * Next.js 现在要求将函数名从 middleware 改为 proxy
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 公开路径直接放行
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 受保护路径：验证 JWT
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // 将用户信息注入 Header，供 API Route 使用（避免重复解析 token）
    const headers = new Headers(req.headers);
    headers.set("x-user-id", payload.userId);
    headers.set("x-user-plan", payload.plan);

    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

// 配置保持不变，继续控制该代理逻辑执行的路径范围
export const config = {
  matcher: ["/api/:path*", "/(app)/:path*"],
};