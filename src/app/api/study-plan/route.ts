/** A student builds (or refreshes) their own study plan; idempotent per week and day. */
import { getViewer } from "@/lib/auth/viewer";
import { audit } from "@/lib/data/mock/notify";
import { ensureStudyPlan } from "@/lib/data/study-plan";

export async function POST() {
  const viewer = await getViewer();
  if (viewer.role !== "student" || !viewer.studentId) return Response.json({ error: "forbidden" }, { status: 403 });
  const plan = ensureStudyPlan(viewer.studentId);
  if (!plan) return Response.json({ error: "No study plan for this seat." }, { status: 400 });
  if (plan.createdNow) audit(viewer.studentId, "studyplan.build", "student", viewer.studentId, { created: plan.createdNow, focus: plan.focus[0]?.title });
  return Response.json({ created: plan.createdNow, openMandatory: plan.openMandatory });
}
