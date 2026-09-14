import { AnnouncementsClient, type AnnouncementRow } from "@/components/leadership/announcements-client";
import { canSeeBranchStaff, SeatDenied } from "@/components/leadership/seat-guard";
import { PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { branchName, type BranchId } from "@/lib/config/school";
import { announcementsFor } from "@/lib/data/mock/announcements";
import { personName } from "@/lib/data/mock/notify";

const DEMO_BRANCH: BranchId = "gulberg";

export default async function PrincipalAnnouncementsPage() {
  const viewer = await getViewer();
  if (!canSeeBranchStaff(viewer)) return <SeatDenied home={viewer.home} />;
  const branchId = viewer.branchId ?? DEMO_BRANCH;
  const rows: AnnouncementRow[] = announcementsFor(branchId).map((a) => ({ ...a, authorName: personName(a.authorId) }));
  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader eyebrow={`Principal · ${branchName(branchId)}`} title="Announcements" description="Notices for your campus and the school-wide ones from leadership. Yours reach every student, parent and teacher at the campus." />
      <AnnouncementsClient initial={rows} fixedScope={viewer.branchId ?? undefined} />
    </div>
  );
}
