import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Sparkline } from "@/components/charts/sparkline";
import { Card, KeyValue, Trend } from "@/components/ui/primitives";
import { branchName } from "@/lib/config/school";
import { LEADERS } from "@/lib/data/mock/people";
import { ATTENDANCE_TREND, BRANCH_STATS, BRANCH_TREND_WEEKS } from "@/lib/data/mock/stats";
import { cn, fmtInt } from "@/lib/utils";

/** Three branch cards with a six-week attendance sparkline and the headline figures. */
export function BranchCards() {
  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
      {BRANCH_STATS.map((b) => {
        const principal = LEADERS.find((p) => p.role === "principal" && p.branchId === b.branchId);
        const falling = b.attendanceTrend < 0;
        return (
          <Card key={b.branchId} hover className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-ink">{branchName(b.branchId)}</h3>
                <p className="truncate text-xs text-ink-3">{principal?.name ?? "Principal"}</p>
              </div>
              <Link href={`/portal/leadership/branches?branch=${b.branchId}`} className="btn-ghost btn-sm -mr-2 -mt-1" aria-label={`Open ${branchName(b.branchId)}`}>
                Open
                <ArrowUpRight size={14} />
              </Link>
            </div>
            <div>
              <div className="flex items-baseline justify-between text-xs text-ink-3">
                <span>Attendance, {BRANCH_TREND_WEEKS.length} weeks</span>
                <span>
                  <span className="num font-semibold text-ink">{b.attendanceToday}%</span> <Trend value={b.attendanceTrend} />
                </span>
              </div>
              <Sparkline values={ATTENDANCE_TREND[b.branchId]} className={cn("mt-1", falling ? "text-warn" : "text-accent")} label={`${branchName(b.branchId)} attendance trend`} />
            </div>
            <KeyValue
              items={[
                { k: "Students", v: fmtInt(b.students) },
                { k: "Average mark", v: `${b.avgMark}%` },
                { k: "Fee collected", v: `${b.feeCollectedPct}%` },
                { k: "At-risk", v: <span className={b.atRisk >= 20 ? "text-warn" : undefined}>{b.atRisk}</span> },
              ]}
            />
          </Card>
        );
      })}
    </div>
  );
}
