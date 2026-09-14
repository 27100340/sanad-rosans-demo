/**
 * Personal tasks and challenges a teacher hands to one student or a whole
 * class. Pure types and helpers; the store lives in lib/data/mock/tasks.ts.
 */

export type TaskKind = "task" | "challenge";
export type TaskStatus = "assigned" | "in_progress" | "done";
export type TaskActivityType = "study_material" | "video" | "simulation" | "assignment" | "daily_challenge" | "short_test";

export interface Task {
  id: string;
  studentId: string;
  teacherId: string;
  kind: TaskKind;
  title: string;
  body: string;
  dueAt: string; // ISO date
  points: number;
  status: TaskStatus;
  mandatory: boolean;
  activityType: TaskActivityType;
  expectedMinutes: number;
  resourceUrl?: string;
  spaceId?: string;
  topic?: string; // syllabus code the task targets
  generatedKey?: string; // "auto-plan:<monday>" / "auto-daily:<date>" for study-plan tasks
  createdAt: string; // ISO datetime
  doneAt?: string;
}

export const TASK_KINDS: TaskKind[] = ["task", "challenge"];
export const TASK_STATUSES: TaskStatus[] = ["assigned", "in_progress", "done"];
export const TASK_ACTIVITY_TYPES: TaskActivityType[] = ["study_material", "video", "simulation", "assignment", "daily_challenge", "short_test"];

export const ACTIVITY_LABEL: Record<TaskActivityType, string> = {
  study_material: "Study material",
  video: "Video",
  simulation: "Simulation",
  assignment: "Assignment",
  daily_challenge: "Daily challenge",
  short_test: "Short test",
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  assigned: "Assigned",
  in_progress: "In progress",
  done: "Done",
};

export function isTaskKind(value: unknown): value is TaskKind {
  return typeof value === "string" && (TASK_KINDS as string[]).includes(value);
}

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && (TASK_STATUSES as string[]).includes(value);
}

export function isActivityType(value: unknown): value is TaskActivityType {
  return typeof value === "string" && (TASK_ACTIVITY_TYPES as string[]).includes(value);
}

/** The status a "next" button moves a task to; done tasks stay done. */
export function nextTaskStatus(status: TaskStatus): TaskStatus {
  if (status === "assigned") return "in_progress";
  return "done";
}

/** Only open tasks can be overdue; `today` is an ISO date. */
export function isOverdue(task: Pick<Task, "dueAt" | "status">, today: string): boolean {
  return task.status !== "done" && task.dueAt < today;
}

export function pointsEarned(tasks: Pick<Task, "points" | "status">[]): number {
  return tasks.reduce((sum, t) => (t.status === "done" ? sum + t.points : sum), 0);
}
