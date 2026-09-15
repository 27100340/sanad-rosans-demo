/**
 * "View as" for the super admin seat.
 *
 * Rather than special-casing the owner inside the ~120 role checks across the
 * portal, the super admin can *become* any person in the school: this module
 * builds a real `Persona` for any student, teacher, guardian or leader from the
 * people records, and `getViewer()` returns it while the cookie is set. Every
 * existing guard then passes on its own terms, and what the owner sees is
 * exactly what that person sees.
 *
 * Only a super admin may set the cookie (enforced in /api/view-as), and the
 * banner in the shell makes the impersonation impossible to miss.
 */
import type { BranchId } from "@/lib/config/school";
import { classById, guardianById, peopleById, studentById, teacherById, GUARDIANS, LEADERS, STUDENTS, TEACHERS } from "@/lib/data/mock/people";
import type { Role } from "@/lib/domain/types";
import type { Persona } from "./personas";

export const VIEW_AS_COOKIE = "view-as";

/** Home for a student: Hifz pathway, early/primary learning, or the senior portal. */
function studentHome(studentId: string): string {
  const student = studentById.get(studentId);
  if (!student) return "/portal/learn";
  if (student.hifz) return "/portal/hifz";
  const year = classById.get(student.classId)?.year ?? 10;
  return year > 0 && year <= 6 ? "/portal/learning" : "/portal/learn";
}

function homeForStaff(role: Role, personId: string): string {
  if (role === "ustadh") return "/portal/hifz/ustadh";
  if (role === "chairman") return "/portal/leadership";
  if (role === "principal") return "/portal/principal";
  if (role === "coordinator") return "/portal/coordinator";
  if (role === "finance" || role === "registrar") return "/portal/finance";
  // A teacher with no subject space of their own runs a whole-class pathway.
  return teacherById.get(personId)?.spaceIds.length ? "/portal/teach" : "/portal/teaching";
}

/**
 * The persona for any person in the school, or null when the id is unknown.
 * Ids are stable, so this is also what makes a "view as" link shareable.
 */
export function personaForPerson(personId: string): Persona | null {
  const student = studentById.get(personId);
  if (student) {
    const className = classById.get(student.classId)?.name ?? "";
    return {
      id: `view-${personId}`,
      personId,
      label: `${student.name}${className ? ` · ${className}` : ""}`,
      role: "student",
      branchId: student.branchId,
      home: studentHome(personId),
      blurb: `Student in ${className || "the school"}.`,
      studentId: personId,
    };
  }

  const guardian = guardianById.get(personId);
  if (guardian) {
    const wards = guardian.studentIds.map((id) => studentById.get(id)?.firstName ?? id).join(" and ");
    const branchId = (guardian.studentIds.map((id) => studentById.get(id)?.branchId).find(Boolean) ?? null) as BranchId | null;
    return {
      id: `view-${personId}`,
      personId,
      label: `${guardian.name} · parent`,
      role: "parent",
      branchId,
      home: "/portal/family",
      blurb: wards ? `Guardian of ${wards}.` : "Guardian.",
      guardianId: personId,
    };
  }

  const teacher = teacherById.get(personId);
  if (teacher) {
    return {
      id: `view-${personId}`,
      personId,
      label: `${teacher.name} · ${teacher.subjects[0] ?? teacher.role}`,
      role: teacher.role,
      branchId: teacher.branchId,
      home: homeForStaff(teacher.role, personId),
      blurb: teacher.subjects.join(", ") || "Teaching staff.",
      spaceId: teacher.spaceIds[0],
    };
  }

  const leader = peopleById.get(personId) ?? LEADERS.find((l) => l.id === personId);
  if (leader) {
    return {
      id: `view-${personId}`,
      personId,
      label: `${leader.name}${leader.title ? ` · ${leader.title}` : ""}`,
      role: leader.role,
      branchId: leader.branchId,
      home: homeForStaff(leader.role, personId),
      blurb: leader.title ?? leader.role,
      };
  }
  return null;
}

export interface DirectoryPerson {
  id: string;
  name: string;
  role: Role;
  detail: string;
  branchId: BranchId | null;
  home: string;
}

/** Everyone the super admin can view the portal as, grouped for the picker. */
export function directory(): { staff: DirectoryPerson[]; students: DirectoryPerson[]; guardians: DirectoryPerson[] } {
  const staff: DirectoryPerson[] = [
    ...LEADERS.map((l) => ({ id: l.id, name: l.name, role: l.role, detail: l.title ?? l.role, branchId: l.branchId, home: homeForStaff(l.role, l.id) })),
    ...TEACHERS.map((t) => ({ id: t.id, name: t.name, role: t.role, detail: t.subjects.join(", ") || t.role, branchId: t.branchId, home: homeForStaff(t.role, t.id) })),
  ].filter((p) => p.role !== "superadmin");

  const students: DirectoryPerson[] = STUDENTS.map((s) => ({
    id: s.id,
    name: s.name,
    role: "student" as const,
    detail: classById.get(s.classId)?.name ?? s.classId,
    branchId: s.branchId,
    home: studentHome(s.id),
  }));

  const guardians: DirectoryPerson[] = GUARDIANS.map((g) => ({
    id: g.id,
    name: g.name,
    role: "parent" as const,
    detail: g.studentIds.map((id) => studentById.get(id)?.firstName ?? id).join(", "),
    branchId: (g.studentIds.map((id) => studentById.get(id)?.branchId).find(Boolean) ?? null) as BranchId | null,
    home: "/portal/family",
  }));

  const byName = (a: DirectoryPerson, b: DirectoryPerson) => a.name.localeCompare(b.name);
  return { staff: staff.sort(byName), students: students.sort(byName), guardians: guardians.sort(byName) };
}
