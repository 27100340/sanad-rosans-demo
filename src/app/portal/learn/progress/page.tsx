import { ArrowRight } from "lucide-react";
import { LinkButton, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { studentById } from "@/lib/data/mock/people";
import { AHMED_MASTERY, AHMED_NEXT_ACTION, AHMED_TREND } from "@/lib/data/mock/learn-extra";
import { Denied, isLearner } from "@/components/teach/guard";
import { MasteryList, TrendBars } from "@/components/learn/mastery-list";

export default async function ProgressPage() {
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;

  const items = AHMED_MASTERY.map((m) => ({ code: m.code, title: m.title, value: m.mastery, trend: m.trend }));

  return (
    <>
      <PageHeader eyebrow="Progress" title="Mathematics" description="Mastery by topic, your six-week trend and the next best action." />

      <div className="card flex flex-col gap-4 border-accent/30 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-accent">Next best action</p>
          <p className="mt-1 text-sm font-medium text-ink">{AHMED_NEXT_ACTION.title}</p>
          <p className="mt-1 max-w-prose text-xs text-ink-2">{AHMED_NEXT_ACTION.body}</p>
        </div>
        <LinkButton href={AHMED_NEXT_ACTION.href} className="shrink-0">
          Open tutor
          <ArrowRight size={14} />
        </LinkButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle title="Mastery by topic" hint="Change over the last fortnight." />
          <MasteryList items={items} />
        </section>
        <section>
          <SectionTitle title="Trend" hint="Average mark by week this term." />
          <TrendBars weeks={AHMED_TREND.weeks} marks={AHMED_TREND.marks} />
        </section>
      </div>
    </>
  );
}
