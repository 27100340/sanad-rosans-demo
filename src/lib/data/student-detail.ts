/**
 * Everything a staff member sees about one student, gathered from the mock
 * stores: profile and guardian, attendance, results, submissions, tasks,
 * mastery, tarbiyah, risk, the Performance Index row and a past / present /
 * future activity timeline. Pure reads; production replaces this with a
 * handful of SQL views.
 */
import { branchRiskRows } from "@/components/principal/risk";
import { attemptsSubmittedBy } from "./mock/attempts-index";
import { lessonsForClass, marksForStudent } from "./mock/attendance";
import { TIMETABLE_G8B } from "./mock/comms";
import { kpiFor, type KpiStudent } from "./kpi";
import { paperAttemptsForStudent } from "./mock/papers";
import { classById, guardianById, studentById, teacherById } from "./mock/people";
import { ASSIGNMENTS, spaceById, spacesForClass } from "./mock/spaces";
import { tarbiyahFor } from "./mock/tarbiyah";
import { tasksForStudent } from "./mock/tasks";
import { allocationsForStudent, masteryFor, testById } from "./mock/tests";
import { listPapers, paperQuestionById, secondsFor } from "./pastpapers";
import { attendancePercent, isExcludedFromAttendance, summarise, type AttendanceStatus } from "@/lib/domain/attendance";
import { paperTotal, pctOf } from "@/lib/domain/assessment";
import type { RiskFlag, Student, TarbiyahLog } from "@/lib/domain/types";
import { isOverdue, type Task } from "@/lib/domain/tasks";
import { daysAgoISO, todayISO } from "@/lib/utils";

export interface ActivityItem {
  when: string; // ISO date or datetime
  kind: "practice" | "attendance" | "result" | "submission" | "assignment" | "lesson" | "test" | "task" | "tarbiyah";
  title: string;
  detail: string;
  status?: string;
}

export interface ResultRow {
  title: string;
  kind: "test" | "paper";
  subject: string;
  score: number;
  total: number;
  pct: number;
  date: string;
  href?: string;
}

export interface StudentDetail {
  student: Student;
  className: string;
  classTeacher: string;
  guardian: { id: string; name: string; phoneMasked: string; language: "en" | "ur" } | null;
  subjects: { spaceId: string; subject: string; teacher: string }[];
  attendance: { total: number; present: number; late: number; online: number; absent: number; excluded: number; pct: number | null; recent: AttendanceStatus[] };
  results: ResultRow[];
  submissions: { assignmentId: string; title: string; subject: string; status: string; awarded?: number; maxMarks: number; dueDate: string }[];
  tasks: Task[];
  mastery: { code: string; title: string; score: number }[];
  tarbiyah: TarbiyahLog[];
  risk: RiskFlag | null;
  kpi: KpiStudent | null;
  timeline: { date: string; pct: number; label: string }[];
  timeManagement: { tracked: number; withinTargetPct: number | null; spent: number; expected: number } | null;
  recommendations: string[];
  activity: { past: ActivityItem[]; present: ActivityItem[]; future: ActivityItem[] };
}

const RECENT_MARKS = 10;
const WEEKS = 6;

