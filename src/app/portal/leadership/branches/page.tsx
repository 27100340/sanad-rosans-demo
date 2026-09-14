import { BranchDetail } from "@/components/leadership/branch-detail";
import { BranchTable } from "@/components/leadership/branch-table";
import { canSeeLeadership, SeatDenied } from "@/components/leadership/seat-guard";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { school, type BranchId } from "@/lib/config/school";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseBranch(raw: string | string[] | undefined): BranchId | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return school.branches.some((b) => b.id === value) ? (value as BranchId) : null;
}

export default async function BranchesPage({ searchParams }: { searchParams: SearchParams }) {
  const viewer = await getViewer();
  if (!canSeeLeadership(viewer)) return <SeatDenied home={viewer.home} />;
  const selected = parseBranch((await searchParams).branch);
  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader eyebrow="Leadership" title="Branches" description="Every campus on one table. Select a branch to open its detail." />
      <BranchTable selected={selected} />
      {selected ? <BranchDetail branchId={selected} /> : <EmptyState title="Select a branch to see its classes" body="Attendance by class, teacher load and at-risk students for that campus." />}
    </div>
  );
}
