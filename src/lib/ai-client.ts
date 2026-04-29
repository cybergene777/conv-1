// src/lib/ai-client.ts
// 统一 AI 调用层：所有模型走 OpenAI 兼容接口，只换 baseURL + apiKey

import { AIAgent } from "@/types/ai";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const AI_TIMEOUT_MS = 30_000; // 30 秒超时，防止某个模型挂死阻塞

/**
 * 向单个 AI 发起流式请求，返回 ReadableStream<string>（chunk 文本）
 * 调用方负责消费流并处理错误
 */
export async function streamFromAgent(
  agent: AIAgent,
  messages: AIMessage[]
): Promise<ReadableStream<string>> {
  const apiKey = process.env[agent.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`Missing API key for agent: ${agent.id} (env: ${agent.apiKeyEnv})`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

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
      temperature: 0.7,
    }),
    signal: controller.signal,
  });

  clearTimeout(timer);

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`${agent.id} API error ${response.status}: ${err}`);
  }

  // 将 SSE 原始流转换为文本 chunk 流
  return new ReadableStream<string>({
    async start(streamController) {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const lines = decoder.decode(value, { stream: true }).split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;

            try {
              const json = JSON.parse(data);
              const chunk = json.choices?.[0]?.delta?.content;
              if (chunk) streamController.enqueue(chunk);
            } catch {
              // 忽略无法解析的行
            }
          }
        }
      } finally {
        streamController.close();
        reader.releaseLock();
      }
    },
  });
}
