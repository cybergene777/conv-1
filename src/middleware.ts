// src/middleware.ts
// JWT 鉴权 + 免费用户次数限制（中间件层）
// 注意：次数原子扣减在 API Route 内用数据库事务完成，此处仅做快速拦截

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractToken } from "@/lib/jwt";

// 需要鉴权的路径
const PROTECTED_PATHS = ["/api/chat", "/api/user", "/api/payment"];
// 完全公开的路径（无需 token）
const PUBLIC_PATHS = ["/api/auth/login", "/api/auth/register"];

export async function middleware(req: NextRequest) {
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

export const config = {
  matcher: ["/api/:path*", "/(app)/:path*"],
};
