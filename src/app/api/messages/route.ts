/**
 * Messages and notifications. Teachers POST a notice to a class or one
 * student, optionally to their guardians; a coordinator or principal may write
 * to any class in their own branch. A show-cause notice always reaches
 * guardians and is queued as an email, and any notice may request the email
 * channel as well. Anyone GETs their own notifications and PATCHes them read.
 * Notifications are keyed by the person id: the student id for students, the
 * guardian id for parents, the staff id otherwise.
 */
import { getViewer } from "@/lib/auth/viewer";
import type { Persona } from "@/lib/auth/personas";
import { classById, studentById, studentsInClass } from "@/lib/data/mock/people";
import { audit, markRead, notificationsFor, notify, queueMail } from "@/lib/data/mock/notify";
import { classesForBranch, spacesForTeacher } from "@/lib/data/repo";

type MessageKind = "message" | "show-cause";

interface SendBody {
  target?: { classId?: string; studentId?: string };
  toGuardians?: boolean;
  toStudents?: boolean;
  kind?: string;
  email?: boolean;
  subject?: string;
  body?: string;
}

function inboxId(viewer: Persona): string {
  return viewer.studentId ?? viewer.guardianId ?? viewer.personId;
}

/** Classes this seat may write to: a teacher's own spaces, or every class in a coordinator's or principal's branch. */
function writableClassIds(viewer: Persona): Set<string> {
  if (viewer.role === "teacher") return new Set(spacesForTeacher(viewer.personId).map((s) => s.classId));
  if ((viewer.role === "coordinator" || viewer.role === "principal") && viewer.branchId) return new Set(classesForBranch(viewer.branchId, true).map((c) => c.id));
  return new Set();
}

export async function GET() {
  const viewer = await getViewer();
  return Response.json({ notifications: notificationsFor(inboxId(viewer)) });
}

export async function PATCH(req: Request) {
  const viewer = await getViewer();
  const body = (await req.json().catch(() => ({}))) as { ids?: string[] };
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string") : undefined;
  return Response.json({ marked: markRead(inboxId(viewer), ids) });
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  const allowed = writableClassIds(viewer);
  if (!allowed.size) return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as SendBody;

  const kind: MessageKind = body.kind === "show-cause" ? "show-cause" : "message";
  const subject = (body.subject ?? "").trim();
  const text = (body.body ?? "").trim();
  if (subject.length < 3) return Response.json({ error: "Add a subject." }, { status: 400 });
  if (text.length < 3) return Response.json({ error: "Write the message." }, { status: 400 });

  const student = body.target?.studentId ? studentById.get(body.target.studentId) : undefined;
  const classId = student?.classId ?? body.target?.classId;
  if (!classId || !allowed.has(classId)) return Response.json({ error: viewer.role === "teacher" ? "That class is not one of your spaces." : "That class is not in your branch." }, { status: 403 });
  if (body.target?.studentId && !student) return Response.json({ error: "unknown student" }, { status: 400 });

  const students = student ? [student] : studentsInClass(classId);
  const toGuardians = kind === "show-cause" || Boolean(body.toGuardians);
  const toStudents = body.toStudents !== false;
  if (!toStudents && !toGuardians) return Response.json({ error: "Pick at least one recipient group." }, { status: 400 });

  const studentIds = toStudents ? students.map((s) => s.id) : [];
  const guardianIds = toGuardians ? [...new Set(students.map((s) => s.guardianId))] : [];
  const className = classById.get(classId)?.name ?? classId;
  const title = kind === "show-cause" ? `Show-cause notice: ${subject}` : subject;
  const href = "/portal/learn/inbox";

  if (studentIds.length) notify({ personIds: studentIds }, { kind, title, body: text, href, fromId: viewer.personId });
  if (guardianIds.length) notify({ personIds: guardianIds }, { kind, title, body: text, href: "/portal/family/messages", fromId: viewer.personId });

  let emails = 0;
  if (kind === "show-cause" || body.email) {
    for (const gid of guardianIds) {
      queueMail(gid, "email", title, text);
      emails += 1;
    }
  }

  audit(viewer.personId, kind === "show-cause" ? "message.show_cause" : "message.send", "message", undefined, {
    classId,
    className,
    studentId: student?.id,
    subject,
    students: studentIds.length,
    guardians: guardianIds.length,
    emails,
  });
  return Response.json({ students: studentIds.length, guardians: guardianIds.length, emails });
}
