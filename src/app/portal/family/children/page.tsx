import { PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { guardianById, studentById } from "@/lib/data/mock/people";
import { Denied, isParent } from "@/components/teach/guard";
import { ChildCard, wardSummary } from "@/components/family/child-card";

export default async function ChildrenPage() {
  const viewer = await getViewer();
  const guardian = isParent(viewer) && viewer.guardianId ? guardianById.get(viewer.guardianId) : undefined;
  if (!guardian) return <Denied />;

  const wards = guardian.studentIds.flatMap((id) => {
    const student = studentById.get(id);
    return student ? [wardSummary(student)] : [];
  });

  return (
    <>
      <PageHeader eyebrow={guardian.name} title="My children" description="Attendance, marks, Hifz progress and character notes from their teachers." />
      <div className="grid gap-6 md:grid-cols-2">
        {wards.map((w) => (
          <ChildCard key={w.studentId} ward={w} />
        ))}
      </div>
    </>
  );
}
