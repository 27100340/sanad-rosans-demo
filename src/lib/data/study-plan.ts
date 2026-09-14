/**
 * Weakness-led study plans, ported from the reference study-plan.ts. Once a
 * week the student gets a four-step sequence on their weakest topic (read,
 * watch, explore, write) plus a short quiz allocated in the normal tests
 * store; every day a five-minute challenge. Everything is stored as ordinary
 * tasks and allocations, keyed so the generator is idempotent, so completion
 * stays auditable. Deterministic: no AI call.
 */
import { assembleQuestions, subjectIdForSpace } from "@/lib/ai/assess";
import { notify } from "./mock/notify";
import { classById, studentById } from "./mock/people";
import { spacesForClass } from "./mock/spaces";
import { addTask, tasksForStudent } from "./mock/tasks";
import { addTest, allocate, masteryFor, TESTS } from "./mock/tests";
import type { Task } from "@/lib/domain/tasks";
import type { SubjectSpace } from "@/lib/domain/types";
import { daysAgoISO, todayISO } from "@/lib/utils";

export interface StudyFocus {
  spaceId: string;
  subject: string;
  code: string;
  title: string;
  mastery: number | null;
}

export interface StudyPlan {
  generatedFor: string;
  weekKey: string;
  focus: StudyFocus[];
  tasks: Task[];
  openMandatory: number;
  createdNow: number;
}

const WEEKLY_QUIZ_CLOSE_DAYS = 5;
const MAX_LISTED = 30;

function mondayISO(): string {
  const dow = new Date().getDay();
  return daysAgoISO((dow + 6) % 7);
}

/** Weakest assessed topics across the student's spaces; unlocked topics fill in when nothing is assessed yet. */
export function focusFor(studentId: string): StudyFocus[] {
  const student = studentById.get(studentId);
  if (!student) return [];
  const mastery = new Map(masteryFor(studentId).map((m) => [m.topicCode, m.score]));
  const out: StudyFocus[] = [];
  for (const space of spacesForClass(student.classId)) {
    for (const t of space.syllabus) {
      const unlocked = space.tutorRules.allowedTopics.includes(t.code);
      const score = mastery.get(t.code);
      if (score === undefined && !unlocked) continue;
      out.push({ spaceId: space.id, subject: space.subject, code: t.code, title: t.title.split(":").pop()?.trim() ?? t.title, mastery: score ?? null });
    }
  }
  return out.sort((a, b) => (a.mastery ?? 101) - (b.mastery ?? 101)).slice(0, 3);
}

function resourceFor(space: SubjectSpace, kind: "notes" | "video" | "simulation", code: string): string | undefined {
  const approved = space.resources.filter((r) => r.status === "approved");
  const byTopic = approved.find((r) => r.topicCodes?.includes(code) && (kind === "video" ? r.kind === "video" : kind === "notes" ? r.kind === "notes" || r.kind === "worksheet" : r.kind === "link"));
  if (byTopic) return byTopic.url;
  const byKind = approved.find((r) => (kind === "video" ? r.kind === "video" : kind === "notes" ? r.kind === "textbook" || r.kind === "notes" || r.kind === "worksheet" : r.kind === "link"));
  return byKind?.url ?? approved.find((r) => r.kind === "syllabus")?.url;
}

