import { canSeePrincipal, SeatDenied } from "@/components/leadership/seat-guard";
import { TeacherCards, type TeacherCardRow } from "@/components/principal/teacher-cards";
import { PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { branchName, type BranchId } from "@/lib/config/school";
import { classById, TEACHERS } from "@/lib/data/mock/people";
import { SPACES } from "@/lib/data/mock/spaces";

const DEMO_BRANCH: BranchId = "gulberg";

function cardRows(branchId: BranchId): TeacherCardRow[] {
  return TEACHERS.filter((t) => t.branchId === branchId).map((t) => {
    const spaces = SPACES.filter((s) => s.teacherId === t.id);
    return {
      id: t.id,
      name: t.name,
      tone: t.avatarTone ?? "accent",
      subjects: t.subjects,
      spaces: spaces.map((s) => ({ id: s.id, label: `${classById.get(s.classId)?.name ?? s.classId} · ${s.subject}` })),
      backlog: t.markingBacklog,
      periods: t.weeklyPeriods,
      pending: spaces.flatMap((s) => s.resources).filter((r) => r.status === "pending").length,
    };
  });
}

export default async function TeachersPage() {
  const viewer = await getViewer();
  if (!canSeePrincipal(viewer)) return <SeatDenied home={viewer.home} />;
  const branchId = viewer.branchId ?? DEMO_BRANCH;
  const rows = cardRows(branchId);
  const pending = rows.reduce((a, r) => a + r.pending, 0);
  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader eyebrow={`Principal · ${branchName(branchId)}`} title="Teachers" description={`${rows.length} teaching staff, ${pending} resource approval${pending === 1 ? "" : "s"} waiting on you.`} />
      <TeacherCards rows={rows} />
    </div>
  );
}
