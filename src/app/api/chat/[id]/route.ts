// src/app/api/chat/[id]/route.ts
// GET    /api/chat/[id]  → 获取 Thread 详情（含全部 turns）
// PATCH  /api/chat/[id]  → 修改标题
// DELETE /api/chat/[id]  → 删除 Thread

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

type Params = { params: { id: string } };

// ─── GET：Thread 详情 ─────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return err("Unauthorized", 401);

  const thread = await prisma.thread.findFirst({
    where: { id: params.id, userId },
    include: {
      turns: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!thread) return err("Thread 不存在", 404);
  return ok({ thread });
}

// ─── PATCH：修改标题 ──────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return err("Unauthorized", 401);

  const { title } = await req.json();
  if (!title?.trim()) return err("标题不能为空");

  const thread = await prisma.thread.findFirst({
    where: { id: params.id, userId },
  });
  if (!thread) return err("Thread 不存在", 404);

  const updated = await prisma.thread.update({
    where: { id: params.id },
    data: { title: title.trim() },
  });

  return ok({ thread: updated });
}

// ─── DELETE：删除 Thread ──────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return err("Unauthorized", 401);

  const thread = await prisma.thread.findFirst({
    where: { id: params.id, userId },
  });
  if (!thread) return err("Thread 不存在", 404);

  // Prisma schema 已设置 onDelete: Cascade，turns 会自动删除
  await prisma.thread.delete({ where: { id: params.id } });

  return ok({ message: "已删除" });
}

