import Link from "next/link";
import { Card, Trend } from "@/components/ui/primitives";
import { branchName, type BranchId } from "@/lib/config/school";
import { LEADERS } from "@/lib/data/mock/people";
import { BRANCH_STATS } from "@/lib/data/mock/stats";
import { cn, fmtInt, fmtPKR } from "@/lib/utils";

const COLUMNS = ["Branch", "Principal", "Students", "Teachers", "Attendance", "Avg mark", "Fee %", "Fee PKR", "At-risk", "Hifz", "Backlog"];

/** Every BranchStats column, one row per campus; the selected row is highlighted. */
export function BranchTable({ selected }: { selected: BranchId | null }) {
  return (
    <Card className="p-0">
      <div className="overflow-x-auto">
        <table className="table min-w-[56rem]">
          <thead>
            <tr>
              {COLUMNS.map((c, i) => (
                <th key={c} className={i >= 2 ? "text-right" : undefined}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BRANCH_STATS.map((b) => {
              const principal = LEADERS.find((p) => p.role === "principal" && p.branchId === b.branchId);
              const active = selected === b.branchId;
              return (
                <tr key={b.branchId} className={cn(active && "bg-accent-soft/40")}>
                  <td className="font-medium">
                    <Link href={`/portal/leadership/branches?branch=${b.branchId}`} className="text-accent hover:underline">
                      {branchName(b.branchId)}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap text-ink-2">{principal?.name ?? "Principal"}</td>
                  <td className="num text-right">{fmtInt(b.students)}</td>
                  <td className="num text-right">{b.teachers}</td>
                  <td className="num whitespace-nowrap text-right">
                    {b.attendanceToday}% <Trend value={b.attendanceTrend} />
                  </td>
                  <td className="num text-right">{b.avgMark}%</td>
                  <td className="num text-right">{b.feeCollectedPct}%</td>
                  <td className="num text-right">{fmtPKR(b.feeCollectedPKR)}</td>
                  <td className={cn("num text-right", b.atRisk >= 20 && "font-semibold text-warn")}>{b.atRisk}</td>
                  <td className="num text-right">{b.hifzStudents}</td>
                  <td className={cn("num text-right", b.markingBacklog >= 50 && "font-semibold text-warn")}>{b.markingBacklog}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
