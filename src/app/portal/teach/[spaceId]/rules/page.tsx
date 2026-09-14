import { PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { classById } from "@/lib/data/mock/people";
import { Denied, teacherSpace } from "@/components/teach/guard";
import { RulesForm } from "@/components/teach/rules-form";

export default async function TutorRulesPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const viewer = await getViewer();
  const space = teacherSpace(viewer, spaceId);
  if (!space) return <Denied />;

  const className = classById.get(space.classId)?.name ?? "";

  return (
    <>
      <PageHeader eyebrow={`${space.subject} · ${className}`} title="Tutor rules" description="These rules bind the student tutor: it cannot answer beyond them." />
      <RulesForm syllabus={space.syllabus} rules={space.tutorRules} />
    </>
  );
}
