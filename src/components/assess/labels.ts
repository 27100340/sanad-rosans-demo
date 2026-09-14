import type { Tone } from "@/components/ui/primitives";
import type { AllocationStatus, MarkingStatus, QuestionType, TestMode } from "@/lib/domain/assessment";
import type { GuardMode } from "@/lib/domain/proctor";

export const TEST_MODE: Record<TestMode, { label: string; tone: Tone }> = {
  quiz: { label: "Quiz", tone: "accent" },
  timed: { label: "Timed test", tone: "info" },
  mock: { label: "Mock exam", tone: "gold" },
  "past-paper": { label: "Past-paper practice", tone: "neutral" },
};

export const ALLOCATION_STATUS: Record<AllocationStatus, { label: string; tone: Tone }> = {
  "not-started": { label: "Not started", tone: "neutral" },
  "in-progress": { label: "In progress", tone: "warn" },
  submitted: { label: "Awaiting review", tone: "info" },
  published: { label: "Marked", tone: "ok" },
};

export const MARKING_STATUS: Record<MarkingStatus, { label: string; tone: Tone }> = {
  auto: { label: "Auto-marked", tone: "ok" },
  "ai-marked": { label: "AI marked", tone: "info" },
  "teacher-approved": { label: "Approved", tone: "ok" },
};

export const QUESTION_TYPE: Record<QuestionType, string> = {
  mcq: "Multiple choice",
  numeric: "Numeric",
  short: "Short answer",
  structured: "Structured",
};

export function fmtClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const GUARD_MODE: Record<GuardMode, { label: string; tone: Tone; hint: string }> = {
  off: { label: "Practice", tone: "neutral", hint: "No monitoring. Notes and tab switching allowed." },
  standard: { label: "No-help", tone: "info", hint: "Leaving the window cancels the attempt; captures are deterred and logged." },
  strict: { label: "Proctored", tone: "danger", hint: "Full-screen, on-device camera proctor; a violation locks the test until you unlock it." },
};
