import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pct(n: number, digits = 0): string {
  return `${n.toFixed(digits)}%`;
}

export function fmtInt(n: number): string {
  return new Intl.NumberFormat("en-PK").format(Math.round(n));
}

export function fmtPKR(n: number): string {
  if (n >= 1_000_000) return `Rs ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Rs ${Math.round(n / 1_000)}k`;
  return `Rs ${n}`;
}

export function initials(name: string): string {
  return name
    .replace(/^(Ms\.|Mr\.|Mrs\.|Dr\.|Qari|Hafiz|Ustadh)\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
