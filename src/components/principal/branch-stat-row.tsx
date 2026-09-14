import { AlertTriangle, CalendarCheck, ClipboardList, Users } from "lucide-react";
import { Stat, Trend } from "@/components/ui/primitives";
import type { BranchId } from "@/lib/config/school";
import { branchStats } from "@/lib/data/mock/stats";
import { fmtInt } from "@/lib/utils";

/** One row of four tiles for a single campus. */
export function BranchStatRow({ branchId }: { branchId: BranchId }) {
  const b = branchStats(branchId);
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      <Stat label="Students" value={fmtInt(b.students)} tone="accent" icon={<Users size={18} />} trend={`${b.teachers} teachers · ${b.hifzStudents} in Hifz`} />
      <Stat label="Attendance today" value={`${b.attendanceToday}%`} tone="ok" icon={<CalendarCheck size={18} />} trend={<span><Trend value={b.attendanceTrend} /> vs last week</span>} />
      <Stat label="At-risk students" value={fmtInt(b.atRisk)} tone="warn" icon={<AlertTriangle size={18} />} trend="Early-warning list" />
      <Stat label="Marking backlog" value={fmtInt(b.markingBacklog)} tone="info" icon={<ClipboardList size={18} />} trend="Ungraded submissions" />
    </div>
  );
}
