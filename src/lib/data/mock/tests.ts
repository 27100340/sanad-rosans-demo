/**
 * Tests, allocations and attempts for the demo, plus the in-memory store that
 * the assessment API mutates. Grade 8-B has one quiz and one timed test; Ahmed
 * has a submitted attempt on the timed test awaiting teacher review, and three
 * classmates have approved attempts so the analytics have a distribution.
 * Production replaces this module with Supabase tables.
 */
import type { Allocation, AnswerRecord, Attempt, QuestionMarking, Test, TopicMastery } from "@/lib/domain/assessment";
import { autoMark, maxMarksOf, pctOf, rollMastery, totalOf } from "@/lib/domain/assessment";
import { daysAgoISO } from "@/lib/utils";
import { classById } from "./people";
import { questionById } from "./questions";
import { singleton } from "../store";

const G8B_STUDENTS = classById.get("gulberg-g8b")?.studentIds ?? [];

const SEED_TESTS: Test[] = [
  {
    id: "t-maths-quiz-8ae",
    spaceId: "gulberg-g8b-maths",
    title: "Quick check: brackets and equations",
    mode: "quiz",
    questionIds: ["q-m-01", "q-m-02", "q-m-04", "q-m-05"],
    opensAt: daysAgoISO(2),
    closesAt: daysAgoISO(-5),
    attemptsAllowed: 2,
    proctored: false,
    guardMode: "off",
    createdBy: "t-hina-raza",
  },
  {
    id: "t-maths-timed-1",
    spaceId: "gulberg-g8b-maths",
    title: "Topic test: equations and sequences",
    mode: "timed",
    questionIds: ["q-m-03", "q-m-06", "q-m-07", "q-m-08", "q-m-10", "q-m-12"],
    durationMin: 25,
    opensAt: daysAgoISO(4),
    closesAt: daysAgoISO(-3),
    attemptsAllowed: 1,
    proctored: false,
    guardMode: "standard",
    createdBy: "t-hina-raza",
  },
  {
    id: "t-olmaths-mock-1",
    spaceId: "gulberg-o1-ol-maths",
    title: "Mock exam: algebra and simultaneous equations",
    mode: "mock",
    questionIds: ["q-ol-01", "q-m-03", "q-m-06", "q-m-12"],
    durationMin: 40,
    opensAt: daysAgoISO(1),
    closesAt: daysAgoISO(-6),
    attemptsAllowed: 1,
    proctored: true,
    guardMode: "strict",
    createdBy: "t-hina-raza",
  },
  {
    id: "t-science-quiz-1",
    spaceId: "gulberg-g8b-science",
    title: "Quick check: cells and changes",
    mode: "quiz",
    questionIds: ["q-s-01", "q-s-03", "q-s-05"],
    opensAt: daysAgoISO(1),
    closesAt: daysAgoISO(-6),
    attemptsAllowed: 1,
    proctored: false,
    guardMode: "off",
    createdBy: "t-usman-tariq",
  },
];

/* ---------------- seeded attempts ---------------- */

function marks(questionId: string, response: string): QuestionMarking {
  const q = questionById.get(questionId);
  const auto = q ? autoMark(q, response) : null;
  if (auto) return auto;
  return { questionId, awarded: 0, points: [], feedback: "", status: "ai-marked" };
}

function answers(map: Record<string, string>, at: string): AnswerRecord[] {
  return Object.entries(map).map(([questionId, response]) => ({ questionId, response, savedAt: at }));
}

const TIMED_TEST = SEED_TESTS[1];
const TIMED_MAX = maxMarksOf(TIMED_TEST.questionIds.map((id) => questionById.get(id)).filter((q): q is NonNullable<typeof q> => Boolean(q)));

const AHMED_ANSWERS = {
  "q-m-03": "5x - 7 = 2x + 11\n5x - 2x = 11 + 7\n3x = 18\nx = 6",
  "q-m-06": "y + 9 = 4x\nx = y + 9 / 4",
  "q-m-07": "1",
  "q-m-08": "79",
  "q-m-10": "5, 3, 1\nincreasing because it goes 5 3 1",
  "q-m-12": "difference is 7 so 7n\n7n + 5\n7n + 5 = 100 gives n = 13.57 so no",
};

