// src/components/chat/AISelector.tsx
// AI 选择器：显示所有可用 AI，点击切换选中状态
"use client";

import { AI_AGENTS, FREE_MAX_AGENTS } from "@/lib/ai-agents";
import { useSettingsStore } from "@/store/settingsStore";
import { AgentId } from "@/types/ai";

interface AISelectorProps {
  isPro?: boolean;
  disabled?: boolean;
}

export default function AISelector({ isPro = false, disabled = false }: AISelectorProps) {
  const { selectedAgents, toggleAgent } = useSettingsStore();
  const maxAgents = isPro ? AI_AGENTS.length : FREE_MAX_AGENTS;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {AI_AGENTS.map((agent) => {
        const isSelected = selectedAgents.includes(agent.id as AgentId);
        const isAtLimit = !isSelected && selectedAgents.length >= maxAgents;

        return (
          <button
            key={agent.id}
            disabled={disabled || isAtLimit}
            onClick={() => toggleAgent(agent.id as AgentId, maxAgents)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all select-none"
            title={
              isAtLimit
                ? `免费版最多选 ${FREE_MAX_AGENTS} 个 AI`
                : isSelected
                ? `取消选择 ${agent.name}`
                : `选择 ${agent.name}`
            }
            style={{
              border: `1.5px solid ${isSelected ? agent.color : "var(--border)"}`,
              background: isSelected ? `${agent.color}18` : "transparent",
              color: isSelected ? agent.color : "var(--text-muted)",
              opacity: disabled || isAtLimit ? 0.4 : 1,
              cursor: disabled || isAtLimit ? "not-allowed" : "pointer",
              transform: isSelected ? "scale(1)" : "scale(0.97)",
            }}
          >
            {/* 颜色圆点 */}
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: isSelected ? agent.color : "var(--border)" }}
            />
            {agent.name}
          </button>
        );
      })}

      {!isPro && (
        <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>
          已选 {selectedAgents.length}/{FREE_MAX_AGENTS}
        </span>
      )}
    </div>
  );
}
