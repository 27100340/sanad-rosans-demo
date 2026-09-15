import { singleton } from "./store";
import { TEACHERS } from "./mock/people";
import type { Appraisal } from "../domain/hr";
import type { Persona } from "../auth/personas";
export const canHr = (p: Persona) =>
  ["superadmin", "chairman", "principal", "teacher", "ustadh"].includes(p.role);
export const canReviewHr = (p: Persona) =>
  ["superadmin", "chairman", "principal"].includes(p.role);
export const APPRAISALS = singleton<Appraisal[]>("appraisals-v1", () =>
  TEACHERS.map((t, i) => ({
    id: `review-${t.id}`,
    teacherId: t.id,
    teacherName: t.name,
    branchId: t.branchId!,
    period: "Term 1 · 2026–27",
    ratings: {
      planning: 4,
      practice: 4,
      feedback: i % 2 ? 3 : 4,
      professional: 4,
      development: 3,
    },
    evidence:
      "Demo observation: lesson objective was clear; a short exit check identified learners needing guided practice. Review marked samples before finalising.",
    goal: "Use an exit check twice weekly and bring three annotated work samples to the next review.",
    dueDate: "2026-10-15",
    status: "draft",
    response: "",
  })),
);
export function reviewsFor(p: Persona) {
  return APPRAISALS.filter((a) =>
    canReviewHr(p)
      ? !p.branchId || a.branchId === p.branchId
      : a.teacherId === p.personId,
  );
}
