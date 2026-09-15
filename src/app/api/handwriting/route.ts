/**
 * POST /api/handwriting — read a handwritten answer back as text.
 *
 * The ink pad sends a PNG of the student's working; Gemini vision transcribes
 * it so the existing Mark-Scheme Marker can score it exactly like a typed
 * answer. The transcription is returned to the student to check and edit
 * before it is submitted: a misread word must never become a wrong mark the
 * student cannot see or correct.
 */
import { NextResponse } from "next/server";
import { transcribe } from "@/lib/ai/handwriting";
import { viewerRestriction } from "@/lib/auth/access";
import { getViewer } from "@/lib/auth/viewer";

export const runtime = "nodejs";

const MAX_QUESTION_CHARS = 600;

interface Body {
  image?: string;
  question?: string;
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (viewerRestriction(viewer)) {
    return NextResponse.json({ error: "This seat is currently restricted." }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  if (typeof body.image !== "string" || !body.image.startsWith("data:image/")) {
    return NextResponse.json({ error: "Send the answer sheet as a PNG data URL." }, { status: 400 });
  }

  const result = await transcribe(body.image, (body.question ?? "").slice(0, MAX_QUESTION_CHARS));
  if (!result) {
    return NextResponse.json(
      { error: "Handwriting reading is not available right now. Type your answer instead." },
      { status: 503 },
    );
  }
  if (!result.text) {
    return NextResponse.json(
      { error: "That could not be read. Write a little larger, or type the answer instead." },
      { status: 422 },
    );
  }
  return NextResponse.json({ text: result.text, live: result.live });
}
