import { getViewer } from "@/lib/auth/viewer";
import { classById, studentById } from "@/lib/data/mock/people";
import { spaceById } from "@/lib/data/mock/spaces";
import { run, type TutorTurn } from "@/lib/ai/tutor";

interface Body {
  spaceId?: string;
  messages?: TutorTurn[];
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  const student = viewer.role === "student" && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return Response.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Body;
  const space = body.spaceId ? spaceById.get(body.spaceId) : undefined;
  if (!space || space.classId !== student.classId) return Response.json({ error: "unknown space" }, { status: 400 });
  const messages = Array.isArray(body.messages) ? body.messages.filter((m) => (m.role === "student" || m.role === "tutor") && typeof m.text === "string").slice(-20) : [];
  if (!messages.length) return Response.json({ error: "empty" }, { status: 400 });

  const grade = classById.get(student.classId)?.name ?? "";
  const out = await run({ spaceId: space.id, firstName: student.firstName, grade, messages });
  return Response.json(out);
}
