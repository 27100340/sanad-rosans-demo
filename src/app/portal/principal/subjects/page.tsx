import { canSeePrincipal, SeatDenied } from "@/components/leadership/seat-guard";
import { SubjectsAdmin, type ClassRow, type SpaceRow, type SubjectRow, type TeacherRow } from "@/components/principal/subjects-admin";
import { PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { branchName, type BranchId } from "@/lib/config/school";
import { classById, teacherById } from "@/lib/data/mock/people";
import { classesForBranch, listSpaces, listSubjects, teachersForBranch } from "@/lib/data/repo";

const DEMO_BRANCH: BranchId = "gulberg";

export default async function SubjectsPage() {
  const viewer = await getViewer();
  if (!canSeePrincipal(viewer)) return <SeatDenied home={viewer.home} />;
  const branchId = viewer.branchId ?? DEMO_BRANCH;

  const subjects: SubjectRow[] = listSubjects().map((s) => ({ id: s.id, name: s.name, code: s.code, board: s.board, sections: s.sections, strands: s.strands.length, custom: s.custom }));
  const classes: ClassRow[] = classesForBranch(branchId).map((c) => ({ id: c.id, name: c.name, section: c.section }));
  const teachers: TeacherRow[] = teachersForBranch(branchId).map((t) => ({ id: t.id, name: t.name, subjects: t.subjects }));
  const spaces: SpaceRow[] = listSpaces(branchId).map((s) => ({
    id: s.id,
    subject: s.subject,
    className: classById.get(s.classId)?.name ?? s.classId,
    teacherId: s.teacherId,
    teacherName: teacherById.get(s.teacherId)?.name ?? s.teacherId,
    students: classById.get(s.classId)?.studentIds.length ?? 0,
  }));

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        eyebrow={`Principal · ${branchName(branchId)}`}
        title="Subjects"
        description={`${spaces.length} subject spaces across ${classes.length} classes. Assigning a subject creates the teacher's space with its syllabus map and tutor rules.`}
      />
      <SubjectsAdmin subjects={subjects} classes={classes} teachers={teachers} spaces={spaces} />
    </div>
  );
}
