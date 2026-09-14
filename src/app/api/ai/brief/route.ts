import { getViewer } from "@/lib/auth/viewer";
import { guardianById } from "@/lib/data/mock/people";
import { run, type BriefLanguage } from "@/lib/ai/brief";

interface Body {
  studentId?: string;
  language?: BriefLanguage;
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  const guardian = viewer.role === "parent" && viewer.guardianId ? guardianById.get(viewer.guardianId) : undefined;
  if (!guardian) return Response.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.studentId || !guardian.studentIds.includes(body.studentId)) return Response.json({ error: "not your ward" }, { status: 403 });
  const language: BriefLanguage = body.language === "ur" ? "ur" : "en";

  const out = await run({ studentId: body.studentId, language });
  return Response.json(out);
}
