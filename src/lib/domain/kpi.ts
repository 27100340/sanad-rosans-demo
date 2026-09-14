/**
 * Performance Index: the student-facing ranking engine, ported from the
 * reference exam lab's KPI (six pillars, each 0..100, weighted toward what
 * improves outcomes). Pure: pages feed it plain facts gathered from the
 * stores; nothing here reads data.
 *
 *   Mastery                30  accuracy on scored questions; last 30 days count double;
 *                              fewer than 10 scored questions is confidence-scaled
 *   Practice & Consistency 20  attempt volume (log-capped), active days in 30, self-chosen sessions
 *   Assignments & Tasks    15  completion AND on-time rate of set work
 *   Daily Challenges       10  participation + performance on challenges
 *   Attendance             10  present + online attended, late counts half, excused excluded
 *   Contribution           15  library resources shared, answers given, "helpful" marks earned
 *
 * Volume terms are log-scaled and capped so grinding cannot beat mastery.
 * A pillar with no data scores a neutral 50, except Contribution (zero is zero).
 */
import { countedStatuses } from "./attendance";

export const KPI_WEIGHTS = { mastery: 30, practice: 20, assignments: 15, daily: 10, attendance: 10, contribution: 15 } as const;
export type PillarKey = keyof typeof KPI_WEIGHTS;
export const PILLAR_ORDER: PillarKey[] = ["mastery", "practice", "assignments", "contribution", "daily", "attendance"];

export const PILLAR_INFO: Record<PillarKey, { label: string; short: string; blurb: string }> = {
  mastery: { label: "Mastery", short: "Mastery", blurb: "Accuracy on scored questions; the last 30 days count double." },
  practice: { label: "Practice and consistency", short: "Practice", blurb: "How often you sit tests and papers, active days in the last 30, self-chosen practice." },
  assignments: { label: "Assignments and tasks", short: "Work", blurb: "Completion and on-time rate of the work set for you." },
  daily: { label: "Daily challenges", short: "Daily", blurb: "Taking part in, and doing well on, daily challenges." },
  attendance: { label: "Attendance", short: "Attend", blurb: "Present and online count fully, late counts half; approved leave is excluded." },
  contribution: { label: "Contribution", short: "Contrib", blurb: "Resources shared in the library, answers given, 'helpful' marks earned from peers." },
};

export interface PillarScore {
  score: number;
  detail: string;
}

export interface KpiAdvice {
  pillar: PillarKey;
  text: string;
  href: string;
  gain: number;
}

export interface ScoredItem {
  earned: number;
  max: number;
  at: string; // ISO date
  topicCode?: string;
}

export interface WorkItem {
  done: boolean;
  onTime: boolean;
  overdue: boolean;
}

export interface KpiInputs {
  scored: ScoredItem[];
  sessions: { at: string; selfChosen: boolean }[];
  work: WorkItem[];
  daily: { assigned: number; done: number };
  attendance: string[];
  contribution: { total: number; monthPoints: number } | null;
  today: string; // ISO date
}

const WINDOW_DAYS = 30;
const NEUTRAL = 50;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
export const round1 = (n: number) => Math.round(n * 10) / 10;
/** log-scaled fraction of `full`, so the first few count most and the cap is soft. */
export const logCap = (n: number, full: number) => clamp01(Math.log10(1 + Math.max(0, n)) / Math.log10(1 + full));

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

function accuracyOf(items: ScoredItem[]): { acc: number | null; scored: number } {
  let e = 0;
  let m = 0;
  for (const q of items) {
    e += q.earned;
    m += q.max;
  }
  return { acc: m > 0 ? (e / m) * 100 : null, scored: items.length };
}

export function masteryPillar(scored: ScoredItem[], today: string): PillarScore {
  const all = accuracyOf(scored);
  const recent = accuracyOf(scored.filter((q) => daysBetween(q.at, today) <= WINDOW_DAYS));
  if (all.acc === null) return { score: 0, detail: "No scored questions yet. Sit a quiz or a past paper." };
  const blended = recent.acc !== null ? (all.acc + 2 * recent.acc) / 3 : all.acc;
  const confidence = clamp01(all.scored / 10);
  return {
    score: Math.round(blended * confidence),
    detail: `${Math.round(all.acc)}% over ${all.scored} scored questions` + (recent.acc !== null ? `, ${Math.round(recent.acc)}% in the last 30 days (counted twice)` : ", nothing scored in the last 30 days") + (confidence < 1 ? `; low volume, scaled by ${confidence.toFixed(1)}` : ""),
  };
}

