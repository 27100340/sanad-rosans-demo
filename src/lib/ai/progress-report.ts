/**
 * Progress report email. Facts are gathered from the stores (tests, papers,
 * assignments, tasks, attendance, mastery, ranking); Gemini writes a short,
 * warm email in English or Urdu; the fallback is a slot-filled template so a
 * report is always produced. Used by the student page and the Saturday
 * parent-report automation. Ported from the reference progress-report.ts.
 */
import { askGemini, VALUES_GUARDRAIL } from "./gemini";
import { school } from "@/lib/config/school";
import { kpiFor } from "@/lib/data/kpi";
import { attemptsSubmittedBy } from "@/lib/data/mock/attempts-index";
import { marksForStudent } from "@/lib/data/mock/attendance";
import { paperAttemptsForStudent } from "@/lib/data/mock/papers";
import { classById, studentById, teacherById } from "@/lib/data/mock/people";
import { ASSIGNMENTS, spacesForClass } from "@/lib/data/mock/spaces";
import { tasksForStudent } from "@/lib/data/mock/tasks";
import { masteryFor } from "@/lib/data/mock/tests";
import { attendancePercent } from "@/lib/domain/attendance";
import { pctOf } from "@/lib/domain/assessment";
import { todayISO } from "@/lib/utils";

export interface ProgressStats {
  studentId: string;
  name: string;
  firstName: string;
  className: string;
  classTeacher: string;
  testsSat: number;
  papersSat: number;
  accuracy: number | null; // over published tests and papers
  attendancePct: number | null;
  assignmentsSubmitted: number;
  assignmentsOutstanding: number;
  tasksDone: number;
  tasksOpen: number;
  strengths: string[];
  focus: string[];
  trend: "up" | "down" | "flat";
  rankClass: number | null;
  outOfClass: number | null;
  index: number | null;
}

export function buildProgressStats(studentId: string): ProgressStats | null {
  const student = studentById.get(studentId);
  if (!student) return null;
  const cls = classById.get(student.classId);
  const today = todayISO();

  const attempts = attemptsSubmittedBy(studentId);
  const papers = paperAttemptsForStudent(studentId).filter((p) => p.finishedAt);
  let earned = 0;
  let max = 0;
  for (const a of attempts) {
    earned += a.total ?? 0;
    max += a.maxMarks;
  }
  for (const p of papers) {
    earned += p.answers.reduce((s, x) => s + x.awarded, 0);
    max += p.maxMarks;
  }

  const spaces = spacesForClass(student.classId);
  const assignments = ASSIGNMENTS.filter((a) => spaces.some((s) => s.id === a.spaceId));
  const submitted = assignments.filter((a) => a.submissions.some((s) => s.studentId === studentId)).length;
  const tasks = tasksForStudent(studentId);

  const titles = new Map(spaces.flatMap((s) => s.syllabus.map((t) => [t.code, t.title.split(":").pop()?.trim() ?? t.title] as const)));
  const mastery = masteryFor(studentId).sort((a, b) => b.score - a.score);
  const kpi = kpiFor(studentId);

  return {
    studentId,
    name: student.name,
    firstName: student.firstName,
    className: cls?.name ?? "",
    classTeacher: cls ? (teacherById.get(cls.classTeacherId)?.name ?? "") : "",
    testsSat: attempts.length,
    papersSat: papers.length,
    accuracy: max > 0 ? pctOf(earned, max) : null,
    attendancePct: attendancePercent(marksForStudent(studentId).map((m) => m.status)) ?? student.attendancePct,
    assignmentsSubmitted: submitted,
    assignmentsOutstanding: assignments.filter((a) => a.dueDate >= today || true).length - submitted,
    tasksDone: tasks.filter((t) => t.status === "done").length,
    tasksOpen: tasks.filter((t) => t.status !== "done").length,
    strengths: mastery.filter((m) => m.score >= 70).slice(0, 2).map((m) => titles.get(m.topicCode) ?? m.topicCode),
    focus: mastery.filter((m) => m.score < 70).slice(-2).map((m) => titles.get(m.topicCode) ?? m.topicCode),
    trend: student.markTrend > 3 ? "up" : student.markTrend < -3 ? "down" : "flat",
    rankClass: kpi?.rankClass ?? null,
    outOfClass: kpi?.outOfClass ?? null,
    index: kpi?.composite ?? null,
  };
}

export interface ComposeInput {
  stats: ProgressStats;
  forParent: boolean;
  recipientName: string;
  language: "en" | "ur";
  senderName: string;
}

export interface ComposedEmail {
  subject: string;
  body: string;
  live: boolean;
}

