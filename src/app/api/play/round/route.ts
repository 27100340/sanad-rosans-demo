/**
 * Serve the next round of a play activity. Students play their own; a guardian
 * plays alongside a ward, which is how the early years band is meant to work.
 *
 * `live` is the truth about where these items came from: true only when the
 * model produced them and they passed validation.
 */
import { getViewer } from "@/lib/auth/viewer";
import { activityById } from "@/content/play";
import { learnerById, recentlySeen, seededRound, sessionsForActivity } from "@/lib/data/play";
import { nextRound } from "@/lib/ai/play-coach";

interface Body {
  activityId?: string;
  studentId?: string;
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (viewer.role !== "student" && viewer.role !== "parent") return Response.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Body;
  const learner = learnerById(viewer, body.studentId);
  if (!learner) return Response.json({ error: "No learner in an early or primary class on this seat." }, { status: 403 });

  const activity = body.activityId ? activityById.get(body.activityId) : undefined;
  if (!activity || activity.band !== learner.band) return Response.json({ error: "That activity is not for this learner's stage." }, { status: 400 });

  const playCount = sessionsForActivity(learner.student.id, activity.id).length;
  const fallback = seededRound(activity, playCount);
  if (!fallback) return Response.json({ error: "This activity has no rounds." }, { status: 500 });

  const { round, live } = await nextRound({ activity, fallback, avoid: recentlySeen(learner.student.id, activity.id) });
  return Response.json({ activityId: activity.id, studentId: learner.student.id, round, live });
}
