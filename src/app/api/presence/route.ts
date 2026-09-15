/** Presence beacon (POST from every seat) and the online list (GET, staff only, scoped to their students). */
import { getViewer } from "@/lib/auth/viewer";
import { onlineNow, recordPresence } from "@/lib/data/mock/presence";
import { personName } from "@/lib/data/mock/notify";
import { STUDENTS, studentsInClass, TEACHERS } from "@/lib/data/mock/people";
import { spacesForTeacher } from "@/lib/data/repo";

export async function POST(req: Request) {
  const viewer = await getViewer();
  const body = (await req.json().catch(() => ({}))) as { path?: string };
  recordPresence(viewer.studentId ?? viewer.guardianId ?? viewer.personId, typeof body.path === "string" ? body.path : "/portal");
  return Response.json({ ok: true });
}

export async function GET() {
  const viewer = await getViewer();
  let ids: string[] = [];
  if (viewer.role === "teacher") ids = [...new Set(spacesForTeacher(viewer.personId).map((s) => s.classId))].flatMap((c) => studentsInClass(c).map((s) => s.id));
  else if (["principal", "chairman", "superadmin"].includes(viewer.role)) ids = [...STUDENTS.filter((s) => viewer.branchId === null || s.branchId === viewer.branchId).map((s) => s.id), ...TEACHERS.filter((t) => viewer.branchId === null || t.branchId === viewer.branchId).map((t) => t.id)];
  else return Response.json({ error: "forbidden" }, { status: 403 });
  return Response.json({ online: onlineNow(ids).map((p) => ({ ...p, name: personName(p.personId) })) });
}