/** Creates this week's sequence and today's challenge if they do not exist yet, then returns the plan. */
export function ensureStudyPlan(studentId: string): StudyPlan | null {
  const student = studentById.get(studentId);
  if (!student || student.hifz) return null;
  const today = todayISO();
  const weekKey = `auto-plan:${mondayISO()}`;
  const dailyKey = `auto-daily:${today}`;
  const focus = focusFor(studentId);
  const primary = focus[0];
  let createdNow = 0;
  let existing = tasksForStudent(studentId);

  if (primary && !existing.some((t) => t.generatedKey === weekKey)) {
    const space = spacesForClass(student.classId).find((s) => s.id === primary.spaceId);
    if (space) {
      const base = { studentId, teacherId: space.teacherId, mandatory: true, spaceId: space.id, topic: primary.code, generatedKey: weekKey } as const;
      const steps: Array<Pick<Task, "kind" | "title" | "body" | "activityType" | "expectedMinutes" | "points"> & { due: number; resourceUrl?: string }>= [
        { kind: "task", title: `Read: ${primary.title}`, body: `Read the approved notes on ${primary.title} and write five retrieval questions for yourself.`, activityType: "study_material", expectedMinutes: 20, points: 10, due: 1, resourceUrl: resourceFor(space, "notes", primary.code) },
        { kind: "task", title: `Watch: ${primary.title}`, body: "One focused lesson. Pause at each worked example, try it first, then record your most common slip.", activityType: "video", expectedMinutes: 25, points: 10, due: 2, resourceUrl: resourceFor(space, "video", primary.code) },
        { kind: "task", title: `Explore: ${primary.title}`, body: "Change at least two things in the resource or simulation and write what changed and why.", activityType: "simulation", expectedMinutes: 20, points: 10, due: 3, resourceUrl: resourceFor(space, "simulation", primary.code) },
        { kind: "task", title: `Write: one-page summary of ${primary.title}`, body: "Definitions, the key method, one worked example and the mistake you will not make again. Hand it to your teacher.", activityType: "assignment", expectedMinutes: 35, points: 15, due: 4 },
      ];
      for (const s of steps) {
        addTask({ ...base, kind: s.kind, title: s.title, body: s.body, activityType: s.activityType, expectedMinutes: s.expectedMinutes, points: s.points, dueAt: daysAgoISO(-s.due), resourceUrl: s.resourceUrl });
        createdNow += 1;
      }
      const subjectId = subjectIdForSpace(space);
      let questions = assembleQuestions(subjectId, [primary.code], "quiz");
      if (!questions.length) questions = assembleQuestions(subjectId, space.tutorRules.allowedTopics, "quiz");
      if (questions.length) {
        const title = `Weekly check: ${primary.title}`;
        const already = TESTS.find((t) => t.spaceId === space.id && t.title === title && t.opensAt >= mondayISO());
        const test = already ?? addTest({ spaceId: space.id, title, mode: "quiz", questionIds: questions.map((q) => q.id), opensAt: today, closesAt: daysAgoISO(-WEEKLY_QUIZ_CLOSE_DAYS), attemptsAllowed: 1, proctored: false, guardMode: "off", instructions: "Study-plan diagnostic. Complete it before the deadline.", createdBy: space.teacherId });
        allocate(test.id, [studentId]);
        addTask({ ...base, kind: "challenge", title: `Short test: ${primary.title}`, body: "Sit the weekly check in Tests and submit it before the deadline.", activityType: "short_test", expectedMinutes: 15, points: 20, dueAt: daysAgoISO(-WEEKLY_QUIZ_CLOSE_DAYS), resourceUrl: "/portal/learn/tests" });
        createdNow += 1;
      }
      notify({ personIds: [studentId] }, { kind: "assignment", title: "Your study plan for this week is ready", body: `This week focuses on ${primary.title} (${space.subject}). Every step is recorded.`, href: "/portal/learn/study-plan" });
    }
  }

  existing = tasksForStudent(studentId);
  if (focus.length && !existing.some((t) => t.generatedKey === dailyKey)) {
    const pick = focus[new Date().getDay() % focus.length];
    const space = spacesForClass(student.classId).find((s) => s.id === pick.spaceId);
    if (space) {
      addTask({ studentId, teacherId: space.teacherId, kind: "challenge", title: `Daily challenge: ${pick.title}`, body: "Three targeted questions with the tutor. Five minutes, no notes.", activityType: "daily_challenge", expectedMinutes: 5, points: 10, mandatory: true, dueAt: today, spaceId: space.id, topic: pick.code, generatedKey: dailyKey, resourceUrl: `/portal/learn/tutor?space=${encodeURIComponent(space.id)}&quiz=1` });
      createdNow += 1;
      notify({ personIds: [studentId] }, { kind: "challenge", title: `Today's challenge: ${pick.title}`, body: "Three targeted questions are waiting in the tutor.", href: "/portal/learn/tasks" });
    }
  }

  const tasks = tasksForStudent(studentId).filter((t) => t.generatedKey?.startsWith("auto-")).slice(0, MAX_LISTED);
  return { generatedFor: today, weekKey, focus, tasks, openMandatory: tasks.filter((t) => t.mandatory && t.status !== "done").length, createdNow };
}

/** Read-only view for the page before the student presses "Build my plan". */
export function currentPlan(studentId: string): StudyPlan | null {
  const student = studentById.get(studentId);
  if (!student || student.hifz) return null;
  const tasks = tasksForStudent(studentId).filter((t) => t.generatedKey?.startsWith("auto-")).slice(0, MAX_LISTED);
  return { generatedFor: todayISO(), weekKey: `auto-plan:${mondayISO()}`, focus: focusFor(studentId), tasks, openMandatory: tasks.filter((t) => t.mandatory && t.status !== "done").length, createdNow: 0 };
}

export function classNameOf(studentId: string): string {
  const s = studentById.get(studentId);
  return s ? (classById.get(s.classId)?.name ?? "") : "";
}
