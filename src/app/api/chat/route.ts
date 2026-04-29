// src/app/api/chat/route.ts
// GET  /api/chat  → 获取当前用户的 Thread 列表（侧边栏用）
// POST /api/chat  → 创建空 Thread

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

// ─── GET：Thread 列表 ─────────────────────────────────────
export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return err("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

  const [threads, total] = await Promise.all([
    prisma.thread.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        agents: true,
        createdAt: true,
        updatedAt: true,
        // 只取最后一条 turn 用于侧边栏预览
        turns: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, role: true },
        },
      },
    }),
    prisma.thread.count({ where: { userId } }),
  ]);

  return ok({ threads, total, page, limit });
}

// ─── POST：创建空 Thread ──────────────────────────────────
export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return err("Unauthorized", 401);

  const { agents, title } = await req.json();
  if (!agents?.length) return err("agents 不能为空");

  const thread = await prisma.thread.create({
    data: { userId, title: title ?? "新对话", agents },
  });

  return ok({ thread });
}

