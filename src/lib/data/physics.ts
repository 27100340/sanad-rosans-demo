/**
 * Physics data layer. Reads the seeded 9702 banks, holds everything the demo
 * creates at runtime on `globalThis` (see lib/data/store.ts), and exposes the
 * selectors the pages use.
 *
 * The reference project keeps all of this in Supabase Storage — one JSON doc
 * per user for attempts, another fanned out per student for allocations. Sanad
 * has no Supabase, so the same shapes live in process memory here and the read
 * paths are plain array scans. Production swaps this file, not its callers.
 */
import type {
  AllocationMode,
  GuidedAnswer,
  HelpMode,
  PaperType,
  PhysicsAllocation,
  PhysicsAttempt,
  PhysicsPaper,
  PhysicsQuestion,
  QuestionFormat,
  StudioAnswer,
  ThinkingLevel,
} from "@/lib/domain/physics";
import { analyse, paperCodeOf, slugify } from "@/lib/domain/physics";
import { AUTHORED_BANK } from "@/content/physics/bank";
import { PASTPAPER_BANK } from "@/content/physics/pastpaper-bank";
import { SEED_ANSWERS } from "@/content/physics/library";
import { MISCONCEPTIONS, PHYSICS_CLASS_ID, PHYSICS_GROUP_NAME, PHYSICS_TEACHER_ID, PHYSICS_TERM, misconceptionsForTopic } from "@/content/physics/cohort";
import { seedAttempts } from "@/content/physics/seed-attempts";
import { ALL_TOPICS } from "@/content/physics/topics";
import { studentById, studentsInClass } from "./mock/people";
import { singleton } from "./store";

export { PHYSICS_CLASS_ID, PHYSICS_TEACHER_ID, PHYSICS_TERM, PHYSICS_GROUP_NAME, misconceptionsForTopic };

/* ------------------------------------------------------------------ */
/* Banks                                                               */
/* ------------------------------------------------------------------ */

/** Questions the model wrote to top up a paper the banks could not fill. Runtime only. */
const AI_QUESTIONS: PhysicsQuestion[] = singleton("physicsAiQuestions", () => []);

/** Every question the Exam Lab can reach, in one map. Built once per process. */
const INDEX: Map<string, PhysicsQuestion> = singleton(
  "physicsQuestionIndex",
  () => new Map([...AUTHORED_BANK, ...PASTPAPER_BANK].map((q) => [q.id, q])),
);

export function physicsQuestion(id: string): PhysicsQuestion | undefined {
  return INDEX.get(id) ?? AI_QUESTIONS.find((q) => q.id === id);
}

export function physicsQuestions(ids: string[]): PhysicsQuestion[] {
  return ids.map(physicsQuestion).filter((q): q is PhysicsQuestion => Boolean(q));
}

export function addAiQuestion(q: Omit<PhysicsQuestion, "id" | "source" | "visibility">): PhysicsQuestion {
  const full: PhysicsQuestion = { ...q, id: `ai-${Date.now().toString(36)}-${AI_QUESTIONS.length}`, source: "ai", visibility: "portal" };
  AI_QUESTIONS.push(full);
  return full;
}

export const AUTHORED_COUNT = AUTHORED_BANK.length;
export const PASTPAPER_COUNT = PASTPAPER_BANK.length;
export const FIGURE_DEPENDENT_COUNT = PASTPAPER_BANK.filter((q) => q.needsFigure).length;

export interface BankFilter {
  topics: string[];
  levels: ThinkingLevel[];
  format: QuestionFormat | "mixed";
  paperType: PaperType | "any";
  /** "authored" keeps to the department's own questions; "pastpaper" to real Cambridge ones. */
  source: "any" | "authored" | "pastpaper";
  /** Figure-dependent past-paper questions are excluded unless this is true. */
  includeFigureQuestions: boolean;
}

export function defaultFilter(): BankFilter {
  return { topics: [], levels: ["LOT", "HOT"], format: "mixed", paperType: "any", source: "any", includeFigureQuestions: false };
}

