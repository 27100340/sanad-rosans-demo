/**
 * A student submits a sitting of an allocated paper. The sitting is marked
 * here, recorded against the student, and fed to the analytics.
 *
 * What comes back depends on the allocation mode: an open- or closed-book
 * assignment returns the marks immediately, while a test-mode sitting returns
 * only a confirmation until the teacher releases them. One attempt per
 * allocation — a resubmission is refused rather than silently overwriting.
 */
import { getViewer } from "@/lib/auth/viewer";
import { viewerRestriction } from "@/lib/auth/access";
import { markPaper } from "../_ai/examiner";
import { addAttempt, allocationById, attemptForAllocation, paperById, physicsQuestions } from "@/lib/data/physics";
import { buildAttempt, pct, resultsImmediate } from "@/lib/domain/physics";
import { studentById } from "@/lib/data/mock/people";

const MAX_RESPONSE_CHARS = 2000;
const MAX_DURATION_SEC = 6 * 60 * 60;

interface Body {
  allocationId?: string;
  responses?: unknown;
  durationSec?: number;
  revealsUsed?: number;
}

function responseMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string") out[key] = value.slice(0, MAX_RESPONSE_CHARS);
  }
  return out;
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (viewer.role !== "student" || !viewer.studentId || viewerRestriction(viewer)) {
    return Response.json({ error: "Only the student it was set for can sit this paper." }, { status: 403 });
  }
  const student = studentById.get(viewer.studentId);
  if (!student) return Response.json({ error: "Unknown student." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Body;
  const allocation = body.allocationId ? allocationById(body.allocationId) : undefined;
  if (!allocation || !allocation.studentIds.includes(student.id)) return Response.json({ error: "That paper was not set for you." }, { status: 403 });
  if (attemptForAllocation(allocation.id, student.id)) return Response.json({ error: "You have already submitted this paper." }, { status: 409 });

  const paper = paperById(allocation.paperId);
  if (!paper) return Response.json({ error: "That paper is no longer available." }, { status: 400 });
  const questions = physicsQuestions(paper.questionIds);
  if (!questions.length) return Response.json({ error: "That paper has no questions." }, { status: 400 });

  const rawDuration = Math.round(Number(body.durationSec));
  const durationSec = Number.isFinite(rawDuration) ? Math.min(Math.max(rawDuration, 0), MAX_DURATION_SEC) : 0;
  const rawReveals = Math.round(Number(body.revealsUsed));

  const marked = await markPaper(questions, responseMap(body.responses), student.firstName);
  const attempt = addAttempt(
    buildAttempt({
      id: `at-${Date.now().toString(36)}-${student.id}`,
      studentId: student.id,
      studentName: student.name,
      classId: student.classId,
      paper,
      questions: marked,
      durationSec,
      ref: allocation.title,
      context: {
        kind: allocation.mode === "test" ? "test" : "assignment",
        help: allocation.mode === "assignment_help",
        revealsUsed: Number.isFinite(rawReveals) ? Math.max(0, rawReveals) : 0,
        allocationId: allocation.id,
      },
    }),
  );

  // A test result stays sealed until the teacher releases it.
  if (!resultsImmediate(allocation.mode) && !allocation.publishedAt) {
    return Response.json({ submitted: true, released: false, attemptId: attempt.id, questionCount: attempt.qCount });
  }

  return Response.json({
    submitted: true,
    released: true,
    attemptId: attempt.id,
    result: {
      awarded: attempt.score,
      total: attempt.total,
      percent: pct(attempt.score, attempt.total),
      perQuestion: attempt.questions,
    },
  });
}
