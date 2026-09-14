export const EXPENSE_CATEGORIES = [
  "Learning materials",
  "Facilities",
  "Utilities",
  "Transport",
  "Technology",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export interface Expense {
  id: string;
  branchId: string;
  vendor: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  status: "pending" | "approved" | "paid" | "rejected";
  createdBy: string;
  approvedBy?: string;
  paymentRef?: string;
}
export interface PayrollLine {
  id: string;
  branchId: string;
  teacherId: string;
  name: string;
  month: string;
  basic: number;
  allowance: number;
  deduction: number;
  status: "draft" | "approved" | "paid";
  approvedBy?: string;
  paymentRef?: string;
}
export function money(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > 100_000_000
  )
    throw new Error("Enter a whole PKR amount between 0 and 100,000,000.");
  return value;
}
export function netPay(
  line: Pick<PayrollLine, "basic" | "allowance" | "deduction">,
): number {
  const gross = money(line.basic) + money(line.allowance);
  if (money(line.deduction) > gross)
    throw new Error("Deductions cannot exceed gross pay.");
  return gross - line.deduction;
}
export function expenseTransition(
  expense: Expense,
  action: string,
  actor: string,
  approver: boolean,
): Expense {
  if (action === "approve" || action === "reject") {
    if (!approver)
      throw new Error(
        "Only the principal or chairman can approve expenditure.",
      );
    if (expense.createdBy === actor)
      throw new Error("A different person must review this expense.");
    if (expense.status !== "pending")
      throw new Error("Only pending expenses can be reviewed.");
    return {
      ...expense,
      status: action === "approve" ? "approved" : "rejected",
      approvedBy: actor,
    };
  }
  if (action === "pay") {
    if (expense.status !== "approved")
      throw new Error("Approve the expense before recording payment.");
    return { ...expense, status: "paid", paymentRef: `PAY-${expense.id}` };
  }
  throw new Error("Unknown expense action.");
}
/** Quoted cells plus formula-neutralisation for spreadsheet downloads. */
export function csv(rows: unknown[][]): string {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const raw = String(value ?? "");
          const safe = /^[\s]*[=+@-]/.test(raw) ? `'${raw}` : raw;
          return `"${safe.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\r\n");
}
