import { PageHeader, SectionTitle } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { classById } from "@/lib/data/mock/people";
import { Denied, teacherSpace } from "@/components/teach/guard";
import { MisconceptionBars } from "@/components/teach/misconception-bars";
import { ReteachList, reteachRows } from "@/components/teach/reteach-list";
import { MasteryList } from "@/components/learn/mastery-list";

export default async function ClassInsightPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const viewer = await getViewer();
  const space = teacherSpace(viewer, spaceId);
  if (!space) return <Denied />;

  const className = classById.get(space.classId)?.name ?? "";
  const rows = reteachRows(space);
  const mastery = space.masteryByTopic.map((m) => ({ code: m.code, title: m.title, value: m.classAvg }));

  return (
    <>
      <PageHeader eyebrow={`${space.subject} · ${className}`} title="Class insight" description="Built from tutor transcripts and marking feedback over the last fortnight." />

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle title="Misconceptions" hint="Top five by frequency, with a typical wrong line." />
          <MisconceptionBars items={space.misconceptions} />
        </section>
        <section>
          <SectionTitle title="Mastery by topic" hint="Class average on assessed strands." />
          <MasteryList items={mastery} />
        </section>
      </div>

      <section>
        <SectionTitle title="Who to re-teach what" hint={`${rows.length} students below the 65% band, weakest topic first.`} />
        <ReteachList rows={rows} />
      </section>
    </>
  );
}
