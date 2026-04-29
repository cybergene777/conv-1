// src/store/settingsStore.ts
// 持久化到 localStorage：用户偏好设置

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AgentId } from "@/types/ai";

interface SettingsStore {
  // 已选中的 AI 列表（持久化）
  selectedAgents: AgentId[];
  // 主题
  theme: "light" | "dark" | "system";

  // Actions
  toggleAgent: (agentId: AgentId, maxAgents: number) => void;
  setSelectedAgents: (agents: AgentId[]) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      selectedAgents: ["deepseek", "kimi"], // 默认选中前两个
      theme: "system",

      toggleAgent: (agentId, maxAgents) => {
        const current = get().selectedAgents;
        if (current.includes(agentId)) {
          // 至少保留一个
          if (current.length <= 1) return;
          set({ selectedAgents: current.filter((id) => id !== agentId) });
        } else {
          if (current.length >= maxAgents) return; // 已达上限
          set({ selectedAgents: [...current, agentId] });
        }
      },

      setSelectedAgents: (agents) => set({ selectedAgents: agents }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "conv1-settings", // localStorage key
    }
  )
);
