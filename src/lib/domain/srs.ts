/**
 * Spaced repetition for Hifz units. SM-2 adapted to memorisation blocks:
 * a recitation score (0-100) maps to a quality grade; secure units drift out
 * to long manzil intervals, lapses pull them back to daily sabqi.
 */
import type { HifzUnit, HifzUnitKind } from "./types";

const MIN_EASE = 1.3;
const MAX_EASE = 2.8;

export function qualityFromScore(score: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (score >= 100) return 5;
  if (score >= 95) return 4;
  if (score >= 85) return 3;
  if (score >= 70) return 2;
  if (score >= 50) return 1;
  return 0;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function reviewUnit(unit: HifzUnit, score: number, today: string): HifzUnit {
  const q = qualityFromScore(score);
  let { ease, intervalDays, reviews, lapses } = unit;

  if (q < 3) {
    lapses += 1;
    intervalDays = 1;
    ease = Math.max(MIN_EASE, ease - 0.2);
  } else {
    if (reviews === 0) intervalDays = 1;
    else if (reviews === 1) intervalDays = 3;
    else intervalDays = Math.round(intervalDays * ease);
    ease = Math.min(MAX_EASE, Math.max(MIN_EASE, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))));
  }
  reviews += 1;

  const status: HifzUnit["status"] =
    q < 3 ? "weak" : intervalDays >= 21 ? "secure" : "learning";

  return { ...unit, ease, intervalDays, reviews, lapses, lastScore: score, dueDate: addDays(today, intervalDays), status };
}

export function classifyUnit(unit: HifzUnit, today: string): HifzUnitKind {
  if (unit.reviews === 0) return "sabaq";
  if (unit.intervalDays <= 7) return "sabqi";
  return "manzil";
}

export function dueUnits(units: HifzUnit[], today: string): HifzUnit[] {
  return units.filter((u) => u.dueDate <= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function todaysQueue(units: HifzUnit[], today: string, manzilCap = 3) {
  const due = dueUnits(units, today);
  const sabaq = due.filter((u) => classifyUnit(u, today) === "sabaq");
  const sabqi = due.filter((u) => classifyUnit(u, today) === "sabqi");
  const manzil = due.filter((u) => classifyUnit(u, today) === "manzil").slice(0, manzilCap);
  return { sabaq, sabqi, manzil, overdueManzil: Math.max(0, due.filter((u) => classifyUnit(u, today) === "manzil").length - manzilCap) };
}

/** Probability the unit is still retained today, from a simple forgetting curve. */
export function retention(unit: HifzUnit, today: string): number {
  if (unit.reviews === 0) return 0;
  const elapsed = Math.max(0, (Date.parse(today) - Date.parse(unit.dueDate)) / 86_400_000 + unit.intervalDays);
  const stability = Math.max(1, unit.intervalDays * unit.ease);
  return Math.exp(-elapsed / (stability * 1.5));
}
