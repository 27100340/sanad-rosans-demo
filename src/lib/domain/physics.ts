/**
 * Physics. Pure types and pure functions only; no IO.
 *
 * The question, attempt, allocation and analytics shapes are ported from the
 * Physics Studio Exam Lab (sjabrankamran-site/src/lib/exam-lab/*) and keep its
 * short field names — `t`, `lvl`, `cmd`, `opts`, `ans` — deliberately: the
 * seeded 9702 banks are lifted from that project verbatim, and renaming the
 * fields would mean rewriting 1,012 questions for no gain.
 *
 * Reused from Sanad rather than re-invented: `MarkPoint` and `MarkingStatus`
 * from lib/domain/types and lib/domain/assessment, and lib/ai/marker.ts for
 * marking structured answers. Deliberately NOT folded into Sanad's
 * `assessment.ts` Question/Test/Attempt: those carry subjectId + topicCode +
 * core/extended difficulty, and have nowhere to put a Cambridge paper type, a
 * LOT/HOT thinking level, a command word or a past-paper reference — which are
 * exactly what the Exam Lab is for. See the report for the full reasoning.
 */
import type { MarkPoint } from "./types";
import type { MarkingStatus } from "./assessment";

export type { MarkPoint, MarkingStatus };

/* ------------------------------------------------------------------ */
/* Questions                                                           */
/* ------------------------------------------------------------------ */

/** Thinking level, as the Exam Lab tags it. LOT: recall and single-step apply. HOT: multi-step reasoning. */
export type ThinkingLevel = "LOT" | "HOT";

export const THINKING_LEVELS: ThinkingLevel[] = ["LOT", "HOT"];

export const LEVEL_LABEL: Record<ThinkingLevel, string> = {
  LOT: "Lower order",
  HOT: "Higher order",
};

export const LEVEL_BLURB: Record<ThinkingLevel, string> = {
  LOT: "State, Define, Calculate — recall and single-step application.",
  HOT: "Explain, Suggest, Show that, Compare — multi-step reasoning, where the marks are.",
};

export type QuestionFormat = "mcq" | "structured";

/** The three written Cambridge 9702 papers the bank covers. */
export type PaperType = "P1" | "P2" | "P4";

export const PAPER_TYPES: PaperType[] = ["P1", "P2", "P4"];

/** Canonical Cambridge 9702 paper facts, as the reference records them. */
export const PAPER_CANON: Record<PaperType, { marks: number; durationMin: number; name: string; short: string }> = {
  P1: { marks: 40, durationMin: 75, name: "Paper 1 · Multiple Choice", short: "Multiple choice" },
  P2: { marks: 60, durationMin: 75, name: "Paper 2 · AS Structured", short: "AS structured" },
  P4: { marks: 100, durationMin: 120, name: "Paper 4 · A2 Structured", short: "A2 structured" },
};

export type QuestionSource = "authored" | "pastpaper" | "ai";

export interface PhysicsQuestion {
  id: string;
  /** Syllabus topic, one of ALL_TOPICS. */
  t: string;
  lvl: ThinkingLevel;
  type: QuestionFormat;
  paper: PaperType;
  /** Cambridge command word: State, Define, Calculate, Determine, Explain, Suggest, Show that, Compare, Describe, Sketch. */
  cmd: string;
  marks: number;
  stem: string;
  /** Multiple choice only, in display order. */
  opts?: string[];
  /** Multiple choice only: index of the correct option. Server-only. */
  ans?: number;
  /** Mark scheme, one line per marking point. Server-only until an attempt is submitted. */
  scheme: string[];
  source: QuestionSource;
  visibility: "public" | "portal" | "both";
  /**
   * True when the stem refers to a figure that did not survive text extraction.
   * The reference serves those as page images from a private asset bucket;
   * Sanad has no such assets, so these are excluded unless a teacher opts in.
   */
  needsFigure?: boolean;
}

/** A bank entry before it is id-stamped. Matches the authored seed literals. */
export type RawPhysicsQuestion = Omit<PhysicsQuestion, "id" | "source" | "visibility">;

/** What a runner may see. Never send `ans` or `scheme` to a client before submission. */
export type StudentQuestion = Omit<PhysicsQuestion, "ans" | "scheme">;

export function forRunner(q: PhysicsQuestion): StudentQuestion {
  const { ans: _ans, scheme: _scheme, ...rest } = q;
  return rest;
}

