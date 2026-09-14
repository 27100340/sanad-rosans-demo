import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Chip, EmptyState, Progress } from "@/components/ui/primitives";
import { fmtDay } from "@/components/teach/helpers";
import { pctOf, type TestMode } from "@/lib/domain/assessment";
import { TEST_MODE } from "./labels";

export interface TestRow {
  id: string;
  href: string;
  title: string;
  mode: TestMode;
  questions: number;
  maxMarks: number;
  opensAt: string;
  closesAt: string;
  durationMin?: number;
  submitted: number;
  allocated: number;
  awaiting: number;
}

function ProgressCell({ row }: { row: TestRow }) {
  return (
    <div className="min-w-40">
      <div className="flex items-center gap-2">
        <span className="num whitespace-nowrap text-xs text-ink-2">
          {row.submitted} submitted / {row.allocated} allocated
        </span>
        {row.awaiting > 0 ? <Chip tone="warn">{row.awaiting} to review</Chip> : null}
      </div>
      <Progress value={pctOf(row.submitted, row.allocated)} tone={row.submitted === row.allocated && row.allocated > 0 ? "ok" : "accent"} className="mt-1.5 max-w-40" />
    </div>
  );
}

export function TestTable({ rows }: { rows: TestRow[] }) {
  if (!rows.length) return <EmptyState title="No tests yet" body="Assemble one below. It is allocated to the whole class the moment you create it." />;
  return (
    <div className="card overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Test</th>
            <th>Mode</th>
            <th className="text-right">Questions</th>
            <th className="text-right">Marks</th>
            <th>Window</th>
            <th>Duration</th>
            <th>Progress</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const mode = TEST_MODE[row.mode];
            return (
              <tr key={row.id}>
                <td className="font-medium">
                  <Link href={row.href} className="hover:text-accent">
                    {row.title}
                  </Link>
                </td>
                <td>
                  <Chip tone={mode.tone}>{mode.label}</Chip>
                </td>
                <td className="num text-right">{row.questions}</td>
                <td className="num text-right">{row.maxMarks}</td>
                <td className="whitespace-nowrap text-ink-2">
                  {fmtDay(row.opensAt)} – {fmtDay(row.closesAt)}
                </td>
                <td className="num whitespace-nowrap text-ink-2">{row.durationMin ? `${row.durationMin} min` : "untimed"}</td>
                <td>
                  <ProgressCell row={row} />
                </td>
                <td className="text-right">
                  <Link href={row.href} className="btn-ghost btn-sm whitespace-nowrap">
                    Open <ArrowRight size={14} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