export function practicePillar(sessions: KpiInputs["sessions"], today: string): PillarScore & { activeDays: number } {
  const recent = sessions.filter((s) => daysBetween(s.at, today) <= WINDOW_DAYS);
  const days = new Set(recent.map((s) => s.at)).size;
  const self = recent.filter((s) => s.selfChosen).length;
  const score = Math.round((0.4 * logCap(sessions.length, 60) + 0.4 * clamp01(days / 12) + 0.2 * clamp01(self / 8)) * 100);
  return { score, activeDays: days, detail: `${sessions.length} sessions in total, active ${days} of the last 30 days, ${self} self-chosen` };
}

export function assignmentsPillar(work: WorkItem[]): PillarScore & { overdue: number; open: number } {
  if (!work.length) return { score: NEUTRAL, detail: "Nothing set yet; a neutral 50 until it is.", overdue: 0, open: 0 };
  const done = work.filter((w) => w.done).length;
  const onTime = work.filter((w) => w.onTime).length;
  const completion = done / work.length;
  const onTimeRate = done ? onTime / done : 0;
  const overdue = work.filter((w) => w.overdue).length;
  return {
    score: Math.round((0.6 * completion + 0.4 * onTimeRate) * 100),
    detail: `${done} of ${work.length} completed, ${done ? Math.round(onTimeRate * 100) : 0}% of those on time` + (overdue ? `, ${overdue} overdue` : ""),
    overdue,
    open: work.length - done,
  };
}

export function dailyPillar(daily: KpiInputs["daily"], recentAccuracy: number | null): PillarScore {
  if (!daily.assigned) return { score: NEUTRAL, detail: "No daily challenges in the last 30 days; a neutral 50." };
  const participation = daily.done / daily.assigned;
  const perf = recentAccuracy ?? NEUTRAL;
  return { score: Math.round(0.6 * participation * 100 + 0.4 * perf), detail: `${daily.done} of ${daily.assigned} challenges done in 30 days, ${Math.round(perf)}% accuracy` };
}

export function attendancePillar(statuses: string[]): PillarScore {
  const counted = countedStatuses(statuses);
  if (!counted.length) return { score: NEUTRAL, detail: "No attendance recorded yet; a neutral 50." };
  const attended = counted.filter((s) => s === "present" || s === "online").length;
  const late = counted.filter((s) => s === "late").length;
  return { score: Math.round(((attended + 0.5 * late) / counted.length) * 100), detail: `${attended} attended and ${late} late of ${counted.length} lessons (approved leave excluded)` };
}

export function contributionPillar(c: KpiInputs["contribution"]): PillarScore {
  if (!c || c.total <= 0) return { score: 0, detail: "No library contributions yet. Share a resource or answer a question." };
  return { score: Math.round((0.7 * logCap(c.total, 150) + 0.3 * logCap(c.monthPoints, 50)) * 100), detail: `${c.total} contribution points in total, ${c.monthPoints} this month` };
}

export interface KpiResult {
  pillars: Record<PillarKey, PillarScore>;
  composite: number;
  advice: KpiAdvice[];
  hasData: boolean;
}

export function compositeOf(pillars: Record<PillarKey, PillarScore>): number {
  return round1(PILLAR_ORDER.reduce((sum, k) => sum + pillars[k].score * (KPI_WEIGHTS[k] / 100), 0));
}

/** Effort only: every pillar except Mastery, re-weighted to 100. The class leaderboard ranks on this so marks alone never decide it. */
export function effortIndex(pillars: Record<PillarKey, PillarScore>): number {
  const keys = PILLAR_ORDER.filter((k) => k !== "mastery");
  const weight = keys.reduce((a, k) => a + KPI_WEIGHTS[k], 0);
  return round1(keys.reduce((sum, k) => sum + pillars[k].score * (KPI_WEIGHTS[k] / weight), 0));
}

