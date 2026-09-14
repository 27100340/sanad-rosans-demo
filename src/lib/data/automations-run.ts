/**
 * The runners behind each automation. Deterministic and bounded so a run
 * finishes inside one request; the AI is never called in bulk (parent
 * reports use the template, exactly like the reference's Saturday job).
 */
import { buildProgressStats, fallbackEmail } from "@/lib/ai/progress-report";
import { buildKpi } from "./kpi";
import { INVOICES, isOverdue, markReminder, paidOf, statusOf, TERM } from "./mock/fees";
import { notify, personName, queueMail } from "./mock/notify";
import { guardianById, STUDENTS } from "./mock/people";
import { preferencesFor } from "./mock/preferences";
import { tasksForStudent } from "./mock/tasks";
import { recordRun, type JobId, type JobRun } from "./mock/automations";
import { ensureStudyPlan } from "./study-plan";
import type { BranchId } from "@/lib/config/school";
import { fmtInt, todayISO } from "@/lib/utils";

export function runJob(jobId: JobId, branchId: BranchId, by: string): JobRun {
  const students = STUDENTS.filter((s) => s.branchId === branchId && !s.hifz);
  const today = todayISO();

  if (jobId === "daily-study-plans") {
    let built = 0;
    for (const s of students) if ((ensureStudyPlan(s.id)?.createdNow ?? 0) > 0) built += 1;
    return recordRun({ jobId, by, summary: `${students.length} students: ${built} plans built, ${students.length - built} already current`, counts: { students: students.length, built } });
  }

  if (jobId === "saturday-parent-reports") {
    let queued = 0;
    for (const s of students) {
      const stats = buildProgressStats(s.id);
      const guardian = guardianById.get(s.guardianId);
      if (!stats || !guardian) continue;
      const mail = fallbackEmail({ stats, forParent: true, recipientName: guardian.name, language: preferencesFor(guardian.id).language, senderName: personName(by === "schedule" ? "p-principal-gulberg" : by) });
      queueMail(guardian.id, "email", mail.subject, mail.body);
      notify({ personIds: [guardian.id] }, { kind: "report", title: mail.subject, body: mail.body.slice(0, 280), href: "/portal/family/reports" });
      queued += 1;
    }
    return recordRun({ jobId, by, summary: `${queued} reports queued to ${queued} guardians`, counts: { queued } });
  }

  if (jobId === "weekly-digest") {
    const kpi = new Map(buildKpi(branchId).students.map((k) => [k.studentId, k]));
    let sent = 0;
    for (const s of students) {
      const tasks = tasksForStudent(s.id);
      const done = tasks.filter((t) => t.status === "done").length;
      const open = tasks.length - done;
      const k = kpi.get(s.id);
      notify({ personIds: [s.id] }, { kind: "reminder", title: "Your week in numbers", body: `${done} task${done === 1 ? "" : "s"} done, ${open} open${k ? `; Performance Index ${Math.round(k.composite)}, #${k.rankClass} of ${k.outOfClass} in ${k.className}` : ""}.`, href: "/portal/learn/ranking" });
      sent += 1;
    }
    return recordRun({ jobId, by, summary: `${sent} digests sent`, counts: { sent } });
  }

  if (jobId === "fee-reminders") {
    let reminded = 0;
    for (const inv of INVOICES.filter((i) => i.branchId === branchId && statusOf(i) !== "paid")) {
      const s = STUDENTS.find((x) => x.id === inv.studentId);
      if (!s) continue;
      const outstanding = inv.amount - paidOf(inv);
      const overdue = isOverdue(inv, today);
      const subject = `${overdue ? "Overdue" : "Reminder"}: ${TERM} fee for ${s.name}`;
      const text = `Rs ${fmtInt(outstanding)} of the ${TERM} fee for ${s.name} is ${overdue ? `overdue (due ${inv.dueDate})` : `due on ${inv.dueDate}`}. Please pay by bank transfer or at the school office.`;
      queueMail(s.guardianId, "email", subject, text);
      notify({ personIds: [s.guardianId] }, { kind: "reminder", title: subject, body: text, href: "/portal/family/children" });
      markReminder(inv);
      reminded += 1;
    }
    return recordRun({ jobId, by, summary: `${reminded} guardians reminded`, counts: { reminded } });
  }

  const table = buildKpi(branchId);
  const avg = table.students.length ? Math.round(table.students.reduce((a, s) => a + s.composite, 0) / table.students.length) : 0;
  return recordRun({ jobId: "kpi-rebuild", by, summary: `${table.students.length} students ranked; average index ${avg}`, counts: { students: table.students.length, average: avg } });
}