/** `pp-m19-12-q11` and its scheme line yield `9702/12/F/M/19 Q11`. */
const PAPER_REF = /Past paper:\s*([0-9]{4}\/[0-9]{2}\/[A-Z]\/[A-Z]\/[0-9]{2})\s*(Q\d+)?/i;

export function paperRefOf(q: PhysicsQuestion): string | null {
  for (const line of q.scheme) {
    const match = line.match(PAPER_REF);
    if (match) return `${match[1]}${match[2] ? ` ${match[2]}` : ""}`;
  }
  return null;
}

/** The paper a past-paper question came from, without its question number. */
export function paperCodeOf(q: PhysicsQuestion): string | null {
  const ref = paperRefOf(q);
  return ref ? ref.replace(/\s*Q\d+$/, "") : null;
}

/* ------------------------------------------------------------------ */
/* Papers the Exam Lab builds                                          */
/* ------------------------------------------------------------------ */

export type PaperMode = "drill" | "paper";

export interface PhysicsPaper {
  id: string;
  title: string;
  mode: PaperMode;
  /** Set when mode is "paper": the Cambridge paper this reproduces. */
  code?: string;
  paperType: PaperType | "mixed";
  topics: string[];
  levels: ThinkingLevel[];
  questionIds: string[];
  totalMarks: number;
  durationMin: number;
  createdBy: string;
  createdByName: string;
  createdAt: string; // ISO datetime
  /** True when at least one question was written by the model rather than drawn from a bank. */
  aiAssembled: boolean;
  briefing: string;
  briefingLive: boolean;
}

export const PAPER_MIN_QUESTIONS = 4;
export const PAPER_MAX_QUESTIONS = 20;
export const PAPER_DEFAULT_QUESTIONS = 10;

/** Recommended seconds for one question, from its paper and thinking level. */
export function expectedSeconds(q: PhysicsQuestion): number {
  const perMark = (PAPER_CANON[q.paper].durationMin * 60) / PAPER_CANON[q.paper].marks;
  return Math.round(perMark * q.marks * (q.lvl === "HOT" ? 1.15 : 1));
}

/* ------------------------------------------------------------------ */
/* Attempts                                                            */
/* ------------------------------------------------------------------ */

export interface AttemptQuestion {
  id: string;
  topic: string;
  level: ThinkingLevel;
  paperType: PaperType;
  marks: number;
  /** null = attempted but not scored. */
  earned: number | null;
  /** Multiple choice only. */
  correct: boolean | null;
  expectedSec: number;
  response: string | null;
  feedback: string | null;
  points: MarkPoint[];
  /** How the mark was decided, so nothing is trusted more than it deserves. */
  method: "auto" | MarkingStatus;
}

/** What kind of sitting this was. Ported from the reference's AttemptContext, minus its proctor fields. */
export interface AttemptContext {
  kind: "practice" | "assignment" | "test";
  /** Whether the mark scheme could be revealed during the sitting. */
  help: boolean;
  revealsUsed: number;
  allocationId: string | null;
}

export interface PhysicsAttempt {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  paperId: string;
  ts: number; // epoch ms
  mode: PaperMode;
  paperType: PaperType | "mixed";
  code?: string;
  ref?: string;
  score: number; // marks earned across scored questions
  total: number; // marks available across scored questions
  qCount: number;
  scoredCount: number;
  durationSec: number;
  questions: AttemptQuestion[];
  context: AttemptContext;
}

/* ------------------------------------------------------------------ */
/* Allocations                                                         */
/* ------------------------------------------------------------------ */

/**
 * Ported from the reference's three allocation modes. `test` there means a
 * camera-proctored sitting; Sanad already owns proctoring elsewhere, so here it
 * means "closed book, mark scheme locked until the teacher publishes".
 */
export type AllocationMode = "assignment_help" | "assignment_nohelp" | "test";

export const ALLOCATION_MODES: AllocationMode[] = ["assignment_help", "assignment_nohelp", "test"];

export const ALLOCATION_MODE_LABEL: Record<AllocationMode, string> = {
  assignment_help: "Open book",
  assignment_nohelp: "Closed book",
  test: "Test conditions",
};

export const ALLOCATION_MODE_BLURB: Record<AllocationMode, string> = {
  assignment_help: "The mark scheme can be revealed while working. Reveals are counted and shown to you.",
  assignment_nohelp: "No mark scheme until it is submitted. Reveals are blocked.",
  test: "No mark scheme, no feedback, and the result stays hidden until you publish it.",
};

export type AllocationStatus = "assigned" | "submitted" | "published";

