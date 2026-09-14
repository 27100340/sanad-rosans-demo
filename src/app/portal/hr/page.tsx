import { getViewer } from "@/lib/auth/viewer";
import { canHr, canReviewHr, reviewsFor } from "@/lib/data/hr";
import { SeatDenied } from "@/components/leadership/seat-guard";
import { PageHeader } from "@/components/ui/primitives";
import { HrWorkspace } from "@/components/principal/hr-workspace";
export default async function HrPage() {
  const p = await getViewer();
  if (!canHr(p)) return <SeatDenied home={p.home} />;
  return (
    <>
      <PageHeader
        eyebrow="People & development"
        title={
          canReviewHr(p)
            ? "Teacher performance & appraisal"
            : "My professional development"
        }
        description="Observation evidence, a transparent rubric, development goals and the teacher's own response."
      />
      <HrWorkspace reviews={reviewsFor(p)} manager={canReviewHr(p)} />
    </>
  );
}
