import { AlertTriangle, ClipboardList, LockKeyhole, Users } from "lucide-react";
import { StudentsConsole } from "@/components/students/students-console";
import { Denied } from "@/components/teach/guard";
import { PageHeader, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { classById } from "@/lib/data/mock/people";
import { consoleRows } from "@/lib/data/students-console";
import { spacesForTeacher } from "@/lib/data/repo";

export default async function TeacherStudentsPage() {
  const viewer = await getViewer();
  if (viewer.role !== "teacher") return <Denied />;

  const classIds = [...new Set(spacesForTeacher(viewer.personId).map((s) => s.classId))];
  const rows = consoleRows(viewer.branchId ?? "gulberg", classIds);
  const atRisk = rows.filter((r) => r.risk).length;
  const overdue = rows.filter((r) => r.overdue).length;
  const restricted = rows.filter((r) => r.restricted).length;

  return (
    <>
      <PageHeader eyebrow="Teacher" title="Students" description="Everyone in your classes. Open a student for the visual report, activity timeline, tasks, tarbiyah log and a progress email home." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Students" value={rows.length} trend={`across ${classIds.length} class${classIds.length === 1 ? "" : "es"}`} icon={<Users size={18} />} tone="accent" />
        <Stat label="At risk" value={atRisk} trend="flagged by early warning" icon={<AlertTriangle size={18} />} tone={atRisk ? "danger" : "ok"} />
        <Stat label="Overdue tasks" value={overdue} trend="students with something overdue" icon={<ClipboardList size={18} />} tone={overdue ? "warn" : "ok"} />
        <Stat label="Restricted" value={restricted} trend="portal access paused" icon={<LockKeyhole size={18} />} tone={restricted ? "danger" : "ok"} />
      </div>

      <StudentsConsole rows={rows} basePath="/portal/teach/students" classes={classIds.map((id) => ({ id, name: classById.get(id)?.name ?? id }))} />
    </>
  );
}
