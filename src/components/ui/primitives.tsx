import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Small, composable primitives. Feature components use only these.    */
/* ------------------------------------------------------------------ */

export type Tone = "accent" | "gold" | "ok" | "warn" | "danger" | "info" | "neutral";

const tileClass: Record<Tone, string> = {
  accent: "tile-accent",
  gold: "tile-gold",
  ok: "tile-ok",
  warn: "tile-warn",
  danger: "tile-danger",
  info: "tile-info",
  neutral: "tile-neutral",
};

const chipClass: Record<Tone, string> = {
  accent: "chip-accent",
  gold: "chip-gold",
  ok: "chip-ok",
  warn: "chip-warn",
  danger: "chip-danger",
  info: "chip-info",
  neutral: "chip-neutral",
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow mb-1.5">{eyebrow}</p> : null}
        <h1 className="text-2xl font-medium tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 max-w-prose text-sm text-ink-2">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionTitle({ title, hint, action }: { title: ReactNode; hint?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {hint ? <p className="text-xs text-ink-3">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className, hover }: { children: ReactNode; className?: string; hover?: boolean }) {
  return <div className={cn("card p-5", hover && "card-hover", className)}>{children}</div>;
}

export function Stat({
  label,
  value,
  trend,
  tone = "neutral",
  icon,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  trend?: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card flex items-center gap-4 p-5", className)}>
      {icon ? <span className={tileClass[tone]}>{icon}</span> : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-ink-3">{label}</p>
        <p className="num mt-1 text-2xl font-semibold leading-none tracking-tight text-ink">{value}</p>
        {trend ? <p className="mt-1.5 text-xs text-ink-3">{trend}</p> : null}
      </div>
    </div>
  );
}

export function Chip({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn(chipClass[tone], className)}>{children}</span>;
}

export function Tile({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn(tileClass[tone], className)}>{children}</span>;
}

export function Trend({ value, suffix = "pp", invert = false }: { value: number; suffix?: string; invert?: boolean }) {
  const good = invert ? value < 0 : value > 0;
  const tone = value === 0 ? "text-ink-3" : good ? "text-ok" : "text-danger";
  const sign = value > 0 ? "+" : "";
  return (
    <span className={cn("num font-medium", tone)}>
      {sign}
      {value}
      {suffix}
    </span>
  );
}

export function Progress({ value, tone = "accent", className }: { value: number; tone?: Tone; className?: string }) {
  const bar: Record<Tone, string> = {
    accent: "bg-accent",
    gold: "bg-gold",
    ok: "bg-ok",
    warn: "bg-warn",
    danger: "bg-danger",
    info: "bg-info",
    neutral: "bg-ink-3",
  };
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", bar[tone])} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: ReactNode; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card-quiet flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {body ? <p className="max-w-sm text-xs text-ink-3">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Avatar({ name, tone = "accent", size = "md" }: { name: string; tone?: Tone; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .replace(/^(Ms\.|Mr\.|Mrs\.|Dr\.|Qari|Hafiz|Ustadh)\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const sz = size === "sm" ? "h-7 w-7 text-2xs" : size === "lg" ? "h-12 w-12 text-sm" : "h-9 w-9 text-xs";
  return <span className={cn(tileClass[tone], "rounded-full font-semibold", sz)}>{initials}</span>;
}

export function LinkButton({ href, children, variant = "primary", className }: { href: string; children: ReactNode; variant?: "primary" | "soft" | "ghost" | "outline" | "gold"; className?: string }) {
  const v = { primary: "btn-primary", soft: "btn-soft", ghost: "btn-ghost", outline: "btn-outline", gold: "btn-gold" }[variant];
  return (
    <Link href={href} className={cn(v, className)}>
      {children}
    </Link>
  );
}

export function KeyValue({ items }: { items: { k: ReactNode; v: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      {items.map((it, i) => (
        <div key={i} className="contents">
          <dt className="text-ink-3">{it.k}</dt>
          <dd className="num text-right font-medium text-ink">{it.v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function HeatCell({ value, label, size = "md" }: { value: number | null; label?: string; size?: "sm" | "md" }) {
  // value 0..100 mapped to accent alpha; null = not started
  const cls =
    value === null
      ? "bg-surface-3"
      : value >= 85
        ? "bg-accent"
        : value >= 70
          ? "bg-accent/70"
          : value >= 50
            ? "bg-warn/70"
            : "bg-danger/70";
  return <div title={label} className={cn("rounded-[4px]", cls, size === "sm" ? "h-3 w-3" : "h-5 w-5")} />;
}

export function AiPill({ live }: { live: boolean }) {
  return (
    <span className={cn("chip", live ? "chip-ok" : "chip-neutral")} title={live ? "Gemini is configured; individual requests may fall back" : "Scripted responses; live AI is disabled or not configured"}>
      <span className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-ok" : "bg-ink-3")} />
      AI {live ? "configured" : "scripted"}
    </span>
  );
}
