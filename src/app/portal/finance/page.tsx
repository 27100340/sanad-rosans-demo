import { getViewer } from "@/lib/auth/viewer";
import { canFinance, canApprove, financeSnapshot } from "@/lib/data/finance";
import { SeatDenied } from "@/components/leadership/seat-guard";
import { PageHeader } from "@/components/ui/primitives";
import { FinanceWorkspace } from "@/components/principal/finance-workspace";
export default async function FinancePage() {
  const p = await getViewer();
  if (!canFinance(p)) return <SeatDenied home={p.home} />;
  return (
    <>
      <PageHeader
        eyebrow="School operations · Finance"
        title="Every rupee, accounted for"
        description="Fees, expenditure, payroll and budgets. All figures are fictional demonstration records."
      />
      <FinanceWorkspace
        data={financeSnapshot(p)}
        approver={canApprove(p)}
        actorId={p.personId}
      />
    </>
  );
}