function hash01(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

/** Six weekly points ending at the term average, following the recorded trend, when there are not yet two scored sittings. */
function syntheticTrend(student: Student): { date: string; pct: number; label: string }[] {
  return Array.from({ length: WEEKS }, (_, i) => {
    const jitter = Math.round((hash01(`${student.id}:${i}`) - 0.5) * 4);
    const pct = Math.max(0, Math.min(100, Math.round(student.avgMark - student.markTrend + (student.markTrend * i) / (WEEKS - 1) + (i === WEEKS - 1 ? 0 : jitter))));
    return { date: daysAgoISO((WEEKS - 1 - i) * 7), pct, label: `Week ${i + 1}` };
  });
}

export function studentDetail(studentId: string): StudentDetail | null {
  const student = studentById.get(studentId);
  if (!student) return null;
  const today = todayISO();
  const cls = classById.get(student.classId);
  const guardian = guardianById.get(student.guardianId);
  const spaces = spacesForClass(student.classId);

  // Attendance
  const marks = marksForStudent(studentId).sort((a, b) => a.markedAt.localeCompare(b.markedAt));
  const counts = summarise(marks);
  const counted = marks.filter((m) => !isExcludedFromAttendance(m.status));
  const attendance = {
    total: counted.length,
    present: counts.present,
    late: counts.late,
    online: counts.online,
    absent: counts.absent,
    excluded: marks.length - counted.length,
    pct: attendancePercent(marks.map((m) => m.status)),
    recent: marks.slice(-RECENT_MARKS).map((m) => m.status),
  };

  // Results: published tests and finished papers
  const results: ResultRow[] = [];
  for (const al of allocationsForStudent(studentId)) {
    const test = testById.get(al.testId);
    if (!test || al.status !== "published" || !al.attemptId) continue;
    const attempt = attemptsSubmittedBy(studentId).find((a) => a.id === al.attemptId);
    if (!attempt) continue;
    results.push({ title: test.title, kind: "test", subject: spaceById.get(test.spaceId)?.subject ?? "", score: attempt.total ?? 0, total: attempt.maxMarks, pct: pctOf(attempt.total ?? 0, attempt.maxMarks), date: (attempt.submittedAt ?? attempt.startedAt).slice(0, 10) });
  }
  const papers = listPapers();
  for (const pa of paperAttemptsForStudent(studentId).filter((p) => p.finishedAt)) {
    const paper = papers.find((p) => p.code === pa.code && p.paperKey === pa.paperKey);
    results.push({ title: paper?.label ?? `${pa.code}/${pa.paperKey}`, kind: "paper", subject: "Past paper", score: paperTotal(pa), total: pa.maxMarks, pct: pctOf(paperTotal(pa), pa.maxMarks), date: (pa.finishedAt ?? pa.startedAt).slice(0, 10) });
  }
  results.sort((a, b) => b.date.localeCompare(a.date));

  // Submissions
  const submissions = ASSIGNMENTS.filter((a) => spaces.some((s) => s.id === a.spaceId)).map((a) => {
    const sub = a.submissions.find((s) => s.studentId === studentId);
    return { assignmentId: a.id, title: a.title, subject: spaceById.get(a.spaceId)?.subject ?? "", status: sub ? sub.status : a.dueDate < today ? "missing" : "not submitted", awarded: sub?.awarded, maxMarks: a.maxMarks, dueDate: a.dueDate };
  });

  const tasks = tasksForStudent(studentId);
  const titles = new Map(spaces.flatMap((s) => s.syllabus.map((t) => [t.code, t.title] as const)));
  const mastery = masteryFor(studentId).map((m) => ({ code: m.topicCode, title: titles.get(m.topicCode) ?? m.topicCode, score: m.score })).sort((a, b) => b.score - a.score);
  const risk = branchRiskRows(student.branchId).find((r) => r.student.id === studentId)?.flag ?? null;
  const kpi = student.hifz ? null : kpiFor(studentId);

  // Accuracy timeline: real sittings when there are two or more, else a synthetic weekly trend.
  const real = results.map((r) => ({ date: r.date, pct: r.pct, label: r.title })).sort((a, b) => a.date.localeCompare(b.date));
  const timeline = real.length >= 2 ? real : student.hifz ? [] : syntheticTrend(student);

  // Time management from timed past-paper answers.
  let tracked = 0;
  let within = 0;
  let spent = 0;
  let expected = 0;
  for (const pa of paperAttemptsForStudent(studentId)) {
    if (pa.pace !== "paper") continue;
    for (const a of pa.answers) {
      const q = paperQuestionById.get(a.questionId);
      if (!q || !a.secondsUsed) continue;
      tracked += 1;
      spent += a.secondsUsed;
      expected += secondsFor(q);
      if (a.secondsUsed <= secondsFor(q)) within += 1;
    }
  }
  const timeManagement = tracked ? { tracked, withinTargetPct: Math.round((within / tracked) * 100), spent, expected } : null;

  // Recommendations: risk reasons first, then the index advice.
  const recommendations = [...(risk?.reasons.map((r) => `Address: ${r.toLowerCase()}.`) ?? []), ...(kpi?.advice.map((a) => a.text) ?? [])].slice(0, 5);
  if (!recommendations.length) recommendations.push("On track. Keep the weekly rhythm of tests, tasks and tutor practice.");

  // Activity timeline
  const past: ActivityItem[] = [];
  const present: ActivityItem[] = [];
  const future: ActivityItem[] = [];
  for (const a of attemptsSubmittedBy(studentId)) {
    const test = testById.get(a.testId);
    past.push({ when: a.submittedAt ?? a.startedAt, kind: "practice", title: test ? `Sat ${test.title}` : "Sat a test", detail: `${a.answers.length} answers · ${a.total ?? 0}/${a.maxMarks}${a.guardEvents ? ` · ${a.guardEvents} guard events` : ""}` });
  }
  for (const pa of paperAttemptsForStudent(studentId)) {
    const item: ActivityItem = { when: pa.finishedAt ?? pa.startedAt, kind: "practice", title: `${pa.finishedAt ? "Finished" : "Sitting"} past paper ${pa.code}/${pa.paperKey}`, detail: `${pa.answers.length} answered · ${paperTotal(pa)}/${pa.maxMarks}` };
    (pa.finishedAt ? past : present).push(item);
  }
  for (const m of marks.slice(-30)) {
    const lesson = lessonsForClass(student.classId).find((l) => l.id === m.lessonId);
    past.push({ when: lesson?.date ?? m.markedAt.slice(0, 10), kind: "attendance", title: lesson ? `${lesson.subject} · period ${lesson.period}` : "Lesson", detail: `Marked ${m.status}${m.note ? ` · ${m.note}` : ""}`, status: m.status });
  }
  for (const r of results) past.push({ when: r.date, kind: "result", title: `Result · ${r.title}`, detail: `${r.score}/${r.total} · ${r.pct}%` });
  for (const s of submissions) {
    if (s.status === "missing" || s.status === "not submitted") {
      (s.dueDate < today ? present : future).push({ when: s.dueDate, kind: "assignment", title: `${s.status === "missing" ? "Missing" : "To do"} · ${s.title}`, detail: `${s.subject} · due ${s.dueDate}`, status: s.status });
    } else past.push({ when: s.dueDate, kind: "submission", title: `Submitted · ${s.title}`, detail: s.awarded !== undefined ? `Marked ${s.awarded}/${s.maxMarks} · ${s.status}` : s.status, status: s.status });
  }
  for (const al of allocationsForStudent(studentId)) {
    const test = testById.get(al.testId);
    if (!test) continue;
    if (al.status === "not-started" || al.status === "in-progress") {
      (test.opensAt <= today ? present : future).push({ when: test.closesAt, kind: "test", title: `${al.status === "in-progress" ? "In progress" : "Open"} · ${test.title}`, detail: `${spaceById.get(test.spaceId)?.subject ?? ""} · closes ${test.closesAt}${test.durationMin ? ` · ${test.durationMin} min` : ""}` });
    }
  }
  for (const t of tasks) {
    if (t.status === "done") past.push({ when: t.doneAt ?? t.dueAt, kind: "task", title: `Done · ${t.title}`, detail: `${t.kind} · ${t.points} points` });
    else (isOverdue(t, today) || t.dueAt <= today ? present : future).push({ when: t.dueAt, kind: "task", title: `${isOverdue(t, today) ? "Overdue" : "Open"} · ${t.title}`, detail: `${t.kind} · due ${t.dueAt} · ${t.points} points`, status: t.status });
  }
  for (const log of tarbiyahFor(studentId)) past.push({ when: log.date, kind: "tarbiyah", title: `${log.positive ? "Praise" : "Note"} · ${log.kind}`, detail: `${log.note} · ${teacherById.get(log.teacherId)?.name ?? ""}` });
  for (const l of lessonsForClass(student.classId).filter((l) => l.date === today)) present.push({ when: l.date, kind: "lesson", title: `Today · ${l.subject} P${l.period}`, detail: `${l.room} · ${teacherById.get(l.teacherId)?.name ?? ""}`, status: l.status });
  const dow = new Date().getDay();
  const days: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 };
  const seen = new Set<string>();
  for (const e of TIMETABLE_G8B.filter((t) => t.classId === student.classId)) {
    let delta = (days[e.day] - dow + 7) % 7;
    if (delta === 0) delta = 7;
    const key = `${e.day}-${e.subject}`;
    if (seen.has(key)) continue;
    seen.add(key);
    future.push({ when: daysAgoISO(-delta), kind: "lesson", title: `${e.subject} (weekly)`, detail: `${e.day} · period ${e.period} · ${e.room}` });
  }
  const byDesc = (a: ActivityItem, b: ActivityItem) => b.when.localeCompare(a.when);
  const byAsc = (a: ActivityItem, b: ActivityItem) => a.when.localeCompare(b.when);

  return {
    student,
    className: cls?.name ?? "",
    classTeacher: cls ? (teacherById.get(cls.classTeacherId)?.name ?? "") : "",
    guardian: guardian ? { id: guardian.id, name: guardian.name, phoneMasked: guardian.phoneMasked, language: guardian.preferredLanguage } : null,
    subjects: spaces.map((s) => ({ spaceId: s.id, subject: s.subject, teacher: teacherById.get(s.teacherId)?.name ?? "" })),
    attendance,
    results,
    submissions,
    tasks,
    mastery,
    tarbiyah: tarbiyahFor(studentId),
    risk,
    kpi,
    timeline,
    timeManagement,
    recommendations,
    activity: { past: past.sort(byDesc).slice(0, 60), present: present.sort(byAsc).slice(0, 40), future: future.sort(byAsc).slice(0, 40) },
  };
}