export interface PhysicsAllocation {
  id: string;
  paperId: string;
  title: string;
  mode: AllocationMode;
  instructions: string | null;
  durationMin: number | null;
  dueAt: string | null; // ISO date
  classId: string;
  className: string;
  studentIds: string[];
  createdBy: string;
  createdByName: string;
  createdAt: string; // ISO datetime
  /** Set once the teacher releases marks for a `test` allocation. */
  publishedAt: string | null;
}

/** Whether a student sitting this allocation may reveal the mark scheme. */
export function helpAllowed(mode: AllocationMode): boolean {
  return mode === "assignment_help";
}

/** Whether a student may see their own marks straight after submitting. */
export function resultsImmediate(mode: AllocationMode): boolean {
  return mode !== "test";
}

export function allocationStatusFor(allocation: PhysicsAllocation, attempt: PhysicsAttempt | undefined): AllocationStatus {
  if (!attempt) return "assigned";
  return allocation.publishedAt || resultsImmediate(allocation.mode) ? "published" : "submitted";
}

/* ------------------------------------------------------------------ */
/* Analytics — ported from lib/exam-lab/analytics.ts                   */
/* ------------------------------------------------------------------ */

export interface TopicStat {
  topic: string;
  attempted: number;
  earned: number;
  available: number;
  accuracy: number;
}

export interface Analytics {
  totalAttempts: number;
  papersSat: number;
  questionsAttempted: number;
  scoredQuestions: number;
  overallAccuracy: number; // 0-100 over scored questions
  byTopic: TopicStat[];
  strengths: TopicStat[];
  weaknesses: TopicStat[];
  byLevel: Record<ThinkingLevel, number>;
  byPaper: { paperType: string; attempts: number; accuracy: number }[];
  timeline: { ts: number; accuracy: number; label: string }[];
  level: number; // 1-10
  levelLabel: string;
  nextLevelHint: string;
  recentAttempts: PhysicsAttempt[];
  recommendations: string[];
}

const LEVEL_NAMES = ["Beginner", "Foundation", "Developing", "Competent", "Proficient", "Advanced", "Strong", "Expert", "Elite", "Mastery"];

/** Scored questions needed for full volume credit in the 1-10 ranking. */
const VOLUME_TARGET = 400;
const MIN_ATTEMPTS_FOR_TOPIC_VERDICT = 2;
const TOPIC_LIST_LIMIT = 5;
const TIMELINE_LIMIT = 20;
const RECENT_LIMIT = 8;
const HOT_CONCERN_THRESHOLD = 55;
const PAPERS_FOR_STAMINA = 3;

