/**
 * Pure derivations over Hifz mock state for the pages: heat grid cells,
 * headline stats, chip tones. No IO, no React.
 */
import type { HifzPlan, HifzUnit, HifzUnitKind } from "@/lib/domain/types";
import type { Tone } from "@/components/ui/primitives";
import { retention } from "@/lib/domain/srs";
import { ayahLabel, surahMeta } from "@/lib/quran";

export const JUZ_COUNT = 30;
export const RETENTION_WARN = 0.6;
/** Demo-only: consecutive days with a home recitation; production reads the log. */
export const STREAK_DAYS = 12;
const LEARNING_JUZ_FILL = 45;

export interface HeatCellData {
  key: string;
  label: string;
  value: number | null;
}

function averageScore(units: HifzUnit[]): number | null {
  const scored = units.map((u) => u.lastScore).filter((s): s is number => s !== null);
  if (scored.length === 0) return null;
  return Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
}

/** 30 juz cells: completed juz by unit scores, the current juz partial, the rest not started. */
export function juzHeat(units: HifzUnit[], plan: HifzPlan | undefined): HeatCellData[] {
  return Array.from({ length: JUZ_COUNT }, (_, i) => {
    const juz = i + 1;
    const inJuz = units.filter((u) => surahMeta(u.surah)?.juz === juz);
    let value: number | null = null;
    if (plan?.juzCompleted.includes(juz)) value = averageScore(inJuz) ?? 100;
    else if (plan?.currentJuz === juz) value = inJuz.length ? Math.min(LEARNING_JUZ_FILL, averageScore(inJuz) ?? LEARNING_JUZ_FILL) : LEARNING_JUZ_FILL;
    const status = value === null ? "not started" : plan?.currentJuz === juz ? "in progress" : `avg ${value}%`;
    return { key: `juz-${juz}`, label: `Juz ${juz} · ${status}`, value };
  });
}

/** One cell per unit, grouped in surah order (a surah row for the bundled subset). */
export function surahHeat(units: HifzUnit[]): HeatCellData[] {
  return [...units]
    .sort((a, b) => a.surah - b.surah || a.fromAyah - b.fromAyah)
    .map((u) => ({
      key: u.id,
      label: `${unitLabel(u)} · ${u.lastScore === null ? "new" : `${u.lastScore}%`}`,
      value: u.reviews === 0 ? null : u.lastScore,
    }));
}

export function unitLabel(unit: HifzUnit): string {
  return ayahLabel(unit.surah, unit.fromAyah, unit.toAyah);
}

export function securePct(units: HifzUnit[]): number {
  const started = units.filter((u) => u.reviews > 0);
  if (started.length === 0) return 0;
  return Math.round((started.filter((u) => u.status === "secure").length / started.length) * 100);
}

export function weakRetention(units: HifzUnit[], today: string): { unit: HifzUnit; retention: number }[] {
  return units
    .filter((u) => u.reviews > 0)
    .map((u) => ({ unit: u, retention: retention(u, today) }))
    .filter((r) => r.retention < RETENTION_WARN)
    .sort((a, b) => a.retention - b.retention);
}

export function unitForAyah(units: HifzUnit[], surah: number, ayah: number): HifzUnit | undefined {
  return units.find((u) => u.surah === surah && u.fromAyah <= ayah && u.toAyah >= ayah);
}

export const KIND_TONE: Record<HifzUnitKind, Tone> = { sabaq: "accent", sabqi: "info", manzil: "gold" };
export const KIND_LABEL: Record<HifzUnitKind, string> = { sabaq: "Sabaq", sabqi: "Sabqi", manzil: "Manzil" };
export const STATUS_TONE: Record<HifzUnit["status"], Tone> = { new: "neutral", learning: "info", secure: "ok", weak: "danger" };

export function scoreTone(score: number | null): Tone {
  if (score === null) return "neutral";
  if (score >= 95) return "ok";
  if (score >= 85) return "warn";
  return "danger";
}

export function riskTone(securePercent: number, overdueManzil: number): Tone {
  if (securePercent < 60 || overdueManzil >= 5) return "danger";
  if (securePercent < 80 || overdueManzil >= 2) return "warn";
  return "ok";
}

export function riskLabel(securePercent: number, overdueManzil: number): string {
  const tone = riskTone(securePercent, overdueManzil);
  return tone === "danger" ? "High" : tone === "warn" ? "Watch" : "On track";
}

export function fmtDue(iso: string, today: string): string {
  const diff = Math.round((Date.parse(iso) - Date.parse(today)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${-diff} days overdue`;
  return `In ${diff} days`;
}
