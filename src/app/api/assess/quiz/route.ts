/**
 * Tutor mini-quiz. POST returns three mcq/numeric questions on the student's
 * weakest unlocked topic (answers withheld); PATCH marks the responses and
 * returns each correct answer, since the quiz is now over.
 */
import { getViewer } from "@/lib/auth/viewer";
import { studentById } from "@/lib/data/mock/people";
import { spaceById } from "@/lib/data/mock/spaces";
import { questionById } from "@/lib/data/mock/questions";
import { quizFor, subjectIdForSpace } from "@/lib/ai/assess";
import { autoMark } from "@/lib/domain/assessment";

async function context(spaceId: string | undefined) {
  const viewer = await getViewer();
  const me = viewer.role === "student" && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  const space = spaceId ? spaceById.get(spaceId) : undefined;
  if (!me || !space || space.classId !== me.classId) return null;
  return { me, space };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { spaceId?: string };
  const ctx = await context(body.spaceId);
  if (!ctx) return Response.json({ error: "forbidden" }, { status: 403 });
  const quiz = quizFor(ctx.me.id, subjectIdForSpace(ctx.space), ctx.space.tutorRules.allowedTopics);
  if (!quiz.questions.length) return Response.json({ error: "No quiz questions for the unlocked topics yet." }, { status: 404 });
  return Response.json(quiz);
}

interface PatchBody {
  spaceId?: string;
  responses?: { questionId?: string; response?: string }[];
}

export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => ({}))) as PatchBody;
  const ctx = await context(body.spaceId);
  if (!ctx) return Response.json({ error: "forbidden" }, { status: 403 });
  const rows = Array.isArray(body.responses) ? body.responses : [];
  const results = rows.flatMap((r) => {
    const q = typeof r.questionId === "string" ? questionById.get(r.questionId) : undefined;
    const m = q ? autoMark(q, typeof r.response === "string" ? r.response : "") : null;
    if (!q || !m) return [];
    const correct = q.type === "mcq" ? (q.options?.[Number(q.answer)] ?? q.answer) : q.answer;
    return [{ questionId: q.id, earned: m.awarded === q.marks, correct, feedback: m.feedback }];
  });
  const score = results.filter((r) => r.earned).length;
  return Response.json({ results, score, total: results.length });
}
