import { Bell, MailOpen, Megaphone } from "lucide-react";
import { NotificationList } from "@/components/portal/notification-list";
import { toNotificationRow } from "@/components/portal/notification-rows";
import { Denied, isLearner } from "@/components/teach/guard";
import { PageHeader, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { notificationsFor } from "@/lib/data/mock/notify";
import { studentById } from "@/lib/data/mock/people";

export default async function LearnInboxPage() {
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;

  const all = notificationsFor(student.id);
  const rows = all.map(toNotificationRow);
  const unread = all.filter((n) => !n.readAt).length;
  const announcements = all.filter((n) => n.kind === "announcement").length;

  return (
    <>
      <PageHeader eyebrow="Inbox" title="Notices" description="Tasks, tests, announcements and messages from your teachers, newest first." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Unread" value={unread} icon={<Bell size={18} />} tone={unread ? "warn" : "ok"} />
        <Stat label="All notices" value={all.length} icon={<MailOpen size={18} />} tone="accent" />
        <Stat label="Announcements" value={announcements} trend="school and branch" icon={<Megaphone size={18} />} tone="info" />
      </div>

      <NotificationList rows={rows} emptyTitle="No notices yet" emptyBody="Tasks, tests and messages from your teachers will appear here." />
    </>
  );
}
