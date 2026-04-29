// src/app/api/chat/stream/route.ts
// ⭐ 核心：多 AI 并发 SSE 推流

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AGENT_MAP, FREE_MAX_AGENTS } from "@/lib/ai-agents";
import { streamFromAgent, AIMessage } from "@/lib/ai-client";
import { err } from "@/lib/utils";
import { truncate } from "@/lib/utils";
import { AgentId } from "@/types/ai";

export const runtime = "nodejs"; // Edge Runtime 不支持 Prisma

export async function POST(req: NextRequest) {
  // ─── 1. 获取用户信息（由 middleware 注入）────────────────
  const userId = req.headers.get("x-user-id");
  const userPlan = req.headers.get("x-user-plan") as "FREE" | "PRO";
  if (!userId) return err("Unauthorized", 401);

  // ─── 2. 解析请求体 ────────────────────────────────────────
  const body = await req.json();
  const { agents, message, threadId } = body as {
    agents: AgentId[];
    message: string;
    threadId?: string;
  };

  if (!agents?.length || !message?.trim()) {
    return err("agents 和 message 不能为空");
  }

  // ─── 3. 免费用户限制检查（原子扣减，防并发漏洞）──────────
  if (userPlan === "FREE") {
    // 免费用户最多选 2 个 AI
    if (agents.length > FREE_MAX_AGENTS) {
      return err(`免费版最多同时选 ${FREE_MAX_AGENTS} 个 AI`);
    }

    // 原子扣减：影响行数为 0 表示已达上限
    const FREE_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT ?? "5");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await prisma.$executeRaw`
      UPDATE users
      SET daily_count = daily_count + 1
      WHERE id = ${userId}
        AND (
          "dailyResetAt" < ${today}
          OR daily_count < ${FREE_LIMIT}
        )
    `;

    // 同时重置跨日计数
    await prisma.$executeRaw`
      UPDATE users
      SET "dailyResetAt" = ${today}, daily_count = 1
      WHERE id = ${userId} AND "dailyResetAt" < ${today}
    `;

    if (result === 0) {
      return err("今日免费次数已用完，请升级 Pro", 429);
    }
  }

  // ─── 4. 获取或创建 Thread ─────────────────────────────────
  let thread;
  if (threadId) {
    thread = await prisma.thread.findFirst({
      where: { id: threadId, userId },
      include: { turns: { orderBy: { createdAt: "asc" } } },
    });
    if (!thread) return err("Thread 不存在", 404);
  } else {
    thread = await prisma.thread.create({
      data: {
        userId,
        title: truncate(message),
        agents,
      },
      include: { turns: true },
    });
  }

  // ─── 5. 保存用户消息 ──────────────────────────────────────
  await prisma.turn.create({
    data: {
      threadId: thread.id,
      role: "USER",
      content: message,
    },
  });

  // ─── 6. 构建历史消息上下文 ───────────────────────────────
  // 取最近 10 轮，避免 token 超限
  const recentTurns = thread.turns.slice(-20);
  const historyMessages: AIMessage[] = recentTurns.map((t) => ({
    role: t.role === "USER" ? "user" : "assistant",
    content: t.content,
  }));
  historyMessages.push({ role: "user", content: message });

  // ─── 7. 构建 SSE 响应流 ───────────────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // 先发送 threadId，方便前端跳转
      send({ type: "meta", threadId: thread.id });

      // 并发启动所有 AI 流式请求
      const agentTasks = agents.map(async (agentId) => {
        const agent = AGENT_MAP.get(agentId);
        if (!agent) {
          send({ type: "error", agentId, error: "未知 AI" });
          return;
        }

        let fullContent = "";
        let isError = false;

        try {
          const agentStream = await streamFromAgent(agent, historyMessages);
          const reader = agentStream.getReader();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullContent += value;
            send({ type: "chunk", agentId, chunk: value });
          }

          send({ type: "done", agentId });
        } catch (e) {
          isError = true;
          const errorMsg = e instanceof Error ? e.message : "未知错误";
          send({ type: "error", agentId, error: errorMsg });
        }

        // 保存 AI 回复到数据库
        await prisma.turn.create({
          data: {
            threadId: thread.id,
            role: "ASSISTANT",
            content: fullContent || "[响应失败]",
            agentId,
            isError,
          },
        });
      });

      await Promise.allSettled(agentTasks);

      // 全部完成后发终止信号
      send({ type: "finished" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      // 禁止 Nginx/CDN 缓冲，确保实时推流
      "X-Accel-Buffering": "no",
    },
  });
}
