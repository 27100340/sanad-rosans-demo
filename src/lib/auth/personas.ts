/**
 * Demo identity. In production this module is replaced by a Supabase session
 * reader; the predicates and the `Viewer` shape stay identical.
 */
import type { BranchId } from "@/lib/config/school";
import type { Role } from "@/lib/domain/types";

export interface Persona {
  id: string;
  personId: string; // id in the people mock
  label: string;
  role: Role;
  branchId: BranchId | null;
  home: string;
  blurb: string;
  spaceId?: string;
  studentId?: string;
  guardianId?: string;
}

export const PERSONAS: Persona[] = [
  { id: "chairman", personId: "p-chairman", label: "Chairman", role: "chairman", branchId: null, home: "/portal/leadership", blurb: "Sees all three campuses live and asks the school questions." },
  { id: "principal-gulberg", personId: "p-principal-gulberg", label: "Principal, Gulberg", role: "principal", branchId: "gulberg", home: "/portal/principal", blurb: "Runs one campus: at-risk students, teachers, parents, timetable." },
  { id: "coordinator-gulberg", personId: "p-coordinator-gulberg", label: "Mr. Adeel Hussain · Coordinator", role: "coordinator", branchId: "gulberg", home: "/portal/coordinator", blurb: "Runs the Senior section day to day: registers, parents, timetable." },
  { id: "teacher-maths", personId: "t-hina-raza", label: "Ms. Hina Raza · Maths", role: "teacher", branchId: "gulberg", home: "/portal/teach", blurb: "Owns the Grade 8-B and 7-A Mathematics spaces and their AI tutor rules.", spaceId: "gulberg-g8b-maths" },
  { id: "ustadh", personId: "t-qari-abdul-rehman", label: "Qari Abdul Rehman · Hifz", role: "ustadh", branchId: "gulberg", home: "/portal/hifz/ustadh", blurb: "Leads Halaqa 2; sees every student's memorisation map." },
  { id: "student-ahmed", personId: "s-ahmed-hassan", label: "Ahmed Hassan · Grade 8-B", role: "student", branchId: "gulberg", home: "/portal/learn", blurb: "Learns with a tutor that follows his teacher's rules.", studentId: "s-ahmed-hassan" },
  { id: "student-ali", personId: "s-ali-hamza", label: "Ali Hamza · O Level 1", role: "student", branchId: "gulberg", home: "/portal/learn", blurb: "Sits Cambridge past papers and proctored mock exams.", studentId: "s-ali-hamza" },
  { id: "student-zaid", personId: "s-zaid-hassan", label: "Muhammad Zaid · Hifz", role: "student", branchId: "gulberg", home: "/portal/hifz", blurb: "Listens, recites back, and gets word-level feedback.", studentId: "s-zaid-hassan" },
  { id: "parent-nadia", personId: "g-nadia-hassan", label: "Mrs. Nadia Hassan · Parent", role: "parent", branchId: "gulberg", home: "/portal/family", blurb: "Gets tonight's brief for Ahmed and Zaid in Urdu or English.", guardianId: "g-nadia-hassan" },
];

export const PERSONA_COOKIE = "persona";
export const DEFAULT_PERSONA = "chairman";

export function findPersona(id: string | undefined | null): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}

export function isLeadership(p: Persona): boolean {
  return p.role === "chairman";
}
export function isBranchStaff(p: Persona): boolean {
  return p.role === "principal" || p.role === "coordinator" || p.role === "registrar" || p.role === "finance";
}
export function canSeeBranch(p: Persona, branchId: BranchId): boolean {
  return p.branchId === null || p.branchId === branchId;
}
export function isStaff(p: Persona): boolean {
  return ["chairman", "principal", "coordinator", "teacher", "ustadh", "registrar", "finance"].includes(p.role);
}
