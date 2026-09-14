import { Banknote } from "lucide-react";
import { Chip, KeyValue, type Tone } from "@/components/ui/primitives";
import { invoiceForStudent, isOverdue, paidOf, statusOf, type InvoiceStatus } from "@/lib/data/mock/fees";
import { fmtPKR, todayISO } from "@/lib/utils";

const STATUS: Record<InvoiceStatus, { label: string; tone: Tone }> = { paid: { label: "Paid", tone: "ok" }, partial: { label: "Part paid", tone: "warn" }, unpaid: { label: "Unpaid", tone: "danger" } };

/** The ward's term invoice as the parent sees it. */
export function FeeCard({ studentId, firstName }: { studentId: string; firstName: string }) {
  const inv = invoiceForStudent(studentId);
  if (!inv) return null;
  const st = STATUS[statusOf(inv)];
  const overdue = isOverdue(inv, todayISO());
  const last = inv.payments[inv.payments.length - 1];
  return (
    <article className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="tile-gold">
            <Banknote size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">{firstName}'s fees</p>
            <p className="text-xs text-ink-3">{inv.term}</p>
          </div>
        </div>
        <Chip tone={overdue ? "danger" : st.tone}>{overdue ? "Overdue" : st.label}</Chip>
      </div>
      <div className="mt-4">
        <KeyValue
          items={[
            { k: "Term fee", v: fmtPKR(inv.amount) },
            { k: "Paid", v: fmtPKR(paidOf(inv)) },
            { k: "Outstanding", v: <span className={inv.amount - paidOf(inv) > 0 ? "text-warn" : undefined}>{fmtPKR(Math.max(0, inv.amount - paidOf(inv)))}</span> },
            { k: "Due", v: inv.dueDate },
            ...(last ? [{ k: "Last receipt", v: `${last.ref} · ${last.method}` }] : []),
          ]}
        />
      </div>
      <p className="mt-3 text-xs text-ink-3">Pay by bank transfer or at the school office; receipts appear here and in your notices.</p>
    </article>
  );
}
