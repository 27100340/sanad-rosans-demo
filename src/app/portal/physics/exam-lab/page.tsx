import Link from "next/link";
import { FileStack, FlaskConical, ListChecks, Target } from "lucide-react";
import { AiPill, Card, Chip, PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { Denied } from "@/components/teach/guard";
import { ExamLab } from "@/components/physics/exam-lab";
import { getViewer } from "@/lib/auth/viewer";
import { groqIsLive } from "@/lib/ai/groq";
import {
  AUTHORED_COUNT,
  FIGURE_DEPENDENT_COUNT,
  PASTPAPER_COUNT,
  PAST_PAPERS,
  allocationsForTeacher,
  attemptsForAllocation,
  bankCoverage,
  PHYSICS_CLASS_ID,
} from "@/lib/data/physics";
import { ALL_TOPICS, SYLLABUS_NAME, SYLLABUS_YEARS } from "@/content/physics/topics";
import { ALLOCATION_MODE_LABEL, PAPER_CANON, THINKING_LEVELS } from "@/lib/domain/physics";
import { classById, studentsInClass } from "@/lib/data/mock/people";

const PAPER_LIST_LIMIT = 40;

export default async function PhysicsExamLabPage() {
  const viewer = await getViewer();
  if (viewer.role !== "teacher") return <Denied />;

  const coverage = bankCoverage();
  const roster = studentsInClass(PHYSICS_CLASS_ID);
  const className = classById.get(PHYSICS_CLASS_ID)?.name ?? PHYSICS_CLASS_ID;
  const allocations = allocationsForTeacher(viewer.personId);
  const totalBanked = AUTHORED_COUNT + PASTPAPER_COUNT;

  return (
    <>
      <PageHeader
        eyebrow="Teacher · Physics"
        title="Exam Lab"
        description={`Build a paper from ${totalBanked.toLocaleString()} tagged ${SYLLABUS_NAME} questions — as a drill by strand and thinking level, or as an exact reproduction of a real Cambridge paper — then mark it instantly and set it for the class.`}
        actions={
          <>
            <AiPill live={groqIsLive()} />
            <Link href="/portal/physics/overview" className="btn-outline btn-sm">
              <Target size={14} /> Class overview
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Questions banked" value={totalBanked.toLocaleString()} trend={`${AUTHORED_COUNT} authored · ${PASTPAPER_COUNT.toLocaleString()} past paper`} icon={<ListChecks size={18} />} tone="accent" />
        <Stat label="Real papers" value={PAST_PAPERS.length} trend={`${SYLLABUS_YEARS} syllabus`} icon={<FileStack size={18} />} tone="info" />
        <Stat label="Strands covered" value={coverage.filter((c) => c.total > 0).length} trend={`of ${ALL_TOPICS.length}`} icon={<FlaskConical size={18} />} tone="ok" />
        <Stat label="Papers you have set" value={allocations.length} trend={`${className}`} icon={<Target size={18} />} tone="gold" />
      </div>

      <section>
        <SectionTitle
          title="Build a paper"
          hint="Assembly comes from the banks, so this works with or without a model. Only the briefing and any top-up questions need one."
        />
        <ExamLab
          topics={ALL_TOPICS}
          coverage={coverage}
          pastPapers={PAST_PAPERS.slice(0, PAPER_LIST_LIMIT)}
          className={className}
          classSize={roster.length}
          aiLive={groqIsLive()}
        />
      </section>

      {allocations.length ? (
        <section>
          <SectionTitle title="Set for the class" hint="Newest first. A test result stays sealed until you release it." />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-6">
            {allocations.map((allocation) => {
              const sat = attemptsForAllocation(allocation.id);
              return (
                <Card key={allocation.id} className="flex flex-col gap-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Chip tone={allocation.mode === "test" ? "danger" : allocation.mode === "assignment_nohelp" ? "warn" : "info"}>
                      {ALLOCATION_MODE_LABEL[allocation.mode]}
                    </Chip>
                    {allocation.publishedAt ? <Chip tone="ok">Marks released</Chip> : null}
                  </div>
                  <p className="text-sm font-medium leading-6 text-ink">{allocation.title}</p>
                  <p className="num text-2xs text-ink-3">
                    {sat.length} of {allocation.studentIds.length} submitted
                    {allocation.dueAt ? ` · due ${allocation.dueAt}` : ""}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      <section>
        <SectionTitle
          title="What the banks hold"
          hint={`Questions available per strand. ${FIGURE_DEPENDENT_COUNT} past-paper questions refer to a figure the portal does not hold and are excluded by default.`}
        />
        <div className="card overflow-x-auto">
          <table className="table min-w-[36rem]">
            <thead>
              <tr>
                <th>Strand</th>
                {THINKING_LEVELS.map((level) => (
                  <th key={level} className="text-right">
                    {level}
                  </th>
                ))}
                <th className="text-right">Authored</th>
                <th className="text-right">Past paper</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {coverage.map((row) => (
                <tr key={row.topic}>
                  <td className="font-medium text-ink">{row.topic}</td>
                  {THINKING_LEVELS.map((level) => (
                    <td key={level} className="num text-right text-ink-2">
                      {row.byLevel[level] || "—"}
                    </td>
                  ))}
                  <td className="num text-right text-ink-2">{row.authored || "—"}</td>
                  <td className="num text-right text-ink-2">{row.pastpaper || "—"}</td>
                  <td className="num text-right font-medium text-ink">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Card className="flex flex-col gap-2">
        <p className="eyebrow">Papers in the bank</p>
        <p className="max-w-prose text-sm leading-6 text-ink-2">
          {PAST_PAPERS.length} real Cambridge papers, text-extracted and classified by strand and thinking level.
          {PAPER_CANON.P1.name} carries {PAPER_CANON.P1.marks} marks in {PAPER_CANON.P1.durationMin} minutes;
          {" "}{PAPER_CANON.P2.name} carries {PAPER_CANON.P2.marks} in {PAPER_CANON.P2.durationMin};
          {" "}{PAPER_CANON.P4.name} carries {PAPER_CANON.P4.marks} in {PAPER_CANON.P4.durationMin}.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PAST_PAPERS.slice(0, 12).map((p) => (
            <Chip key={p.code} tone="neutral">
              {p.code} · <span className="num">{p.questions}</span>
            </Chip>
          ))}
          {PAST_PAPERS.length > 12 ? <Chip tone="neutral">+{PAST_PAPERS.length - 12} more</Chip> : null}
        </div>
      </Card>
    </>
  );
}
