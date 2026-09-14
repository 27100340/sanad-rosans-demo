import { TEST_MODE } from "@/components/assess/labels";
import { fmtDay } from "@/components/teach/helpers";
import { Avatar, Card, Chip, EmptyState, Progress, SectionTitle, type Tone } from "@/components/ui/primitives";
import type { TestMode } from "@/lib/domain/assessment";
import { pctOf } from "@/lib/domain/assessment";

export interface AssessmentTestRow {
  id: string;
  title: string;
  subject: string;
  className: string;
  teacher: string;
  mode: TestMode;
  opensAt: string;
  closesAt: string;
  allocated: number;
  submitted: number;
  awaiting: number;
  meanPct: number | null;
}

export interface MarkingBacklogRow {
  teacherId: string;
  name: string;
  tone: Tone;
  subjects: string[];
  awaiting: number;
  tests: number;
  reviewed: number;
  total: number;
}

const MAX_BACKLOG_ROWS = 6;

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function TestsTable({ rows }: { rows: AssessmentTestRow[] }) {
  if (!rows.length) return <EmptyState title="No tests set" body="Tests teachers create in their spaces appear here." />;
  return (
    <Card className="p-0">
      <div className="overflow-x-auto">
        <table className="table min-w-[48rem]">
          <thead>
            <tr>
              <th>Test</th>
              <th>Teacher</th>
              <th>Mode</th>
              <th>Window</th>
              <th>Submitted</th>
              <th className="text-right">Review</th>
              <th className="text-right">Mean</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-ink-3">
                    {r.subject} · {r.className}
                  </p>
                </td>
                <td className="whitespace-nowrap text-ink-2">{r.teacher}</td>
                <td>
                  <Chip tone={TEST_MODE[r.mode].tone}>{TEST_MODE[r.mode].label}</Chip>
                </td>
                <td className="whitespace-nowrap text-xs text-ink-2">
                  {fmtDay(r.opensAt)} – {fmtDay(r.closesAt)}
                </td>
                <td className="min-w-36">
                  <div className="flex items-center gap-2">
                    <Progress value={pctOf(r.submitted, r.allocated)} className="w-20" />
                    <span className="num text-xs">
                      {r.submitted}/{r.allocated}
                    </span>
                  </div>
                </td>
                <td className="text-right">{r.awaiting > 0 ? <Chip tone="warn">{r.awaiting} awaiting</Chip> : <span className="text-xs text-ink-3">—</span>}</td>
                <td className="num text-right">{r.meanPct === null ? <span className="text-xs text-ink-3">—</span> : `${r.meanPct}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function BacklogList({ rows }: { rows: MarkingBacklogRow[] }) {
  if (!rows.length) return <EmptyState title="No marking waiting" body="Every submitted attempt has been reviewed by its teacher." />;
  return (
    <div className="grid gap-3">
      {rows.map((t) => (
        <div key={t.teacherId} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar name={t.name} tone={t.tone} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{t.name}</p>
              <p className="truncate text-xs text-ink-3">{t.subjects.join(", ")}</p>
            </div>
          </div>
          <div className="sm:w-72">
            <p className="text-xs text-ink-2">
              <span className="font-semibold text-warn">{plural(t.awaiting, "attempt")}</span> awaiting review across {plural(t.tests, "test")}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <Progress value={pctOf(t.reviewed, t.total)} tone="ok" />
              <span className="num shrink-0 text-xs text-ink-3">
                {t.reviewed}/{t.total}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Principal's read-only view of assessment activity across the branch. Server-safe. */
export function AssessmentBoard({ tests, backlog }: { tests: AssessmentTestRow[]; backlog: MarkingBacklogRow[] }) {
  const sorted = [...backlog].sort((a, b) => b.awaiting - a.awaiting).slice(0, MAX_BACKLOG_ROWS);
  return (
    <>
      <section>
        <SectionTitle title="Tests across the branch" hint={plural(tests.length, "test")} />
        <TestsTable rows={tests} />
      </section>
      <section>
        <SectionTitle title="Marking backlog by teacher" hint="AI-marked attempts still waiting for a teacher's approval" />
        <BacklogList rows={sorted} />
      </section>
    </>
  );
}
