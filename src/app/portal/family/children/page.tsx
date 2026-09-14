import { PageHeader, SectionTitle } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { guardianById, studentById } from "@/lib/data/mock/people";
import { Denied, isParent } from "@/components/teach/guard";
import { ChildCard, wardSummary } from "@/components/family/child-card";
import { FeeCard } from "@/components/family/fee-card";

export default async function ChildrenPage() {
  const viewer = await getViewer();
  const guardian = isParent(viewer) && viewer.guardianId ? guardianById.get(viewer.guardianId) : undefined;
  if (!guardian) return <Denied />;

  const students = guardian.studentIds.flatMap((id) => {
    const student = studentById.get(id);
    return student ? [student] : [];
  });

  return (
    <>
      <PageHeader eyebrow={guardian.name} title="My children" description="Attendance, marks, Hifz progress, character notes from their teachers, and fees." />
      <div className="grid gap-6 md:grid-cols-2">
        {students.map((s) => (
          <ChildCard key={s.id} ward={wardSummary(s)} />
        ))}
      </div>
      <section>
        <SectionTitle title="Fees" hint="One invoice per child per term." />
        <div className="grid gap-6 md:grid-cols-2">
          {students.map((s) => (
            <FeeCard key={s.id} studentId={s.id} firstName={s.firstName} />
          ))}
        </div>
      </section>
    </>
  );
}
