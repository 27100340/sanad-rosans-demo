import { CalendarRange, Flag, ListChecks, Target } from "lucide-react";
import { StudyPlanButton } from "@/components/learn/study-plan-button";
import { TaskList } from "@/components/learn/task-list";
import { taskRow } from "@/components/learn/task-rows";
import { masteryTone } from "@/components/teach/helpers";
import { Denied, isLearner } from "@/components/teach/guard";
import { Card, Chip, PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { studentById } from "@/lib/data/mock/people";
import { currentPlan } from "@/lib/data/study-plan";
import { todayISO } from "@/lib/utils";

export default async function StudyPlanPage() {
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;

  const plan = currentPlan(student.id);
  if (!plan) return <Denied />;
  const today = todayISO();
  const primary = plan.focus[0];
  const thisWeek = plan.tasks.filter((t) => t.generatedKey === plan.weekKey);
  const daily = plan.tasks.filter((t) => t.generatedKey?.startsWith("auto-daily:"));

  return (
    <>
      <PageHeader eyebrow="Study plan" title="My study plan" description="Built from your weakest assessed topics: a four-step sequence each week plus a short test, and a five-minute challenge every day. Every step is a real task, so finishing it counts." actions={<StudyPlanButton hasPlan={plan.tasks.length > 0} />} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="This week's focus" value={primary ? primary.title : "—"} trend={primary ? `${primary.subject} · ${primary.code}` : "nothing assessed yet"} icon={<Target size={18} />} tone="accent" />
        <Stat label="Steps this week" value={thisWeek.length} trend={thisWeek.length ? `${thisWeek.filter((t) => t.status === "done").length} done` : "not built yet"} icon={<ListChecks size={18} />} tone="info" />
        <Stat label="Mandatory open" value={plan.openMandatory} icon={<Flag size={18} />} tone={plan.openMandatory ? "warn" : "ok"} />
        <Stat label="Daily challenges" value={daily.length} trend={`${daily.filter((t) => t.status === "done").length} completed`} icon={<CalendarRange size={18} />} tone="gold" />
      </div>

      <section>
        <SectionTitle title="Focus topics" hint="Lowest rolling mastery first. The plan targets the first; the daily challenge rotates through all three." />
        <div className="grid gap-3 sm:grid-cols-3">
          {plan.focus.map((f) => (
            <Card key={`${f.spaceId}-${f.code}`} className="p-4">
              <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">{f.subject}</p>
              <p className="mt-1 text-sm font-medium text-ink">
                {f.code} · {f.title}
              </p>
              <div className="mt-2">{f.mastery === null ? <Chip tone="neutral">Not assessed yet</Chip> : <Chip tone={masteryTone(f.mastery)}>Mastery {f.mastery}%</Chip>}</div>
            </Card>
          ))}
          {!plan.focus.length ? <p className="card-quiet px-4 py-3 text-xs text-ink-3">Sit a quiz first so the plan has something to target.</p> : null}
        </div>
      </section>

      <section>
        <SectionTitle title="Plan steps" hint="Study material, video, exploration, a written summary, then the weekly check; and today's challenge." />
        {plan.tasks.length ? <TaskList rows={plan.tasks.map((t) => taskRow(t, today))} /> : <p className="card-quiet px-4 py-4 text-sm text-ink-3">No plan yet. Press “Build my plan” and this week's steps appear here and in Tasks.</p>}
      </section>
    </>
  );
}
