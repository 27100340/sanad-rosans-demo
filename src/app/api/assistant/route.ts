import { viewerRestriction } from "@/lib/auth/access";
import { getViewer } from "@/lib/auth/viewer";
import {
  QUESTION_MAX_CHARS,
  canUseAssistant,
  confirmLessonDraft,
  runAssistant,
} from "@/lib/ai/assistant-agent";

const WRITE_TOOL = "create_lesson_draft";

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (viewerRestriction(viewer))
    return Response.json(
      { error: "This seat is currently restricted." },
      { status: 403 },
    );
  // Students keep the study tutor at /portal/learn/tutor and parents keep the
  // family views; neither seat reaches the staff assistant or its tools.
  if (!canUseAssistant(viewer))
    return Response.json(
      { error: "The staff assistant is not available on this seat." },
      { status: 403 },
    );
  try {
    const body = await req.json();
    if (body.execute) {
      // The only mutation, and only ever from an explicit user confirmation:
      // the model can propose this write but never execute it.
      if (body.execute !== WRITE_TOOL || body.confirmed !== true)
        throw new Error("Unknown tool or missing confirmation.");
      return Response.json(confirmLessonDraft(viewer, String(body.classId)));
    }
    const question = String(body.message ?? "").trim();
    if (!question || question.length > QUESTION_MAX_CHARS)
      throw new Error(`Enter a request of 1–${QUESTION_MAX_CHARS.toLocaleString()} characters.`);
    return Response.json(await runAssistant(viewer, question));
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Invalid assistant request" },
      { status: 400 },
    );
  }
}