/** Ahmed's structured answers are AI-marked already (deterministic marker output shape) but not yet approved. */
const AHMED_MARKING: QuestionMarking[] = [
  { questionId: "q-m-03", awarded: 2, status: "ai-marked", points: [
    { label: "M1 collects x terms", earned: true, evidence: "3x = 18" },
    { label: "A1 x = 6", earned: true, evidence: "x = 6" },
    { label: "B1 checks by", earned: false, evidence: "no substitution line" },
  ], feedback: "Method and answer are correct. Add one line substituting 6 back into both sides to secure the last mark." },
  { questionId: "q-m-06", awarded: 1, status: "ai-marked", points: [
    { label: "M1 adds 9", earned: true, evidence: "y + 9 = 4x" },
    { label: "A1 x = (y+9)/4", earned: false, evidence: "x = y + 9 / 4 divides only the 9" },
  ], feedback: "Good first step. The whole of y + 9 must be divided by 4, so write it with a bracket or as a fraction." },
  marks("q-m-07", "1"),
  marks("q-m-08", "79"),
  { questionId: "q-m-10", awarded: 2, status: "ai-marked", points: [
    { label: "B1 5, 3, 1", earned: true, evidence: "5, 3, 1" },
    { label: "B1 decreasing", earned: false, evidence: "wrote increasing" },
    { label: "B1 reason", earned: true, evidence: "it goes 5 3 1" },
  ], feedback: "Your terms are right and they fall each time, which is what decreasing means. Read the direction from the terms you wrote." },
  { questionId: "q-m-12", awarded: 1, status: "ai-marked", points: [
    { label: "M1 common difference 7", earned: true, evidence: "difference is 7 so 7n" },
    { label: "A1 7n - 5", earned: false, evidence: "7n + 5 (sign of the constant)" },
    { label: "M1 sets equal to 100", earned: false, evidence: "used the wrong nth term" },
    { label: "A1 yes n = 15", earned: false, evidence: "concluded no" },
  ], feedback: "Check the constant by substituting n = 1: 7(1) + 5 is 12, not 2. Once the nth term is fixed, the 100 question follows." },
];

const CLASSMATE_RESULTS: [studentId: string, answers: Record<string, string>, structured: Record<string, number>][] = [
  ["s-fatima-zubair", { "q-m-07": "1", "q-m-08": "79" }, { "q-m-03": 3, "q-m-06": 2, "q-m-10": 3, "q-m-12": 4 }],
  ["s-hamza-javed", { "q-m-07": "0", "q-m-08": "80" }, { "q-m-03": 1, "q-m-06": 0, "q-m-10": 1, "q-m-12": 0 }],
  ["s-zainab-omer", { "q-m-07": "1", "q-m-08": "79" }, { "q-m-03": 3, "q-m-06": 1, "q-m-10": 3, "q-m-12": 3 }],
];

function classmateAttempt(studentId: string, auto: Record<string, string>, structured: Record<string, number>, index: number): Attempt {
  const at = `${daysAgoISO(2)}T09:${String(10 + index * 7).padStart(2, "0")}:00`;
  const marking: QuestionMarking[] = TIMED_TEST.questionIds.map((qid) => {
    if (auto[qid] !== undefined) return { ...marks(qid, auto[qid]), status: "teacher-approved" as const };
    const q = questionById.get(qid);
    const awarded = structured[qid] ?? 0;
    return { questionId: qid, awarded, status: "teacher-approved" as const, points: (q?.markScheme ?? []).map((line, i) => ({ label: line.split(":")[0], earned: i < awarded, evidence: i < awarded ? "evidenced in working" : "not shown" })), feedback: awarded === (q?.marks ?? 0) ? "Full marks." : "See the mark scheme lines you missed." };
  });
  return {
    id: `att-${studentId}-timed`,
    testId: "t-maths-timed-1",
    studentId,
    startedAt: at,
    submittedAt: at,
    answers: answers({ ...auto, ...Object.fromEntries(Object.keys(structured).map((k) => [k, "working shown"])) }, at),
    marking,
    total: totalOf(marking),
    maxMarks: TIMED_MAX,
    guardEvents: index === 1 ? 2 : 0,
  };
}

