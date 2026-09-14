/**
 * Scheduled jobs the school runs without anyone pressing a button. In the
 * demo they run on demand from the principal's Automations page; production
 * schedules them with cron. Each run is logged with its summary.
 */
import { singleton } from "../store";
import { daysAgoISO } from "@/lib/utils";

export type JobId = "daily-study-plans" | "saturday-parent-reports" | "weekly-digest" | "fee-reminders" | "kpi-rebuild";

export interface Job {
  id: JobId;
  name: string;
  schedule: string;
  description: string;
}

export interface JobRun {
  id: string;
  jobId: JobId;
  at: string;
  by: string; // person id or "schedule"
  summary: string;
  counts: Record<string, number>;
}

export const JOBS: Job[] = [
  { id: "daily-study-plans", name: "Daily study plans", schedule: "Every day · 06:00", description: "Builds each student's weekly sequence on their weakest topic and today's five-minute challenge." },
  { id: "saturday-parent-reports", name: "Saturday parent reports", schedule: "Saturday · 09:00", description: "Queues a progress email to every guardian from the week's tests, papers, assignments, tasks and attendance." },
  { id: "weekly-digest", name: "Weekly digest", schedule: "Friday · 16:00", description: "One notice per student: what they finished, what is open, and their Performance Index." },
  { id: "fee-reminders", name: "Fee reminders", schedule: "Monday · 10:00", description: "Reminds guardians with an unpaid or part-paid invoice; overdue ones are worded more firmly." },
  { id: "kpi-rebuild", name: "Performance Index rebuild", schedule: "Every 15 minutes", description: "Recomputes the ranking table and notifies students who moved up or down." },
];

const MAX_RUNS = 200;

function seedRuns(): JobRun[] {
  return [
    { id: "run-seed-1", jobId: "daily-study-plans", at: `${daysAgoISO(0)}T06:00:12`, by: "schedule", summary: "24 students: 3 plans built, 21 already current", counts: { students: 24, built: 3 } },
    { id: "run-seed-2", jobId: "saturday-parent-reports", at: `${daysAgoISO(2)}T09:00:41`, by: "schedule", summary: "24 reports queued to 24 guardians", counts: { queued: 24 } },
    { id: "run-seed-3", jobId: "kpi-rebuild", at: `${daysAgoISO(0)}T07:45:03`, by: "schedule", summary: "24 students ranked; 2 movers notified", counts: { students: 24, movers: 2 } },
  ];
}

export const RUNS: JobRun[] = singleton("automationRuns", seedRuns);

export function recordRun(input: Omit<JobRun, "id" | "at">): JobRun {
  const run: JobRun = { ...input, id: `run-${Date.now().toString(36)}`, at: new Date().toISOString() };
  RUNS.unshift(run);
  if (RUNS.length > MAX_RUNS) RUNS.length = MAX_RUNS;
  return run;
}

export function lastRun(jobId: JobId): JobRun | undefined {
  return RUNS.find((r) => r.jobId === jobId);
}

export function isJobId(v: unknown): v is JobId {
  return typeof v === "string" && JOBS.some((j) => j.id === v);
}
