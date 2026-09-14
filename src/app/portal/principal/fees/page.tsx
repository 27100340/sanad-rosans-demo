import { AlertTriangle, Banknote, Percent, Users } from "lucide-react";
import { relativeStamp } from "@/components/leadership/format";
import { canSeePrincipal, SeatDenied } from "@/components/leadership/seat-guard";
import { FeesConsole, type DefaulterRow } from "@/components/principal/fees-console";
import { Chip, PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { branchName, type BranchId } from "@/lib/config/school";
import { feeByClass, FEE_PLANS, invoicesForBranch, isOverdue, paidOf, statusOf, TERM, TERM_DUE } from "@/lib/data/mock/fees";
import { classById, guardianById, studentById } from "@/lib/data/mock/people";
import { cn, fmtPKR, todayISO } from "@/lib/utils";

const DEMO_BRANCH: BranchId = "gulberg";
const LEDGER_LIMIT = 12;

export default async function FeesPage() {
  const viewer = await getViewer();
  if (!canSeePrincipal(viewer) && viewer.role !== "finance") return <SeatDenied home={viewer.home} />;
  const branchId = viewer.branchId ?? DEMO_BRANCH;
  const today = todayISO();

  const invoices = invoicesForBranch(branchId);
  const expected = invoices.reduce((a, i) => a + i.amount, 0);
  const collected = invoices.reduce((a, i) => a + Math.min(i.amount, paidOf(i)), 0);
  const overdue = invoices.filter((i) => isOverdue(i, today));
  const byClass = feeByClass(branchId);

  const defaulters: DefaulterRow[] = invoices
    .filter((i) => statusOf(i) !== "paid")
    .map((i) => {
      const s = studentById.get(i.studentId);
      return { invoiceId: i.id, studentName: s?.name ?? i.studentId, className: classById.get(i.classId)?.name ?? "", guardianName: guardianById.get(s?.guardianId ?? "")?.name ?? "Guardian", amount: i.amount, paid: paidOf(i), outstanding: i.amount - paidOf(i), status: statusOf(i), overdue: isOverdue(i, today), remindersSent: i.remindersSent };
    })
    .sort((a, b) => Number(b.overdue) - Number(a.overdue) || b.outstanding - a.outstanding);

  const ledger = invoices.flatMap((i) => i.payments.map((p) => ({ ...p, studentName: studentById.get(i.studentId)?.name ?? i.studentId, className: classById.get(i.classId)?.name ?? "" }))).sort((a, b) => b.at.localeCompare(a.at)).slice(0, LEDGER_LIMIT);

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader eyebrow={`Principal · ${branchName(branchId)}`} title="Fees and finance" description={`${TERM} · due ${TERM_DUE}. Collection by class, outstanding invoices with reminders and receipts, and the payments ledger.`} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Collected" value={fmtPKR(collected)} trend={`of ${fmtPKR(expected)} expected`} icon={<Banknote size={18} />} tone="accent" />
        <Stat label="Collection" value={`${expected ? Math.round((collected / expected) * 100) : 0}%`} trend="this term" icon={<Percent size={18} />} tone="info" />
        <Stat label="Outstanding" value={defaulters.length} trend={`${fmtPKR(expected - collected)} to collect`} icon={<Users size={18} />} tone={defaulters.length ? "warn" : "ok"} />
        <Stat label="Overdue" value={overdue.length} trend={`past ${TERM_DUE}`} icon={<AlertTriangle size={18} />} tone={overdue.length ? "danger" : "ok"} />
      </div>

      <section>
        <SectionTitle title="By class" hint="Lowest collection first. Plans per section: Montessori, Junior, Senior and Hifz." />
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Class</th>
                <th className="text-right">Students</th>
                <th className="text-right">Expected</th>
                <th className="text-right">Collected</th>
                <th className="text-right">Collection</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {byClass.map((r) => (
                <tr key={r.classId}>
                  <td className="whitespace-nowrap font-medium">{r.className}</td>
                  <td className="num text-right">{r.students}</td>
                  <td className="num text-right">{fmtPKR(r.expected)}</td>
                  <td className="num text-right">{fmtPKR(r.collected)}</td>
                  <td className={cn("num text-right font-semibold", r.pct < 70 ? "text-danger" : r.pct < 90 ? "text-warn" : "text-ok")}>{r.pct}%</td>
                  <td>
                    <span className="flex flex-wrap gap-1">
                      {r.unpaid ? <Chip tone="danger">{r.unpaid} unpaid</Chip> : null}
                      {r.partial ? <Chip tone="warn">{r.partial} part paid</Chip> : null}
                      {!r.unpaid && !r.partial ? <Chip tone="ok">All paid</Chip> : null}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink-3">Plans: {Object.entries(FEE_PLANS).map(([s, v]) => `${s} ${fmtPKR(v)}`).join(" · ")} per term.</p>
      </section>

      <section>
        <SectionTitle title="Outstanding" hint="Overdue first. A reminder goes to the guardian as an email and an in-app notice; a receipt notice goes on payment." />
        <FeesConsole rows={defaulters} />
      </section>

      <section>
        <SectionTitle title="Recent payments" hint={`Last ${LEDGER_LIMIT} receipts.`} />
        {ledger.length ? (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th className="text-right">Amount</th>
                  <th>Method</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((p) => (
                  <tr key={p.ref}>
                    <td className="num whitespace-nowrap text-ink-2">{relativeStamp(p.at)}</td>
                    <td className="whitespace-nowrap font-medium">{p.studentName}</td>
                    <td className="whitespace-nowrap text-ink-2">{p.className}</td>
                    <td className="num text-right">{fmtPKR(p.amount)}</td>
                    <td className="capitalize">{p.method}</td>
                    <td className="font-mono text-xs text-ink-3">{p.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="card-quiet px-4 py-3 text-xs text-ink-3">No payments yet.</p>
        )}
      </section>
    </div>
  );
}