export function analyse(attempts: PhysicsAttempt[]): Analytics {
  const topicMap = new Map<string, { attempted: number; earned: number; available: number }>();
  const levelCount: Record<ThinkingLevel, { earned: number; available: number }> = {
    LOT: { earned: 0, available: 0 },
    HOT: { earned: 0, available: 0 },
  };
  const paperMap = new Map<string, { attempts: number; earned: number; available: number }>();
  let totalEarned = 0;
  let totalAvailable = 0;
  let questionsAttempted = 0;
  let scoredQuestions = 0;

  for (const attempt of attempts) {
    for (const q of attempt.questions) {
      questionsAttempted += 1;
      if (q.earned === null) continue;
      scoredQuestions += 1;
      const earned = q.earned || 0;
      const available = q.marks || 1;
      totalEarned += earned;
      totalAvailable += available;
      const key = q.topic || "Unclassified";
      const topic = topicMap.get(key) ?? { attempted: 0, earned: 0, available: 0 };
      topic.attempted += 1;
      topic.earned += earned;
      topic.available += available;
      topicMap.set(key, topic);
      const level = levelCount[q.level] ?? levelCount.LOT;
      level.earned += earned;
      level.available += available;
    }
    const paper = paperMap.get(attempt.paperType) ?? { attempts: 0, earned: 0, available: 0 };
    paper.attempts += 1;
    paper.earned += attempt.score;
    paper.available += attempt.total;
    paperMap.set(attempt.paperType, paper);
  }

  const byTopic: TopicStat[] = [...topicMap.entries()]
    .map(([topic, v]) => ({ topic, attempted: v.attempted, earned: v.earned, available: v.available, accuracy: pct(v.earned, v.available) }))
    .sort((a, b) => b.accuracy - a.accuracy);

  const overallAccuracy = pct(totalEarned, totalAvailable);
  const settled = byTopic.filter((t) => t.attempted >= MIN_ATTEMPTS_FOR_TOPIC_VERDICT);
  const strengths = settled.slice(0, TOPIC_LIST_LIMIT);
  const weaknesses = [...settled].reverse().slice(0, TOPIC_LIST_LIMIT);
  const papersSat = new Set(attempts.filter((a) => a.mode === "paper" && a.code).map((a) => a.code)).size;

  const timeline = attempts
    .filter((a) => a.total > 0)
    .slice(-TIMELINE_LIMIT)
    .map((a) => ({ ts: a.ts, accuracy: pct(a.score, a.total), label: a.ref || a.paperType }));

  // Level 1-10 blends accuracy (70%) and volume (30%), exactly as the reference does.
  const volumeScore = Math.min(1, scoredQuestions / VOLUME_TARGET);
  const raw = (overallAccuracy / 100) * 0.7 + volumeScore * 0.3;
  const level = Math.max(1, Math.min(10, Math.round(raw * 10) || 1));

  const recommendations: string[] = [];
  if (weaknesses[0]) recommendations.push(`Focus on ${weaknesses[0].topic} — currently ${weaknesses[0].accuracy}%.`);
  if (levelCount.HOT.available && pct(levelCount.HOT.earned, levelCount.HOT.available) < HOT_CONCERN_THRESHOLD) {
    recommendations.push("Practise more higher-order questions: Explain, Suggest, Show that, Compare.");
  }
  if (papersSat < PAPERS_FOR_STAMINA) recommendations.push(`Sit at least ${PAPERS_FOR_STAMINA} full past papers under timed conditions to build exam stamina.`);
  if (weaknesses[1]) recommendations.push(`Revisit ${weaknesses[1].topic} (${weaknesses[1].accuracy}%).`);
  if (!recommendations.length) recommendations.push("Strong across the board — move into full A2 Paper 4 papers to reach Mastery.");

  return {
    totalAttempts: attempts.length,
    papersSat,
    questionsAttempted,
    scoredQuestions,
    overallAccuracy,
    byTopic,
    strengths,
    weaknesses,
    byLevel: {
      LOT: pct(levelCount.LOT.earned, levelCount.LOT.available),
      HOT: pct(levelCount.HOT.earned, levelCount.HOT.available),
    },
    byPaper: [...paperMap.entries()].map(([paperType, v]) => ({ paperType, attempts: v.attempts, accuracy: pct(v.earned, v.available) })),
    timeline,
    level,
    levelLabel: LEVEL_NAMES[level - 1],
    nextLevelHint:
      level >= LEVEL_NAMES.length
        ? "At Mastery — hold it with mixed timed papers."
        : `Reach Level ${level + 1} (${LEVEL_NAMES[level]}) by lifting overall accuracy and clearing the weak topics.`,
    recentAttempts: attempts.slice(-RECENT_LIMIT).reverse(),
    recommendations,
  };
}

/* ------------------------------------------------------------------ */
/* Marking                                                             */
/* ------------------------------------------------------------------ */

/** Percentage, rounded, guarding the empty denominator. */
export function pct(earned: number, available: number): number {
  return available > 0 ? Math.round((earned / available) * 100) : 0;
}

/** Marks a multiple-choice response without a model call. */
export function markMcq(q: PhysicsQuestion, response: string): AttemptQuestion {
  const given = response.trim();
  const correct = given !== "" && Number(given) === q.ans;
  return {
    id: q.id,
    topic: q.t,
    level: q.lvl,
    paperType: q.paper,
    marks: q.marks,
    earned: correct ? q.marks : 0,
    correct,
    expectedSec: expectedSeconds(q),
    response: given || null,
    feedback: correct ? "Correct." : q.scheme[0] ?? "Not the correct option.",
    points: [{ label: q.scheme[0] ?? "Correct option", earned: correct, evidence: optionText(q, given) }],
    method: "auto",
  };
}

/** The option the student actually chose, which is the evidence for a multiple-choice mark. */
function optionText(q: PhysicsQuestion, response: string): string {
  const index = Number(response);
  return Number.isInteger(index) ? q.opts?.[index] ?? "" : "";
}

/** An unanswered question, scored zero without troubling a model. */
export function markBlank(q: PhysicsQuestion): AttemptQuestion {
  return {
    id: q.id,
    topic: q.t,
    level: q.lvl,
    paperType: q.paper,
    marks: q.marks,
    earned: 0,
    correct: q.type === "mcq" ? false : null,
    expectedSec: expectedSeconds(q),
    response: null,
    feedback: "No answer given.",
    points: q.scheme.map((label) => ({ label, earned: false, evidence: "" })),
    method: "auto",
  };
}

