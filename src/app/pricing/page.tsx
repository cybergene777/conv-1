// src/app/pricing/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PricingCard from "@/components/pricing/PricingCard";

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? match[1] : null;
}

const FREE_FEATURES = [
  { text: "每天 5 次提问", included: true },
  { text: "同时对比 2 个 AI", included: true },
  { text: "DeepSeek · Kimi · 千问 · 豆包 · GLM", included: true },
  { text: "历史记录保留 7 天", included: true },
  { text: "无限次提问", included: false },
  { text: "同时对比全部 5 个 AI", included: false },
  { text: "历史记录永久保留", included: false },
];

const PRO_FEATURES = [
  { text: "无限次提问", included: true },
  { text: "同时对比全部 5 个 AI", included: true },
  { text: "DeepSeek · Kimi · 千问 · 豆包 · GLM", included: true },
  { text: "历史记录永久保留", included: true },
  { text: "优先访问新模型", included: true },
  { text: "专属客服支持", included: true },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpgrade() {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "创建订单失败");
        return;
      }
      // 跳转到支付页
      window.location.href = data.data.payUrl;
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen py-16 px-4"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* 顶部导航 */}
      <div className="max-w-3xl mx-auto mb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold"
          style={{ color: "var(--accent)" }}
        >
          <span>⟨/⟩</span>
          <span>Conv:1</span>
        </Link>
      </div>

      {/* 标题 */}
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          简单透明的定价
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          免费体验，满意再升级
        </p>
      </div>

      {/* 卡片 */}
      <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
        <PricingCard
          name="免费版"
          price="¥0"
          priceNote="永久免费"
          description="适合轻度用户，每天免费对比体验"
          features={FREE_FEATURES}
          ctaLabel="开始使用"
          onCta={() => router.push("/chat")}
        />
        <PricingCard
          name="Pro"
          price="¥19"
          priceNote="/ 月"
          description="无限对比，释放 AI 全部潜力"
          features={PRO_FEATURES}
          ctaLabel="立即升级"
          onCta={handleUpgrade}
          highlighted
          loading={loading}
          badge="推荐"
        />
      </div>

      {error && (
        <p className="max-w-3xl mx-auto mt-6 text-center text-sm" style={{ color: "#dc2626" }}>
          {error}
        </p>
      )}

      {/* FAQ 简版 */}
      <div className="max-w-xl mx-auto mt-16 space-y-5">
        {[
          { q: "支付后立即生效吗？", a: "是的，支付成功后账户实时升级，无需等待。" },
          { q: "可以随时取消吗？", a: "当前为一次性购买月度套餐，到期不续费自动降回免费版。" },
          { q: "支持哪些支付方式？", a: "支持微信支付和支付宝，无需绑定信用卡。" },
        ].map(({ q, a }) => (
          <div key={q} className="rounded-xl px-5 py-4" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>{q}</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
