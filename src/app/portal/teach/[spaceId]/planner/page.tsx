import { PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { classById } from "@/lib/data/mock/people";
import { Denied, teacherSpace } from "@/components/teach/guard";
import { PlannerForm } from "@/components/teach/planner-form";

export default async function LessonPlannerPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const viewer = await getViewer();
  const space = teacherSpace(viewer, spaceId);
  if (!space) return <Denied />;

  const className = classById.get(space.classId)?.name ?? "";

  return (
    <>
      <PageHeader eyebrow={`${space.subject} · ${className}`} title="Lesson planner" description="A 40-minute draft from one syllabus point and your approved resources." />
      <PlannerForm spaceId={space.id} syllabus={space.syllabus} />
    </>
  );
}
