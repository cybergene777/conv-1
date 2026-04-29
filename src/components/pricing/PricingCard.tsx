// src/components/pricing/PricingCard.tsx
"use client";

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  name: string;
  price: string;
  priceNote?: string;
  description: string;
  features: PricingFeature[];
  ctaLabel: string;
  onCta: () => void;
  highlighted?: boolean;
  loading?: boolean;
  badge?: string;
}

export default function PricingCard({
  name,
  price,
  priceNote,
  description,
  features,
  ctaLabel,
  onCta,
  highlighted = false,
  loading = false,
  badge,
}: PricingCardProps) {
  return (
    <div
      className="relative flex flex-col rounded-2xl p-8 transition-all"
      style={{
        background: highlighted ? "var(--accent)" : "var(--bg-primary)",
        border: highlighted
          ? "2px solid var(--accent)"
          : "1.5px solid var(--border)",
        boxShadow: highlighted ? "0 8px 32px rgba(77,107,254,0.25)" : "var(--shadow-sm)",
        color: highlighted ? "#fff" : "var(--text-primary)",
      }}
    >
      {/* 徽章 */}
      {badge && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full"
          style={{
            background: highlighted ? "#fff" : "var(--accent)",
            color: highlighted ? "var(--accent)" : "#fff",
          }}
        >
          {badge}
        </span>
      )}

      {/* 计划名 */}
      <p
        className="text-sm font-semibold uppercase tracking-widest mb-4"
        style={{ color: highlighted ? "rgba(255,255,255,0.75)" : "var(--text-muted)" }}
      >
        {name}
      </p>

      {/* 价格 */}
      <div className="mb-2">
        <span className="text-4xl font-bold">{price}</span>
        {priceNote && (
          <span
            className="text-sm ml-1.5"
            style={{ color: highlighted ? "rgba(255,255,255,0.65)" : "var(--text-muted)" }}
          >
            {priceNote}
          </span>
        )}
      </div>

      <p
        className="text-sm mb-8"
        style={{ color: highlighted ? "rgba(255,255,255,0.75)" : "var(--text-secondary)" }}
      >
        {description}
      </p>

      {/* 功能列表 */}
      <ul className="space-y-3 flex-1 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span
              className="mt-0.5 flex-shrink-0"
              style={{
                color: f.included
                  ? highlighted
                    ? "#fff"
                    : "var(--accent)"
                  : highlighted
                  ? "rgba(255,255,255,0.35)"
                  : "var(--text-muted)",
              }}
            >
              {f.included ? "✓" : "–"}
            </span>
            <span
              style={{
                color: f.included
                  ? highlighted
                    ? "#fff"
                    : "var(--text-primary)"
                  : highlighted
                  ? "rgba(255,255,255,0.4)"
                  : "var(--text-muted)",
              }}
            >
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA 按钮 */}
      <button
        onClick={onCta}
        disabled={loading}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: highlighted ? "#fff" : "var(--accent)",
          color: highlighted ? "var(--accent)" : "#fff",
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "处理中…" : ctaLabel}
      </button>
    </div>
  );
}