const SEED_ATTEMPTS: Attempt[] = [
  {
    id: "att-ahmed-timed",
    testId: "t-maths-timed-1",
    studentId: "s-ahmed-hassan",
    startedAt: `${daysAgoISO(1)}T10:05:00`,
    submittedAt: `${daysAgoISO(1)}T10:27:00`,
    answers: answers(AHMED_ANSWERS, `${daysAgoISO(1)}T10:27:00`),
    marking: AHMED_MARKING,
    total: totalOf(AHMED_MARKING),
    maxMarks: TIMED_MAX,
    guardEvents: 1,
  },
  ...CLASSMATE_RESULTS.map(([sid, auto, structured], i) => classmateAttempt(sid, auto, structured, i)),
];

const SEED_ALLOCATIONS: Allocation[] = [
  ...G8B_STUDENTS.map((studentId): Allocation => ({ testId: "t-maths-quiz-8ae", studentId, status: "not-started" })),
  ...G8B_STUDENTS.map((studentId): Allocation => {
    const attempt = SEED_ATTEMPTS.find((a) => a.testId === "t-maths-timed-1" && a.studentId === studentId);
    if (!attempt) return { testId: "t-maths-timed-1", studentId, status: "not-started" };
    const published = attempt.marking.every((m) => m.status !== "ai-marked");
    return { testId: "t-maths-timed-1", studentId, status: published ? "published" : "submitted", attemptId: attempt.id };
  }),
  ...G8B_STUDENTS.map((studentId): Allocation => ({ testId: "t-science-quiz-1", studentId, status: "not-started" })),
  ...(classById.get("gulberg-o1")?.studentIds ?? []).map((studentId): Allocation => ({ testId: "t-olmaths-mock-1", studentId, status: "not-started" })),
];

const SEED_MASTERY: TopicMastery[] = [
  { studentId: "s-ahmed-hassan", topicCode: "8Ae", score: 64, lastAssessedAt: daysAgoISO(9) },
  { studentId: "s-ahmed-hassan", topicCode: "8As", score: 55, lastAssessedAt: daysAgoISO(9) },
];

/* ---------------- store (single write path) ---------------- */

export const TESTS: Test[] = singleton("tests", () => [...SEED_TESTS]);
export const ATTEMPTS: Attempt[] = singleton("attempts", () => [...SEED_ATTEMPTS]);
export const ALLOCATIONS: Allocation[] = singleton("allocations", () => [...SEED_ALLOCATIONS]);
export const MASTERY: TopicMastery[] = singleton("mastery", () => [...SEED_MASTERY]);
export const testById: Map<string, Test> = singleton("testById", () => new Map(TESTS.map((t) => [t.id, t])));
export const attemptById: Map<string, Attempt> = singleton("attemptById", () => new Map(ATTEMPTS.map((a) => [a.id, a])));

export function testsForSpace(spaceId: string): Test[] {
  return TESTS.filter((t) => t.spaceId === spaceId);
}

export function allocationsForTest(testId: string): Allocation[] {
  return ALLOCATIONS.filter((a) => a.testId === testId);
}

export function allocationsForStudent(studentId: string): Allocation[] {
  return ALLOCATIONS.filter((a) => a.studentId === studentId);
}

export function attemptsForTest(testId: string): Attempt[] {
  return ATTEMPTS.filter((a) => a.testId === testId);
}

export function questionsOf(test: Test) {
  return test.questionIds.map((id) => questionById.get(id)).filter((q): q is NonNullable<typeof q> => Boolean(q));
}

export function addTest(input: Omit<Test, "id">): Test {
  const id = `t-${input.spaceId}-${Date.now().toString(36)}`;
  const test: Test = { ...input, id };
  TESTS.push(test);
  testById.set(id, test);
  return test;
}

export function allocate(testId: string, studentIds: string[]): number {
  let added = 0;
  for (const studentId of studentIds) {
    if (ALLOCATIONS.some((a) => a.testId === testId && a.studentId === studentId)) continue;
    ALLOCATIONS.push({ testId, studentId, status: "not-started" });
    added += 1;
  }
  return added;
}

