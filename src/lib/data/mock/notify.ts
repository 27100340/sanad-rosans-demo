/**
 * Notification centre and audit log, in memory. `notify()` targets people by
 * id or by audience (a class, its guardians, a branch); class and branch
 * audiences never include staff. Every staff mutation calls `audit()`.
 * Email and push are represented as a queue that a relay would drain.
 */
import type { BranchId } from "@/lib/config/school";
import { daysAgoISO } from "@/lib/utils";
import { singleton } from "../store";
import { GUARDIANS, STUDENTS, TEACHERS, LEADERS, studentsInClass } from "./people";

export type NotificationKind = "task" | "challenge" | "assignment" | "test" | "announcement" | "message" | "resource" | "marks" | "attendance" | "rank" | "reminder" | "show-cause" | "report";

export interface Notification {
  id: string;
  personId: string; // student, guardian or staff id
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string;
  at: string; // ISO datetime
  readAt?: string;
  fromId?: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actorId: string;
  action: string; // "attendance.save", "test.create", "proctor.unlock" ...
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

export interface QueuedMail {
  id: string;
  at: string;
  to: string; // person id
  channel: "email" | "push" | "sms";
  subject: string;
  body: string;
  status: "queued"; // no relay in the demo
}

export type NotifyTarget =
  | { personIds: string[] }
  | { classId: string; guardians?: boolean } // students of the class, optionally their guardians instead
  | { branchId: BranchId; students?: boolean; guardians?: boolean };

const PER_PERSON_CAP = 100;

function at(daysBack: number, time: string): string {
  return `${daysAgoISO(daysBack)}T${time}:00`;
}

/** A few notices per demo persona so the inboxes are not empty before anyone acts. */
function seedNotifications(): Notification[] {
  return [
    { id: "n-seed-1", personId: "s-ahmed-hassan", kind: "challenge", title: "New challenge: Daily challenge: nth term in under five minutes", body: `Due ${daysAgoISO(-1)} · 25 points`, href: "/portal/learn/tasks", at: at(0, "07:45"), fromId: "t-hina-raza" },
    { id: "n-seed-2", personId: "s-ahmed-hassan", kind: "task", title: "New task: Week 6 notes: linear equations", body: `Mandatory. Due ${daysAgoISO(-2)} · 10 points`, href: "/portal/learn/tasks", at: at(2, "09:05"), fromId: "t-hina-raza" },
    { id: "n-seed-3", personId: "s-ahmed-hassan", kind: "test", title: "Topic test: equations and sequences is open", body: `25 minutes, one attempt. Closes ${daysAgoISO(-3)}.`, href: "/portal/learn/tests", at: at(4, "08:30"), readAt: at(4, "13:02"), fromId: "t-hina-raza" },
    { id: "n-seed-4", personId: "s-ahmed-hassan", kind: "announcement", title: "STEAM Fest 2026 dates confirmed", body: "All three campuses will host STEAM Fest in the second week of October.", href: "/portal/learn", at: at(1, "12:00"), readAt: at(1, "18:40"), fromId: "p-chairman" },
    { id: "n-seed-5", personId: "g-nadia-hassan", kind: "announcement", title: "Term 1 parent-teacher meetings", body: "PTMs for Junior and Senior sections on Saturday 26 September, 9:00 to 13:00. Slots open in the parent portal.", href: "/portal/family/messages", at: at(2, "10:00"), fromId: "p-principal-gulberg" },
    { id: "n-seed-6", personId: "g-nadia-hassan", kind: "report", title: "Term 1 progress reports are ready", body: "Ahmed's and Zaid's reports are in the portal; print or save them from the Reports page.", href: "/portal/family/reports", at: at(1, "16:00"), fromId: "p-principal-gulberg" },
    { id: "n-seed-7", personId: "t-hina-raza", kind: "marks", title: "4 submissions are waiting for your approval", body: "Solving linear equations (set A) · Grade 8-B Mathematics", href: "/portal/teach/gulberg-g8b-maths/assignments/a-maths-linear-1", at: at(0, "08:10") },
    { id: "n-seed-8", personId: "t-hina-raza", kind: "announcement", title: "Term 1 parent-teacher meetings", body: "Saturday 26 September, 9:00 to 13:00. Confirm your slots by Wednesday.", href: "/portal/teach", at: at(2, "10:00"), readAt: at(2, "10:30"), fromId: "p-principal-gulberg" },
    { id: "n-seed-9", personId: "t-hina-raza", kind: "resource", title: "Term 1 revision pack awaits principal approval", body: "The tutor cannot cite it until it is approved.", href: "/portal/teach/gulberg-g8b-maths", at: at(3, "15:20"), readAt: at(3, "16:00") },
  ];
}

/** Staff actions from the last few days, in the same shape the API routes write. */
function seedAudit(): AuditEntry[] {
  return [
    { id: "a-seed-1", at: at(0, "08:12"), actorId: "t-hina-raza", action: "lesson.close", entity: "lesson", entityId: `gulberg-g8b-${daysAgoISO(0)}-p1`, details: { className: "Grade 8-B", subject: "Mathematics", period: 1 } },
    { id: "a-seed-2", at: at(0, "07:45"), actorId: "t-hina-raza", action: "task.create", entity: "task", entityId: "task-ahmed-4", details: { count: 14, kind: "challenge", title: "Daily challenge: nth term in under five minutes", className: "Grade 8-B" } },
    { id: "a-seed-3", at: at(1, "14:20"), actorId: "p-principal-gulberg", action: "space.create", entity: "space", entityId: "gulberg-g7a-ls-maths", details: { className: "Grade 7-A", subject: "Mathematics", teacher: "Ms. Hina Raza" } },
    { id: "a-seed-4", at: at(1, "11:05"), actorId: "t-hina-raza", action: "test.create", entity: "test", entityId: "t-olmaths-mock-1", details: { title: "Mock exam: algebra and simultaneous equations", allocated: 10, guardMode: "strict" } },
    { id: "a-seed-5", at: at(2, "09:40"), actorId: "t-hina-raza", action: "proctor.unlock", entity: "attempt", entityId: "att-daniyal-mock", details: { student: "Daniyal Butt", note: "Power cut during the sitting; verified with the invigilator." } },
    { id: "a-seed-6", at: at(2, "16:30"), actorId: "t-bilal-ahmed", action: "message.show_cause", entity: "message", details: { className: "Grade 8-B", studentId: "s-hamza-javed", subject: "Repeated lateness to first period", students: 1, guardians: 1, emails: 1 } },
    { id: "a-seed-7", at: at(3, "13:00"), actorId: "p-principal-gulberg", action: "resource.approve", entity: "resource", entityId: "r6", details: { title: "Linear equations · class notes (Week 6)", space: "Grade 8-B Mathematics" } },
    { id: "a-seed-8", at: at(3, "08:05"), actorId: "t-usman-tariq", action: "attendance.mark", entity: "lesson", entityId: `gulberg-g8b-${daysAgoISO(3)}-p1`, details: { studentId: "s-umar-farooq", status: "absent" } },
  ];
}

function seedMail(): QueuedMail[] {
  return [
    { id: "m-seed-1", at: at(2, "16:30"), to: "g-hamza-javed", channel: "email", subject: "Show-cause notice: Repeated lateness to first period", body: "Hamza has been late to first period three times this week. Please meet the class teacher on Monday morning.", status: "queued" },
  ];
}

export const NOTIFICATIONS: Notification[] = singleton("notifications", seedNotifications);
export const AUDIT: AuditEntry[] = singleton("audit", seedAudit);
export const MAIL_QUEUE: QueuedMail[] = singleton("mailQueue", seedMail);

function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Resolves a target to person ids. Class and branch audiences exclude staff by construction. */
export function resolveTarget(target: NotifyTarget): string[] {
  if ("personIds" in target) return [...new Set(target.personIds)];
  if ("classId" in target) {
    const students = studentsInClass(target.classId);
    if (target.guardians) return [...new Set(students.map((s) => s.guardianId))];
    return students.map((s) => s.id);
  }
  const students = STUDENTS.filter((s) => s.branchId === target.branchId);
  const ids: string[] = [];
  if (target.students !== false) ids.push(...students.map((s) => s.id));
  if (target.guardians) ids.push(...students.map((s) => s.guardianId));
  return [...new Set(ids)];
}

export function notify(target: NotifyTarget, input: Omit<Notification, "id" | "personId" | "at" | "readAt">, at = new Date().toISOString()): Notification[] {
  const created: Notification[] = [];
  for (const personId of resolveTarget(target)) {
    const n: Notification = { ...input, id: nextId("n"), personId, at };
    NOTIFICATIONS.push(n);
    created.push(n);
    const mine = NOTIFICATIONS.filter((x) => x.personId === personId);
    if (mine.length > PER_PERSON_CAP) {
      const drop = new Set(mine.slice(0, mine.length - PER_PERSON_CAP).map((x) => x.id));
      for (let i = NOTIFICATIONS.length - 1; i >= 0; i -= 1) if (drop.has(NOTIFICATIONS[i].id)) NOTIFICATIONS.splice(i, 1);
    }
  }
  return created;
}

export function notificationsFor(personId: string): Notification[] {
  return NOTIFICATIONS.filter((n) => n.personId === personId).sort((a, b) => b.at.localeCompare(a.at));
}

export function unreadCount(personId: string): number {
  return NOTIFICATIONS.filter((n) => n.personId === personId && !n.readAt).length;
}

export function markRead(personId: string, ids?: string[], at = new Date().toISOString()): number {
  let n = 0;
  for (const x of NOTIFICATIONS) {
    if (x.personId !== personId || x.readAt || (ids && !ids.includes(x.id))) continue;
    x.readAt = at;
    n += 1;
  }
  return n;
}

export function audit(actorId: string, action: string, entity: string, entityId?: string, details?: Record<string, unknown>): AuditEntry {
  const entry: AuditEntry = { id: nextId("a"), at: new Date().toISOString(), actorId, action, entity, entityId, details };
  AUDIT.push(entry);
  return entry;
}

export function auditFor(filter?: { actorId?: string; entity?: string; limit?: number }): AuditEntry[] {
  return AUDIT.filter((e) => (!filter?.actorId || e.actorId === filter.actorId) && (!filter?.entity || e.entity === filter.entity))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, filter?.limit ?? 100);
}

/** Queues an email/push for a person; the demo has no relay, so it stays queued and is listed on the principal's audit page. */
export function queueMail(to: string, channel: QueuedMail["channel"], subject: string, body: string): QueuedMail {
  const m: QueuedMail = { id: nextId("m"), at: new Date().toISOString(), to, channel, subject, body, status: "queued" };
  MAIL_QUEUE.push(m);
  return m;
}

export function personName(id: string): string {
  return STUDENTS.find((s) => s.id === id)?.name ?? GUARDIANS.find((g) => g.id === id)?.name ?? TEACHERS.find((t) => t.id === id)?.name ?? LEADERS.find((l) => l.id === id)?.name ?? id;
}
