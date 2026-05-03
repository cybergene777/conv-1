// src/app/api/chat/stream/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AGENT_MAP } from "@/lib/ai-agents";
import { streamFromAgent, AIMessage } from "@/lib/ai-client";
import { err, truncate } from "@/lib/utils";
import { AgentId } from "@/types/ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return err("Unauthorized", 401);

  const body = await req.json();
  const { agents, message, threadId } = body as {
    agents: AgentId[];
    message: string;
    threadId?: string;
  };

  if (!agents?.length || !message?.trim()) return err("参数错误");

  // 1. 获取或更新 Thread
  let thread;
  if (threadId) {
    thread = await prisma.thread.update({
      where: { id: threadId, userId },
      data: { agents },
      include: { turns: { orderBy: { createdAt: "asc" } } },
    });
  } else {
    thread = await prisma.thread.create({
      data: { userId, title: truncate(message), agents },
      include: { turns: true },
    });
  }

  // 2. 存入用户消息
  await prisma.turn.create({
    data: { threadId: thread.id, role: "USER", content: message },
  });

  // 3. 构建上下文
  const historyMessages: AIMessage[] = thread.turns.slice(-20).map((t) => ({
    role: t.role === "USER" ? "user" : "assistant",
    content: t.content,
  }));

  const agentNames = agents.map((id) => AGENT_MAP.get(id)?.name || id).join(", ");
  historyMessages.unshift({
    role: "system",
    content: `You are ${agentNames}.`,
  });
  historyMessages.push({ role: "user", content: message });

  // 4. SSE 推流
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // send 是线程安全的（Node.js 单线程），多个并发 agentTask 可同时调用
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "meta", threadId: thread.id });

      /**
       * 修复并发问题：
       * 使用回调模式的 streamFromAgent，每个 agent 直接消费自己的 response.body，
       * 通过 onChunk 回调实时 send chunk。
       * 所有 agentTask 同时启动（Promise.allSettled），chunk 事件会真正交替出现，
       * 而不是一个 agent 完成后另一个才开始。
       */
      const agentTasks = agents.map(async (agentId) => {
        const agent = AGENT_MAP.get(agentId);
        if (!agent) return;

        let isError = false;
        let fullContent = "";

        try {
          fullContent = await streamFromAgent(
            agent,
            historyMessages,
            (chunk) => {
              send({ type: "chunk", agentId, chunk });
            }
          );
          send({ type: "done", agentId });
        } catch (e) {
          isError = true;
          send({ type: "error", agentId, error: "AI 响应失败" });
        }

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
      send({ type: "finished" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
