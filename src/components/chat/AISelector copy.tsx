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
    <div className="flex items-center gap-2 flex-wrap">
      {AI_AGENTS.map((agent) => {
        const isSelected = selectedAgents.includes(agent.id as AgentId);
        const isAtLimit = !isSelected && selectedAgents.length >= maxAgents;

        return (
          <button
            key={agent.id}
            disabled={disabled || isAtLimit}
            onClick={() => toggleAgent(agent.id as AgentId, maxAgents)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-200 select-none border shadow-sm"
            title={
              isAtLimit
                ? `免费版最多选 ${FREE_MAX_AGENTS} 个 AI`
                : isSelected
                ? `取消选择 ${agent.name}`
                : `选择 ${agent.name}`
            }
            style={{
              borderColor: isSelected ? agent.color : "var(--border)",
              background: isSelected ? `${agent.color}12` : "var(--bg-primary)",
              color: isSelected ? agent.color : "var(--text-secondary)",
              opacity: disabled || isAtLimit ? 0.45 : 1,
              cursor: disabled || isAtLimit ? "not-allowed" : "pointer",
              transform: isSelected ? "translateY(-1px)" : "none",
            }}
          >
            {/* 动态颜色圆点 */}
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-transform ${isSelected ? 'scale-110' : 'scale-100'}`}
              style={{ 
                background: agent.color,
                boxShadow: isSelected ? `0 0 8px ${agent.color}80` : "none" 
              }}
            />
            {agent.name}
          </button>
        );
      })}

      {!isPro && (
        <div 
          className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ml-1"
          style={{ 
            background: "var(--bg-hover)", 
            color: "var(--text-muted)",
            border: "1px dashed var(--border)"
          }}
        >
          {selectedAgents.length} / {FREE_MAX_AGENTS} SELECTED
        </div>
      )}
    </div>
  );
}