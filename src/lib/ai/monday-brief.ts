/**
 * Monday Brief for leadership: what moved, what to watch, three decisions.
 * The fallback is a template filled from the branch aggregates; Gemini,
 * when live, writes a better narrative from the same compact JSON.
 */
import { askGemini, FAST_MODEL, VALUES_GUARDRAIL } from "./gemini";
import { branchName, school, type BranchId } from "@/lib/config/school";
import { ATTENDANCE_TREND, BRANCH_STATS, ENROLMENT_MOVEMENT, SUBJECT_COMPARISON, schoolTotals } from "@/lib/data/mock/stats";
import { fmtPKR } from "@/lib/utils";

export interface MondayBrief {
  text: string; // Markdown
  live: boolean;
}

const signed = (n: number) => `${n >= 0 ? "+" : ""}${n}`;

function briefInputs() {
  const totals = schoolTotals();
  const byTrend = [...BRANCH_STATS].sort((a, b) => a.attendanceTrend - b.attendanceTrend);
  const worstAttendance = byTrend[0];
  const bestAttendance = byTrend[byTrend.length - 1];
  const worstFee = [...BRANCH_STATS].sort((a, b) => a.feeCollectedPct - b.feeCollectedPct)[0];
  const biggestBacklog = [...BRANCH_STATS].sort((a, b) => b.markingBacklog - a.markingBacklog)[0];
  const worstEnrolment = [...ENROLMENT_MOVEMENT].sort((a, b) => a.joined - a.left - (b.joined - b.left))[0];
  const subjectGaps = SUBJECT_COMPARISON.map((s) => {
    const avgs = Object.values(s.byBranch).map((b) => b.avg);
    return { subject: s.subject, gap: Math.max(...avgs) - Math.min(...avgs) };
  }).sort((a, b) => b.gap - a.gap);
  const widestGap = SUBJECT_COMPARISON.find((s) => s.subject === subjectGaps[0].subject) ?? SUBJECT_COMPARISON[0];
  const gapEntries = (Object.entries(widestGap.byBranch) as [BranchId, { avg: number; trend: number; teacher: string }][]).sort((a, b) => b[1].avg - a[1].avg);
  return { totals, worstAttendance, bestAttendance, worstFee, biggestBacklog, worstEnrolment, widestGap, gapEntries };
}

export function fallback(): MondayBrief {
  const { totals, worstAttendance, bestAttendance, worstFee, biggestBacklog, worstEnrolment, widestGap, gapEntries } = briefInputs();
  const worstSeries = ATTENDANCE_TREND[worstAttendance.branchId];
  const sixWeekDrop = (worstSeries[0] - worstSeries[worstSeries.length - 1]).toFixed(1);
  const [best, , low] = gapEntries;
  const exitReasons = Object.entries(worstEnrolment.reasons).map(([k, v]) => `${k} ${v}`).join(", ");
  const text = [
    `**What moved.** School attendance sits at **${totals.attendance}%** today. ${branchName(worstAttendance.branchId)} slipped ${signed(worstAttendance.attendanceTrend)}pp on the week and is down ${sixWeekDrop} points over six weeks; ${branchName(bestAttendance.branchId)} rose to ${bestAttendance.attendanceToday}%, a term high. Fee collection is ${totals.feePct}% (${fmtPKR(totals.fee)}) with ${branchName(worstFee.branchId)} lowest at ${worstFee.feeCollectedPct}%.`,
    `**What to watch.** ${branchName(worstEnrolment.branchId)} lost ${worstEnrolment.left} students against ${worstEnrolment.joined} joined (${exitReasons}). The widest subject gap is Grade ${widestGap.grade} ${widestGap.subject}: ${branchName(best[0])} ${best[1].avg}% against ${branchName(low[0])} ${low[1].avg}%. ${branchName(biggestBacklog.branchId)} carries ${biggestBacklog.markingBacklog} ungraded submissions.`,
    `**Three decisions.**\n1. Approve a fee-hardship review at ${branchName(worstEnrolment.branchId)} before the next voucher run.\n2. Ask the ${branchName(worstAttendance.branchId)} principal for a named plan on the ${worstAttendance.atRisk} at-risk students by Wednesday.\n3. Turn on AI first-pass marking for the ${branchName(biggestBacklog.branchId)} subjects with the largest backlog and review Thursday.`,
  ].join("\n\n");
  return { text, live: false };
}

export async function run(): Promise<MondayBrief> {
  const base = fallback();
  const system = `You write the Monday Brief for the chairman of ${school.schoolName}. Language: English. ${VALUES_GUARDRAIL}
Use only the DATA block. Write three short Markdown paragraphs headed in bold: "What moved.", "What to watch.", and "Three decisions." (a numbered list of three). Cite exact figures; never invent any. Keep it under 180 words. Calm, factual tone.`;
  const data = { branches: BRANCH_STATS, attendanceSixWeeks: ATTENDANCE_TREND, enrolment: ENROLMENT_MOVEMENT, subjectsGrade8: SUBJECT_COMPARISON };
  const res = await askGemini({ model: FAST_MODEL, system, parts: [{ text: `DATA:\n${JSON.stringify(data)}` }], maxOutputTokens: 450 });
  if (!res.text) return base;
  return { text: res.text, live: true };
}
