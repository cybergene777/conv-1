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
  const { agents, message, threadId, mode = "compare" } = body as {
    agents: AgentId[];
    message: string;
    threadId?: string;
    mode?: "compare" | "chat";  // compare=对比模式，chat=群聊模式
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

  // 3. 构建历史上下文（公共部分）
  const baseHistory: AIMessage[] = thread.turns.slice(-20).map((t) => ({
    role: t.role === "USER" ? "user" : "assistant",
    content: t.content,
  }));

  // 4. SSE 推流
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "meta", threadId: thread.id });

      if (mode === "compare") {
        // ── 对比模式：所有模型并发，各自独立回复 ──────────────────────
        const agentNames = agents.map((id) => AGENT_MAP.get(id)?.name || id).join(", ");
        const messages: AIMessage[] = [
          { role: "system", content: `You are one of the following AI assistants: ${agentNames}. Answer the user's question.` },
          ...baseHistory,
          { role: "user", content: message },
        ];

        const agentTasks = agents.map(async (agentId) => {
          const agent = AGENT_MAP.get(agentId);
          if (!agent) return;

          let isError = false;
          let fullContent = "";

          try {
            fullContent = await streamFromAgent(agent, messages, (chunk) => {
              send({ type: "chunk", agentId, chunk });
            });
            send({ type: "done", agentId });
          } catch {
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

      } else {
        // ── 群聊模式：模型依次回复，后者能看到前者的内容 ─────────────
        const conversationSoFar: AIMessage[] = [
          ...baseHistory,
          { role: "user", content: message },
        ];

        for (const agentId of agents) {
          const agent = AGENT_MAP.get(agentId);
          if (!agent) continue;

          const agentName = agent.name;

          // 构建 system prompt：告知当前角色和对话上下文
          const messages: AIMessage[] = [
            {
              role: "system",
              content: `你是 ${agentName}。这是一个多 AI 群聊场景，多个 AI 会依次发言。请基于前面的对话内容，用自己的角度补充或回应，自然衔接，不要重复前面已说的内容。`,
            },
            ...conversationSoFar,
          ];

          let isError = false;
          let fullContent = "";

          try {
            fullContent = await streamFromAgent(agent, messages, (chunk) => {
              send({ type: "chunk", agentId, chunk });
            });
            send({ type: "done", agentId });

            // 把当前 AI 的回复追加到上下文，供下一个 AI 参考
            conversationSoFar.push({
              role: "assistant",
              content: `[${agentName}]: ${fullContent}`,
            });
          } catch {
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
        }
      }

      send({ type: "finished" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}

