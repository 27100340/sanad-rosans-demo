import { Avatar, EmptyState, Trend } from "@/components/ui/primitives";
import { masteryTone } from "@/components/teach/helpers";
import { cn } from "@/lib/utils";

export interface PerformanceRow {
  studentId: string;
  name: string;
  /** Marked assignment submissions in this space. */
  assignments: { awarded: number; max: number; marked: number; set: number };
  /** Published test attempts in this space. */
  tests: { total: number; max: number; published: number };
  /** Mean rolling mastery over this space's syllabus codes; null when nothing assessed. */
  mastery: number | null;
  /** Task points earned over points offered in this space. */
  effort: { earned: number; offered: number };
  avgMark: number;
  trend: number;
}

const TONE_CLASS = { ok: "text-ok", accent: "text-ink", warn: "text-warn", danger: "text-danger", gold: "text-gold", info: "text-info", neutral: "text-ink-3" } as const;

function Fraction({ n, max, empty = "—" }: { n: number; max: number; empty?: string }) {
  if (!max) return <span className="text-ink-3">{empty}</span>;
  const pct = Math.round((n / max) * 100);
  return (
    <span className={cn("num font-semibold", TONE_CLASS[masteryTone(pct)])}>
      {n}/{max} <span className="font-normal text-ink-3">· {pct}%</span>
    </span>
  );
}

export function PerformanceTable({ rows }: { rows: PerformanceRow[] }) {
  if (!rows.length) return <EmptyState title="No students in this class yet" />;
  return (
    <div className="card overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Student</th>
            <th className="text-right">Assignments</th>
            <th className="text-right">Tests</th>
            <th className="text-right">Mastery</th>
            <th className="text-right">Effort</th>
            <th className="text-right">Term avg</th>
            <th className="text-right">Trend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.studentId}>
              <td>
                <span className="inline-flex items-center gap-2.5">
                  <Avatar name={r.name} size="sm" />
                  <span className="whitespace-nowrap font-medium">{r.name}</span>
                </span>
              </td>
              <td className="whitespace-nowrap text-right">
                <Fraction n={r.assignments.awarded} max={r.assignments.max} empty={r.assignments.set ? "not marked" : "—"} />
                <p className="text-2xs text-ink-3">{r.assignments.marked} of {r.assignments.set} marked</p>
              </td>
              <td className="whitespace-nowrap text-right">
                <Fraction n={r.tests.total} max={r.tests.max} empty="none published" />
                {r.tests.published ? <p className="text-2xs text-ink-3">{r.tests.published} published</p> : null}
              </td>
              <td className={cn("num text-right", r.mastery !== null && TONE_CLASS[masteryTone(r.mastery)])}>{r.mastery === null ? <span className="text-ink-3">—</span> : `${r.mastery}%`}</td>
              <td className="num whitespace-nowrap text-right">
                {r.effort.offered ? (
                  <>
                    {r.effort.earned}/{r.effort.offered} <span className="text-ink-3">pts</span>
                  </>
                ) : (
                  <span className="text-ink-3">—</span>
                )}
              </td>
              <td className="num text-right">{r.avgMark}%</td>
              <td className="text-right">
                <Trend value={r.trend} suffix="" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
