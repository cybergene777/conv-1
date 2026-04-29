// src/lib/utils.ts

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind className 合并工具 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 生成简单的 cuid-like ID（客户端用，不依赖 crypto） */
export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** 截断过长文本用于 Thread 标题自动生成 */
export function truncate(str: string, max = 30): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

/** 格式化时间：今天显示时间，其他显示日期 */
export function formatTime(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

/** 统一的 API 响应格式 */
export function ok<T>(data: T) {
  return Response.json({ success: true, data });
}

export function err(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}
