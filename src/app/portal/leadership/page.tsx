import { ActivityFeed } from "@/components/leadership/activity-feed";
import { BranchCards } from "@/components/leadership/branch-cards";
import { MondayBriefCard } from "@/components/leadership/monday-brief-card";
import { canSeeLeadership, SeatDenied } from "@/components/leadership/seat-guard";
import { SchoolStatRow } from "@/components/leadership/stat-row";
import { LinkButton, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { run as mondayBrief } from "@/lib/ai/monday-brief";
import { getViewer } from "@/lib/auth/viewer";
import { school } from "@/lib/config/school";

export default async function LeadershipCockpit() {
  const viewer = await getViewer();
  if (!canSeeLeadership(viewer)) return <SeatDenied home={viewer.home} />;
  const brief = await mondayBrief();

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        eyebrow={school.schoolName}
        title="Cockpit"
        description="Three campuses, one view. Numbers refresh with every register and every marked script."
        actions={
          <>
            <LinkButton href="/portal/leadership/ask" variant="primary">Ask the School</LinkButton>
            <LinkButton href="/portal/leadership/branches" variant="outline">Branches</LinkButton>
          </>
        }
      />
      <SchoolStatRow />
      <section>
        <SectionTitle title="Branches" hint="Attendance over six weeks, this term's figures" action={<LinkButton href="/portal/leadership/branches" variant="ghost" className="btn-sm">View all</LinkButton>} />
        <BranchCards />
      </section>
      <section className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MondayBriefCard brief={brief} />
        </div>
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
      </section>
    </div>
  );
}
