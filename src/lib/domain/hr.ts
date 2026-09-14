export const RUBRIC = [
  { key: "planning", label: "Planning & curriculum", weight: 25 },
  { key: "practice", label: "Teaching & inclusion", weight: 30 },
  { key: "feedback", label: "Assessment & feedback", weight: 20 },
  { key: "professional", label: "Professional contribution", weight: 15 },
  { key: "development", label: "Development & reflection", weight: 10 },
] as const;
export type Criterion = (typeof RUBRIC)[number]["key"];
export interface Appraisal {
  id: string;
  teacherId: string;
  teacherName: string;
  branchId: string;
  period: string;
  ratings: Record<Criterion, number>;
  evidence: string;
  goal: string;
  dueDate: string;
  status: "draft" | "reviewed" | "acknowledged";
  response: string;
  reviewedBy?: string;
}
export function appraisalScore(ratings: Record<Criterion, number>): number {
  for (const r of RUBRIC)
    if (
      !Number.isInteger(ratings[r.key]) ||
      ratings[r.key] < 1 ||
      ratings[r.key] > 5
    )
      throw new Error("Every rubric rating must be between 1 and 5.");
  return Math.round(
    RUBRIC.reduce((s, r) => s + (ratings[r.key] / 5) * r.weight, 0),
  );
}
export function validateReview(evidence: string, goal: string, date: string) {
  if (evidence.trim().length < 20 || evidence.length > 3000)
    throw new Error("Add 20–3,000 characters of observation evidence.");
  if (goal.trim().length < 10 || goal.length > 1000)
    throw new Error("Add a concrete development goal (10–1,000 characters).");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  )
    throw new Error("Choose a valid review date.");
}
