/**
 * Attendance register. GET returns the register for one lesson; POST opens,
 * closes or reopens a lesson, or marks everyone present; PATCH sets one
 * student's status (with the official reason for exempt / leave).
 * Teachers act only on their own lessons; principals and the chairman on any in their branch.
 */
import { getViewer } from "@/lib/auth/viewer";
import type { Persona } from "@/lib/auth/personas";
import { classById, studentsInClass } from "@/lib/data/mock/people";
import { closeLesson, lessonById, marksForLesson, openLesson, reopenLesson, setAll, setMark } from "@/lib/data/mock/attendance";
import { isAttendanceStatus, validateMark, type Lesson } from "@/lib/domain/attendance";
import { audit, notify } from "@/lib/data/mock/notify";
import { studentById } from "@/lib/data/mock/people";

function canTouch(viewer: Persona, lesson: Lesson): boolean {
  if (viewer.role === "teacher") return lesson.teacherId === viewer.personId;
  if (viewer.role === "principal" || viewer.role === "chairman") {
    const cls = classById.get(lesson.classId);
    return Boolean(cls) && (viewer.branchId === null || cls?.branchId === viewer.branchId);
  }
  return false;
}

async function lessonFor(viewer: Persona, lessonId: string | null | undefined) {
  const lesson = lessonId ? lessonById.get(lessonId) : undefined;
  return lesson && canTouch(viewer, lesson) ? lesson : null;
}

function registerPayload(lesson: Lesson) {
  const marks = new Map(marksForLesson(lesson.id).map((m) => [m.studentId, m]));
  return {
    lesson,
    rows: studentsInClass(lesson.classId).map((s) => ({ studentId: s.id, name: s.name, status: marks.get(s.id)?.status ?? null, note: marks.get(s.id)?.note ?? "" })),
  };
}

export async function GET(req: Request) {
  const viewer = await getViewer();
  const lesson = await lessonFor(viewer, new URL(req.url).searchParams.get("lessonId"));
  if (!lesson) return Response.json({ error: "forbidden" }, { status: 403 });
  return Response.json(registerPayload(lesson));
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  const body = (await req.json().catch(() => ({}))) as { lessonId?: string; action?: string };
  const lesson = await lessonFor(viewer, body.lessonId);
  if (!lesson) return Response.json({ error: "forbidden" }, { status: 403 });
  const now = new Date().toISOString();
  switch (body.action) {
    case "open":
      openLesson(lesson, now);
      break;
    case "close":
      closeLesson(lesson, now);
      break;
    case "reopen":
      reopenLesson(lesson);
      break;
    case "all-present":
      openLesson(lesson, now);
      setAll(lesson, "present", viewer.personId, now);
      break;
    default:
      return Response.json({ error: "unknown action" }, { status: 400 });
  }
  audit(viewer.personId, `lesson.${body.action}`, "lesson", lesson.id);
  return Response.json(registerPayload(lesson));
}

export async function PATCH(req: Request) {
  const viewer = await getViewer();
  const body = (await req.json().catch(() => ({}))) as { lessonId?: string; studentId?: string; status?: string; note?: string };
  const lesson = await lessonFor(viewer, body.lessonId);
  if (!lesson) return Response.json({ error: "forbidden" }, { status: 403 });
  if (lesson.status === "closed") return Response.json({ error: "The register is closed. Reopen it to change a mark." }, { status: 409 });
  if (!body.studentId || !studentsInClass(lesson.classId).some((s) => s.id === body.studentId)) return Response.json({ error: "unknown student" }, { status: 400 });
  const status = body.status ?? "";
  const note = typeof body.note === "string" ? body.note : "";
  const problem = validateMark(status, note);
  if (problem || !isAttendanceStatus(status)) return Response.json({ error: problem ?? "bad status" }, { status: 400 });
  const previous = marksForLesson(lesson.id).find((m) => m.studentId === body.studentId)?.status;
  const mark = setMark(lesson, body.studentId, status, note, viewer.personId, new Date().toISOString());
  audit(viewer.personId, "attendance.mark", "lesson", lesson.id, { studentId: body.studentId, status });
  if (status === "absent" && previous !== "absent") {
    const student = studentById.get(body.studentId);
    if (student) notify({ personIds: [student.guardianId] }, { kind: "attendance", title: `${student.firstName} was marked absent`, body: `${lesson.subject}, period ${lesson.period}, ${lesson.date}. Reply to the class teacher if this is unexpected.`, href: "/portal/family", fromId: viewer.personId });
  }
  return Response.json({ mark });
}
