// src/app/layout.tsx
// 根布局：注入全局字体、CSS 变量、主题类

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// 使用本地字体文件，避免构建时请求 Google Fonts
// path 相对于此文件（src/app/layout.tsx），向上两级到项目根再进 public/fonts
const inter = localFont({
  src: [
    { path: "../../public/fonts/Inter-Regular.woff2",  weight: "400", style: "normal" },
    { path: "../../public/fonts/Inter-Medium.woff2",   weight: "500", style: "normal" },
    { path: "../../public/fonts/Inter-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/Inter-Bold.woff2",     weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const sourceSerif = localFont({
  src: [
    { path: "../../public/fonts/SourceSerif4-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/SourceSerif4-Bold.woff2",    weight: "700", style: "normal" },
  ],
  variable: "--font-serif",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export const metadata: Metadata = {
  title: "Conv :: 1 — 多 AI 对比助手",
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
      <body className={`${inter.variable} ${sourceSerif.variable} font-serif antialiased`}>
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