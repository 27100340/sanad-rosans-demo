import type { Persona } from "../auth/personas";
import { CLASSES } from "./mock/people";
import { singleton } from "./store";
import {
  lessonTemplate,
  stageFor,
  type LessonPlan,
  type LearningObservation,
} from "../domain/teaching";
import { spacesForTeacher } from "./repo";
export function teachingClasses(p: Persona) {
  return CLASSES.filter(
    (c) =>
      c.section !== "Hifz" &&
      (["chairman", "principal", "coordinator"].includes(p.role)
        ? !p.branchId || p.branchId === c.branchId
        : p.role === "teacher" &&
          (c.classTeacherId === p.personId ||
            spacesForTeacher(p.personId).some((s) => s.classId === c.id))),
  );
}
export const LESSON_PLANS = singleton<LessonPlan[]>("pathway-lessons-v1", () =>
  CLASSES.filter((c) => c.section !== "Hifz").map((c) => {
    const stage = stageFor(c);
    return {
      id: `lesson-${c.id}`,
      classId: c.id,
      teacherId: c.classTeacherId,
      stage,
      subject: stage === "early-years" ? "Early numeracy" : "Mathematics",
      ...lessonTemplate(stage, c.year),
      date: "2026-09-15",
      status: "published",
    };
  }),
);
export const OBSERVATIONS = singleton<LearningObservation[]>(
  "learning-observations-v1",
  () => [],
);
export function createLessonDraft(p: Persona, classId: string) {
  const c = teachingClasses(p).find((c) => c.id === classId);
  if (!c || p.role === "coordinator")
    throw new Error("You cannot create a lesson for this class.");
  const stage = stageFor(c);
  const plan: LessonPlan = {
    id: crypto.randomUUID(),
    classId,
    teacherId: p.personId,
    stage,
    subject: stage === "early-years" ? "Early numeracy" : "Mathematics",
    ...lessonTemplate(stage, c.year),
    date: new Date().toISOString().slice(0, 10),
    status: "draft",
  };
  LESSON_PLANS.unshift(plan);
  return plan;
}
