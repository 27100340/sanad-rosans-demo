/**
 * Instant marking for a paper the teacher is trying themselves. Multiple choice
 * is decided without a model; written answers go to the examiner, which falls
 * back to the keyword rubric when Groq is unavailable. Each question reports
 * how it was marked.
 *
 * Nothing is persisted here: a teacher checking their own paper must not land
 * in the class analytics. A student's sitting goes through ../attempt instead.
 */
import { getViewer } from "@/lib/auth/viewer";
import { viewerRestriction } from "@/lib/auth/access";
import { markPaper } from "../../_ai/examiner";
import { paperById, physicsQuestions } from "@/lib/data/physics";
import { pct } from "@/lib/domain/physics";
import { peopleById, teacherById } from "@/lib/data/mock/people";

const MAX_RESPONSE_CHARS = 2000;

interface Body {
  paperId?: string;
  responses?: unknown;
}

export function responseMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string") out[key] = value.slice(0, MAX_RESPONSE_CHARS);
  }
  return out;
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (viewer.role !== "teacher" || viewerRestriction(viewer)) return Response.json({ error: "The Exam Lab is a teacher tool." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Body;
  const paper = body.paperId ? paperById(body.paperId) : undefined;
  if (!paper) return Response.json({ error: "Build a paper before marking it." }, { status: 400 });
  if (paper.createdBy !== viewer.personId) return Response.json({ error: "That paper belongs to another teacher." }, { status: 403 });

  const questions = physicsQuestions(paper.questionIds);
  if (!questions.length) return Response.json({ error: "That paper has no questions left to mark." }, { status: 400 });

  // The marker addresses whoever sat the paper by name; here that is the
  // teacher trying their own, so drop the honorific before taking a first name.
  const fullName = teacherById.get(viewer.personId)?.name ?? peopleById.get(viewer.personId)?.name ?? viewer.label;
  const firstName = fullName.replace(/^(Ms\.|Mr\.|Mrs\.|Dr\.|Qari|Hafiz|Ustadh)\s+/i, "").split(" ")[0];

  const marked = await markPaper(questions, responseMap(body.responses), firstName);
  const awarded = marked.reduce((sum, q) => sum + (q.earned ?? 0), 0);
  const total = marked.reduce((sum, q) => sum + q.marks, 0);

  return Response.json({
    result: {
      awarded,
      total,
      percent: pct(awarded, total),
      perQuestion: marked,
    },
  });
}
