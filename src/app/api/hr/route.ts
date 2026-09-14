import { getViewer } from "@/lib/auth/viewer";
import { viewerRestriction } from "@/lib/auth/access";
import { canHr, canReviewHr, reviewsFor } from "@/lib/data/hr";
import { appraisalScore, validateReview } from "@/lib/domain/hr";
import { audit, notify } from "@/lib/data/mock/notify";
export async function POST(req: Request) {
  const p = await getViewer();
  if (!canHr(p) || viewerRestriction(p))
    return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const b = await req.json();
    const a = reviewsFor(p).find((a) => a.id === b.id);
    if (!a) throw new Error("Unknown appraisal.");
    if (b.action === "review" && canReviewHr(p)) {
      if (a.status !== "draft")
        throw new Error("This review has already been finalised.");
      const evidence = String(b.evidence ?? "");
      const goal = String(b.goal ?? "");
      const date = String(b.dueDate ?? "");
      validateReview(evidence, goal, date);
      appraisalScore(b.ratings);
      Object.assign(a, {
        ratings: b.ratings,
        evidence,
        goal,
        dueDate: date,
        status: "reviewed",
        reviewedBy: p.personId,
      });
      notify(
        { personIds: [a.teacherId] },
        {
          kind: "report",
          title: "Your appraisal is ready for discussion",
          body: "Read the evidence and add your response. Acknowledgement does not mean agreement.",
          href: "/portal/hr",
          fromId: p.personId,
        },
      );
    } else if (
      b.action === "respond" &&
      a.teacherId === p.personId &&
      a.status === "reviewed"
    ) {
      const response = String(b.response ?? "").trim();
      if (response.length < 10 || response.length > 2000)
        throw new Error("Enter your response (10–2,000 characters).");
      Object.assign(a, { response, status: "acknowledged" });
    } else
      throw new Error("This appraisal action is not available for your seat.");
    audit(p.personId, `hr.appraisal.${b.action}`, "appraisal", a.id);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Invalid request" },
      { status: 400 },
    );
  }
}
