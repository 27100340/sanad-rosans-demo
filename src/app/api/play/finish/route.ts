/**
 * Record a finished round and return one encouraging line.
 *
 * The session is a practice record only: it is kept for the child and their
 * guardian and is never written to an academic record, never marked, and never
 * read by any staff or leadership view.
 */
import { getViewer } from "@/lib/auth/viewer";
import { activityById } from "@/content/play";
import { learnerById, playSummary, recordPlay } from "@/lib/data/play";
import { encourage } from "@/lib/ai/play-coach";
import { starsFor } from "@/lib/domain/play";

interface Body {
  activityId?: string;
  studentId?: string;
  correct?: number;
  total?: number;
  roundLive?: boolean;
  seen?: unknown;
}

/** A round is never longer than this, so anything larger is a malformed client. */
const MAX_ITEMS = 12;

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (viewer.role !== "student" && viewer.role !== "parent") return Response.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Body;
  const learner = learnerById(viewer, body.studentId);
  if (!learner) return Response.json({ error: "No learner in an early or primary class on this seat." }, { status: 403 });

  const activity = body.activityId ? activityById.get(body.activityId) : undefined;
  if (!activity || activity.band !== learner.band) return Response.json({ error: "That activity is not for this learner's stage." }, { status: 400 });

  const total = Math.round(Number(body.total));
  const correct = Math.round(Number(body.correct));
  if (!Number.isFinite(total) || !Number.isFinite(correct) || total < 1 || total > MAX_ITEMS || correct < 0 || correct > total) {
    return Response.json({ error: "bad round" }, { status: 400 });
  }

  const seen = Array.isArray(body.seen) ? body.seen.filter((s): s is string => typeof s === "string" && s.length <= 64).slice(0, MAX_ITEMS) : [];
  const withAdult = viewer.role === "parent";

  const session = recordPlay({
    studentId: learner.student.id,
    activityId: activity.id,
    correct,
    total,
    live: body.roundLive === true,
    withAdult,
    seen,
  });

  const coach = await encourage({ activity, firstName: learner.student.firstName, correct, total, withAdult });
  return Response.json({
    message: coach.message,
    live: coach.live,
    stars: starsFor(session.correct, session.total),
    summary: playSummary(learner.student.id),
  });
}
