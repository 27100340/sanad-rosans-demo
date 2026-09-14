/**
 * Personal tasks. Students GET their own list and PATCH a status; teachers
 * POST a task for a student or a whole class (one record per student, each
 * notified) and DELETE tasks they created. Every teacher write is audited.
 */
import { getViewer } from "@/lib/auth/viewer";
import type { Persona } from "@/lib/auth/personas";
import { classById, studentById, studentsInClass } from "@/lib/data/mock/people";
import { addTask, removeTask, setTaskStatus, taskById, tasksForStudent, tasksForTeacher } from "@/lib/data/mock/tasks";
import { audit, notify } from "@/lib/data/mock/notify";
import { spacesForTeacher } from "@/lib/data/repo";
import { isActivityType, isTaskKind, isTaskStatus, type Task } from "@/lib/domain/tasks";
import { daysAgoISO } from "@/lib/utils";

const MAX_POINTS = 500;
const MAX_MINUTES = 600;
const DEFAULT_DUE_DAYS = 3;

interface CreateBody {
  studentIds?: string[];
  classId?: string;
  kind?: string;
  title?: string;
  body?: string;
  dueAt?: string;
  points?: number;
  mandatory?: boolean;
  activityType?: string;
  expectedMinutes?: number;
  resourceUrl?: string;
  spaceId?: string;
}

function teacherClassIds(viewer: Persona): Set<string> {
  return new Set(spacesForTeacher(viewer.personId).map((s) => s.classId));
}

function clampInt(value: unknown, fallback: number, max: number): number {
  const n = typeof value === "number" ? Math.round(value) : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : fallback;
}

export async function GET(req: Request) {
  const viewer = await getViewer();
  if (viewer.role === "student" && viewer.studentId) return Response.json({ tasks: tasksForStudent(viewer.studentId) });
  if (viewer.role === "teacher") {
    const studentId = new URL(req.url).searchParams.get("studentId") ?? undefined;
    return Response.json({ tasks: tasksForTeacher(viewer.personId, studentId) });
  }
  return Response.json({ error: "forbidden" }, { status: 403 });
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (viewer.role !== "teacher") return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as CreateBody;

  const title = (body.title ?? "").trim();
  if (title.length < 3) return Response.json({ error: "Give the task a title." }, { status: 400 });
  if (!isTaskKind(body.kind)) return Response.json({ error: "Pick task or challenge." }, { status: 400 });
  if (!isActivityType(body.activityType)) return Response.json({ error: "Pick an activity type." }, { status: 400 });
  const dueAt = /^\d{4}-\d{2}-\d{2}$/.test(body.dueAt ?? "") ? (body.dueAt as string) : daysAgoISO(-DEFAULT_DUE_DAYS);

  const allowed = teacherClassIds(viewer);
  let students = [];
  if (body.classId) {
    if (!allowed.has(body.classId)) return Response.json({ error: "That class is not one of your spaces." }, { status: 403 });
    students = studentsInClass(body.classId);
  } else {
    const ids = Array.isArray(body.studentIds) ? body.studentIds : [];
    students = ids.map((id) => studentById.get(id)).filter((s): s is NonNullable<typeof s> => Boolean(s) && allowed.has(s?.classId ?? ""));
    if (students.length !== ids.length) return Response.json({ error: "Pick a student from one of your classes." }, { status: 400 });
  }
  if (!students.length) return Response.json({ error: "No students to assign to." }, { status: 400 });

  const fields: Omit<Task, "id" | "status" | "createdAt" | "doneAt" | "studentId"> = {
    teacherId: viewer.personId,
    kind: body.kind,
    title,
    body: (body.body ?? "").trim(),
    dueAt,
    points: clampInt(body.points, 10, MAX_POINTS),
    mandatory: Boolean(body.mandatory),
    activityType: body.activityType,
    expectedMinutes: clampInt(body.expectedMinutes, 20, MAX_MINUTES),
    resourceUrl: body.resourceUrl?.trim() || undefined,
    spaceId: body.spaceId?.trim() || undefined,
  };

  const created = students.map((s) => addTask({ ...fields, studentId: s.id }));
  const className = body.classId ? classById.get(body.classId)?.name : undefined;
  for (const task of created) {
    notify({ personIds: [task.studentId] }, {
      kind: task.kind,
      title: task.kind === "challenge" ? `New challenge: ${task.title}` : `New task: ${task.title}`,
      body: `${task.mandatory ? "Mandatory. " : ""}Due ${task.dueAt} · ${task.points} points`,
      href: "/portal/learn/tasks",
      fromId: viewer.personId,
    });
  }
  audit(viewer.personId, "task.create", "task", created[0]?.id, { count: created.length, kind: fields.kind, title, classId: body.classId, className, dueAt });
  return Response.json({ created: created.length, tasks: created });
}

export async function PATCH(req: Request) {
  const viewer = await getViewer();
  if (viewer.role !== "student" || !viewer.studentId) return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { taskId?: string; status?: string };
  const task = body.taskId ? taskById(body.taskId) : undefined;
  if (!task || task.studentId !== viewer.studentId) return Response.json({ error: "unknown task" }, { status: 404 });
  if (!isTaskStatus(body.status)) return Response.json({ error: "unknown status" }, { status: 400 });
  setTaskStatus(task, body.status);
  return Response.json({ task });
}

export async function DELETE(req: Request) {
  const viewer = await getViewer();
  if (viewer.role !== "teacher") return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { taskId?: string };
  const task = body.taskId ? taskById(body.taskId) : undefined;
  if (!task || task.teacherId !== viewer.personId) return Response.json({ error: "unknown task" }, { status: 404 });
  removeTask(task.id);
  audit(viewer.personId, "task.delete", "task", task.id, { title: task.title, studentId: task.studentId });
  return Response.json({ ok: true });
}
