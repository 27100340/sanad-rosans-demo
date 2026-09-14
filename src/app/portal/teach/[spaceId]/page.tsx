import { BookOpen, ClipboardList, LineChart, Users } from "lucide-react";
import { LinkButton, PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { classById } from "@/lib/data/mock/people";
import { Denied, teacherSpace } from "@/components/teach/guard";
import { spaceStats } from "@/components/teach/space-stats";
import { SyllabusMap } from "@/components/teach/syllabus-map";
import { ResourceList } from "@/components/teach/resource-list";

export default async function SpaceOverviewPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const viewer = await getViewer();
  const space = teacherSpace(viewer, spaceId);
  if (!space) return <Denied />;

  const className = classById.get(space.classId)?.name ?? space.classId;
  const stats = spaceStats(space);

  return (
    <>
      <PageHeader
        eyebrow="Subject space"
        title={space.subject}
        description={`${className} · ${space.subjectCode ?? ""}`}
        actions={<LinkButton href={`/portal/teach/${space.id}/assignments`} variant="soft">Assignments</LinkButton>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Students" value={stats.students} icon={<Users size={18} />} tone="accent" />
        <Stat label="Marking backlog" value={stats.markingBacklog} trend="pending submissions" icon={<ClipboardList size={18} />} tone={stats.markingBacklog ? "warn" : "ok"} />
        <Stat label="Class average" value={`${stats.classAvg}%`} trend="across assessed topics" icon={<LineChart size={18} />} tone="info" />
        <Stat label="Approved resources" value={stats.approvedResources} trend={`of ${space.resources.length} in the space`} icon={<BookOpen size={18} />} tone="gold" />
      </div>

      <section>
        <SectionTitle title="Syllabus map" hint="Class mastery where assessed; the tutor only answers on unlocked strands." />
        <SyllabusMap space={space} />
      </section>

      <section>
        <SectionTitle title="Resources" hint="Genuine links open in a new tab; uploads open as notes." />
        <ResourceList resources={space.resources} />
      </section>
    </>
  );
}
