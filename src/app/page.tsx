// src/app/page.tsx
"use client"
import Link from "next/link";

const AGENTS = [
  { id: "deepseek", name: "DeepSeek", color: "#6366f1", desc: "深度推理" },
  { id: "kimi",     name: "Kimi",     color: "#ec4899", desc: "长文理解" },
  { id: "qwen",     name: "千问",     color: "#8b5cf6", desc: "中文专精" },
  { id: "doubao",   name: "豆包",     color: "#06b6d4", desc: "创意写作" },
  { id: "glm",      name: "GLM",      color: "#10b981", desc: "代码助手" },
];

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: "并发提问",
    desc: "一次输入，同时向多个 AI 发问，节省来回切换的时间。",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/>
      </svg>
    ),
    title: "并排对比",
    desc: "多列气泡并排展示，差异一目了然，选出最优回答。",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: "历史记录",
    desc: "所有对话自动保存，随时回溯，不丢失任何有价值的内容。",
  },
];

const MOCK_REPLIES = [
  { agent: AGENTS[0], text: "量子纠缠是两个粒子之间的特殊关联，无论相距多远，测量一个，另一个状态瞬间确定。" },
  { agent: AGENTS[2], text: "想象一副手套被分开，你打开一只发现是左手，那另一只一定是右手——不管它在哪里。" },
  { agent: AGENTS[4], text: "两个粒子在量子态上产生关联，对其中一个的测量会影响另一个，爱因斯坦称之为「鬼魅般的超距作用」。" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>

      {/* ── 导航 ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 max-w-6xl mx-auto"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-primary)" }}>
        <div className="flex items-center gap-2 font-semibold text-base tracking-tight" style={{ color: "var(--text-primary)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--accent)", color: "#fff" }}>C1</div>
          <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 700 }}>Conv <span style={{ fontWeight: 300, opacity: 0.4 }}>::</span> 1</span>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/pricing" className="text-sm px-4 py-2 rounded-lg transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e: any) => e.currentTarget.style.background = "var(--bg-hover)"}
            onMouseLeave={(e: any) => e.currentTarget.style.background = "transparent"}>
            定价
          </Link>
          <Link href="/login" className="text-sm px-4 py-2 rounded-lg transition-colors"
            style={{ color: "var(--text-secondary)" }}>
            登录
          </Link>
          <Link href="/register" className="text-sm px-4 py-2 rounded-lg font-medium transition-all"
            style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}>
            免费开始
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-8 pt-28 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8"
          style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid var(--accent)22" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
          5 个主流中文 AI，同时在线
        </div>

        <h1 className="text-6xl font-semibold leading-[1.1] mb-6 tracking-tight">
          一次提问<br />
          <span style={{ color: "var(--accent)" }}>五个 AI</span> 同时回答
        </h1>

        <p className="text-lg mb-10 max-w-lg mx-auto" style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>
          向 DeepSeek、Kimi、千问、豆包、智谱 GLM 同时发问，<br />并排对比回答，找到最优解。
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link href="/register" className="px-7 py-3 rounded-xl font-medium text-sm transition-all"
            style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}>
            免费开始使用
          </Link>
          <Link href="/pricing" className="px-7 py-3 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            查看定价
          </Link>
        </div>

        <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
          免费版每天 5 次 · 无需信用卡
        </p>
      </section>

      {/* ── 产品演示 ── */}
      <section className="max-w-5xl mx-auto px-8 mb-28">
        <div className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--border)", background: "var(--bg-card)", boxShadow: "var(--shadow-lg)" }}>
          {/* 窗口顶栏 */}
          <div className="flex items-center gap-2 px-4 py-3"
            style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
            <div className="flex gap-1.5">
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <span className="mx-auto text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Conv :: 1 — 什么是量子纠缠？
            </span>
            <div className="w-12" />
          </div>

          <div className="p-8" style={{ background: "var(--bg-primary)" }}>
            {/* 用户消息 */}
            <div className="flex justify-end mb-8">
              <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm max-w-xs"
                style={{ background: "var(--bubble-user-bg)", color: "var(--bubble-user-fg)" }}>
                什么是量子纠缠？用简单的语言解释一下
              </div>
            </div>

            {/* 三列 AI 回复 */}
            <div className="grid grid-cols-3 gap-4">
              {MOCK_REPLIES.map(({ agent, text }) => (
                <div key={agent.id} className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <img src={`/ai-avatars/${agent.id}.svg`} alt={agent.name} width={20} height={20} style={{ borderRadius: 5 }} />
                    <span className="text-xs font-semibold" style={{ color: agent.color }}>
                      {agent.name}
                    </span>
                  </div>
                  <div className="rounded-xl px-3.5 py-3 text-xs leading-relaxed"
                    style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                    {text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 特性 ── */}
      <section className="max-w-4xl mx-auto px-8 mb-28">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold tracking-tight mb-3">为什么选择 Conv:1</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>为 AI 重度用户设计</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl p-6 transition-colors"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                style={{ background: "var(--bg-hover)", color: "var(--accent)" }}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-sm mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI 阵容 ── */}
      <section className="max-w-4xl mx-auto px-8 mb-28 text-center">
        <h2 className="text-3xl font-semibold tracking-tight mb-3">覆盖主流中文 AI</h2>
        <p className="text-sm mb-12" style={{ color: "var(--text-muted)" }}>持续接入更多模型，保持与前沿同步</p>
        <div className="flex justify-center gap-8 flex-wrap">
          {AGENTS.map((a) => (
            <div key={a.id} className="flex flex-col items-center gap-2.5">
              <img src={`/ai-avatars/${a.id}.svg`} alt={a.name} width={48} height={48} style={{ borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} />
              <span className="text-xs font-medium">{a.name}</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{a.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 底部 CTA ── */}
      <section className="max-w-2xl mx-auto px-8 mb-20 text-center">
        <div className="rounded-2xl p-12"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <h2 className="text-3xl font-semibold tracking-tight mb-3">现在就开始对比</h2>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>注册即用，每天 5 次免费</p>
          <Link href="/register" className="inline-block px-8 py-3 rounded-xl font-medium text-sm transition-all"
            style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}>
            免费注册
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-xs" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>
        © 2025 Conv :: 1 · 多 AI 对比助手
      </footer>
    </div>
  );
}
