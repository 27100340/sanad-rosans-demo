/**
 * Ask the School. The model only ever sees pre-computed aggregates (never
 * raw PII). The rule-based matcher decides which figures and chart go with
 * the answer; Gemini, when live, writes the narrative from the same data.
 */
import { askGemini, FAST_MODEL, VALUES_GUARDRAIL } from "./gemini";
import { branchName, school, type BranchId } from "@/lib/config/school";
import { TEACHERS } from "@/lib/data/mock/people";
import { ATTENDANCE_TREND, BRANCH_STATS, ENROLMENT_MOVEMENT, SUBJECT_COMPARISON, schoolTotals } from "@/lib/data/mock/stats";
import { fmtPKR } from "@/lib/utils";

export type AskTopic = "enrolment" | "subject" | "backlog" | "attendance" | "summary";

export interface Figure {
  label: string;
  value: string;
}

export interface Bar {
  label: string;
  value: number;
}

export interface AskAnswer {
  question: string;
  topic: AskTopic;
  answer: string; // Markdown
  figures: Figure[];
  chart?: { title: string; unit: string; bars: Bar[] };
  live: boolean;
}

const BRANCH_IDS: BranchId[] = ["gulberg", "lakecity", "paragon"];
const signed = (n: number) => `${n >= 0 ? "+" : ""}${n}`;

export function classify(question: string): AskTopic {
  const q = question.toLowerCase();
  if (/(losing|enrol|leav|withdraw|drop)/.test(q)) return "enrolment";
  if (/(backlog|marking|ungraded|overdue)/.test(q)) return "backlog";
  if (/(attendance|absent|present)/.test(q)) return "attendance";
  if (/(maths|mathematics|subject|compare|english|science|urdu|islamiyat)/.test(q)) return "subject";
  return "summary";
}

function subjectFor(question: string) {
  const q = question.toLowerCase();
  return SUBJECT_COMPARISON.find((s) => q.includes(s.subject.toLowerCase().split(" ")[0])) ?? SUBJECT_COMPARISON[0];
}

function figuresAndChart(topic: AskTopic, question: string): Pick<AskAnswer, "figures" | "chart"> {
  switch (topic) {
    case "enrolment":
      return {
        figures: ENROLMENT_MOVEMENT.map((m) => ({ label: `${branchName(m.branchId)} net`, value: `${signed(m.joined - m.left)} (${m.joined} in, ${m.left} out)` })),
        chart: { title: "Students left this term", unit: "students", bars: ENROLMENT_MOVEMENT.map((m) => ({ label: branchName(m.branchId), value: m.left })) },
      };
    case "subject": {
      const s = subjectFor(question);
      return {
        figures: BRANCH_IDS.map((b) => ({ label: `${branchName(b)} · ${s.byBranch[b].teacher}`, value: `${s.byBranch[b].avg}% (${signed(s.byBranch[b].trend)})` })),
        chart: { title: `Grade ${s.grade} ${s.subject} average`, unit: "%", bars: BRANCH_IDS.map((b) => ({ label: branchName(b), value: s.byBranch[b].avg })) },
      };
    }
    case "backlog": {
      const top = [...TEACHERS].sort((a, b) => b.markingBacklog - a.markingBacklog).filter((t) => t.markingBacklog > 0).slice(0, 4);
      return {
        figures: BRANCH_STATS.map((b) => ({ label: `${branchName(b.branchId)} backlog`, value: `${b.markingBacklog} submissions` })),
        chart: { title: "Ungraded submissions by teacher (Gulberg)", unit: "items", bars: top.map((t) => ({ label: t.name, value: t.markingBacklog })) },
      };
    }
    case "attendance":
      return {
        figures: BRANCH_STATS.map((b) => ({ label: `${branchName(b.branchId)} today`, value: `${b.attendanceToday}% (${signed(b.attendanceTrend)}pp)` })),
        chart: { title: "Attendance change over six weeks", unit: "pp", bars: BRANCH_IDS.map((b) => ({ label: branchName(b), value: +(ATTENDANCE_TREND[b][5] - ATTENDANCE_TREND[b][0]).toFixed(1) })) },
      };
    default: {
      const t = schoolTotals();
      return {
        figures: [
          { label: "Students", value: String(t.students) },
          { label: "Attendance today", value: `${t.attendance}%` },
          { label: "Fee collected", value: `${fmtPKR(t.fee)} (${t.feePct}%)` },
          { label: "At-risk students", value: String(t.atRisk) },
        ],
        chart: { title: "Students by branch", unit: "students", bars: BRANCH_STATS.map((b) => ({ label: branchName(b.branchId), value: b.students })) },
      };
    }
  }
}

