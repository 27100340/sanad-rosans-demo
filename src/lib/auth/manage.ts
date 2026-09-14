import type { Persona } from "./personas";
import { spacesForTeacher } from "@/lib/data/repo";
import type { Student } from "@/lib/domain/types";

/** Who may act on a student's record: the chairman anywhere, a principal in their branch, a teacher in their classes. */
export function mayManage(viewer: Persona, student: Student): boolean {
  if (viewer.role === "chairman") return true;
  if (viewer.role === "principal") return viewer.branchId === student.branchId;
  if (viewer.role === "teacher") return spacesForTeacher(viewer.personId).some((s) => s.classId === student.classId);
  return false;
}
