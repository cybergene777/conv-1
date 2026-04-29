// src/app/api/user/route.ts
// GET   /api/user  → 获取当前用户信息（含今日剩余次数）
// PATCH /api/user  → 更新用户信息（暂支持修改密码）

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// ─── GET：用户信息 ────────────────────────────────────────
export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return err("Unauthorized", 401);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      plan: true,
      dailyCount: true,
      dailyResetAt: true,
      createdAt: true,
    },
  });
  if (!user) return err("用户不存在", 404);

  // 计算今日剩余次数
  const FREE_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT ?? "5");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isNewDay = user.dailyResetAt < today;
  const usedToday = isNewDay ? 0 : user.dailyCount;
  const remaining = user.plan === "PRO" ? null : Math.max(0, FREE_LIMIT - usedToday);

  return ok({ ...user, remaining, freeLimit: FREE_LIMIT });
}

// ─── PATCH：修改密码 ──────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return err("Unauthorized", 401);

  const { oldPassword, newPassword } = await req.json();
  if (!oldPassword || !newPassword) return err("旧密码和新密码不能为空");
  if (newPassword.length < 8) return err("新密码至少 8 位");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return err("用户不存在", 404);

  if (user.passwordHash !== hashPassword(oldPassword)) {
    return err("旧密码错误", 401);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashPassword(newPassword) },
  });

  return ok({ message: "密码已更新" });
}

