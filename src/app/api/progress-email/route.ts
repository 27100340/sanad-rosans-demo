/**
 * Progress email for one student. POST composes (AI with fallback) and
 * returns the draft; PUT queues the edited email to the guardian or the
 * student, notifies them in-app and audits it. Teachers may act on students
 * in their spaces; the principal and chairman on any in their branch.
 */
import { buildProgressStats, composeProgressEmail } from "@/lib/ai/progress-report";
import { mayManage } from "@/lib/auth/manage";
import { getViewer } from "@/lib/auth/viewer";
import { audit, notify, queueMail, personName } from "@/lib/data/mock/notify";
import { guardianById, studentById } from "@/lib/data/mock/people";

export async function POST(req: Request) {
  const viewer = await getViewer();
  const body = (await req.json().catch(() => ({}))) as { studentId?: string; forParent?: boolean; language?: string };
  const student = body.studentId ? studentById.get(body.studentId) : undefined;
  if (!student || !mayManage(viewer, student)) return Response.json({ error: "forbidden" }, { status: 403 });
  const stats = buildProgressStats(student.id);
  if (!stats) return Response.json({ error: "unknown student" }, { status: 400 });
  const guardian = guardianById.get(student.guardianId);
  const forParent = Boolean(body.forParent) && Boolean(guardian);
  const language = body.language === "ur" ? "ur" : "en";
  const out = await composeProgressEmail({ stats, forParent, recipientName: forParent ? (guardian?.name ?? "Parent") : student.firstName, language, senderName: personName(viewer.personId) });
  return Response.json(out);
}

export async function PUT(req: Request) {
  const viewer = await getViewer();
  const body = (await req.json().catch(() => ({}))) as { studentId?: string; forParent?: boolean; subject?: string; body?: string };
  const student = body.studentId ? studentById.get(body.studentId) : undefined;
  if (!student || !mayManage(viewer, student)) return Response.json({ error: "forbidden" }, { status: 403 });
  const subject = (body.subject ?? "").trim().slice(0, 200);
  const text = (body.body ?? "").trim().slice(0, 6000);
  if (subject.length < 3 || text.length < 10) return Response.json({ error: "Subject and body are needed." }, { status: 400 });
  const to = body.forParent ? student.guardianId : student.id;
  queueMail(to, "email", subject, text);
  notify({ personIds: [to] }, { kind: "report", title: subject, body: text.slice(0, 280), href: body.forParent ? "/portal/family/reports" : "/portal/learn/progress", fromId: viewer.personId });
  audit(viewer.personId, "progress.email", "student", student.id, { student: student.name, to: personName(to), subject });
  return Response.json({ queued: 1 });
}
