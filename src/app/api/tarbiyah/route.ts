/**
 * Tarbiyah observations. Staff who manage the student POST one; praise is
 * pushed to the guardian for tonight's brief, a concern to the class teacher
 * and the branch principal. Every entry is audited.
 */
import { mayManage } from "@/lib/auth/manage";
import { getViewer } from "@/lib/auth/viewer";
import { audit, notify } from "@/lib/data/mock/notify";
import { classById, LEADERS, studentById } from "@/lib/data/mock/people";
import { addTarbiyahLog, isTarbiyahKind } from "@/lib/data/mock/tarbiyah";
import { todayISO } from "@/lib/utils";

export async function POST(req: Request) {
  const viewer = await getViewer();
  const body = (await req.json().catch(() => ({}))) as { studentId?: string; kind?: string; positive?: boolean; note?: string };
  const student = body.studentId ? studentById.get(body.studentId) : undefined;
  if (!student || !mayManage(viewer, student)) return Response.json({ error: "forbidden" }, { status: 403 });
  if (!isTarbiyahKind(body.kind)) return Response.json({ error: "Pick a kind." }, { status: 400 });
  const note = (body.note ?? "").trim().slice(0, 400);
  if (note.length < 5) return Response.json({ error: "Write one specific sentence." }, { status: 400 });
  const positive = body.kind === "concern" ? false : Boolean(body.positive);
  const log = addTarbiyahLog({ studentId: student.id, teacherId: viewer.personId, date: todayISO(), kind: body.kind, positive, note });

  if (positive) notify({ personIds: [student.guardianId] }, { kind: "message", title: `${student.firstName}: ${body.kind} noted today`, body: note, href: "/portal/family", fromId: viewer.personId });
  else {
    const cls = classById.get(student.classId);
    const principal = LEADERS.find((p) => p.role === "principal" && p.branchId === student.branchId);
    const ids = [cls?.classTeacherId, principal?.id].filter((x): x is string => Boolean(x) && x !== viewer.personId);
    if (ids.length) notify({ personIds: ids }, { kind: "message", title: `Concern logged for ${student.name}`, body: note, href: `/portal/teach/students/${student.id}`, fromId: viewer.personId });
  }
  audit(viewer.personId, "tarbiyah.log", "student", student.id, { student: student.name, kind: body.kind, positive });
  return Response.json({ log });
}
