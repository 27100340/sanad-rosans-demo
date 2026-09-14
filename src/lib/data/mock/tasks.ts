/**
 * Personal tasks store. Seeded so Ahmed's list shows every state and Ali has
 * a couple of O Level items; the tasks API is the single write path.
 * Production replaces this with an edu_tasks table.
 */
import type { Task } from "@/lib/domain/tasks";
import { daysAgoISO } from "@/lib/utils";
import { singleton } from "../store";

const PER_STUDENT_CAP = 500;

function at(daysBack: number, time: string): string {
  return `${daysAgoISO(daysBack)}T${time}:00`;
}

const SEED_TASKS: Task[] = [
  {
    id: "task-ahmed-1",
    studentId: "s-ahmed-hassan",
    teacherId: "t-hina-raza",
    kind: "task",
    title: "Watch: solving equations with brackets",
    body: "Ten-minute Corbettmaths clip, then try the three practice questions at the end.",
    dueAt: daysAgoISO(1),
    points: 10,
    status: "done",
    mandatory: false,
    activityType: "video",
    expectedMinutes: 15,
    resourceUrl: "https://corbettmaths.com/contents/",
    spaceId: "gulberg-g8b-maths",
    createdAt: at(4, "14:10"),
    doneAt: at(2, "19:40"),
  },
  {
    id: "task-ahmed-2",
    studentId: "s-ahmed-hassan",
    teacherId: "t-hina-raza",
    kind: "task",
    title: "Week 6 notes: linear equations",
    body: "Read the class notes and copy the two worked examples into your exercise book.",
    dueAt: daysAgoISO(-2),
    points: 10,
    status: "in_progress",
    mandatory: true,
    activityType: "study_material",
    expectedMinutes: 20,
    resourceUrl: "/portal/teach/gulberg-g8b-maths/resources/r6",
    spaceId: "gulberg-g8b-maths",
    createdAt: at(2, "09:05"),
  },
  {
    id: "task-ahmed-3",
    studentId: "s-ahmed-hassan",
    teacherId: "t-usman-tariq",
    kind: "task",
    title: "Cells worksheet, questions 1 to 6",
    body: "Label the animal and plant cell diagrams and answer the short questions underneath.",
    dueAt: daysAgoISO(2),
    points: 15,
    status: "assigned",
    mandatory: true,
    activityType: "assignment",
    expectedMinutes: 30,
    spaceId: "gulberg-g8b-science",
    createdAt: at(5, "11:30"),
  },
  {
    id: "task-ahmed-4",
    studentId: "s-ahmed-hassan",
    teacherId: "t-hina-raza",
    kind: "challenge",
    title: "Daily challenge: nth term in under five minutes",
    body: "Five sequences, find the nth term of each. Beat the clock and earn the bonus points.",
    dueAt: daysAgoISO(-1),
    points: 25,
    status: "assigned",
    mandatory: false,
    activityType: "daily_challenge",
    expectedMinutes: 5,
    spaceId: "gulberg-g8b-maths",
    createdAt: at(0, "07:45"),
  },
  {
    id: "task-ali-1",
    studentId: "s-ali-hamza",
    teacherId: "t-hina-raza",
    kind: "task",
    title: "Past paper 4024/12: questions 1 to 10",
    body: "Timed practice, 30 minutes. Mark it against the scheme and note anything you lost marks on.",
    dueAt: daysAgoISO(-3),
    points: 20,
    status: "assigned",
    mandatory: true,
    activityType: "short_test",
    expectedMinutes: 30,
    resourceUrl: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-o-level-mathematics-d-4024/past-papers/",
    spaceId: "gulberg-o1-ol-maths",
    createdAt: at(1, "13:20"),
  },
  {
    id: "task-ali-2",
    studentId: "s-ali-hamza",
    teacherId: "t-hina-raza",
    kind: "challenge",
    title: "Simultaneous equations sprint",
    body: "Eight pairs of simultaneous equations by elimination. Ten minutes, no calculator.",
    dueAt: daysAgoISO(-1),
    points: 25,
    status: "assigned",
    mandatory: false,
    activityType: "daily_challenge",
    expectedMinutes: 10,
    spaceId: "gulberg-o1-ol-maths",
    createdAt: at(0, "08:00"),
  },
];

export const TASKS: Task[] = singleton("tasks", () => [...SEED_TASKS]);

function byDue(a: Task, b: Task): number {
  return a.dueAt.localeCompare(b.dueAt) || a.createdAt.localeCompare(b.createdAt);
}

export function tasksForStudent(studentId: string): Task[] {
  return TASKS.filter((t) => t.studentId === studentId).sort(byDue);
}

export function tasksForTeacher(teacherId: string, studentId?: string): Task[] {
  return TASKS.filter((t) => t.teacherId === teacherId && (!studentId || t.studentId === studentId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function taskById(id: string): Task | undefined {
  return TASKS.find((t) => t.id === id);
}

/** Adds a task; the oldest done tasks are dropped once a student passes the cap. */
export function addTask(input: Omit<Task, "id" | "status" | "createdAt" | "doneAt">): Task {
  const task: Task = { ...input, id: `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, status: "assigned", createdAt: new Date().toISOString() };
  TASKS.push(task);
  const mine = TASKS.filter((t) => t.studentId === input.studentId);
  if (mine.length > PER_STUDENT_CAP) {
    const drop = new Set(mine.filter((t) => t.status === "done").slice(0, mine.length - PER_STUDENT_CAP).map((t) => t.id));
    for (let i = TASKS.length - 1; i >= 0; i -= 1) if (drop.has(TASKS[i].id)) TASKS.splice(i, 1);
  }
  return task;
}

export function setTaskStatus(task: Task, status: Task["status"], now = new Date().toISOString()): Task {
  task.status = status;
  task.doneAt = status === "done" ? now : undefined;
  return task;
}

export function removeTask(id: string): boolean {
  const index = TASKS.findIndex((t) => t.id === id);
  if (index < 0) return false;
  TASKS.splice(index, 1);
  return true;
}
