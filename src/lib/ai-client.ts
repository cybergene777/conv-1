// src/lib/ai-client.ts
// 统一 AI 调用层：使用回调模式避免双层 ReadableStream 的 backpressure 串行问题

import { AIAgent } from "@/types/ai";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const AI_TIMEOUT_MS = 30_000;

/**
 * 以回调方式流式读取单个 AI 的响应。
 * 不再返回 ReadableStream，而是直接在内部消费 response.body，
 * 并通过 onChunk / onDone 通知调用者，彻底消除中间层 backpressure。
 */
export async function streamFromAgent(
  agent: AIAgent,
  messages: AIMessage[],
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const apiKey = process.env[agent.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`Missing API key for agent: ${agent.id} (env: ${agent.apiKeyEnv})`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  // 如果外部传入 signal，联动取消
  signal?.addEventListener("abort", () => controller.abort());

  const response = await fetch(`${agent.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: agent.model,
      messages,
      stream: true,
      max_tokens: 2048,
      temperature: agent.id === "kimi" ? 1 : 0.7,
      // kimi-k2.5 默认开启思考模式，思考阶段 content 为 null 导致流式解析异常
      // 对话场景关闭即可，如需思考能力请改用 kimi-k2-thinking 模型
      ...agent.extraBody, 
    }),
    signal: controller.signal,
  });

  clearTimeout(timer);

  // 临时调试：打印 kimi 响应状态
  // if (agent.id === "kimi") {
  //   console.log("[kimi status]", response.status, response.ok);
  // }

  if (!response.ok) {
    const errText = await response.text();
    // 临时调试：打印完整错误
    // console.log(`[${agent.id} error body]`, errText);
    throw new Error(`${agent.id} API error ${response.status}: ${errText}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let leftover = "";
  let fullContent = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunkStr = leftover + decoder.decode(value, { stream: true });
      const lines = chunkStr.split("\n");
      leftover = lines.pop() ?? "";

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

        const data = trimmedLine.slice(6).trim();
        if (data === "[DONE]") break;

        try {
          const json = JSON.parse(data);
          // 临时调试：打印 kimi 返回的原始结构
          // if (agent.id === "kimi") {
          //  console.log("[kimi raw]", JSON.stringify(json.choices?.[0]?.delta));
          // }

          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            fullContent += content;
            onChunk(content);
          }
        } catch (e) {
          console.error(`JSON Parse Error from ${agent.id}:`, data);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullContent;
}
