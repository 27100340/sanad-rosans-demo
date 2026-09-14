import { AlertTriangle, CalendarCheck, Users, Wallet } from "lucide-react";
import { Stat } from "@/components/ui/primitives";
import { branchName } from "@/lib/config/school";
import { BRANCH_STATS, schoolTotals } from "@/lib/data/mock/stats";
import { fmtInt, fmtPKR } from "@/lib/utils";

/** One row of four tiles: the whole school at a glance. */
export function SchoolStatRow() {
  const t = schoolTotals();
  const mostAtRisk = [...BRANCH_STATS].sort((a, b) => b.atRisk - a.atRisk)[0];
  const bestAttendance = [...BRANCH_STATS].sort((a, b) => b.attendanceToday - a.attendanceToday)[0];
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      <Stat label="Students" value={fmtInt(t.students)} tone="accent" icon={<Users size={18} />} trend={`${t.teachers} teachers · ${t.hifz} in Hifz`} />
      <Stat label="Attendance today" value={`${t.attendance}%`} tone="ok" icon={<CalendarCheck size={18} />} trend={`${branchName(bestAttendance.branchId)} highest at ${bestAttendance.attendanceToday}%`} />
      <Stat label="Fee collected this month" value={fmtPKR(t.fee)} tone="gold" icon={<Wallet size={18} />} trend={`${t.feePct}% of billed`} />
      <Stat label="At-risk students" value={fmtInt(t.atRisk)} tone="warn" icon={<AlertTriangle size={18} />} trend={`${mostAtRisk.atRisk} at ${branchName(mostAtRisk.branchId)}`} />
    </div>
  );
}
