import { Ban, LockKeyhole, ShieldCheck, Users } from "lucide-react";
import { relativeStamp } from "@/components/leadership/format";
import { canSeePrincipal, SeatDenied } from "@/components/leadership/seat-guard";
import { AccessConsole, type AccessRow, type AccessTargets } from "@/components/principal/access-console";
import { PageHeader, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { branchName, school, type BranchId } from "@/lib/config/school";
import { listRestrictions } from "@/lib/data/mock/access";
import { personName } from "@/lib/data/mock/notify";
import { classById, STUDENTS } from "@/lib/data/mock/people";
import { classesForBranch } from "@/lib/data/repo";
import { isRestrictionActive, type AccessScope } from "@/lib/domain/access";

const DEMO_BRANCH: BranchId = "gulberg";

export default async function AccessPage({ searchParams }: { searchParams: Promise<{ scope?: string; key?: string }> }) {
  const viewer = await getViewer();
  if (!canSeePrincipal(viewer)) return <SeatDenied home={viewer.home} />;
  const branchId = viewer.branchId ?? DEMO_BRANCH;
  const sp = await searchParams;

  const rows: AccessRow[] = listRestrictions().map((r) => ({ ...r, active: isRestrictionActive(r), createdByName: personName(r.createdBy), when: relativeStamp(r.createdAt) }));
  const targets: AccessTargets = {
    classes: classesForBranch(branchId, true).map((c) => ({ id: c.id, name: c.name })),
    students: STUDENTS.filter((s) => s.branchId === branchId).map((s) => ({ id: s.id, name: s.name, className: classById.get(s.classId)?.name ?? "" })).sort((a, b) => a.name.localeCompare(b.name)),
    branches: viewer.branchId ? [{ id: viewer.branchId, name: branchName(viewer.branchId) }] : school.branches.map((b) => ({ id: b.id, name: b.name })),
  };
  const active = rows.filter((r) => r.active);
  const people = active.filter((r) => r.scope === "person").length;
  const defaultScope: AccessScope = sp.scope === "class" || sp.scope === "branch" || sp.scope === "role" ? sp.scope : "person";

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader eyebrow={`Principal · ${branchName(branchId)}`} title="Access locks" description="Pause portal access for a student, a class, the branch or a role. The person keeps their account and sees your message instead of the portal; release restores everything." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="In force" value={active.length} icon={<LockKeyhole size={18} />} tone={active.length ? "warn" : "ok"} />
        <Stat label="Individuals" value={people} trend="person-scoped" icon={<Users size={18} />} tone="neutral" />
        <Stat label="Suspended" value={active.filter((r) => r.mode === "suspended").length} icon={<Ban size={18} />} tone={active.some((r) => r.mode === "suspended") ? "danger" : "ok"} />
        <Stat label="Released" value={rows.length - active.length} trend="kept for the audit trail" icon={<ShieldCheck size={18} />} tone="info" />
      </div>

      <AccessConsole rows={rows} targets={targets} defaultScope={defaultScope} defaultKey={sp.key ?? ""} />
    </div>
  );
}
