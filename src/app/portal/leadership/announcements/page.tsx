import { AnnouncementsClient, type AnnouncementRow } from "@/components/leadership/announcements-client";
import { canSeeLeadership, SeatDenied } from "@/components/leadership/seat-guard";
import { PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { ANNOUNCEMENTS } from "@/lib/data/mock/comms";
import { peopleById, teacherById } from "@/lib/data/mock/people";

function authorName(id: string): string {
  return peopleById.get(id)?.name ?? teacherById.get(id)?.name ?? "School office";
}

export default async function AnnouncementsPage() {
  const viewer = await getViewer();
  if (!canSeeLeadership(viewer)) return <SeatDenied home={viewer.home} />;
  const rows: AnnouncementRow[] = ANNOUNCEMENTS.map((a) => ({ ...a, authorName: authorName(a.authorId) }));
  const me = peopleById.get(viewer.personId)?.name ?? viewer.label;
  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader eyebrow="Leadership" title="Announcements" description="School-wide and branch notices, newest first." />
      <AnnouncementsClient initial={rows} authorName={me} />
    </div>
  );
}
