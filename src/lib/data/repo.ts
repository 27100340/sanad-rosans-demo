/**
 * The demo's in-memory repository. It is the single write path for records
 * that admins create at runtime (subjects, subject spaces). Reads elsewhere go
 * through the same arrays and maps the mock modules export, so a space created
 * here appears for the teacher, the students, and the principal immediately.
 * Production swaps this file for a Supabase-backed implementation.
 */
import type { SchoolClass, SectionName, SubjectSpace } from "@/lib/domain/types";
import type { BranchId } from "@/lib/config/school";
import { CLASSES, TEACHERS, classById, teacherById } from "./mock/people";
import { SPACES, spaceById } from "./mock/spaces";
import { SUBJECTS, buildSpace, type Subject } from "./mock/subjects";
import { singleton } from "./store";

const catalogue: Subject[] = singleton("subjects", () => [...SUBJECTS]);

export function listSubjects(): Subject[] {
  return catalogue;
}

export function subjectById(id: string): Subject | undefined {
  return catalogue.find((s) => s.id === id);
}

export interface NewSubjectInput {
  name: string;
  code?: string;
  board?: string;
  sections: SectionName[];
  strands: string[];
}

export function addSubject(input: NewSubjectInput): { subject?: Subject; error?: string } {
  const name = input.name.trim();
  if (name.length < 2) return { error: "Subject needs a name." };
  if (catalogue.some((s) => s.name.toLowerCase() === name.toLowerCase())) return { error: `${name} already exists in the catalogue.` };
  const strands = input.strands.map((s) => s.trim()).filter(Boolean);
  if (!strands.length) return { error: "Add at least one strand so the tutor and planner have a syllabus map." };
  const id = "custom-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const subject: Subject = {
    id,
    name,
    code: input.code?.trim() || undefined,
    board: input.board?.trim() || "School curriculum",
    sections: input.sections.length ? input.sections : ["Junior", "Senior"],
    strands,
    custom: true,
  };
  catalogue.push(subject);
  return { subject };
}

export function listSpaces(branchId?: BranchId): SubjectSpace[] {
  return branchId ? SPACES.filter((s) => s.branchId === branchId) : SPACES;
}

export function spacesForTeacher(teacherId: string): SubjectSpace[] {
  return SPACES.filter((s) => s.teacherId === teacherId);
}

export function classesForBranch(branchId: BranchId, includeHifz = false): SchoolClass[] {
  return CLASSES.filter((c) => c.branchId === branchId && (includeHifz || c.section !== "Hifz"));
}

export function teachersForBranch(branchId: BranchId) {
  return TEACHERS.filter((t) => t.branchId === branchId && t.role === "teacher");
}

export function addSpace(input: { subjectId: string; classId: string; teacherId: string }): { space?: SubjectSpace; error?: string } {
  const subject = subjectById(input.subjectId);
  const cls = classById.get(input.classId);
  const teacher = teacherById.get(input.teacherId);
  if (!subject || !cls || !teacher) return { error: "Pick a subject, a class and a teacher." };
  if (!subject.sections.includes(cls.section)) return { error: `${subject.name} is not offered in the ${cls.section} section.` };
  if (teacher.branchId !== cls.branchId) return { error: `${teacher.name} teaches at a different campus.` };
  const existing = SPACES.find((s) => s.classId === cls.id && s.subject === subject.name);
  if (existing) return { error: `${cls.name} already has ${subject.name} with ${teacherById.get(existing.teacherId)?.name ?? "a teacher"}.` };

  const space = buildSpace(subject, cls, teacher.id);
  SPACES.push(space);
  spaceById.set(space.id, space);
  if (!teacher.spaceIds.includes(space.id)) teacher.spaceIds.push(space.id);
  if (!teacher.subjects.includes(subject.name)) teacher.subjects.push(subject.name);
  return { space };
}

export function reassignSpace(spaceId: string, teacherId: string): { space?: SubjectSpace; error?: string } {
  const space = spaceById.get(spaceId);
  const teacher = teacherById.get(teacherId);
  if (!space || !teacher) return { error: "Unknown space or teacher." };
  const previous = teacherById.get(space.teacherId);
  if (previous) previous.spaceIds = previous.spaceIds.filter((id) => id !== spaceId);
  space.teacherId = teacher.id;
  if (!teacher.spaceIds.includes(spaceId)) teacher.spaceIds.push(spaceId);
  return { space };
}
