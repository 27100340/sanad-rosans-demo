import { ReportCard } from "@/components/family/report-card";
import { Denied, isParent } from "@/components/teach/guard";
import { PageHeader } from "@/components/ui/primitives";
import { PrintButton } from "@/components/ui/print-button";
import { getViewer } from "@/lib/auth/viewer";
import { guardianById } from "@/lib/data/mock/people";
import { studentDetail } from "@/lib/data/student-detail";

export default async function ReportsPage() {
  const viewer = await getViewer();
  const guardian = isParent(viewer) && viewer.guardianId ? guardianById.get(viewer.guardianId) : undefined;
  if (!guardian) return <Denied />;

  const reports = guardian.studentIds.map((id) => studentDetail(id)).filter((d): d is NonNullable<typeof d> => d !== null);

  return (
    <>
      <PageHeader eyebrow={guardian.name} title="Reports" description="A term report per child from live records: attendance, results, mastery, tasks, character notes and next steps. Print or save as PDF." actions={<PrintButton label="Print reports" />} />
      <div className="space-y-6">
        {reports.map((d) => (
          <ReportCard key={d.student.id} d={d} />
        ))}
      </div>
    </>
  );
}
