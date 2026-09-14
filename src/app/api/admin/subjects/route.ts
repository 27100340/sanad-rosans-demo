import { getViewer } from "@/lib/auth/viewer";
import { addSubject, listSubjects, type NewSubjectInput } from "@/lib/data/repo";

function canAdmin(role: string) {
  return role === "principal" || role === "chairman";
}

export async function GET() {
  const viewer = await getViewer();
  if (!canAdmin(viewer.role)) return Response.json({ error: "forbidden" }, { status: 403 });
  return Response.json({ subjects: listSubjects() });
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!canAdmin(viewer.role)) return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as Partial<NewSubjectInput>;
  const out = addSubject({
    name: typeof body.name === "string" ? body.name : "",
    code: typeof body.code === "string" ? body.code : undefined,
    board: typeof body.board === "string" ? body.board : undefined,
    sections: Array.isArray(body.sections) ? body.sections : [],
    strands: Array.isArray(body.strands) ? body.strands.filter((s): s is string => typeof s === "string") : [],
  });
  if (out.error) return Response.json({ error: out.error }, { status: 400 });
  return Response.json({ subject: out.subject });
}
