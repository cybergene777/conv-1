// src/components/chat/ModelSelector.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { AI_AGENTS, FREE_MAX_AGENTS } from "@/lib/ai-agents";
import { useSettingsStore } from "@/store/settingsStore";
import { AgentId } from "@/types/ai";

interface ModelSelectorProps {
  isPro?: boolean;
  disabled?: boolean;
  onClose?: () => void;
  direction?: "up" | "down";  // 弹出方向，默认向上
}

/**
 * ModelSelector - 模型选择卡片组件
 * 
 * 功能：
 * - 展示所有可用的 AI 模型
 * - 支持多选，遵守免费版/Pro版 限制
 * - 实时更新 settingsStore 中的选中模型
 * - 点击外部自动关闭
 */
export default function ModelSelector({
  isPro = false,
  disabled = false,
  onClose,
  direction = "up",
}: ModelSelectorProps) {
  const { selectedAgents, toggleAgent } = useSettingsStore();
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const maxAgents = isPro ? AI_AGENTS.length : FREE_MAX_AGENTS;
  const isAtLimit = selectedAgents.length >= maxAgents;

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: direction === "down" ? "calc(100% + 8px)" : "auto",
        bottom: direction === "up" ? "calc(100% + 8px)" : "auto",
        right: 0,
        marginTop: 0,
        width: 320,
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        zIndex: 200,
        overflow: "hidden",
        animation: "fadeSlideDown 0.15s ease-out",
      }}
    >
      <style>{`
        @keyframes fadeSlideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          选择 AI 模型
        </h3>
        <span
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            background: "var(--bg-hover)",
            padding: "2px 8px",
            borderRadius: 6,
          }}
        >
          {selectedAgents.length}/{maxAgents}
        </span>
      </div>

      {/* Models Grid */}
      <div
        style={{
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxHeight: "320px",
          overflowY: "auto",
        }}
      >
        {AI_AGENTS.map((agent) => {
          const isSelected = selectedAgents.includes(agent.id as AgentId);
          const isThisAtLimit = !isSelected && selectedAgents.length >= maxAgents;

          return (
            <button
              key={agent.id}
              onClick={() => {
                if (!disabled && !isThisAtLimit) {
                  toggleAgent(agent.id as AgentId, maxAgents);
                }
              }}
              disabled={disabled || isThisAtLimit}
              onMouseEnter={() => setHoveredAgent(agent.id)}
              onMouseLeave={() => setHoveredAgent(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 8,
                border: `1.5px solid ${
                  isSelected
                    ? agent.color
                    : hoveredAgent === agent.id
                    ? "var(--border)"
                    : "transparent"
                }`,
                background:
                  isSelected
                    ? `${agent.color}12`
                    : hoveredAgent === agent.id
                    ? "var(--bg-hover)"
                    : "transparent",
                cursor: disabled || isThisAtLimit ? "not-allowed" : "pointer",
                transition: "all 0.12s ease",
                opacity: disabled || isThisAtLimit ? 0.5 : 1,
                textAlign: "left",
                position: "relative",
              }}
            >
              {/* Checkbox */}
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  border: `2px solid ${isSelected ? agent.color : "var(--border)"}`,
                  background: isSelected ? agent.color : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.12s ease",
                }}
              >
                {isSelected && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>

              {/* Avatar */}
              <img
                src={`/ai-avatars/${agent.avatar}`}
                alt={agent.name}
                width={24}
                height={24}
                style={{
                  borderRadius: 4,
                  flexShrink: 0,
                  opacity: disabled || isThisAtLimit ? 0.6 : 1,
                }}
              />

              {/* Name & Model */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? agent.color : "var(--text-primary)",
                    marginBottom: 2,
                  }}
                >
                  {agent.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {agent.model}
                </div>
              </div>

              {/* Selected badge */}
              {isSelected && (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: agent.color,
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer info */}
      <div
        style={{
          padding: "8px 16px",
          borderTop: "1px solid var(--border)",
          fontSize: 11,
          color: "var(--text-muted)",
          lineHeight: "1.6",
        }}
      >
        {!isPro && (
          <p style={{ margin: 0 }}>
            💡 免费版最多选择 {FREE_MAX_AGENTS} 个模型
          </p>
        )}
        {isAtLimit && (
          <p style={{ margin: 0, color: "var(--accent)" }}>
            已达选择限制，取消选择后可添加新模型
          </p>
        )}
      </div>
    </div>
  );
}
