import { AnnouncementsClient, type AnnouncementRow } from "@/components/leadership/announcements-client";
import { canSeeLeadership, SeatDenied } from "@/components/leadership/seat-guard";
import { PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { announcementsFor } from "@/lib/data/mock/announcements";
import { personName } from "@/lib/data/mock/notify";

export default async function AnnouncementsPage() {
  const viewer = await getViewer();
  if (!canSeeLeadership(viewer)) return <SeatDenied home={viewer.home} />;
  const rows: AnnouncementRow[] = announcementsFor(null).map((a) => ({ ...a, authorName: personName(a.authorId) }));
  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader eyebrow="Leadership" title="Announcements" description="School-wide and branch notices, newest first. Publishing notifies everyone in scope at once." />
      <AnnouncementsClient initial={rows} />
    </div>
  );
}
