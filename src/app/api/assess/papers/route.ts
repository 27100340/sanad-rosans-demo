/**
 * Past-paper practice. POST starts (or resumes) a sitting and returns the
 * student-safe questions; PATCH answers one question (typed, or a photographed
 * script that is transcribed first), marks it at once and reveals that
 * question's key and mark-scheme crops; PATCH { finish } seals the sitting.
 * GET returns a sitting with everything revealed for answered questions.
 */
import { getViewer } from "@/lib/auth/viewer";
import { studentById } from "@/lib/data/mock/people";
import { finishPaperAttempt, paperAttemptById, recordPaperAnswer, startPaperAttempt, storeScriptImage } from "@/lib/data/mock/papers";
import { forStudentPaper, listPapers, paperQuestionById, questionsForPaper } from "@/lib/data/pastpapers";
import { markPaperQuestion } from "@/lib/ai/assess";
import { transcribe } from "@/lib/ai/handwriting";
import type { PaperAnswer } from "@/lib/domain/assessment";
import { paperTotal } from "@/lib/domain/assessment";

const MAX_RESPONSE_CHARS = 3000;

async function student() {
  const viewer = await getViewer();
  return viewer.role === "student" && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
}

function reveal(questionId: string) {
  const q = paperQuestionById.get(questionId);
  return q ? { answer: q.answer, msImg: q.msImg, msRows: q.msRows } : null;
}

export async function POST(req: Request) {
  const me = await student();
  if (!me) return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { code?: string; paperKey?: string; pace?: "paper" | "untimed" };
  const paper = listPapers().find((p) => p.code === body.code && p.paperKey === body.paperKey);
  if (!paper) return Response.json({ error: "unknown paper" }, { status: 400 });
  const attempt = startPaperAttempt(me.id, paper.code, paper.paperKey, body.pace === "untimed" ? "untimed" : "paper", new Date().toISOString());
  return Response.json({ attempt, paper, questions: questionsForPaper(paper.code, paper.paperKey).map(forStudentPaper), revealed: Object.fromEntries(attempt.answers.map((a) => [a.questionId, reveal(a.questionId)])) });
}

interface PatchBody {
  attemptId?: string;
  questionId?: string;
  response?: string;
  image?: string; // data URL of a photographed script
  secondsUsed?: number;
  finish?: boolean;
}

export async function PATCH(req: Request) {
  const me = await student();
  if (!me) return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as PatchBody;
  const attempt = body.attemptId ? paperAttemptById.get(body.attemptId) : undefined;
  if (!attempt || attempt.studentId !== me.id) return Response.json({ error: "unknown sitting" }, { status: 400 });
  const now = new Date().toISOString();

  if (body.finish) {
    finishPaperAttempt(attempt, now);
    return Response.json({ finished: true, total: paperTotal(attempt), maxMarks: attempt.maxMarks });
  }

  const q = body.questionId ? paperQuestionById.get(body.questionId) : undefined;
  if (!q || q.code !== attempt.code || q.paperKey !== attempt.paperKey) return Response.json({ error: "question not in this paper" }, { status: 400 });
  if (attempt.finishedAt) return Response.json({ error: "This sitting is finished." }, { status: 409 });

  let response = typeof body.response === "string" ? body.response.slice(0, MAX_RESPONSE_CHARS) : "";
  let imageId: string | undefined;
  let transcribed = false;
  if (typeof body.image === "string" && body.image.startsWith("data:image/")) {
    imageId = storeScriptImage(attempt.id, q.id, body.image);
    const t = await transcribe(body.image, q.ref);
    if (t === null) return Response.json({ error: "Handwriting reading is not available right now. Type your answer instead." }, { status: 503 });
    if (!t.text) return Response.json({ error: "The photo could not be read. Retake it in good light, or type the answer." }, { status: 422 });
    response = t.text;
    transcribed = true;
  }
  const marked = await markPaperQuestion(q, response, me.firstName);
  const answer: PaperAnswer = {
    questionId: q.id,
    response,
    imageId,
    transcribed,
    awarded: marked.awarded,
    points: marked.points,
    feedback: marked.feedback,
    status: response.trim() ? marked.status : "unanswered",
    secondsUsed: Math.max(0, Math.round(Number(body.secondsUsed) || 0)),
    answeredAt: now,
  };
  recordPaperAnswer(attempt, answer);
  return Response.json({ answer, revealed: reveal(q.id), total: paperTotal(attempt), maxMarks: attempt.maxMarks, live: marked.live });
}

export async function GET(req: Request) {
  const me = await student();
  if (!me) return Response.json({ error: "forbidden" }, { status: 403 });
  const attemptId = new URL(req.url).searchParams.get("attemptId");
  const attempt = attemptId ? paperAttemptById.get(attemptId) : undefined;
  if (!attempt || attempt.studentId !== me.id) return Response.json({ error: "unknown sitting" }, { status: 400 });
  return Response.json({ attempt, total: paperTotal(attempt), revealed: Object.fromEntries(attempt.answers.map((a) => [a.questionId, reveal(a.questionId)])) });
}
