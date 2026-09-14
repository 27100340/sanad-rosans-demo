import { canSeeBranchStaff, SeatDenied } from "@/components/leadership/seat-guard";
import { InboxGroups, type InboxRow } from "@/components/principal/inbox-groups";
import { AiPill, PageHeader } from "@/components/ui/primitives";
import { aiIsLive } from "@/lib/ai/gemini";
import { classifyMessage } from "@/lib/ai/triage";
import { getViewer } from "@/lib/auth/viewer";
import { branchName, type BranchId } from "@/lib/config/school";
import { PARENT_MESSAGES } from "@/lib/data/mock/comms";
import { guardianById, studentById } from "@/lib/data/mock/people";

const DEMO_BRANCH: BranchId = "gulberg";

function inboxRows(branchId: BranchId): InboxRow[] {
  return PARENT_MESSAGES.filter((m) => m.branchId === branchId).map((m) => {
    const guardian = guardianById.get(m.guardianId);
    return {
      id: m.id,
      guardianName: guardian?.name ?? "Parent",
      studentNames: (guardian?.studentIds ?? []).map((id) => studentById.get(id)?.name ?? id),
      date: m.date,
      text: m.text,
      triage: m.triage ?? classifyMessage(m.text),
      language: guardian?.preferredLanguage ?? "en",
    };
  });
}

export default async function InboxPage() {
  const viewer = await getViewer();
  if (!canSeeBranchStaff(viewer)) return <SeatDenied home={viewer.home} />;
  const branchId = viewer.branchId ?? DEMO_BRANCH;
  const rows = inboxRows(branchId);
  const urgent = rows.filter((r) => r.triage === "urgent").length;
  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader eyebrow={`Principal · ${branchName(branchId)}`} title="Parent inbox" description={`${rows.length} messages this week, ${urgent} urgent. Triage is automatic; every reply is yours to edit before it goes.`} actions={<AiPill live={aiIsLive()} />} />
      <InboxGroups rows={rows} />
    </div>
  );
}
