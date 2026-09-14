import { BookOpen, ClipboardCheck, LineChart, Users } from "lucide-react";
import { SpacePanels, spaceAnalytics } from "@/components/teach/analytics-panels";
import { Denied } from "@/components/teach/guard";
import { EmptyState, PageHeader, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { spacesForTeacher } from "@/lib/data/repo";

export default async function TeacherAnalyticsPage() {
  const viewer = await getViewer();
  if (viewer.role !== "teacher") return <Denied />;

  const spaces = spacesForTeacher(viewer.personId).map(spaceAnalytics);
  const students = spaces.reduce((a, s) => a + s.students, 0);
  const testsWithResults = spaces.reduce((a, s) => a + s.tests.length, 0);
  const withMastery = spaces.filter((s) => s.masteryAvg !== null);
  const avgMastery = withMastery.length ? Math.round(withMastery.reduce((a, s) => a + (s.masteryAvg ?? 0), 0) / withMastery.length) : null;

  return (
    <>
      <PageHeader
        eyebrow="Teacher"
        title="Analytics"
        description="One page per space: where the class stands by topic, which questions were hardest, how attendance is moving, and who needs you first."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Spaces" value={spaces.length} icon={<BookOpen size={18} />} tone="accent" />
        <Stat label="Students" value={students} trend="across your classes" icon={<Users size={18} />} tone="info" />
        <Stat label="Tests with results" value={testsWithResults} icon={<ClipboardCheck size={18} />} tone={testsWithResults ? "ok" : "neutral"} />
        <Stat label="Average class mastery" value={avgMastery === null ? "—" : `${avgMastery}%`} icon={<LineChart size={18} />} tone={avgMastery !== null && avgMastery >= 70 ? "ok" : "warn"} />
      </div>

      {spaces.length ? (
        spaces.map((data) => <SpacePanels key={data.space.id} data={data} />)
      ) : (
        <EmptyState title="No spaces yet" body="Once a space is assigned to you, its analytics appear here." />
      )}
    </>
  );
}
