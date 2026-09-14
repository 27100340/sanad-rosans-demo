import type { Tone } from "@/components/ui/primitives";
import type { ResourceStatus, SubmissionStatus, TimetableEntry } from "@/lib/domain/types";

export function masteryTone(value: number): Tone {
  if (value >= 75) return "ok";
  if (value >= 60) return "accent";
  if (value >= 50) return "warn";
  return "danger";
}

export function fmtDay(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function todayWeekday(): TimetableEntry["day"] {
  const days: TimetableEntry["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return days[new Date().getDay() - 1] ?? "Mon";
}

export const SUBMISSION_STATUS: Record<SubmissionStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "warn" },
  "ai-marked": { label: "AI marked", tone: "info" },
  "teacher-approved": { label: "Approved", tone: "ok" },
};

export const RESOURCE_STATUS: Record<ResourceStatus, { label: string; tone: Tone }> = {
  approved: { label: "Approved", tone: "ok" },
  pending: { label: "Pending approval", tone: "warn" },
  draft: { label: "Draft", tone: "neutral" },
};

export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function humanTag(tag: string): string {
  return tag.replace(/-/g, " ");
}
