/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 1. 字体系统：接入 layout.tsx 中定义的 Google 字体变量
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"], // 用于功能性 UI 文字
        serif: ["var(--font-serif)", "Georgia", "serif"],    // 用于 Conv :: 1 品牌标识和正文内容
      },
      
      // 2. 颜色系统：同步 AI 品牌色[cite: 1]
      colors: {
        deepseek: "#4D6BFE",
        kimi:     "#FF6B35",
        qwen:     "#6B4FBB",
        doubao:   "#00B4D8",
        glm:      "#06D6A0",
      },

      // 3. 动画系统：微调节奏以符合极简、灵动的交互感[cite: 1]
      animation: {
        "fade-in":   "fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-up":  "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-dot": "pulseDot 1.5s infinite ease-in-out",
      },
      
      keyframes: {
        fadeIn: { 
          from: { opacity: "0" }, 
          to: { opacity: "1" } 
        },
        slideUp: { 
          from: { transform: "translateY(12px)", opacity: "0" }, 
          to: { transform: "translateY(0)", opacity: "1" } 
        },
        pulseDot: { 
          "0%, 80%, 100%": { transform: "scale(0.7)", opacity: "0.5" }, 
          "40%": { transform: "scale(1.1)", opacity: "1" } 
        },
      },

      // 4. 阴影系统：优化暗色模式下的视觉深度[cite: 1]
      boxShadow: {
        'soft-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'soft-md': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'brand': '0 0 15px var(--accent-subtle)',
      },
    },
  },
  plugins: [],
};