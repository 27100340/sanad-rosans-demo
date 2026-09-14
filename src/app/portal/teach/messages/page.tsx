import { Bell, Mail, Send } from "lucide-react";
import { relativeStamp } from "@/components/leadership/format";
import { NotificationList } from "@/components/portal/notification-list";
import { toNotificationRow } from "@/components/portal/notification-rows";
import { ComposeMessage, type ComposeClass } from "@/components/teach/compose-message";
import { Denied } from "@/components/teach/guard";
import { Chip, PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { auditFor, notificationsFor, personName, type AuditEntry } from "@/lib/data/mock/notify";
import { classById, studentsInClass } from "@/lib/data/mock/people";
import { spacesForTeacher } from "@/lib/data/repo";

const SENT_LIMIT = 10;

function sentLine(e: AuditEntry): string {
  const d = e.details ?? {};
  const who = typeof d.studentId === "string" ? personName(d.studentId) : typeof d.className === "string" ? d.className : "";
  const counts = [`${Number(d.students ?? 0)} student${Number(d.students ?? 0) === 1 ? "" : "s"}`, `${Number(d.guardians ?? 0)} guardian${Number(d.guardians ?? 0) === 1 ? "" : "s"}`];
  if (Number(d.emails ?? 0)) counts.push(`${Number(d.emails)} email${Number(d.emails) === 1 ? "" : "s"} queued`);
  return `${who} · ${counts.join(", ")}`;
}

export default async function TeacherMessagesPage({ searchParams }: { searchParams: Promise<{ student?: string }> }) {
  const viewer = await getViewer();
  if (viewer.role !== "teacher") return <Denied />;
  const { student: defaultStudentId } = await searchParams;

  const classIds = [...new Set(spacesForTeacher(viewer.personId).map((s) => s.classId))];
  const classes: ComposeClass[] = classIds.map((id) => ({ id, name: classById.get(id)?.name ?? id, students: studentsInClass(id).map((s) => ({ id: s.id, name: s.name })) }));
  const notices = notificationsFor(viewer.personId);
  const unread = notices.filter((n) => !n.readAt).length;
  const sent = auditFor({ actorId: viewer.personId, entity: "message", limit: SENT_LIMIT });

  return (
    <>
      <PageHeader eyebrow="Teacher" title="Messages" description="Write to a class or one student, with their guardians when it matters. Notices sent to you are on the right." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Unread notices" value={unread} icon={<Bell size={18} />} tone={unread ? "warn" : "ok"} />
        <Stat label="Classes you can write to" value={classes.length} icon={<Mail size={18} />} tone="accent" />
        <Stat label="Sent recently" value={sent.length} trend="messages and notices" icon={<Send size={18} />} tone="info" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <section>
            <SectionTitle title="Compose" hint="Students see it in their Inbox; guardians in the family portal." />
            <ComposeMessage classes={classes} defaultStudentId={defaultStudentId ?? ""} />
          </section>
          <section>
            <SectionTitle title="Sent" hint={`Your last ${SENT_LIMIT} sends, from the audit log.`} />
            {sent.length ? (
              <div className="card divide-y divide-line">
                {sent.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{typeof e.details?.subject === "string" ? e.details.subject : "(no subject)"}</p>
                      <p className="mt-0.5 text-xs text-ink-3">{sentLine(e)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Chip tone={e.action === "message.show_cause" ? "danger" : "accent"}>{e.action === "message.show_cause" ? "Show-cause" : "Message"}</Chip>
                      <span className="text-2xs text-ink-3">{relativeStamp(e.at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="card-quiet px-4 py-3 text-xs text-ink-3">Nothing sent yet.</p>
            )}
          </section>
        </div>
        <section className="lg:col-span-2">
          <SectionTitle title="Your notices" hint="Approvals, announcements and marking reminders." />
          <NotificationList rows={notices.map(toNotificationRow)} emptyTitle="No notices" />
        </section>
      </div>
    </>
  );
}
