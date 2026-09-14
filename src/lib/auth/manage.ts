import type { Persona } from "./personas";
import { classById, studentById } from "@/lib/data/mock/people";
import { spacesForTeacher } from "@/lib/data/repo";
import type { Student } from "@/lib/domain/types";

/** Who may read and post in a class library: its students, its teachers, the branch's principal, the chairman. */
export function mayUseClass(viewer: Persona, classId: string): boolean {
  if (viewer.role === "student" && viewer.studentId) return studentById.get(viewer.studentId)?.classId === classId;
  if (viewer.role === "teacher") return spacesForTeacher(viewer.personId).some((s) => s.classId === classId);
  if (viewer.role === "principal" || viewer.role === "chairman") return viewer.branchId === null || classById.get(classId)?.branchId === viewer.branchId;
  return false;
}

/** Who may act on a student's record: the chairman anywhere, a principal in their branch, a teacher in their classes. */
export function mayManage(viewer: Persona, student: Student): boolean {
  if (viewer.role === "chairman") return true;
  if (viewer.role === "principal") return viewer.branchId === student.branchId;
  if (viewer.role === "teacher") return spacesForTeacher(viewer.personId).some((s) => s.classId === student.classId);
  return false;
}
