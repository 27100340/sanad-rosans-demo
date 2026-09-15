/**
 * Assignment Designer: a teacher's brief in words becomes selection criteria
 * and a concrete question set from the bank (Groq, with a deterministic
 * keyword fallback). Nothing is saved; the builder loads the result.
 */
import { getViewer } from "@/lib/auth/viewer";
import { spaceById } from "@/lib/data/mock/spaces";
import { design } from "@/lib/ai/designer";
import { maxMarksOf } from "@/lib/domain/assessment";

export async function POST(req: Request) {
  const viewer = await getViewer();
  const body = (await req.json().catch(() => ({}))) as { spaceId?: string; brief?: string };
  const space = body.spaceId ? spaceById.get(body.spaceId) : undefined;
  if (viewer.role !== "teacher" || !space || space.teacherId !== viewer.personId) return Response.json({ error: "forbidden" }, { status: 403 });
  const brief = typeof body.brief === "string" ? body.brief.trim() : "";
  if (brief.length < 8) return Response.json({ error: "Describe the assignment in a sentence or two." }, { status: 400 });
  const out = await design({ brief, space });
  return Response.json({ criteria: out.criteria, questions: out.questions, maxMarks: maxMarksOf(out.questions), live: out.live });
}
