import Link from "next/link";
import { ArrowRight, CheckCheck, ClipboardList, Clock, Lock } from "lucide-react";
import { Card, Chip, EmptyState, PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { Denied, isLearner } from "@/components/teach/guard";
import { getViewer } from "@/lib/auth/viewer";
import { studentById } from "@/lib/data/mock/people";
import { allocationsForStudent, attemptForAllocation, paperById } from "@/lib/data/physics";
import { ALLOCATION_MODE_LABEL, PAPER_CANON, pct, resultsImmediate, scoreTone } from "@/lib/domain/physics";

export default async function PhysicsAssignmentsPage() {
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;

  const rows = allocationsForStudent(student.id)
    .map((allocation) => {
      const attempt = attemptForAllocation(allocation.id, student.id);
      const paper = paperById(allocation.paperId);
      const released = Boolean(attempt) && (resultsImmediate(allocation.mode) || Boolean(allocation.publishedAt));
      return { allocation, attempt, paper, released };
    })
    .sort((a, b) => Number(Boolean(a.attempt)) - Number(Boolean(b.attempt)) || b.allocation.createdAt.localeCompare(a.allocation.createdAt));

  const todo = rows.filter((r) => !r.attempt).length;
  const awaiting = rows.filter((r) => r.attempt && !r.released).length;

  return (
    <>
      <PageHeader
        eyebrow="Physics"
        title="Papers set for you"
        description="Practice papers and tests your teacher has set. Open book papers let you reveal the mark scheme as you work; a test keeps its marks sealed until your teacher releases them."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="To sit" value={todo} icon={<ClipboardList size={18} />} tone={todo ? "warn" : "ok"} />
        <Stat label="Awaiting release" value={awaiting} icon={<Lock size={18} />} tone={awaiting ? "info" : "neutral"} />
        <Stat label="Completed" value={rows.filter((r) => r.released).length} icon={<CheckCheck size={18} />} tone="ok" />
        <Stat label="Set in total" value={rows.length} icon={<Clock size={18} />} tone="accent" />
      </div>

      <section>
        <SectionTitle title="Your papers" hint="Anything not yet sat is listed first." />
        {rows.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-6">
            {rows.map(({ allocation, attempt, paper, released }) => (
              <Card key={allocation.id} hover className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Chip tone={allocation.mode === "test" ? "danger" : allocation.mode === "assignment_nohelp" ? "warn" : "info"}>
                    {ALLOCATION_MODE_LABEL[allocation.mode]}
                  </Chip>
                  {attempt ? (
                    released ? (
                      <Chip tone={scoreTone(pct(attempt.score, attempt.total))}>
                        <span className="num">
                          {attempt.score}/{attempt.total}
                        </span>
                      </Chip>
                    ) : (
                      <Chip tone="neutral">
                        <Lock size={12} /> Marks sealed
                      </Chip>
                    )
                  ) : (
                    <Chip tone="warn">Not sat</Chip>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-6 text-ink">{allocation.title}</p>
                  <p className="num mt-1 text-2xs text-ink-3">
                    {paper ? `${paper.questionIds.length} questions · ${paper.totalMarks} marks` : "Paper unavailable"}
                    {allocation.durationMin ? ` · ${allocation.durationMin} min` : ""}
                    {paper?.paperType && paper.paperType !== "mixed" ? ` · ${PAPER_CANON[paper.paperType].short}` : ""}
                  </p>
                  {allocation.dueAt ? <p className="num mt-0.5 text-2xs text-ink-3">Due {allocation.dueAt}</p> : null}
                </div>

                {allocation.instructions ? <p className="rounded-lg bg-surface-2 px-2.5 py-2 text-xs leading-5 text-ink-2">{allocation.instructions}</p> : null}

                <Link href={`/portal/physics/assignments/${allocation.id}`} className={`${attempt ? "btn-ghost" : "btn-soft"} btn-sm mt-auto self-start`}>
                  {attempt ? "Review your script" : "Sit this paper"} <ArrowRight size={13} />
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing set yet"
            body="When your teacher sets a physics paper it appears here. In the meantime, Physics Studio will teach you any strand you ask about."
            action={
              <Link href="/portal/physics" className="btn-soft btn-sm">
                Open Physics Studio
              </Link>
            }
          />
        )}
      </section>
    </>
  );
}
