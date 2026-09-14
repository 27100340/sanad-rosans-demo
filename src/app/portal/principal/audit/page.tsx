import { Activity, Mail, ScrollText, Users } from "lucide-react";
import { relativeStamp } from "@/components/leadership/format";
import { canSeePrincipal, SeatDenied } from "@/components/leadership/seat-guard";
import { AuditLog, type AuditRow, type MailRow } from "@/components/principal/audit-log";
import { PageHeader, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { branchName, type BranchId } from "@/lib/config/school";
import { auditFor, MAIL_QUEUE, personName, type AuditEntry } from "@/lib/data/mock/notify";
import { todayISO } from "@/lib/utils";

const DEMO_BRANCH: BranchId = "gulberg";
const LIMIT = 200;

const ACTION_LABEL: Record<string, string> = {
  "attendance.mark": "Marked attendance",
  "lesson.open": "Opened a register",
  "lesson.close": "Closed a register",
  "lesson.reopen": "Reopened a register",
  "lesson.all-present": "Marked everyone present",
  "task.create": "Set a task",
  "task.delete": "Removed a task",
  "file.upload": "Uploaded a file",
  "file.delete": "Removed a file",
  "test.create": "Created a test",
  "attempt.publish": "Published results",
  "proctor.unlock": "Unlocked a proctored attempt",
  "message.send": "Sent a message",
  "message.show_cause": "Issued a show-cause notice",
  "space.create": "Assigned a subject",
  "space.reassign": "Reassigned a subject",
  "resource.approve": "Approved a resource",
  "access.lock": "Locked access",
  "access.unlock": "Restored access",
};

const HIDDEN_KEYS = new Set(["classId", "spaceId"]);

function humanKey(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").toLowerCase();
}

/** "Grade 8-B · 14 students · title: …" from the free-form details an API route recorded. */
function summarise(details: AuditEntry["details"]): string {
  if (!details) return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(details)) {
    if (value === undefined || value === null || HIDDEN_KEYS.has(key)) continue;
    if (key === "studentId" && typeof value === "string") parts.push(personName(value));
    else if (key === "className" || key === "title" || key === "subject" || key === "student" || key === "teacher") parts.push(String(value));
    else if (typeof value === "number") parts.push(`${value} ${humanKey(key)}`);
    else if (typeof value === "string" || typeof value === "boolean") parts.push(`${humanKey(key)}: ${value}`);
  }
  return parts.join(" · ");
}

export default async function AuditPage() {
  const viewer = await getViewer();
  if (!canSeePrincipal(viewer)) return <SeatDenied home={viewer.home} />;
  const branchId = viewer.branchId ?? DEMO_BRANCH;

  const entries = auditFor({ limit: LIMIT });
  const rows: AuditRow[] = entries.map((e) => ({
    id: e.id,
    when: relativeStamp(e.at),
    actorId: e.actorId,
    actorName: personName(e.actorId),
    action: e.action,
    label: ACTION_LABEL[e.action] ?? e.action.replace(/[._]/g, " "),
    entity: e.entity,
    entityId: e.entityId,
    summary: summarise(e.details),
  }));
  const mails: MailRow[] = [...MAIL_QUEUE].sort((a, b) => b.at.localeCompare(a.at)).map((m) => ({ id: m.id, when: relativeStamp(m.at), toName: personName(m.to), channel: m.channel, subject: m.subject, status: m.status }));

  const today = todayISO();
  const todayCount = entries.filter((e) => e.at.startsWith(today)).length;
  const actors = new Set(entries.map((e) => e.actorId)).size;

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader eyebrow={`Principal · ${branchName(branchId)}`} title="Audit log" description="Every staff action in the portal, newest first, and the messages waiting to go out." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Actions today" value={todayCount} icon={<Activity size={18} />} tone="accent" />
        <Stat label="Recorded" value={entries.length} trend={`last ${LIMIT} kept in the demo`} icon={<ScrollText size={18} />} tone="info" />
        <Stat label="Staff active" value={actors} trend="distinct actors" icon={<Users size={18} />} tone="neutral" />
        <Stat label="Queued to send" value={mails.length} trend="email and push" icon={<Mail size={18} />} tone={mails.length ? "warn" : "ok"} />
      </div>

      <AuditLog rows={rows} mails={mails} />
    </div>
  );
}
