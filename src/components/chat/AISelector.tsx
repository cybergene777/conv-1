// src/components/chat/AISelector.tsx
"use client";

import Image from "next/image";
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
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all select-none"
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
            {/* 修改5: 官方 SVG 图标 */}
            <img
              src={`/ai-avatars/${agent.avatar}`}
              alt={agent.name}
              width={14}
              height={14}
              style={{ borderRadius: 3, flexShrink: 0 }}
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
