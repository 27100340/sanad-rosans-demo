import { canSeePrincipal, SeatDenied } from "@/components/leadership/seat-guard";
import { branchRiskRows, TOP_NOTE_COUNT } from "@/components/principal/risk";
import { RiskList, type RiskListRow } from "@/components/principal/risk-list";
import { AiPill, EmptyState, PageHeader } from "@/components/ui/primitives";
import { groqIsLive } from "@/lib/ai/groq";
import { run as riskNotes } from "@/lib/ai/risk-note";
import { getViewer } from "@/lib/auth/viewer";
import { branchName, type BranchId } from "@/lib/config/school";

const DEMO_BRANCH: BranchId = "gulberg";

export default async function AtRiskPage() {
  const viewer = await getViewer();
  if (!canSeePrincipal(viewer)) return <SeatDenied home={viewer.home} />;
  const branchId = viewer.branchId ?? DEMO_BRANCH;
  const ranked = branchRiskRows(branchId);
  const notes = await riskNotes(ranked.slice(0, TOP_NOTE_COUNT).map((r) => ({ flag: r.flag, firstName: r.student.firstName, className: r.className, ownerName: r.ownerName })));
  const rows: RiskListRow[] = ranked.map((r) => ({ flag: r.flag, studentName: r.student.name, className: r.className, ownerName: r.ownerName, note: notes[r.flag.studentId] }));
  const high = rows.filter((r) => r.flag.level === "high").length;

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        eyebrow={`Principal · ${branchName(branchId)}`}
        title="At-risk students"
        description={`${rows.length} students flagged by the early-warning engine, ${high} high. Scored on attendance, marks and Hifz revision; the note is written for the top ${TOP_NOTE_COUNT}.`}
        actions={<AiPill live={groqIsLive()} />}
      />
      {rows.length ? <RiskList rows={rows} /> : <EmptyState title="No students flagged" body="Every student in this branch is inside the attendance and marks bands." />}
    </div>
  );
}
