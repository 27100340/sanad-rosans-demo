import { AskSchoolClient } from "@/components/leadership/ask-school-client";
import { canSeeLeadership, SeatDenied } from "@/components/leadership/seat-guard";
import { AiPill, PageHeader } from "@/components/ui/primitives";
import { groqIsLive } from "@/lib/ai/groq";
import { getViewer } from "@/lib/auth/viewer";
import { SUGGESTED_QUESTIONS } from "@/lib/data/mock/leadership-extra";

export default async function AskTheSchoolPage() {
  const viewer = await getViewer();
  if (!canSeeLeadership(viewer)) return <SeatDenied home={viewer.home} />;
  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader eyebrow="Leadership" title="Ask the School" description="Plain-language questions over live aggregates. No student record leaves the school." actions={<AiPill live={groqIsLive()} />} />
      <AskSchoolClient suggestions={SUGGESTED_QUESTIONS} />
    </div>
  );
}
