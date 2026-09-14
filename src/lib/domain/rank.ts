/**
 * Class rankings. Pure; the principal's rankings page feeds it one row per
 * student. The composite blends marks, attendance and effort (task points
 * earned against points offered). A component a class does not carry (Hifz
 * classes have no marks; a class with no tasks has no effort signal) drops
 * out and its weight is shared by the rest, so every class ranks on the same
 * 0..100 scale. Ties share a rank (1, 2, 2, 4).
 */

export interface RankInput {
  studentId: string;
  marks: number | null; // 0..100 average mark, or manzil secure % for a Hifz class
  attendance: number; // 0..100
  effort: number | null; // 0..100, points earned over points offered
}

export type RankBand = "distinction" | "merit" | "pass" | "support";

export interface RankRow extends RankInput {
  composite: number;
  rank: number;
  band: RankBand;
}

export const WEIGHTS = { marks: 0.5, attendance: 0.3, effort: 0.2 } as const;

export const BAND_LABEL: Record<RankBand, string> = {
  distinction: "Distinction",
  merit: "Merit",
  pass: "On track",
  support: "Needs support",
};

export function compositeScore(input: Pick<RankInput, "marks" | "attendance" | "effort">): number {
  const parts: [number | null, number][] = [
    [input.marks, WEIGHTS.marks],
    [input.attendance, WEIGHTS.attendance],
    [input.effort, WEIGHTS.effort],
  ];
  let sum = 0;
  let weight = 0;
  for (const [value, w] of parts) {
    if (value === null) continue;
    sum += Math.max(0, Math.min(100, value)) * w;
    weight += w;
  }
  return weight ? Math.round(sum / weight) : 0;
}

export function bandOf(composite: number): RankBand {
  if (composite >= 85) return "distinction";
  if (composite >= 70) return "merit";
  if (composite >= 50) return "pass";
  return "support";
}

/** Effort as a percentage of the points a student was offered; null when nothing was set. */
export function effortPct(earned: number, offered: number): number | null {
  return offered > 0 ? Math.round(Math.min(100, (earned / offered) * 100)) : null;
}

export function rankStudents(inputs: RankInput[]): RankRow[] {
  const scored = inputs
    .map((i) => ({ ...i, composite: compositeScore(i) }))
    .sort((a, b) => b.composite - a.composite || a.studentId.localeCompare(b.studentId));
  let rank = 0;
  let previous: number | null = null;
  return scored.map((r, index) => {
    if (r.composite !== previous) {
      rank = index + 1;
      previous = r.composite;
    }
    return { ...r, rank, band: bandOf(r.composite) };
  });
}
