/**
 * Attachments. POST uploads (teacher: any scope in their spaces; student: only
 * "submission:<their submission id>"), GET ?id= streams the bytes to anyone
 * who may see the scope, DELETE removes the uploader's own file.
 */
import { getViewer } from "@/lib/auth/viewer";
import type { Persona } from "@/lib/auth/personas";
import { FILES, fileBytes, filesFor, removeFile, storeFile } from "@/lib/data/mock/files";
import { ASSIGNMENTS, spaceById } from "@/lib/data/mock/spaces";
import { testById } from "@/lib/data/mock/tests";
import { audit } from "@/lib/data/mock/notify";

/** Which space a scope belongs to, so ownership can be checked. */
function spaceOfScope(scope: string): string | null {
  const [kind, id] = scope.split(":", 2);
  if (kind === "resource") return id;
  if (kind === "assignment") return ASSIGNMENTS.find((a) => a.id === id)?.spaceId ?? null;
  if (kind === "test") return testById.get(id)?.spaceId ?? null;
  if (kind === "submission") return ASSIGNMENTS.find((a) => a.submissions.some((s) => s.id === id))?.spaceId ?? null;
  return null;
}

function mayWrite(viewer: Persona, scope: string): boolean {
  const spaceId = spaceOfScope(scope);
  if (!spaceId) return false;
  const space = spaceById.get(spaceId);
  if (!space) return false;
  if (viewer.role === "teacher") return space.teacherId === viewer.personId;
  if (viewer.role === "student" && scope.startsWith("submission:")) {
    const id = scope.slice("submission:".length);
    return ASSIGNMENTS.some((a) => a.submissions.some((s) => s.id === id && s.studentId === viewer.studentId));
  }
  return false;
}

function mayRead(viewer: Persona, scope: string): boolean {
  if (mayWrite(viewer, scope)) return true;
  const spaceId = spaceOfScope(scope);
  const space = spaceId ? spaceById.get(spaceId) : undefined;
  if (!space) return false;
  if (viewer.role === "principal" || viewer.role === "chairman") return true;
  if (viewer.role === "student") return !scope.startsWith("submission:") && Boolean(viewer.studentId) && space.classId === (space.classId && spaceById.get(space.id)?.classId);
  return false;
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  const body = (await req.json().catch(() => ({}))) as { scope?: string; name?: string; dataUrl?: string };
  if (!body.scope || !body.name || !body.dataUrl || !mayWrite(viewer, body.scope)) return Response.json({ error: "forbidden" }, { status: 403 });
  const out = storeFile({ ownerId: viewer.personId, scope: body.scope, name: body.name, dataUrl: body.dataUrl });
  if (!out.file) return Response.json({ error: out.error }, { status: 400 });
  audit(viewer.personId, "file.upload", "file", out.file.id, { scope: body.scope, name: out.file.name, bytes: out.file.bytes });
  return Response.json({ file: out.file });
}

export async function GET(req: Request) {
  const viewer = await getViewer();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const scope = url.searchParams.get("scope");
  if (scope) {
    if (!mayRead(viewer, scope)) return Response.json({ error: "forbidden" }, { status: 403 });
    return Response.json({ files: filesFor(scope) });
  }
  const file = id ? FILES.get(id) : undefined;
  if (!file || !mayRead(viewer, file.scope)) return Response.json({ error: "not found" }, { status: 404 });
  const bytes = fileBytes(file.id);
  if (!bytes) return Response.json({ error: "not found" }, { status: 404 });
  return new Response(bytes, { headers: { "content-type": file.contentType, "content-disposition": `inline; filename="${file.name}"`, "cache-control": "private, no-store" } });
}

export async function DELETE(req: Request) {
  const viewer = await getViewer();
  const body = (await req.json().catch(() => ({}))) as { id?: string };
  const file = body.id ? FILES.get(body.id) : undefined;
  if (!file || file.ownerId !== viewer.personId) return Response.json({ error: "forbidden" }, { status: 403 });
  removeFile(file.id);
  audit(viewer.personId, "file.delete", "file", file.id, { scope: file.scope });
  return Response.json({ ok: true });
}
