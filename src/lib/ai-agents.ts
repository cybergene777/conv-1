// src/lib/ai-agents.ts
// AI 配置表：新增模型只需在此添加一条记录

import { AIAgent, AgentId } from "@/types/ai";

export const AI_AGENTS: AIAgent[] = [
  {
    id: "deepseek",
    name: "DeepSeek",
    baseURL: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    color: "#4D6BFE",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    avatar: "deepseek.png",
  },
  {
    id: "kimi",
    name: "Kimi",
    baseURL: "https://api.moonshot.cn/v1",
    model: "kimi-k2.5",
    color: "#FF6B35",
    apiKeyEnv: "KIMI_API_KEY",
    avatar: "kimi.png",
    extraBody: {
      enable_thinking: false,
      //tools: [{ type: "web_search" }],
    },
  },
  {
    id: "qwen",
    name: "千问",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    color: "#6B4FBB",
    apiKeyEnv: "QWEN_API_KEY",
    avatar: "qwen.png",
    extraBody: {
      enable_search: true,
    },
  },
  {
    id: "doubao",
    name: "豆包",
    // 豆包使用 ARK 网关，model 需填写 Endpoint ID
    baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    model: process.env.DOUBAO_ENDPOINT_ID ?? "doubao-pro-4k",
    color: "#00B4D8",
    apiKeyEnv: "DOUBAO_API_KEY",
    avatar: "doubao.png",
  },
  {
    id: "glm",
    name: "智谱 GLM",
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4-flash",
    color: "#06D6A0",
    apiKeyEnv: "GLM_API_KEY",
    avatar: "glm.png",
  },
];

export const AGENT_MAP = new Map<AgentId, AIAgent>(
  AI_AGENTS.map((a) => [a.id as AgentId, a])
);

// 免费版最多可选 AI 数量
export const FREE_MAX_AGENTS = 2;