function adviceFor(pillars: Record<PillarKey, PillarScore>, ctx: { overdue: number; open: number; weakestTopic: string | null; contribTotal: number; hrefs: Record<"work" | "tests" | "library" | "tasks" | "today", string> }): KpiAdvice[] {
  const gain = (pillar: PillarKey, delta: number) => round1(Math.min(100 - pillars[pillar].score, Math.max(0, delta)) * (KPI_WEIGHTS[pillar] / 100));
  const candidates: KpiAdvice[] = [];
  if (ctx.overdue || ctx.open) {
    const n = ctx.overdue || ctx.open;
    candidates.push({ pillar: "assignments", text: `Finish your ${n} ${ctx.overdue ? "overdue" : "open"} piece${n === 1 ? "" : "s"} of work`, href: ctx.hrefs.work, gain: gain("assignments", n * 15) });
  }
  candidates.push({ pillar: "practice", text: "Sit three quizzes or past-paper questions this week", href: ctx.hrefs.tests, gain: gain("practice", 12) });
  candidates.push({ pillar: "mastery", text: ctx.weakestTopic ? `Revise ${ctx.weakestTopic} with the tutor, then retry a quiz on it` : "Sit a scored quiz", href: ctx.hrefs.tests, gain: gain("mastery", 8) });
  candidates.push({ pillar: "contribution", text: ctx.contribTotal > 0 ? "Answer a classmate's question in the library" : "Share your first resource in the library", href: ctx.hrefs.library, gain: gain("contribution", ctx.contribTotal > 0 ? 10 : 25) });
  candidates.push({ pillar: "daily", text: "Complete this week's daily challenges", href: ctx.hrefs.tasks, gain: gain("daily", 20) });
  candidates.push({ pillar: "attendance", text: "Attend every lesson for the next month", href: ctx.hrefs.today, gain: gain("attendance", 10) });
  const headroom = (p: PillarKey) => (100 - pillars[p].score) * KPI_WEIGHTS[p];
  const order = [...new Set(candidates.map((c) => c.pillar))].sort((a, b) => headroom(b) - headroom(a));
  const picked: KpiAdvice[] = [];
  for (const p of order) {
    if (picked.length >= 3) break;
    const best = candidates.filter((c) => c.pillar === p).sort((a, b) => b.gain - a.gain)[0];
    if (best && best.gain > 0) picked.push(best);
  }
  return picked;
}

export function computeKpi(input: KpiInputs, hrefs: Parameters<typeof adviceFor>[1]["hrefs"]): KpiResult {
  const mastery = masteryPillar(input.scored, input.today);
  const practice = practicePillar(input.sessions, input.today);
  const assignments = assignmentsPillar(input.work);
  const recentAcc = accuracyOf(input.scored.filter((q) => daysBetween(q.at, input.today) <= WINDOW_DAYS)).acc;
  const daily = dailyPillar(input.daily, recentAcc);
  const attendance = attendancePillar(input.attendance);
  const contribution = contributionPillar(input.contribution);
  const pillars: Record<PillarKey, PillarScore> = { mastery, practice: { score: practice.score, detail: practice.detail }, assignments: { score: assignments.score, detail: assignments.detail }, daily, attendance, contribution };

  const byTopic = new Map<string, { e: number; m: number; n: number }>();
  for (const q of input.scored) {
    if (!q.topicCode) continue;
    const t = byTopic.get(q.topicCode) ?? { e: 0, m: 0, n: 0 };
    t.e += q.earned;
    t.m += q.max;
    t.n += 1;
    byTopic.set(q.topicCode, t);
  }
  const weakestTopic = [...byTopic.entries()].filter(([, v]) => v.n >= 2 && v.m > 0).sort((a, b) => a[1].e / a[1].m - b[1].e / b[1].m)[0]?.[0] ?? null;

  return {
    pillars,
    composite: compositeOf(pillars),
    advice: adviceFor(pillars, { overdue: assignments.overdue, open: assignments.open, weakestTopic, contribTotal: input.contribution?.total ?? 0, hrefs }),
    hasData: input.scored.length > 0 || input.work.length > 0 || input.attendance.length > 0,
  };
}

export type KpiBand = { label: string; tone: "ok" | "accent" | "warn" | "danger" };

export function kpiBand(score: number): KpiBand {
  if (score >= 80) return { label: "Excellent", tone: "ok" };
  if (score >= 65) return { label: "Strong", tone: "accent" };
  if (score >= 50) return { label: "Developing", tone: "warn" };
  return { label: "Needs focus", tone: "danger" };
}

/** Dense ranks over a best-first list; ties share a rank and the next place is skipped. */
export function denseRanks<T>(sorted: T[], score: (t: T) => number): number[] {
  let rank = 0;
  let prev = Number.NaN;
  return sorted.map((t, i) => {
    const s = score(t);
    if (s !== prev) {
      rank = i + 1;
      prev = s;
    }
    return rank;
  });
}

/** Stable private code for anonymous leaderboards, e.g. "RS-4F2A". */
export function anonCode(id: string): string {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return `RS-${(h >>> 0).toString(16).toUpperCase().padStart(8, "0").slice(-4)}`;
}
