/**
 * Past-paper practice attempts. One attempt per student per paper sitting;
 * each question is marked the moment it is answered, so the student sees the
 * scheme for that question only after committing an answer.
 */
import type { PaperAnswer, PaperAttempt } from "@/lib/domain/assessment";
import { questionsForPaper } from "@/lib/data/pastpapers";
import { singleton } from "../store";

export const PAPER_ATTEMPTS: PaperAttempt[] = singleton("paperAttempts", () => []);
export const paperAttemptById: Map<string, PaperAttempt> = singleton("paperAttemptById", () => new Map());
export const PAPER_IMAGES: Map<string, string> = singleton("paperImages", () => new Map()); // photographed scripts, data URLs

export function startPaperAttempt(studentId: string, code: string, paperKey: string, pace: PaperAttempt["pace"], now: string): PaperAttempt {
  const open = PAPER_ATTEMPTS.find((a) => a.studentId === studentId && a.code === code && a.paperKey === paperKey && !a.finishedAt);
  if (open) return open;
  const questions = questionsForPaper(code, paperKey);
  const attempt: PaperAttempt = { id: `pa-${studentId}-${Date.now().toString(36)}`, studentId, code, paperKey, pace, startedAt: now, answers: [], maxMarks: questions.reduce((a, q) => a + q.marks, 0) };
  PAPER_ATTEMPTS.push(attempt);
  paperAttemptById.set(attempt.id, attempt);
  return attempt;
}

export function recordPaperAnswer(attempt: PaperAttempt, answer: PaperAnswer): void {
  const i = attempt.answers.findIndex((a) => a.questionId === answer.questionId);
  if (i >= 0) attempt.answers[i] = answer;
  else attempt.answers.push(answer);
}

export function finishPaperAttempt(attempt: PaperAttempt, now: string): void {
  attempt.finishedAt = now;
}

export function paperAttemptsForStudent(studentId: string): PaperAttempt[] {
  return PAPER_ATTEMPTS.filter((a) => a.studentId === studentId).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function paperAttemptsForPaper(code: string, paperKey: string): PaperAttempt[] {
  return PAPER_ATTEMPTS.filter((a) => a.code === code && a.paperKey === paperKey);
}

export function storeScriptImage(attemptId: string, questionId: string, dataUrl: string): string {
  const id = `${attemptId}-${questionId}`;
  PAPER_IMAGES.set(id, dataUrl);
  return id;
}
