import { singleton } from "./store";
import { INVOICES, paidOf } from "./mock/fees";
import { TEACHERS } from "./mock/people";
import {
  EXPENSE_CATEGORIES,
  netPay,
  type Expense,
  type PayrollLine,
} from "../domain/finance";
import type { Persona } from "../auth/personas";

export const canFinance = (p: Persona) =>
  ["chairman", "principal", "finance"].includes(p.role);
export const canApprove = (p: Persona) =>
  ["chairman", "principal"].includes(p.role);
export const inBranch = (p: Persona, branch: string) =>
  p.branchId === null || p.branchId === branch;
export const EXPENSES = singleton<Expense[]>("finance-expenses-v1", () => [
  {
    id: "exp-1001",
    branchId: "gulberg",
    vendor: "Learning Supply Co.",
    category: "Learning materials",
    description: "Primary manipulatives and reading books",
    amount: 42000,
    date: "2026-09-12",
    status: "pending",
    createdBy: "p-finance-gulberg",
  },
  {
    id: "exp-1002",
    branchId: "gulberg",
    vendor: "Campus Maintenance",
    category: "Facilities",
    description: "Classroom maintenance",
    amount: 28000,
    date: "2026-09-10",
    status: "approved",
    createdBy: "p-finance-gulberg",
    approvedBy: "p-principal-gulberg",
  },
  {
    id: "exp-1003",
    branchId: "gulberg",
    vendor: "Utility provider",
    category: "Utilities",
    description: "September utilities",
    amount: 35000,
    date: "2026-09-09",
    status: "paid",
    createdBy: "p-finance-gulberg",
    approvedBy: "p-principal-gulberg",
    paymentRef: "PAY-exp-1003",
  },
]);
export const PAYROLL = singleton<PayrollLine[]>("payroll-v1", () =>
  TEACHERS.map((t, i) => ({
    id: `salary-${t.id}-2026-09`,
    branchId: t.branchId!,
    teacherId: t.id,
    name: t.name,
    month: "2026-09",
    basic: 60000 + i * 3000,
    allowance: 5000,
    deduction: 0,
    status: "draft",
  })),
);
export function financeSnapshot(p: Persona) {
  const expenses = EXPENSES.filter((e) => inBranch(p, e.branchId));
  const payroll = PAYROLL.filter((e) => inBranch(p, e.branchId));
  const invoices = INVOICES.filter((e) => inBranch(p, e.branchId));
  const billed = invoices.reduce((s, i) => s + i.amount, 0);
  const collected = invoices.reduce((s, i) => s + paidOf(i), 0);
  const cashOut =
    expenses
      .filter((e) => e.status === "paid")
      .reduce((s, e) => s + e.amount, 0) +
    payroll
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + netPay(p), 0);
  const campusCount = p.branchId ? 1 : 3;
  const budgets = EXPENSE_CATEGORIES.map((category, i) => ({
    category,
    budget: [120000, 80000, 90000, 60000, 45000][i] * campusCount,
    committed: expenses
      .filter((e) => e.category === category && e.status !== "rejected")
      .reduce((s, e) => s + e.amount, 0),
  }));
  return {
    expenses,
    payroll,
    billed,
    collected,
    outstanding: billed - collected,
    cashOut,
    netCashMovement: collected - cashOut,
    budgets,
  };
}
