import { AlertTriangle, ClipboardList, LockKeyhole, Users } from "lucide-react";
import { canSeePrincipal, SeatDenied } from "@/components/leadership/seat-guard";
import { StudentsConsole } from "@/components/students/students-console";
import { PageHeader, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { branchName, type BranchId } from "@/lib/config/school";
import { consoleRows } from "@/lib/data/students-console";
import { classesForBranch } from "@/lib/data/repo";

const DEMO_BRANCH: BranchId = "gulberg";

export default async function PrincipalStudentsPage() {
  const viewer = await getViewer();
  if (!canSeePrincipal(viewer)) return <SeatDenied home={viewer.home} />;
  const branchId = viewer.branchId ?? DEMO_BRANCH;
  const classes = classesForBranch(branchId, true);
  const rows = consoleRows(branchId, classes.map((c) => c.id));
  const atRisk = rows.filter((r) => r.risk).length;
  const overdue = rows.filter((r) => r.overdue).length;
  const restricted = rows.filter((r) => r.restricted).length;

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader eyebrow={`Principal · ${branchName(branchId)}`} title="Students" description="Every student in the branch with the figures that matter. Open one for the full picture and the access controls." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Students" value={rows.length} trend={`in ${classes.filter((c) => c.studentIds.length).length} classes with rosters`} icon={<Users size={18} />} tone="accent" />
        <Stat label="At risk" value={atRisk} icon={<AlertTriangle size={18} />} tone={atRisk ? "danger" : "ok"} />
        <Stat label="Overdue tasks" value={overdue} trend="students with something overdue" icon={<ClipboardList size={18} />} tone={overdue ? "warn" : "ok"} />
        <Stat label="Restricted" value={restricted} trend="portal access paused" icon={<LockKeyhole size={18} />} tone={restricted ? "danger" : "ok"} />
      </div>

      <StudentsConsole rows={rows} basePath="/portal/principal/students" classes={classes.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
