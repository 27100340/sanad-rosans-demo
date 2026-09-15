import { GraduationCap, HeartHandshake, Users } from "lucide-react";
import { PeopleDirectory, type PersonRow } from "@/components/admin/people-directory";
import { SeatDenied } from "@/components/leadership/seat-guard";
import { LinkButton, PageHeader, Stat } from "@/components/ui/primitives";
import { directory, type DirectoryPerson } from "@/lib/auth/impersonate";
import { isSuperAdmin } from "@/lib/auth/personas";
import { getSession } from "@/lib/auth/viewer";
import { branchName } from "@/lib/config/school";

function toRows(people: DirectoryPerson[], group: PersonRow["group"]): PersonRow[] {
  return people.map((p) => ({ id: p.id, name: p.name, role: p.role, detail: p.detail, branch: p.branchId ? branchName(p.branchId) : "All campuses", group }));
}

export default async function PeoplePage() {
  const { real } = await getSession();
  if (!isSuperAdmin(real)) return <SeatDenied home={real.home} />;

  const { staff, students, guardians } = directory();
  const rows = [...toRows(staff, "staff"), ...toRows(students, "students"), ...toRows(guardians, "guardians")];

  return (
    <>
      <PageHeader
        eyebrow="Super admin"
        title="People"
        description="Everyone in the school. Opening the portal as someone shows exactly what they see, including anything locked for them; the banner brings you back."
        actions={<LinkButton href="/portal/admin" variant="outline">Control centre</LinkButton>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Staff" value={staff.length} trend="leaders, teachers and ustadhs" icon={<Users size={18} />} tone="accent" />
        <Stat label="Students" value={students.length} trend="across every class" icon={<GraduationCap size={18} />} tone="info" />
        <Stat label="Parents" value={guardians.length} trend="guardian accounts" icon={<HeartHandshake size={18} />} tone="gold" />
        <Stat label="Total" value={rows.length} trend="people you can view as" icon={<Users size={18} />} tone="neutral" />
      </div>

      <PeopleDirectory rows={rows} />
    </>
  );
}
