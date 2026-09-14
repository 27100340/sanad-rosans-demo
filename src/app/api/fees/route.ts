/**
 * Fees actions for the principal (own branch) or chairman: send a reminder
 * to the guardian (queued email plus an in-app notice) or record a payment.
 * Both are audited; a receipt notice goes to the guardian on payment.
 */
import { getViewer } from "@/lib/auth/viewer";
import { INVOICES, isOverdue, markReminder, paidOf, recordPayment, statusOf, TERM } from "@/lib/data/mock/fees";
import { audit, notify, queueMail } from "@/lib/data/mock/notify";
import { studentById } from "@/lib/data/mock/people";
import { fmtInt, todayISO } from "@/lib/utils";

const METHODS = ["bank", "cash", "card", "easypaisa"] as const;

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (viewer.role !== "principal" && viewer.role !== "chairman") return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { action?: string; invoiceId?: string; amount?: number; method?: string };
  const inv = INVOICES.find((i) => i.id === body.invoiceId);
  if (!inv || (viewer.branchId && inv.branchId !== viewer.branchId)) return Response.json({ error: "unknown invoice" }, { status: 400 });
  const student = studentById.get(inv.studentId);
  if (!student) return Response.json({ error: "unknown student" }, { status: 400 });
  const outstanding = inv.amount - paidOf(inv);

  if (body.action === "remind") {
    if (outstanding <= 0) return Response.json({ error: "Nothing outstanding." }, { status: 400 });
    const overdue = isOverdue(inv, todayISO());
    const subject = `${overdue ? "Overdue" : "Reminder"}: ${TERM} fee for ${student.name}`;
    const text = `Assalamu alaikum. Rs ${fmtInt(outstanding)} of the ${TERM} fee for ${student.name} is ${overdue ? `overdue (due ${inv.dueDate})` : `due on ${inv.dueDate}`}. Please pay by bank transfer or at the school office. Ignore this if you have already paid.`;
    queueMail(student.guardianId, "email", subject, text);
    notify({ personIds: [student.guardianId] }, { kind: "reminder", title: subject, body: text, href: "/portal/family/children", fromId: viewer.personId });
    markReminder(inv);
    audit(viewer.personId, "fee.remind", "invoice", inv.id, { student: student.name, outstanding, overdue });
    return Response.json({ ok: true, remindersSent: inv.remindersSent });
  }

  if (body.action === "payment") {
    const amount = Math.round(Number(body.amount));
    const method = METHODS.includes(body.method as (typeof METHODS)[number]) ? (body.method as (typeof METHODS)[number]) : "bank";
    if (!Number.isFinite(amount) || amount <= 0 || amount > outstanding) return Response.json({ error: `Enter an amount up to Rs ${fmtInt(outstanding)}.` }, { status: 400 });
    const p = recordPayment(inv, amount, method);
    notify({ personIds: [student.guardianId] }, { kind: "message", title: `Receipt ${p.ref}: Rs ${fmtInt(amount)} received`, body: `${TERM} fee for ${student.name}. ${statusOf(inv) === "paid" ? "Fully paid, thank you." : `Rs ${fmtInt(inv.amount - paidOf(inv))} remains.`}`, href: "/portal/family/children", fromId: viewer.personId });
    audit(viewer.personId, "fee.payment", "invoice", inv.id, { student: student.name, amount, method, ref: p.ref });
    return Response.json({ ok: true, status: statusOf(inv), paid: paidOf(inv), ref: p.ref });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}
