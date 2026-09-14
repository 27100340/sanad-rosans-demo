/**
 * Fees: one term invoice per student from the section's plan, seeded so
 * most are paid, some partly and a few not at all; payments and reminders
 * are recorded at runtime. Figures are fictional. Production: fee plans,
 * invoices and a payments ledger.
 */
import type { SectionName } from "@/lib/domain/types";
import type { BranchId } from "@/lib/config/school";
import { singleton } from "../store";
import { classById, STUDENTS } from "./people";

export const TERM = "Term 1 · 2026–27";
export const TERM_DUE = "2026-09-10";

export const FEE_PLANS: Record<SectionName, number> = { Montessori: 45_000, Junior: 52_000, Senior: 61_000, Hifz: 38_000 };

export type InvoiceStatus = "paid" | "partial" | "unpaid";

export interface Payment {
  at: string; // ISO datetime
  amount: number;
  method: "bank" | "cash" | "card" | "easypaisa";
  ref: string;
}

export interface Invoice {
  id: string;
  studentId: string;
  branchId: BranchId;
  classId: string;
  term: string;
  amount: number;
  dueDate: string;
  payments: Payment[];
  remindersSent: number;
  lastReminderAt?: string;
}

function hash01(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

function seed(): Invoice[] {
  return STUDENTS.map((s) => {
    const cls = classById.get(s.classId);
    const amount = FEE_PLANS[cls?.section ?? "Senior"];
    const r = hash01(`fee:${s.id}`);
    const payments: Payment[] = [];
    if (r < 0.7) payments.push({ at: `2026-09-0${1 + Math.floor(r * 9)}T10:00:00`, amount, method: r < 0.4 ? "bank" : r < 0.6 ? "easypaisa" : "cash", ref: `RCPT-${s.id.slice(2, 6).toUpperCase()}-1` });
    else if (r < 0.85) payments.push({ at: "2026-09-05T11:30:00", amount: Math.round(amount / 2), method: "bank", ref: `RCPT-${s.id.slice(2, 6).toUpperCase()}-1` });
    return { id: `inv-${s.id}`, studentId: s.id, branchId: s.branchId, classId: s.classId, term: TERM, amount, dueDate: TERM_DUE, payments, remindersSent: 0 };
  });
}

export const INVOICES: Invoice[] = singleton("invoices", seed);

export function paidOf(inv: Invoice): number {
  return inv.payments.reduce((a, p) => a + p.amount, 0);
}

export function statusOf(inv: Invoice): InvoiceStatus {
  const paid = paidOf(inv);
  return paid >= inv.amount ? "paid" : paid > 0 ? "partial" : "unpaid";
}

export function isOverdue(inv: Invoice, today: string): boolean {
  return statusOf(inv) !== "paid" && inv.dueDate < today;
}

export function invoicesForBranch(branchId: BranchId): Invoice[] {
  return INVOICES.filter((i) => i.branchId === branchId);
}

export function invoiceForStudent(studentId: string): Invoice | undefined {
  return INVOICES.find((i) => i.studentId === studentId);
}

export function recordPayment(inv: Invoice, amount: number, method: Payment["method"], now = new Date().toISOString()): Payment {
  const p: Payment = { at: now, amount, method, ref: `RCPT-${inv.studentId.slice(2, 6).toUpperCase()}-${inv.payments.length + 1}` };
  inv.payments.push(p);
  return p;
}

export function markReminder(inv: Invoice, now = new Date().toISOString()): void {
  inv.remindersSent += 1;
  inv.lastReminderAt = now;
}

export interface ClassFeeRow {
  classId: string;
  className: string;
  students: number;
  expected: number;
  collected: number;
  pct: number;
  unpaid: number;
  partial: number;
}

export function feeByClass(branchId: BranchId): ClassFeeRow[] {
  const groups = new Map<string, Invoice[]>();
  for (const inv of invoicesForBranch(branchId)) groups.set(inv.classId, [...(groups.get(inv.classId) ?? []), inv]);
  return [...groups.entries()]
    .map(([classId, invs]) => {
      const expected = invs.reduce((a, i) => a + i.amount, 0);
      const collected = invs.reduce((a, i) => a + Math.min(i.amount, paidOf(i)), 0);
      return { classId, className: classById.get(classId)?.name ?? classId, students: invs.length, expected, collected, pct: expected ? Math.round((collected / expected) * 100) : 0, unpaid: invs.filter((i) => statusOf(i) === "unpaid").length, partial: invs.filter((i) => statusOf(i) === "partial").length };
    })
    .sort((a, b) => a.pct - b.pct);
}