function fallbackText(topic: AskTopic, question: string): string {
  switch (topic) {
    case "enrolment": {
      const [worst, second] = [...ENROLMENT_MOVEMENT].sort((a, b) => b.left - a.left);
      const reasons = Object.entries(worst.reasons).map(([k, v]) => `${k} (${v})`).join(", ");
      const lake = ENROLMENT_MOVEMENT.find((m) => m.branchId === "lakecity") ?? second;
      return `**${branchName(worst.branchId)}** is where we are losing students: **${worst.left} left** against ${worst.joined} joined this term. Exit reasons: ${reasons}. ${branchName(lake.branchId)} is net positive (${signed(lake.joined - lake.left)}) and ${branchName(second.branchId)} is broadly stable at ${signed(second.joined - second.left)}.\n\n**What to do:** ask the ${branchName(worst.branchId)} principal for a fee-hardship review of the ${worst.reasons["fees"] ?? 0} fee-related exits and a transport survey before the next intake.`;
    }
    case "subject": {
      const s = subjectFor(question);
      const ranked = BRANCH_IDS.map((b) => ({ b, ...s.byBranch[b] })).sort((a, z) => z.avg - a.avg);
      const best = ranked[0];
      const worst = ranked[ranked.length - 1];
      return `Grade ${s.grade} **${s.subject}** is strongest at **${branchName(best.b)}** (${best.avg}%, ${signed(best.trend)} since last term, ${best.teacher}) and weakest at **${branchName(worst.b)}** (${worst.avg}%, ${signed(worst.trend)}, ${worst.teacher}). The gap is **${best.avg - worst.avg} points**.\n\n**What to do:** pair ${worst.teacher} with ${best.teacher} on a shared scheme of work and compare the two misconception heatmaps before mid-term.`;
    }
    case "backlog": {
      const [top, next] = [...TEACHERS].sort((a, b) => b.markingBacklog - a.markingBacklog);
      const total = BRANCH_STATS.reduce((a, b) => a + b.markingBacklog, 0);
      const gulberg = BRANCH_STATS.find((b) => b.branchId === "gulberg");
      return `Across the school there are **${total} ungraded submissions**; Gulberg carries ${gulberg?.markingBacklog ?? 0} of them. The biggest individual backlog is **${top.name}** (${top.subjects.join(", ")}) with **${top.markingBacklog} items**, followed by ${next.name} with ${next.markingBacklog}.\n\n**What to do:** switch on AI first-pass marking for ${top.subjects[0]} and ${next.subjects[0]} in Gulberg so those teachers only approve, and check the count again on Thursday.`;
    }
    case "attendance": {
      const sorted = [...BRANCH_STATS].sort((a, b) => a.attendanceTrend - b.attendanceTrend);
      const worst = sorted[0];
      const drift = sorted[1];
      const best = sorted[sorted.length - 1];
      const drop = (ATTENDANCE_TREND[worst.branchId][0] - ATTENDANCE_TREND[worst.branchId][5]).toFixed(1);
      return `**${branchName(worst.branchId)}** needs attention: attendance is **${worst.attendanceToday}%** today, down ${drop} points over six weeks and ${Math.abs(worst.attendanceTrend)}pp against last week. ${branchName(drift.branchId)} is also drifting (${drift.attendanceToday}%, ${signed(drift.attendanceTrend)}pp). ${branchName(best.branchId)} is at a term high of ${best.attendanceToday}%.\n\n**What to do:** have the ${branchName(worst.branchId)} principal run the early-warning list today and call the families of the new high-risk students before Friday.`;
    }
    default: {
      const t = schoolTotals();
      return `${school.schoolName} has **${t.students} students** across three campuses. Attendance is ${t.attendance}% today, ${t.feePct}% of this month's fees are collected (${fmtPKR(t.fee)}), and **${t.atRisk} students** are on the early-warning list.\n\n**What to do:** the two numbers moving the wrong way are Paragon City attendance and the Gulberg marking backlog; start there.`;
    }
  }
}

function aggregates() {
  return {
    branches: BRANCH_STATS,
    attendanceTrendSixWeeks: ATTENDANCE_TREND,
    subjectsGrade8: SUBJECT_COMPARISON,
    enrolmentThisTerm: ENROLMENT_MOVEMENT,
    teacherBacklog: TEACHERS.map((t) => ({ name: t.name, branch: t.branchId, subjects: t.subjects, backlog: t.markingBacklog, periodsPerWeek: t.weeklyPeriods })),
  };
}

export function fallback(question: string): AskAnswer {
  const topic = classify(question);
  return { question, topic, answer: fallbackText(topic, question), ...figuresAndChart(topic, question), live: false };
}

export async function run(question: string): Promise<AskAnswer> {
  const base = fallback(question);
  const system = `You are the leadership analyst for ${school.schoolName}. Seat: chairman. Language: English. ${VALUES_GUARDRAIL}
Answer strictly from the AGGREGATES block. Write two short Markdown paragraphs: first the answer with the exact figures you used (bold the key numbers), then one line starting with "**What to do:**". If the question cannot be answered from the data, say which figure is missing and offer the closest question you can answer. Never invent numbers.`;
  const res = await askGemini({
    model: FAST_MODEL,
    system,
    parts: [{ text: `AGGREGATES:\n${JSON.stringify(aggregates())}\n\nQUESTION: ${question}` }],
    maxOutputTokens: 500,
  });
  if (!res.text) return base;
  return { ...base, answer: res.text, live: true };
}
