import { getViewer } from "@/lib/auth/viewer";
import { viewerRestriction } from "@/lib/auth/access";
import {
  canFinance,
  canApprove,
  EXPENSES,
  PAYROLL,
  inBranch,
  financeSnapshot,
} from "@/lib/data/finance";
import {
  EXPENSE_CATEGORIES,
  expenseTransition,
  money,
  netPay,
  csv,
  type ExpenseCategory,
} from "@/lib/domain/finance";
import { audit } from "@/lib/data/mock/notify";

export async function GET(req: Request) {
  const p = await getViewer();
  if (!canFinance(p) || viewerRestriction(p))
    return Response.json({ error: "Forbidden" }, { status: 403 });
  const data = financeSnapshot(p);
  if (new URL(req.url).searchParams.get("export") === "csv") {
    const rows = [
      ["Type", "Reference", "Branch", "Payee", "Amount PKR", "Status"],
      ...data.expenses.map((e) => [
        "Expense",
        e.id,
        e.branchId,
        e.vendor,
        e.amount,
        e.status,
      ]),
      ...data.payroll.map((e) => [
        "Payroll",
        e.id,
        e.branchId,
        e.name,
        netPay(e),
        e.status,
      ]),
    ];
    return new Response(csv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="sanad-finance.csv"',
        "Cache-Control": "no-store",
      },
    });
  }
  return Response.json(data);
}
export async function POST(req: Request) {
  const p = await getViewer();
  if (!canFinance(p) || viewerRestriction(p))
    return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const b = await req.json();
    if (b.action === "create") {
      const branchId = p.branchId ?? b.branchId ?? "gulberg";
      if (
        !["gulberg", "lakecity", "paragon"].includes(branchId) ||
        !inBranch(p, branchId)
      )
        throw new Error("Invalid campus.");
      const vendor = String(b.vendor ?? "").trim();
      const description = String(b.description ?? "").trim();
      if (
        !vendor ||
        vendor.length > 120 ||
        !description ||
        description.length > 500
      )
        throw new Error(
          "Enter a supplier and description (up to 120 / 500 characters).",
        );
      if (!EXPENSE_CATEGORIES.includes(b.category))
        throw new Error("Choose an expense category.");
      const amount = money(b.amount);
      if (!amount) throw new Error("Amount must be greater than zero.");
      const expense = {
        id: crypto.randomUUID(),
        branchId,
        vendor,
        description,
        category: b.category as ExpenseCategory,
        amount,
        date: new Date().toISOString().slice(0, 10),
        status: "pending" as const,
        createdBy: p.personId,
      };
      EXPENSES.unshift(expense);
      audit(p.personId, "finance.expense.create", "expense", expense.id, {
        amount,
        branchId,
      });
      return Response.json({ ok: true, id: expense.id });
    }
    if (b.kind === "payroll") {
      const line = PAYROLL.find(
        (e) => e.id === b.id && inBranch(p, e.branchId),
      );
      if (!line) throw new Error("Unknown payroll record.");
      if (b.action === "approve" && line.status === "draft" && canApprove(p)) {
        netPay(line);
        line.status = "approved";
        line.approvedBy = p.personId;
      } else if (b.action === "pay" && line.status === "approved") {
        line.status = "paid";
        line.paymentRef = `SAL-${line.id}`;
      } else
        throw new Error("Invalid payroll transition or insufficient role.");
      audit(p.personId, `finance.payroll.${b.action}`, "payroll", line.id);
    } else {
      const i = EXPENSES.findIndex(
        (e) => e.id === b.id && inBranch(p, e.branchId),
      );
      if (i < 0) throw new Error("Unknown expense.");
      EXPENSES[i] = expenseTransition(
        EXPENSES[i],
        b.action,
        p.personId,
        canApprove(p),
      );
      audit(p.personId, `finance.expense.${b.action}`, "expense", b.id);
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Invalid request" },
      { status: 400 },
    );
  }
}