function englishFallback(i: ComposeInput): ComposedEmail {
  const s = i.stats;
  const who = i.forParent ? `${s.firstName}` : "you";
  const trendLine = s.trend === "up" ? "The trend is upward; please keep the routine going." : s.trend === "down" ? "Marks have dipped a little recently; steady practice will bring them back." : "Performance is steady.";
  const lines = [
    `Dear ${i.forParent ? i.recipientName || "Parent" : s.firstName},`,
    "",
    `Here is a short progress update for ${who} in ${s.className}.`,
    "",
    `• Tests and papers: ${s.testsSat} test${s.testsSat === 1 ? "" : "s"} and ${s.papersSat} past paper${s.papersSat === 1 ? "" : "s"} sat${s.accuracy !== null ? `, ${s.accuracy}% overall` : ""}.`,
    s.attendancePct !== null ? `• Attendance: ${s.attendancePct}% this term.` : "",
    `• Assignments: ${s.assignmentsSubmitted} submitted, ${Math.max(0, s.assignmentsOutstanding)} outstanding.`,
    `• Tasks and challenges: ${s.tasksDone} done, ${s.tasksOpen} open.`,
    s.strengths.length ? `• Strengths: ${s.strengths.join(", ")}.` : "",
    s.focus.length ? `• Focus areas: ${s.focus.join(", ")}.` : "",
    s.rankClass !== null && s.outOfClass ? `• Performance Index ${s.index}, ranked ${s.rankClass} of ${s.outOfClass} in the class.` : "",
    `• ${trendLine}`,
    "",
    i.forParent ? `Ten minutes of practice on the portal each evening makes the biggest difference. Please write back if you have any questions.` : "Keep using the tutor for anything unclear; it will guide you without giving the answer away.",
    "",
    "Warm regards,",
    i.senderName,
    school.schoolName,
  ].filter((l) => l !== "");
  return { subject: `Progress update: ${s.name} (${s.className})`, body: lines.join("\n"), live: false };
}

function urduFallback(i: ComposeInput): ComposedEmail {
  const s = i.stats;
  const lines = [
    `محترم ${i.forParent ? i.recipientName || "والدین" : s.firstName}،`,
    "",
    `${s.className} میں ${s.firstName} کی پیش رفت کی مختصر رپورٹ حاضر ہے۔`,
    "",
    `• ٹیسٹ اور پرچے: ${s.testsSat} ٹیسٹ اور ${s.papersSat} سابقہ پرچے${s.accuracy !== null ? `، مجموعی طور پر ${s.accuracy}٪` : ""}۔`,
    s.attendancePct !== null ? `• حاضری: اس ٹرم میں ${s.attendancePct}٪۔` : "",
    `• اسائنمنٹس: ${s.assignmentsSubmitted} جمع، ${Math.max(0, s.assignmentsOutstanding)} باقی۔`,
    `• ٹاسک اور چیلنج: ${s.tasksDone} مکمل، ${s.tasksOpen} باقی۔`,
    s.focus.length ? `• توجہ کے موضوعات: ${s.focus.join("، ")}۔` : "",
    "",
    "ہر شام دس منٹ کی مشق سب سے زیادہ فرق ڈالتی ہے۔ کسی سوال کی صورت میں ضرور رابطہ کریں۔",
    "",
    "والسلام،",
    i.senderName,
    school.schoolName,
  ].filter((l) => l !== "");
  return { subject: `پیش رفت رپورٹ: ${s.name} (${s.className})`, body: lines.join("\n"), live: false };
}

export function fallbackEmail(i: ComposeInput): ComposedEmail {
  return i.language === "ur" ? urduFallback(i) : englishFallback(i);
}

export async function composeProgressEmail(i: ComposeInput): Promise<ComposedEmail> {
  const base = fallbackEmail(i);
  const s = i.stats;
  const audience = i.forParent ? "the student's parent or guardian: address them warmly and refer to the student by first name in the third person" : "the student directly, encouraging and in the second person";
  const languageLine = i.language === "ur" ? "Write in Urdu script (never Roman Urdu), warm and respectful." : "Write in plain, warm British English.";
  const res = await askGemini({
    system: [
      `You are ${i.senderName}, a teacher at ${school.schoolName}. Write a short, professional progress-update email to ${audience}. 120 to 180 words. Plain text with short bullet lines using "• ". End with a sign-off.`,
      VALUES_GUARDRAIL,
      languageLine,
      "Use only the facts given; never invent marks or events.",
      "Reply in EXACTLY this format:\nSUBJECT: <subject line>\nBODY:\n<the email body>",
    ].join("\n\n"),
    parts: [{ text: `Student: ${s.name}\nRecipient: ${i.recipientName}\nClass: ${s.className}\nTests sat: ${s.testsSat}; papers sat: ${s.papersSat}; overall accuracy: ${s.accuracy ?? "n/a"}%\nAttendance: ${s.attendancePct ?? "n/a"}%\nAssignments submitted/outstanding: ${s.assignmentsSubmitted}/${Math.max(0, s.assignmentsOutstanding)}\nTasks done/open: ${s.tasksDone}/${s.tasksOpen}\nStrengths: ${s.strengths.join(", ") || "n/a"}\nFocus areas: ${s.focus.join(", ") || "n/a"}\nTrend: ${s.trend}\nClass rank: ${s.rankClass ?? "n/a"} of ${s.outOfClass ?? "n/a"}` }],
    temperature: 0.4,
    maxOutputTokens: 700,
  });
  if (!res.text) return base;
  const m = res.text.match(/SUBJECT:\s*(.+?)\s*\nBODY:\s*([\s\S]+)/i);
  if (!m) return base;
  return { subject: m[1].trim().slice(0, 200), body: m[2].trim().slice(0, 6000), live: true };
}