export function startAttempt(test: Test, studentId: string, now: string): { attempt?: Attempt; error?: string } {
  const allocation = ALLOCATIONS.find((a) => a.testId === test.id && a.studentId === studentId);
  if (!allocation) return { error: "This test is not allocated to you." };
  const prior = ATTEMPTS.filter((a) => a.testId === test.id && a.studentId === studentId);
  const open = prior.find((a) => !a.submittedAt);
  if (open) return { attempt: open };
  if (prior.length >= test.attemptsAllowed) return { error: "No attempts left on this test." };
  const attempt: Attempt = { id: `att-${studentId}-${Date.now().toString(36)}`, testId: test.id, studentId, startedAt: now, answers: [], marking: [], maxMarks: maxMarksOf(questionsOf(test)), guardEvents: 0 };
  ATTEMPTS.push(attempt);
  attemptById.set(attempt.id, attempt);
  allocation.status = "in-progress";
  allocation.attemptId = attempt.id;
  return { attempt };
}

export function saveAnswer(attempt: Attempt, questionId: string, response: string, now: string): void {
  const existing = attempt.answers.find((a) => a.questionId === questionId);
  if (existing) {
    existing.response = response;
    existing.savedAt = now;
  } else attempt.answers.push({ questionId, response, savedAt: now });
}

export function recordGuardEvent(attempt: Attempt): void {
  attempt.guardEvents += 1;
}

/** Seals the attempt with its marking; the caller has already produced `marking` (auto + AI). */
export function submitAttempt(attempt: Attempt, marking: QuestionMarking[], now: string): void {
  attempt.marking = marking;
  attempt.total = totalOf(marking);
  attempt.submittedAt = now;
  const allocation = ALLOCATIONS.find((a) => a.testId === attempt.testId && a.studentId === attempt.studentId);
  if (allocation) {
    allocation.status = marking.every((m) => m.status !== "ai-marked") ? "published" : "submitted";
    allocation.attemptId = attempt.id;
  }
  if (allocation?.status === "published") updateMastery(attempt);
}

export function reviewQuestion(attempt: Attempt, questionId: string, awarded: number | undefined, approve: boolean): void {
  const m = attempt.marking.find((x) => x.questionId === questionId);
  if (!m) return;
  const q = questionById.get(questionId);
  if (awarded !== undefined && q) {
    const next = Math.max(0, Math.min(q.marks, Math.round(awarded)));
    if (next !== m.awarded) m.overridden = true;
    m.awarded = next;
  }
  if (approve) m.status = "teacher-approved";
  attempt.total = totalOf(attempt.marking);
}

/** Approves every remaining AI mark, publishes to the student and rolls topic mastery. */
export function publishAttempt(attempt: Attempt): void {
  for (const m of attempt.marking) if (m.status === "ai-marked") m.status = "teacher-approved";
  attempt.total = totalOf(attempt.marking);
  const allocation = ALLOCATIONS.find((a) => a.testId === attempt.testId && a.studentId === attempt.studentId);
  if (allocation) allocation.status = "published";
  updateMastery(attempt);
}

function updateMastery(attempt: Attempt): void {
  const byTopic = new Map<string, { awarded: number; max: number }>();
  for (const m of attempt.marking) {
    const q = questionById.get(m.questionId);
    if (!q) continue;
    const row = byTopic.get(q.topicCode) ?? { awarded: 0, max: 0 };
    row.awarded += m.awarded;
    row.max += q.marks;
    byTopic.set(q.topicCode, row);
  }
  const at = (attempt.submittedAt ?? attempt.startedAt).slice(0, 10);
  for (const [topicCode, row] of byTopic) {
    const existing = MASTERY.find((x) => x.studentId === attempt.studentId && x.topicCode === topicCode);
    const latest = pctOf(row.awarded, row.max);
    if (existing) {
      existing.score = rollMastery(existing.score, latest);
      existing.lastAssessedAt = at;
    } else MASTERY.push({ studentId: attempt.studentId, topicCode, score: rollMastery(undefined, latest), lastAssessedAt: at });
  }
}

export function masteryFor(studentId: string): TopicMastery[] {
  return MASTERY.filter((m) => m.studentId === studentId);
}
