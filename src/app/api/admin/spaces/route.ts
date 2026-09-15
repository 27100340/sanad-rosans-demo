import { getViewer } from "@/lib/auth/viewer";
import { addSpace, reassignSpace } from "@/lib/data/repo";
import { classById } from "@/lib/data/mock/people";

function canAdmin(role: string) {
  return role === "principal" || role === "chairman" || role === "superadmin";
}

/** POST: assign a subject to a class and a teacher, creating a Subject Space. */
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!canAdmin(viewer.role)) return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { subjectId?: string; classId?: string; teacherId?: string };
  const cls = body.classId ? classById.get(body.classId) : undefined;
  if (viewer.branchId && cls && cls.branchId !== viewer.branchId) return Response.json({ error: "That class is in another campus." }, { status: 403 });
  const out = addSpace({ subjectId: body.subjectId ?? "", classId: body.classId ?? "", teacherId: body.teacherId ?? "" });
  if (out.error) return Response.json({ error: out.error }, { status: 400 });
  return Response.json({ space: { id: out.space!.id, subject: out.space!.subject, classId: out.space!.classId, teacherId: out.space!.teacherId } });
}

/** PATCH: move an existing space to another teacher. */
export async function PATCH(req: Request) {
  const viewer = await getViewer();
  if (!canAdmin(viewer.role)) return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { spaceId?: string; teacherId?: string };
  const out = reassignSpace(body.spaceId ?? "", body.teacherId ?? "");
  if (out.error) return Response.json({ error: out.error }, { status: 400 });
  return Response.json({ ok: true });
}
