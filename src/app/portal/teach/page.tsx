import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Card, Chip, EmptyState, KeyValue, PageHeader } from "@/components/ui/primitives";
import { Denied } from "@/components/teach/guard";
import { spaceStats } from "@/components/teach/space-stats";
import { getViewer } from "@/lib/auth/viewer";
import { classById } from "@/lib/data/mock/people";
import { spacesForTeacher } from "@/lib/data/repo";

export default async function MySpacesPage() {
  const viewer = await getViewer();
  if (viewer.role !== "teacher") return <Denied />;

  const spaces = spacesForTeacher(viewer.personId).map((space) => ({
    space,
    className: classById.get(space.classId)?.name ?? space.classId,
    stats: spaceStats(space),
  }));
  const backlog = spaces.reduce((a, s) => a + s.stats.markingBacklog, 0);

  return (
    <>
      <PageHeader
        eyebrow="Teacher"
        title="My spaces"
        description={`${spaces.length} subject space${spaces.length === 1 ? "" : "s"} assigned by your principal · ${backlog} submission${backlog === 1 ? "" : "s"} waiting for marks.`}
      />
      {spaces.length ? (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {spaces.map(({ space, className, stats }) => (
            <Card key={space.id} hover className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <span className="tile-accent">
                  <BookOpen size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{space.subject}</p>
                  <p className="truncate text-xs text-ink-3">{className} · {space.subjectCode}</p>
                </div>
              </div>
              <KeyValue
                items={[
                  { k: "Students", v: stats.students },
                  { k: "Marking backlog", v: <span className={stats.markingBacklog ? "text-warn" : undefined}>{stats.markingBacklog}</span> },
                  { k: "Approved resources", v: `${stats.approvedResources} / ${space.resources.length}` },
                ]}
              />
              <div className="flex flex-wrap gap-1.5">
                {space.syllabus.slice(0, 3).map((t) => <Chip key={t.code} tone="neutral">{t.code}</Chip>)}
                {space.syllabus.length > 3 ? <Chip tone="neutral">+{space.syllabus.length - 3} strands</Chip> : null}
              </div>
              <Link href={`/portal/teach/${space.id}`} className="btn-soft btn-sm mt-auto self-start">
                Open space <ArrowRight size={14} />
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No spaces yet" body="Your principal assigns subjects to classes under Subjects; each assignment appears here." />
      )}
    </>
  );
}
