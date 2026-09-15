/**
 * Attendance register. GET returns the register for one lesson; POST opens,
 * closes or reopens a lesson, or marks everyone present; PATCH sets one
 * student's status (with the official reason for exempt, leave and bunk).
 * Teachers act only on their own lessons; principals and the chairman on any in their branch.
 *
 * The seat gate, the payload shape and the guardian notice live in
 * lib/data/attendance-register.ts, which the agent route shares.
 */
import { getViewer } from "@/lib/auth/viewer";
import { lessonForViewer, notifyGuardian, registerPayload } from "@/lib/data/attendance-register";
import { closeLesson, marksForLesson, openLesson, reopenLesson, setAll, setMark } from "@/lib/data/mock/attendance";
import { audit } from "@/lib/data/mock/notify";
import { studentsInClass } from "@/lib/data/mock/people";
import { isAttendanceStatus, validateMark } from "@/lib/domain/attendance";

const CLOSED_MESSAGE = "The register is closed. Reopen it to change a mark.";

export async function GET(req: Request) {
  const viewer = await getViewer();
  const lesson = lessonForViewer(viewer, new URL(req.url).searchParams.get("lessonId"));
  if (!lesson) return Response.json({ error: "forbidden" }, { status: 403 });
  return Response.json(registerPayload(lesson));
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  const body = (await req.json().catch(() => ({}))) as { lessonId?: string; action?: string };
  const lesson = lessonForViewer(viewer, body.lessonId);
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
  const lesson = lessonForViewer(viewer, body.lessonId);
  if (!lesson) return Response.json({ error: "forbidden" }, { status: 403 });
  if (lesson.status === "closed") return Response.json({ error: CLOSED_MESSAGE }, { status: 409 });
  if (!body.studentId || !studentsInClass(lesson.classId).some((s) => s.id === body.studentId)) return Response.json({ error: "unknown student" }, { status: 400 });
  const status = body.status ?? "";
  const note = typeof body.note === "string" ? body.note : "";
  const problem = validateMark(status, note);
  if (problem || !isAttendanceStatus(status)) return Response.json({ error: problem ?? "bad status" }, { status: 400 });
  const previous = marksForLesson(lesson.id).find((m) => m.studentId === body.studentId)?.status ?? null;
  const mark = setMark(lesson, body.studentId, status, note, viewer.personId, new Date().toISOString());
  audit(viewer.personId, "attendance.mark", "lesson", lesson.id, { studentId: body.studentId, status });
  notifyGuardian(lesson, body.studentId, status, previous, viewer.personId);
  return Response.json({ mark });
}