/** Totals a marked sitting into the attempt record the analytics read. */
export function buildAttempt(input: {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  paper: PhysicsPaper;
  questions: AttemptQuestion[];
  durationSec: number;
  context: AttemptContext;
  ref?: string;
}): PhysicsAttempt {
  const scored = input.questions.filter((q) => q.earned !== null);
  return {
    id: input.id,
    studentId: input.studentId,
    studentName: input.studentName,
    classId: input.classId,
    paperId: input.paper.id,
    ts: Date.now(),
    mode: input.paper.mode,
    paperType: input.paper.paperType,
    code: input.paper.code,
    ref: input.ref ?? input.paper.title,
    score: scored.reduce((sum, q) => sum + (q.earned ?? 0), 0),
    total: scored.reduce((sum, q) => sum + q.marks, 0),
    qCount: input.questions.length,
    scoredCount: scored.length,
    durationSec: input.durationSec,
    questions: input.questions,
    context: input.context,
  };
}

/* ------------------------------------------------------------------ */
/* Physics Studio                                                      */
/* ------------------------------------------------------------------ */

/** How the student asked to be helped. The studio never simply hands over the answer. */
export type HelpMode = "hint" | "worked-example" | "examiner";

export const HELP_MODES: HelpMode[] = ["hint", "worked-example", "examiner"];

export const HELP_LABEL: Record<HelpMode, string> = {
  hint: "Hint",
  "worked-example": "Worked example",
  examiner: "Examiner style",
};

export const HELP_BLURB: Record<HelpMode, string> = {
  hint: "One nudge and one question back. Your answer stays yours.",
  "worked-example": "A similar question worked in full, then yours to finish.",
  examiner: "How the marks are actually awarded, point by point.",
};

/**
 * Provenance of a studio answer, and the integrity core of the whole section.
 * The order is the life of the answer: the model writes it, the student may ask
 * for a review, a teacher verifies it, and only a verified answer may be
 * published to the library. Nothing else may set the verified label.
 */
export type AnswerStatus = "ai-assisted" | "review-requested" | "teacher-verified";

export const STATUS_LABEL: Record<AnswerStatus, string> = {
  "ai-assisted": "AI-assisted · not reviewed",
  "review-requested": "Teacher review requested",
  "teacher-verified": "Teacher-verified",
};

/** The guided answer body. One field per teaching move, so the UI never parses prose. */
export interface GuidedAnswer {
  idea: string;
  steps: string[];
  pitfall: string;
  check: string;
}

export interface StudioAnswer {
  id: string;
  slug: string;
  studentId: string;
  studentName: string;
  classId: string;
  /** Syllabus topic, one of ALL_TOPICS. */
  topic: string;
  mode: HelpMode;
  question: string;
  answer: GuidedAnswer;
  status: AnswerStatus;
  /** True when a model wrote the body; false when the scripted fallback did. */
  live: boolean;
  askedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  reviewerName?: string;
  /** The teacher's own words, added at review. Shown above the AI body, never merged into it. */
  reviewNote?: string;
  inLibrary: boolean;
}

export function isVerified(a: Pick<StudioAnswer, "status">): boolean {
  return a.status === "teacher-verified";
}

/** URL-safe slug, following the reference's `studioSlug`. */
export function slugify(text: string, suffix: string): string {
  const base = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return `${base || "physics-question"}-${suffix}`;
}

/* ------------------------------------------------------------------ */
/* Class view                                                          */
/* ------------------------------------------------------------------ */

export interface Misconception {
  tag: string;
  topic: string;
  count: number;
  example: string;
  correction: string;
}

/** Topics below this are named as needing a reteach. */
export const RETEACH_THRESHOLD = 60;

export function reteachList(topics: TopicStat[]): TopicStat[] {
  return topics.filter((t) => t.accuracy < RETEACH_THRESHOLD).sort((a, b) => a.accuracy - b.accuracy);
}

/** Tone for a percentage, so every physics view colours the same number the same way. */
export function scoreTone(value: number): "ok" | "warn" | "danger" {
  if (value >= 75) return "ok";
  if (value >= RETEACH_THRESHOLD) return "warn";
  return "danger";
}

/** `swaps-flemings-rules` reads as `Swaps flemings rules`. */
export function misconceptionTitle(tag: string): string {
  const words = tag.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
