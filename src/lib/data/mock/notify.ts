/**
 * Notification centre and audit log, in memory. `notify()` targets people by
 * id or by audience (a class, its guardians, a branch); class and branch
 * audiences never include staff. Every staff mutation calls `audit()`.
 * Email and push are represented as a queue that a relay would drain.
 */
import type { BranchId } from "@/lib/config/school";
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

export const NOTIFICATIONS: Notification[] = singleton("notifications", () => []);
export const AUDIT: AuditEntry[] = singleton("audit", () => []);
export const MAIL_QUEUE: QueuedMail[] = singleton("mailQueue", () => []);

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
