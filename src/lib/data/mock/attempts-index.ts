/**
 * Read helpers over the attempts store that several aggregators share.
 * Kept apart from tests.ts so it stays the single write path.
 */
import type { Attempt } from "@/lib/domain/assessment";
import { ATTEMPTS } from "./tests";

/** Submitted attempts for one student, newest first. */
export function attemptsSubmittedBy(studentId: string): Attempt[] {
  return ATTEMPTS.filter((a) => a.studentId === studentId && a.submittedAt).sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
}

export function attemptsBy(studentId: string): Attempt[] {
  return ATTEMPTS.filter((a) => a.studentId === studentId).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}
