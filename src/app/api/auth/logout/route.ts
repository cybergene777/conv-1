// src/app/api/auth/logout/route.ts
// 登出：将 token 加入黑名单（Session 表），middleware 验证时会拒绝已登出 token

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/jwt";
import { ok, err } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const token = extractToken(req);
  if (!token) return err("未登录", 401);

  const payload = await verifyToken(token);
  if (!payload) return err("token 无效", 401);

  // 解析过期时间（jose payload 中的 exp 是 Unix 秒）
  const { exp } = payload as unknown as { exp?: number };
  const expiresAt = exp ? new Date(exp * 1000) : new Date(Date.now() + 7 * 86400_000);

  // 写入黑名单，已存在则忽略（幂等）
  await prisma.session.upsert({
    where: { token },
    update: {},
    create: {
      userId: payload.userId,
      token,
      expiresAt,
    },
  });

  return ok({ message: "已登出" });
}

