/**
 * Student: start an attempt (POST) and save / guard / submit (PATCH).
 * Answers and mark schemes never leave the server before submission.
 */
import { getViewer } from "@/lib/auth/viewer";
import { studentById } from "@/lib/data/mock/people";
import { attemptById, questionsOf, recordGuardEvent, saveAnswer, startAttempt, submitAttempt, testById } from "@/lib/data/mock/tests";
import { markAttempt } from "@/lib/ai/assess";
import { forStudent, isLate, secondsLeft } from "@/lib/domain/assessment";
import { audit } from "@/lib/data/mock/notify";

const MAX_RESPONSE_CHARS = 2000;

async function student() {
  const viewer = await getViewer();
  return viewer.role === "student" && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
}

export async function POST(req: Request) {
  const me = await student();
  if (!me) return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { testId?: string };
  const test = body.testId ? testById.get(body.testId) : undefined;
  if (!test) return Response.json({ error: "unknown test" }, { status: 400 });
  const now = new Date();
  const out = startAttempt(test, me.id, now.toISOString());
  if (!out.attempt) return Response.json({ error: out.error }, { status: 400 });
  return Response.json({
    attemptId: out.attempt.id,
    questions: questionsOf(test).map(forStudent),
    answers: out.attempt.answers,
    secondsLeft: secondsLeft(out.attempt, test.durationMin, now),
  });
}

interface PatchBody {
  attemptId?: string;
  questionId?: string;
  response?: string;
  guardEvent?: boolean;
  submit?: boolean;
}

export async function PATCH(req: Request) {
  const me = await student();
  if (!me) return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as PatchBody;
  const attempt = body.attemptId ? attemptById.get(body.attemptId) : undefined;
  if (!attempt || attempt.studentId !== me.id) return Response.json({ error: "unknown attempt" }, { status: 400 });
  if (attempt.submittedAt) return Response.json({ error: "already submitted" }, { status: 409 });
  const test = testById.get(attempt.testId);
  if (!test) return Response.json({ error: "unknown test" }, { status: 400 });
  const now = new Date();

  if (body.guardEvent) recordGuardEvent(attempt);

  if (typeof body.questionId === "string" && typeof body.response === "string") {
    if (!test.questionIds.includes(body.questionId)) return Response.json({ error: "question not in test" }, { status: 400 });
    saveAnswer(attempt, body.questionId, body.response.slice(0, MAX_RESPONSE_CHARS), now.toISOString());
  }

  if (body.submit) {
    const questions = questionsOf(test);
    const responses = new Map(attempt.answers.map((a) => [a.questionId, a.response]));
    const { marking, live } = await markAttempt(questions, responses, me.firstName);
    submitAttempt(attempt, marking, now.toISOString());
    attempt.late = isLate(attempt, test.durationMin, now);
    audit(me.id, "attempt.submit", "attempt", attempt.id, { testId: test.id, late: attempt.late, total: attempt.total });
    return Response.json({ submitted: true, attemptId: attempt.id, total: attempt.total, maxMarks: attempt.maxMarks, late: attempt.late, live });
  }

  return Response.json({ saved: true, secondsLeft: secondsLeft(attempt, test.durationMin, now), guardEvents: attempt.guardEvents });
}
