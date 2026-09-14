import { PageHeader, SectionTitle } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { classById, guardianById, studentById, teacherById } from "@/lib/data/mock/people";
import { FAMILY_THREAD } from "@/lib/data/mock/learn-extra";
import { notificationsFor } from "@/lib/data/mock/notify";
import { Denied, isParent } from "@/components/teach/guard";
import { MessageThread } from "@/components/family/message-thread";
import { NotificationList } from "@/components/portal/notification-list";
import { toNotificationRow } from "@/components/portal/notification-rows";

export default async function MessagesPage() {
  const viewer = await getViewer();
  const guardian = isParent(viewer) && viewer.guardianId ? guardianById.get(viewer.guardianId) : undefined;
  if (!guardian) return <Denied />;

  const firstWard = guardian.studentIds.map((id) => studentById.get(id)).find((s) => s && !s.hifz);
  const cls = firstWard ? classById.get(firstWard.classId) : undefined;
  const teacherName = cls ? (teacherById.get(cls.classTeacherId)?.name ?? "Class teacher") : "Class teacher";

  const notices = notificationsFor(guardian.id).map(toNotificationRow);

  return (
    <>
      <PageHeader eyebrow={guardian.name} title="Messages" description={firstWard ? `Thread with ${firstWard.firstName}'s class teacher, and notices from the school.` : "Thread with the class teacher, and notices from the school."} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle title="Class teacher" hint="Replies reach the teacher's Messages page." />
          <MessageThread teacherName={teacherName} parentName={guardian.name} messages={FAMILY_THREAD} />
        </section>
        <section>
          <SectionTitle title="Notices" hint="Attendance alerts, show-cause notices, announcements and reports." />
          <NotificationList rows={notices} emptyTitle="No notices" emptyBody="Attendance alerts and school announcements will appear here." />
        </section>
      </div>
    </>
  );
}