function pool(filter: BankFilter): PhysicsQuestion[] {
  const banks = filter.source === "authored" ? AUTHORED_BANK : filter.source === "pastpaper" ? PASTPAPER_BANK : [...AUTHORED_BANK, ...PASTPAPER_BANK];
  return banks.filter((q) => {
    if (!filter.includeFigureQuestions && q.needsFigure) return false;
    if (filter.topics.length && !filter.topics.includes(q.t)) return false;
    if (filter.levels.length && !filter.levels.includes(q.lvl)) return false;
    if (filter.format !== "mixed" && q.type !== filter.format) return false;
    if (filter.paperType !== "any" && q.paper !== filter.paperType) return false;
    return true;
  });
}

export function bankMatching(filter: BankFilter): PhysicsQuestion[] {
  return pool(filter);
}

/** What each strand can offer, which drives the Exam Lab's coverage table. */
export function bankCoverage(): { topic: string; total: number; byLevel: Record<ThinkingLevel, number>; authored: number; pastpaper: number }[] {
  return ALL_TOPICS.map((topic) => {
    const rows = [...AUTHORED_BANK, ...PASTPAPER_BANK].filter((q) => q.t === topic && !q.needsFigure);
    return {
      topic,
      total: rows.length,
      byLevel: { LOT: rows.filter((q) => q.lvl === "LOT").length, HOT: rows.filter((q) => q.lvl === "HOT").length },
      authored: rows.filter((q) => q.source === "authored").length,
      pastpaper: rows.filter((q) => q.source === "pastpaper").length,
    };
  });
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Picks `count` questions, rotating through the requested thinking levels and
 * preferring the least-used strand each time, so a ten-question paper never
 * lands nine questions on one strand while another requested strand is missed.
 */
export function selectQuestions(filter: BankFilter, count: number): PhysicsQuestion[] {
  const candidates = shuffle(pool(filter));
  const levels = filter.levels.length ? filter.levels : (["LOT", "HOT"] as ThinkingLevel[]);
  const picked: PhysicsQuestion[] = [];
  const taken = new Set<string>();
  const usedTopics = new Map<string, number>();

  let guard = candidates.length + levels.length;
  while (picked.length < count && guard > 0) {
    guard -= 1;
    let progressed = false;
    for (const level of levels) {
      if (picked.length >= count) break;
      const next = candidates
        .filter((q) => q.lvl === level && !taken.has(q.id))
        .sort((a, b) => (usedTopics.get(a.t) ?? 0) - (usedTopics.get(b.t) ?? 0))[0];
      if (!next) continue;
      taken.add(next.id);
      picked.push(next);
      usedTopics.set(next.t, (usedTopics.get(next.t) ?? 0) + 1);
      progressed = true;
    }
    if (!progressed) break;
  }
  return picked;
}

/* ------------------------------------------------------------------ */
/* Real Cambridge papers                                               */
/* ------------------------------------------------------------------ */

export interface PastPaperSummary {
  code: string; // "9702/12/F/M/19"
  paperType: PaperType;
  questions: number;
  marks: number;
  /** Questions in this paper whose figure did not survive text extraction. */
  figureDependent: number;
}

/** The real papers the ported bank covers, newest first. Built once per process. */
export const PAST_PAPERS: PastPaperSummary[] = singleton("physicsPastPapers", () => {
  const byCode = new Map<string, PhysicsQuestion[]>();
  for (const q of PASTPAPER_BANK) {
    const code = paperCodeOf(q);
    if (!code) continue;
    const list = byCode.get(code) ?? [];
    list.push(q);
    byCode.set(code, list);
  }
  return [...byCode.entries()]
    .map(([code, questions]) => ({
      code,
      paperType: questions[0].paper,
      questions: questions.length,
      marks: questions.reduce((sum, q) => sum + q.marks, 0),
      figureDependent: questions.filter((q) => q.needsFigure).length,
    }))
    .sort((a, b) => b.code.localeCompare(a.code));
});

/** Every question from one real paper, in question-number order. */
export function questionsForPaperCode(code: string, includeFigureQuestions: boolean): PhysicsQuestion[] {
  return PASTPAPER_BANK.filter((q) => paperCodeOf(q) === code && (includeFigureQuestions || !q.needsFigure)).sort((a, b) => {
    const na = Number(a.id.match(/q(\d+)$/)?.[1] ?? 0);
    const nb = Number(b.id.match(/q(\d+)$/)?.[1] ?? 0);
    return na - nb;
  });
}

/* ------------------------------------------------------------------ */
/* Papers the Exam Lab builds                                          */
/* ------------------------------------------------------------------ */

const PAPERS: PhysicsPaper[] = singleton("physicsPapers", () => []);

export function addPaper(input: Omit<PhysicsPaper, "id" | "createdAt">): PhysicsPaper {
  const paper: PhysicsPaper = { ...input, id: `pp-${Date.now().toString(36)}-${PAPERS.length}`, createdAt: new Date().toISOString() };
  PAPERS.push(paper);
  return paper;
}

export function paperById(id: string): PhysicsPaper | undefined {
  return PAPERS.find((p) => p.id === id);
}

export function papersForTeacher(teacherId: string): PhysicsPaper[] {
  return PAPERS.filter((p) => p.createdBy === teacherId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ------------------------------------------------------------------ */
/* Allocations                                                         */
/* ------------------------------------------------------------------ */

const ALLOCATIONS: PhysicsAllocation[] = singleton("physicsAllocations", () => []);

export interface NewAllocationInput {
  paperId: string;
  title: string;
  mode: AllocationMode;
  instructions: string | null;
  durationMin: number | null;
  dueAt: string | null;
  classId: string;
  className: string;
  studentIds: string[];
  createdBy: string;
  createdByName: string;
}

export function addAllocation(input: NewAllocationInput): PhysicsAllocation {
  const allocation: PhysicsAllocation = {
    ...input,
    id: `al-${Date.now().toString(36)}-${ALLOCATIONS.length}`,
    createdAt: new Date().toISOString(),
    publishedAt: null,
  };
  ALLOCATIONS.unshift(allocation);
  return allocation;
}

export function allocationById(id: string): PhysicsAllocation | undefined {
  return ALLOCATIONS.find((a) => a.id === id);
}

export function allocationsForTeacher(teacherId: string): PhysicsAllocation[] {
  return ALLOCATIONS.filter((a) => a.createdBy === teacherId);
}

export function allocationsForStudent(studentId: string): PhysicsAllocation[] {
  return ALLOCATIONS.filter((a) => a.studentIds.includes(studentId));
}

/** Releases marks for a test-mode allocation. Only the teacher who set it may. */
export function publishAllocation(id: string, teacherId: string): PhysicsAllocation | null {
  const allocation = allocationById(id);
  if (!allocation || allocation.createdBy !== teacherId) return null;
  allocation.publishedAt = new Date().toISOString();
  return allocation;
}

/* ------------------------------------------------------------------ */
/* Attempts                                                            */
/* ------------------------------------------------------------------ */

/** The term's history: the deterministic seed plus anything sat during the demo. */
const ATTEMPTS: PhysicsAttempt[] = singleton("physicsAttempts", () =>
  seedAttempts((studentId) => studentById.get(studentId)?.name ?? studentId),
);

export function addAttempt(attempt: PhysicsAttempt): PhysicsAttempt {
  ATTEMPTS.push(attempt);
  return attempt;
}

export function attemptById(id: string): PhysicsAttempt | undefined {
  return ATTEMPTS.find((a) => a.id === id);
}

export function attemptsForStudent(studentId: string): PhysicsAttempt[] {
  return ATTEMPTS.filter((a) => a.studentId === studentId).sort((a, b) => a.ts - b.ts);
}

export function attemptForAllocation(allocationId: string, studentId: string): PhysicsAttempt | undefined {
  return ATTEMPTS.find((a) => a.context.allocationId === allocationId && a.studentId === studentId);
}

export function attemptsForAllocation(allocationId: string): PhysicsAttempt[] {
  return ATTEMPTS.filter((a) => a.context.allocationId === allocationId);
}

export function classAttempts(classId = PHYSICS_CLASS_ID): PhysicsAttempt[] {
  return ATTEMPTS.filter((a) => a.classId === classId).sort((a, b) => a.ts - b.ts);
}

/* ------------------------------------------------------------------ */
/* Analytics                                                           */
/* ------------------------------------------------------------------ */

export function studentAnalytics(studentId: string) {
  return analyse(attemptsForStudent(studentId));
}

export function classAnalytics(classId = PHYSICS_CLASS_ID) {
  return analyse(classAttempts(classId));
}

/** The class list with each student's own standing, weakest first. */
export function classStandings(classId = PHYSICS_CLASS_ID) {
  return studentsInClass(classId)
    .map((student) => {
      const attempts = attemptsForStudent(student.id);
      const analytics = analyse(attempts);
      return {
        student,
        attempts: attempts.length,
        accuracy: analytics.overallAccuracy,
        byLevel: analytics.byLevel,
        weakest: analytics.weaknesses[0]?.topic ?? null,
        level: analytics.level,
        levelLabel: analytics.levelLabel,
      };
    })
    .filter((row) => row.attempts > 0)
    .sort((a, b) => a.accuracy - b.accuracy);
}

export function misconceptions() {
  return MISCONCEPTIONS;
}

/** Bank questions that expose a misconception, so a reteach can be assessed straight away. */
export function questionsForMisconception(tag: string): PhysicsQuestion[] {
  const misconception = MISCONCEPTIONS.find((m) => m.tag === tag);
  if (!misconception) return [];
  return AUTHORED_BANK.filter((q) => q.t === misconception.topic && q.lvl === "HOT");
}

/* ------------------------------------------------------------------ */
/* Physics Studio answers                                              */
/* ------------------------------------------------------------------ */

const ANSWERS: StudioAnswer[] = singleton("physicsAnswers", () => [...SEED_ANSWERS]);

export interface NewAnswerInput {
  studentId: string;
  studentName: string;
  classId: string;
  topic: string;
  mode: HelpMode;
  question: string;
  answer: GuidedAnswer;
  live: boolean;
}

/** Every studio answer starts as AI-assisted. Nothing else may set the status at creation. */
export function addAnswer(input: NewAnswerInput): StudioAnswer {
  const suffix = (ANSWERS.length + 1).toString(36);
  const record: StudioAnswer = {
    ...input,
    id: `pa-${Date.now().toString(36)}-${suffix}`,
    slug: slugify(input.question, suffix),
    status: "ai-assisted",
    askedAt: new Date().toISOString(),
    inLibrary: false,
  };
  ANSWERS.unshift(record);
  return record;
}

export function answerById(id: string): StudioAnswer | undefined {
  return ANSWERS.find((a) => a.id === id);
}

export function answerBySlug(slug: string): StudioAnswer | undefined {
  return ANSWERS.find((a) => a.slug === slug);
}

/** The student asks a teacher to check the answer. A verified answer is left alone. */
export function requestReview(id: string, studentId: string): StudioAnswer | null {
  const answer = answerById(id);
  if (!answer || answer.studentId !== studentId) return null;
  if (answer.status === "ai-assisted") answer.status = "review-requested";
  return answer;
}

export interface VerifyInput {
  id: string;
  reviewerId: string;
  reviewerName: string;
  note: string;
  publish: boolean;
}

/** The only path to a teacher-verified label. Publishing to the library requires verification. */
export function verifyAnswer(input: VerifyInput): StudioAnswer | null {
  const answer = answerById(input.id);
  if (!answer) return null;
  answer.status = "teacher-verified";
  answer.reviewedAt = new Date().toISOString();
  answer.reviewerId = input.reviewerId;
  answer.reviewerName = input.reviewerName;
  answer.reviewNote = input.note;
  answer.inLibrary = input.publish;
  return answer;
}

/** Published, teacher-verified answers: the library students browse. Newest first. */
export function libraryEntries(topic?: string): StudioAnswer[] {
  return ANSWERS.filter((a) => a.inLibrary && a.status === "teacher-verified" && (!topic || a.topic === topic)).sort((a, b) =>
    (b.reviewedAt ?? b.askedAt).localeCompare(a.reviewedAt ?? a.askedAt),
  );
}

/** Waiting on a teacher, oldest first so the longest wait is dealt with first. */
export function reviewQueue(): StudioAnswer[] {
  return ANSWERS.filter((a) => a.status === "review-requested").sort((a, b) => a.askedAt.localeCompare(b.askedAt));
}

export function verifiedAnswers(): StudioAnswer[] {
  return ANSWERS.filter((a) => a.status === "teacher-verified").sort((a, b) => (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? ""));
}

export function answersForStudent(studentId: string): StudioAnswer[] {
  return ANSWERS.filter((a) => a.studentId === studentId).sort((a, b) => b.askedAt.localeCompare(a.askedAt));
}

/** Strands that already have a verified answer, with how many, for the library filter. */
export function libraryTopicCounts(): { topic: string; count: number }[] {
  const published = libraryEntries();
  return ALL_TOPICS.map((topic) => ({ topic, count: published.filter((a) => a.topic === topic).length })).filter((row) => row.count > 0);
}
