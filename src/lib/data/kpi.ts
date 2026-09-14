/**
 * Gathers the facts the Performance Index needs for every academic student
 * in a branch from the mock stores, then ranks them in their class, their
 * branch and the whole school. Cheap enough to rebuild on every request in
 * the demo; production caches the table for fifteen minutes and notifies
 * rank movers (see the reference kpi.ts).
 */
import { attemptsSubmittedBy } from "./mock/attempts-index";
import { marksForStudent } from "./mock/attendance";
import { contribFor } from "./mock/contribution";
import { paperQuestionById } from "./pastpapers";
import { paperAttemptsForStudent } from "./mock/papers";
import { classById, STUDENTS, studentById } from "./mock/people";
import { questionById } from "./mock/questions";
import { ASSIGNMENTS, spacesForClass } from "./mock/spaces";
import { tasksForStudent } from "./mock/tasks";
import { allocationsForStudent, testById } from "./mock/tests";
import { computeKpi, denseRanks, effortIndex, type KpiInputs, type KpiResult, type PillarKey, type PillarScore, type ScoredItem } from "@/lib/domain/kpi";
import { isOverdue } from "@/lib/domain/tasks";
import { todayISO } from "@/lib/utils";
import type { BranchId } from "@/lib/config/school";

export interface KpiStudent extends KpiResult {
  studentId: string;
  name: string;
  classId: string;
  className: string;
  branchId: BranchId;
  effort: number;
  rankClass: number;
  outOfClass: number;
  rankBranch: number;
  outOfBranch: number;
  rankSchool: number;
  outOfSchool: number;
  sessions: number;
}

export interface KpiTable {
  computedAt: string;
  students: KpiStudent[];
}

const HREFS = { work: "/portal/learn/tasks", tests: "/portal/learn/tests", library: "/portal/learn/library", tasks: "/portal/learn/tasks", today: "/portal/learn" } as const;
const DAILY_WINDOW = 30;

function daysBack(iso: string, today: string): number {
  return Math.round((Date.parse(today) - Date.parse(iso.slice(0, 10))) / 86_400_000);
}

export function kpiInputsFor(studentId: string, today = todayISO()): KpiInputs {
  const student = studentById.get(studentId);
  const scored: ScoredItem[] = [];
  const sessions: KpiInputs["sessions"] = [];
  const work: KpiInputs["work"] = [];

  for (const attempt of attemptsSubmittedBy(studentId)) {
    const at = (attempt.submittedAt ?? attempt.startedAt).slice(0, 10);
    sessions.push({ at, selfChosen: false });
    for (const m of attempt.marking) {
      const q = questionById.get(m.questionId);
      if (q) scored.push({ earned: m.awarded, max: q.marks, at, topicCode: q.topicCode });
    }
  }
  for (const pa of paperAttemptsForStudent(studentId)) {
    sessions.push({ at: pa.startedAt.slice(0, 10), selfChosen: true });
    for (const a of pa.answers) {
      const q = paperQuestionById.get(a.questionId);
      if (q && a.status !== "unanswered") scored.push({ earned: a.awarded, max: q.marks, at: a.answeredAt.slice(0, 10), topicCode: `${q.code} Q${q.qnum}` });
    }
  }
  if (student) {
    const spaceIds = new Set(spacesForClass(student.classId).map((s) => s.id));
    for (const a of ASSIGNMENTS.filter((x) => spaceIds.has(x.spaceId))) {
      const sub = a.submissions.find((s) => s.studentId === studentId);
      if (sub?.awarded !== undefined) scored.push({ earned: sub.awarded, max: a.maxMarks, at: a.dueDate, topicCode: a.topicCode });
      work.push({ done: Boolean(sub), onTime: Boolean(sub), overdue: !sub && a.dueDate < today });
    }
  }
  for (const al of allocationsForStudent(studentId)) {
    const test = testById.get(al.testId);
    if (!test) continue;
    const done = al.status === "submitted" || al.status === "published";
    work.push({ done, onTime: done, overdue: !done && test.closesAt < today });
  }
  const tasks = tasksForStudent(studentId);
  for (const t of tasks) {
    if (t.kind !== "task") continue;
    const done = t.status === "done";
    work.push({ done, onTime: done && (!t.doneAt || t.doneAt.slice(0, 10) <= t.dueAt), overdue: isOverdue(t, today) });
  }
  const challenges = tasks.filter((t) => t.kind === "challenge" && daysBack(t.createdAt, today) <= DAILY_WINDOW);

  return {
    scored,
    sessions,
    work,
    daily: { assigned: challenges.length, done: challenges.filter((t) => t.status === "done").length },
    attendance: marksForStudent(studentId).map((m) => m.status),
    contribution: contribFor(studentId),
    today,
  };
}

export function buildKpi(branchId?: BranchId): KpiTable {
  const today = todayISO();
  const rows = STUDENTS.filter((s) => !s.hifz && (!branchId || s.branchId === branchId)).map((s): KpiStudent => {
    const inputs = kpiInputsFor(s.id, today);
    const result = computeKpi(inputs, HREFS);
    return { ...result, studentId: s.id, name: s.name, classId: s.classId, className: classById.get(s.classId)?.name ?? s.classId, branchId: s.branchId, effort: effortIndex(result.pillars), rankClass: 0, outOfClass: 0, rankBranch: 0, outOfBranch: 0, rankSchool: 0, outOfSchool: 0, sessions: inputs.sessions.length };
  });
  const byScore = (a: KpiStudent, b: KpiStudent) => b.composite - a.composite || b.sessions - a.sessions || a.name.localeCompare(b.name);
  const rank = (group: KpiStudent[], apply: (row: KpiStudent, r: number, outOf: number) => void) => {
    const sorted = [...group].sort(byScore);
    const ranks = denseRanks(sorted, (t) => t.composite);
    sorted.forEach((row, i) => apply(row, ranks[i], sorted.length));
  };
  rank(rows, (r, x, n) => { r.rankSchool = x; r.outOfSchool = n; });
  for (const b of new Set(rows.map((r) => r.branchId))) rank(rows.filter((r) => r.branchId === b), (r, x, n) => { r.rankBranch = x; r.outOfBranch = n; });
  for (const c of new Set(rows.map((r) => r.classId))) rank(rows.filter((r) => r.classId === c), (r, x, n) => { r.rankClass = x; r.outOfClass = n; });
  return { computedAt: new Date().toISOString(), students: rows.sort((a, b) => a.rankSchool - b.rankSchool) };
}

export function kpiFor(studentId: string): KpiStudent | null {
  const student = studentById.get(studentId);
  if (!student) return null;
  return buildKpi(student.branchId).students.find((s) => s.studentId === studentId) ?? null;
}

export type { PillarKey, PillarScore };
