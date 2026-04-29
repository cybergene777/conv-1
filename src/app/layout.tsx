// src/app/layout.tsx
// 根布局：注入全局字体、CSS 变量、主题类

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conv:1 — 多 AI 对比助手",
  description: "同时向 DeepSeek、Kimi、千问、豆包、智谱 GLM 提问，对比不同 AI 的回答",
  keywords: ["AI", "对比", "DeepSeek", "Kimi", "千问", "豆包", "GLM"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {/* 主题脚本：在 hydration 前同步读取 localStorage，避免闪白 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem("conv1-settings");
                const theme = t ? JSON.parse(t)?.state?.theme : "system";
                const dark =
                  theme === "dark" ||
                  (theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
                if (dark) document.documentElement.classList.add("dark");
              } catch {}
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
