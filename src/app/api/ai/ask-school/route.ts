import { NextResponse } from "next/server";
import { run } from "@/lib/ai/ask-school";
import { getViewer } from "@/lib/auth/viewer";

const MAX_QUESTION_LENGTH = 300;

/** Ask the School: answers from aggregates only. Leadership and principals may ask. */
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!["chairman", "principal", "superadmin"].includes(viewer.role)) {
    return NextResponse.json({ error: "This seat cannot ask the school." }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { question?: string };
  const question = (body.question ?? "").trim().slice(0, MAX_QUESTION_LENGTH);
  if (!question) return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
  const answer = await run(question);
  return NextResponse.json(answer);
}
