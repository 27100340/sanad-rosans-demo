/**
 * Assessment orchestration: marks a whole attempt (mcq and numeric are
 * deterministic; short and structured go through the Mark-Scheme Marker with
 * its fallback), assembles a test from the bank, and picks a tutor mini-quiz.
 * No Gemini call is made here except through `marker.run`.
 */
import type { Question, QuestionMarking, StudentQuestion, TestMode } from "@/lib/domain/assessment";
import type { SubjectSpace } from "@/lib/domain/types";
import { SUBJECTS } from "@/lib/data/mock/subjects";
import { autoMark, forStudent } from "@/lib/domain/assessment";
import { questionsForSubject } from "@/lib/data/mock/questions";
import { masteryFor } from "@/lib/data/mock/tests";
import { run as mark } from "./marker";
import type { PaperQuestion } from "@/lib/data/pastpapers";
import type { MarkPoint } from "@/lib/domain/types";

export async function markAttempt(questions: Question[], responses: Map<string, string>, firstName: string): Promise<{ marking: QuestionMarking[]; live: boolean }> {
  let live = false;
  const marking: QuestionMarking[] = [];
  for (const q of questions) {
    const response = responses.get(q.id) ?? "";
    const auto = autoMark(q, response);
    if (auto) {
      marking.push(auto);
      continue;
    }
    if (!response.trim()) {
      marking.push({ questionId: q.id, awarded: 0, status: "ai-marked", points: q.markScheme.map((line) => ({ label: line.split(":")[0], earned: false, evidence: "no answer" })), feedback: "No answer was written for this question." });
      continue;
    }
    const out = await mark({ question: q.stem, answer: response, markScheme: q.markScheme, maxMarks: q.marks, firstName });
    live = live || out.live;
    marking.push({ questionId: q.id, awarded: out.awarded, points: out.points, feedback: out.feedback, status: "ai-marked" });
  }
  return { marking, live };
}

const MODE_SIZE: Record<TestMode, number> = { quiz: 4, timed: 6, mock: 8, "past-paper": 3 };

/**
 * Picks questions per topic from the bank, deterministically: mcq and numeric
 * first for quizzes, structured weighted in for timed and mock modes. The bank
 * is authored, so the "assembly" never invents a question.
 */
export function assembleQuestions(subjectId: string, topicCodes: string[], mode: TestMode): Question[] {
  const pool = questionsForSubject(subjectId, topicCodes);
  const weight = (q: Question) => (mode === "quiz" ? (q.type === "mcq" || q.type === "numeric" ? 0 : 1) : q.type === "structured" ? 0 : 1);
  const perTopic = new Map<string, Question[]>();
  for (const q of pool) perTopic.set(q.topicCode, [...(perTopic.get(q.topicCode) ?? []), q]);
  const ordered = [...perTopic.values()].map((qs) => [...qs].sort((a, b) => weight(a) - weight(b)));
  const picked: Question[] = [];
  const size = MODE_SIZE[mode];
  for (let round = 0; picked.length < size; round += 1) {
    let any = false;
    for (const qs of ordered) {
      const q = qs[round];
      if (!q) continue;
      any = true;
      if (picked.length < size) picked.push(q);
    }
    if (!any) break;
  }
  return picked;
}

export const QUIZ_SIZE = 3;

/** Three questions on the student's weakest assessed topic in this space (falls back to the first unlocked topic). */
export function quizFor(studentId: string, subjectId: string, unlockedTopics: string[]): { topicCode: string; questions: StudentQuestion[] } {
  const weakest = masteryFor(studentId).filter((m) => unlockedTopics.includes(m.topicCode)).sort((a, b) => a.score - b.score)[0]?.topicCode ?? unlockedTopics[0] ?? "";
  const pool = questionsForSubject(subjectId, [weakest]).filter((q) => q.type === "mcq" || q.type === "numeric");
  const fallbackPool = pool.length ? pool : questionsForSubject(subjectId, unlockedTopics).filter((q) => q.type === "mcq" || q.type === "numeric");
  return { topicCode: weakest, questions: fallbackPool.slice(0, QUIZ_SIZE).map(forStudent) };
}

/** Catalogue id for a space; seeded spaces carry only the subject name. */
export function subjectIdForSpace(space: Pick<SubjectSpace, "subject" | "subjectId">): string {
  return space.subjectId ?? SUBJECTS.find((s) => s.name === space.subject)?.id ?? "";
}

const LETTER_RE = /^[A-D]$/;

/** Marks one past-paper question: mcq by key letter, structured through the marker with the scheme rows as mark points. */
export async function markPaperQuestion(q: PaperQuestion, response: string, firstName: string): Promise<{ awarded: number; points: MarkPoint[]; feedback: string; status: "auto" | "ai-marked"; live: boolean }> {
  if (q.type === "mcq") {
    const chosen = response.trim().toUpperCase();
    const earned = LETTER_RE.test(chosen) && chosen === (q.answer ?? "").toUpperCase();
    return { awarded: earned ? 1 : 0, points: [{ label: `Key ${q.answer ?? "?"}`, earned, evidence: chosen || "no option chosen" }], feedback: earned ? "Correct." : `The key is ${q.answer}. Re-read the stem for the quantity it actually asks for.`, status: "auto", live: false };
  }
  const scheme = q.msRows.length ? q.msRows : [`A1: correct answer with working (${q.marks} marks)`];
  const out = await mark({ question: `${q.ref} (see the printed question)`, answer: response, markScheme: scheme, maxMarks: q.marks, firstName });
  return { awarded: out.awarded, points: out.points, feedback: out.feedback, status: "ai-marked", live: out.live };
}
