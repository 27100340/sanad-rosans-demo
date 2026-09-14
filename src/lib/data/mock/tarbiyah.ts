/**
 * Tarbiyah log: quick character observations (punctuality, salah, akhlaq,
 * helpfulness, effort, concern) that roll into the parent brief and the
 * student's profile. Seeds live in comms.ts; entries added at runtime sit in
 * a singleton so API routes and pages share them.
 */
import type { TarbiyahLog } from "@/lib/domain/types";
import { singleton } from "../store";
import { TARBIYAH_LOGS } from "./comms";

export const TARBIYAH_KINDS: TarbiyahLog["kind"][] = ["punctuality", "salah", "akhlaq", "helpfulness", "effort", "concern"];

export const TARBIYAH_LABEL: Record<TarbiyahLog["kind"], string> = {
  punctuality: "Punctuality",
  salah: "Salah",
  akhlaq: "Akhlaq",
  helpfulness: "Helpfulness",
  effort: "Effort",
  concern: "Concern",
};

const EXTRA: TarbiyahLog[] = singleton("tarbiyahExtra", () => []);

export function tarbiyahFor(studentId: string): TarbiyahLog[] {
  return [...EXTRA, ...TARBIYAH_LOGS].filter((l) => l.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date));
}

export function tarbiyahByTeacher(teacherId: string): TarbiyahLog[] {
  return [...EXTRA, ...TARBIYAH_LOGS].filter((l) => l.teacherId === teacherId).sort((a, b) => b.date.localeCompare(a.date));
}

export function addTarbiyahLog(input: Omit<TarbiyahLog, "id">): TarbiyahLog {
  const log: TarbiyahLog = { ...input, id: `tb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}` };
  EXTRA.unshift(log);
  return log;
}

export function isTarbiyahKind(v: unknown): v is TarbiyahLog["kind"] {
  return typeof v === "string" && (TARBIYAH_KINDS as string[]).includes(v);
}
