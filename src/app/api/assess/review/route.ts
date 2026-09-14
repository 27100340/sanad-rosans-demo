/**
 * Teacher review: override a mark, approve one question, or publish the whole
 * attempt (approves every remaining AI mark and rolls topic mastery).
 */
import { getViewer } from "@/lib/auth/viewer";
import { spaceById } from "@/lib/data/mock/spaces";
import { attemptById, publishAttempt, reviewQuestion, testById } from "@/lib/data/mock/tests";
import { audit, notify } from "@/lib/data/mock/notify";

interface Body {
  attemptId?: string;
  questionId?: string;
  awarded?: number;
  approve?: boolean;
  publish?: boolean;
}

export async function PATCH(req: Request) {
  const viewer = await getViewer();
  if (viewer.role !== "teacher") return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as Body;
  const attempt = body.attemptId ? attemptById.get(body.attemptId) : undefined;
  const test = attempt ? testById.get(attempt.testId) : undefined;
  const space = test ? spaceById.get(test.spaceId) : undefined;
  if (!attempt || !space || space.teacherId !== viewer.personId) return Response.json({ error: "unknown attempt" }, { status: 400 });
  if (!attempt.submittedAt) return Response.json({ error: "not submitted yet" }, { status: 409 });

  if (typeof body.questionId === "string") {
    reviewQuestion(attempt, body.questionId, typeof body.awarded === "number" ? body.awarded : undefined, Boolean(body.approve));
  }
  if (body.publish) {
    publishAttempt(attempt);
    audit(viewer.personId, "attempt.publish", "attempt", attempt.id, { total: attempt.total });
    notify({ personIds: [attempt.studentId] }, { kind: "marks", title: `Marks published: ${test?.title ?? "test"}`, body: `${attempt.total} / ${attempt.maxMarks}. Open the result for the evidence and feedback.`, href: `/portal/learn/tests/${attempt.id}`, fromId: viewer.personId });
  }

  return Response.json({ attemptId: attempt.id, total: attempt.total, maxMarks: attempt.maxMarks, marking: attempt.marking, published: attempt.marking.every((m) => m.status !== "ai-marked") });
}
