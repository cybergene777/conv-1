// src/app/page.tsx
// 落地页：品牌展示 + 核心卖点 + CTA
import Link from "next/link";

const AGENTS = [
  { id: "deepseek", name: "DeepSeek", color: "#4D6BFE", desc: "深度推理" },
  { id: "kimi",     name: "Kimi",     color: "#FF6B35", desc: "长文理解" },
  { id: "qwen",     name: "千问",     color: "#6B4FBB", desc: "中文专精" },
  { id: "doubao",   name: "豆包",     color: "#00B4D8", desc: "创意写作" },
  { id: "glm",      name: "GLM",      color: "#06D6A0", desc: "代码助手" },
];

const FEATURES = [
  {
    icon: "⚡",
    title: "并发提问",
    desc: "一次输入，同时向多个 AI 发问，节省你来回切换的时间。",
  },
  {
    icon: "⟷",
    title: "并排对比",
    desc: "多列气泡并排展示，差异一目了然，选出最优回答。",
  },
  {
    icon: "◷",
    title: "历史记录",
    desc: "所有对话自动保存，随时回溯，不丢失任何有价值的内容。",
  },
];

export default function HomePage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* ── 顶部导航 ── */}
      <nav
        className="flex items-center justify-between px-8 py-4 max-w-5xl mx-auto"
      >
        <div className="flex items-center gap-2 font-bold text-lg" style={{ color: "var(--accent)" }}>
          <span>⟨/⟩</span>
          <span>Conv:1</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pricing"
            className="text-sm transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            定价
          </Link>
          <Link
            href="/login"
            className="text-sm px-4 py-2 rounded-xl transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            登录
          </Link>
          <Link
            href="/register"
            className="text-sm px-4 py-2 rounded-xl font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            免费开始
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-3xl mx-auto px-8 pt-24 pb-20 text-center">
        {/* AI 颜色条 */}
        <div className="flex justify-center gap-2 mb-10">
          {AGENTS.map((a) => (
            <div
              key={a.id}
              className="flex flex-col items-center gap-2"
            >
              <div
                className="w-9 h-9 rounded-full"
                style={{
                  background: `${a.color}22`,
                  border: `2px solid ${a.color}`,
                  boxShadow: `0 0 16px ${a.color}44`,
                }}
              />
            </div>
          ))}
        </div>

        <h1
          className="text-5xl font-bold leading-tight mb-6"
          style={{ letterSpacing: "-0.02em" }}
        >
          一次提问，<br />
          <span style={{ color: "var(--accent)" }}>五个 AI</span> 同时回答
        </h1>
        <p
          className="text-lg mb-10 max-w-xl mx-auto"
          style={{ color: "var(--text-secondary)", lineHeight: 1.75 }}
        >
          向 DeepSeek、Kimi、千问、豆包、智谱 GLM 同时发问，
          并排对比不同 AI 的回答，找到最优解。
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/register"
            className="px-8 py-3.5 rounded-2xl font-semibold text-sm transition-all"
            style={{
              background: "var(--accent)",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(77,107,254,0.35)",
            }}
          >
            免费开始使用 →
          </Link>
          <Link
            href="/pricing"
            className="px-8 py-3.5 rounded-2xl text-sm font-medium transition-colors"
            style={{
              background: "var(--bg-secondary)",
              border: "1.5px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            查看定价
          </Link>
        </div>

        <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
          免费版每天 5 次 · 无需信用卡
        </p>
      </section>

      {/* ── 伪截图：多列气泡演示 ── */}
      <section className="max-w-5xl mx-auto px-8 mb-20">
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            border: "1.5px solid var(--border)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.08)",
          }}
        >
          {/* 窗口顶栏 */}
          <div
            className="flex items-center gap-1.5 px-4 py-3"
            style={{
              background: "var(--bg-sidebar)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <span key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
            ))}
            <span className="mx-auto text-xs" style={{ color: "var(--text-muted)" }}>
              Conv:1 — 什么是量子纠缠？
            </span>
          </div>

          {/* 对话区 mock */}
          <div
            className="p-8"
            style={{ background: "var(--bg-primary)" }}
          >
            {/* 用户消息 */}
            <div className="flex justify-end mb-6">
              <div
                className="px-4 py-3 rounded-2xl rounded-tr-sm text-sm max-w-xs"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                什么是量子纠缠？用简单的语言解释一下
              </div>
            </div>

            {/* 三列 AI 回复 */}
            <div className="grid grid-cols-3 gap-4">
              {AGENTS.slice(0, 3).map((agent) => (
                <div key={agent.id} className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: agent.color }} />
                    <span className="text-xs font-semibold" style={{ color: agent.color }}>
                      {agent.name}
                    </span>
                  </div>
                  <div
                    className="rounded-2xl px-4 py-3 text-xs leading-relaxed"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {agent.id === "deepseek" &&
                      "量子纠缠是两个粒子之间的特殊关联，无论相距多远，测量其中一个的状态，另一个的状态会瞬间确定。这并不传递信息，而是量子力学的内禀特性。"}
                    {agent.id === "kimi" &&
                      "想象一副手套被分开，你打开其中一只发现是左手的，那另一只一定是右手的——不管它在火星上。量子纠缠类似，但更奇妙的是，手套在你"看"之前没有确定的状态。"}
                    {agent.id === "qwen" &&
                      "量子纠缠指两个粒子在量子态上产生关联。一旦纠缠，对其中一个粒子的测量会影响另一个粒子的量子态，不受空间距离限制，爱因斯坦称之为"鬼魅般的超距作用"。"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 特性 ── */}
      <section className="max-w-4xl mx-auto px-8 mb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-6"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="text-2xl mb-4 w-10 h-10 flex items-center justify-center rounded-xl"
                style={{ background: "var(--bg-hover)" }}
              >
                {f.icon}
              </div>
              <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI 阵容 ── */}
      <section className="max-w-4xl mx-auto px-8 mb-24 text-center">
        <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          覆盖主流中文 AI
        </h2>
        <p className="text-sm mb-10" style={{ color: "var(--text-muted)" }}>
          持续接入更多模型，保持与 AI 前沿同步
        </p>
        <div className="flex justify-center gap-6 flex-wrap">
          {AGENTS.map((a) => (
            <div key={a.id} className="flex flex-col items-center gap-2">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold"
                style={{
                  background: `${a.color}18`,
                  border: `1.5px solid ${a.color}44`,
                  color: a.color,
                }}
              >
                {a.name[0]}
              </div>
              <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                {a.name}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {a.desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 底部 CTA ── */}
      <section
        className="text-center py-20 px-8"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
          现在就开始对比
        </h2>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          注册即用，每天 5 次免费
        </p>
        <Link
          href="/register"
          className="inline-block px-10 py-4 rounded-2xl font-semibold text-sm"
          style={{ background: "var(--accent)", color: "#fff", boxShadow: "0 4px 16px rgba(77,107,254,0.35)" }}
        >
          免费注册 →
        </Link>
      </section>

      {/* Footer */}
      <footer
        className="text-center py-6 text-xs"
        style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}
      >
        © 2025 Conv:1 · 多 AI 对比助手
      </footer>
    </div>
  );
}
