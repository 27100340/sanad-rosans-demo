import { SettingsForm } from "@/components/portal/settings-form";
import { Avatar, Chip, KeyValue, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { branchName } from "@/lib/config/school";
import { classById, guardianById, peopleById, studentById, teacherById } from "@/lib/data/mock/people";
import { preferencesFor } from "@/lib/data/mock/preferences";
import { anonCode } from "@/lib/domain/kpi";

export default async function SettingsPage() {
  const viewer = await getViewer();
  const personId = viewer.studentId ?? viewer.guardianId ?? viewer.personId;
  const student = viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  const guardian = viewer.guardianId ? guardianById.get(viewer.guardianId) : undefined;
  const staff = peopleById.get(viewer.personId) ?? teacherById.get(viewer.personId);
  const name = student?.name ?? guardian?.name ?? staff?.name ?? viewer.label;

  const profile = student
    ? [{ k: "Class", v: classById.get(student.classId)?.name ?? "" }, { k: "Campus", v: branchName(student.branchId) }, { k: "Guardian", v: guardianById.get(student.guardianId)?.name ?? "" }, { k: "Leaderboard code", v: <span className="font-mono">{anonCode(student.id)}</span> }]
    : guardian
      ? [{ k: "Children", v: guardian.studentIds.map((id) => studentById.get(id)?.firstName ?? id).join(", ") }, { k: "Phone", v: guardian.phoneMasked }, { k: "Preferred language", v: guardian.preferredLanguage === "ur" ? "Urdu" : "English" }]
      : [{ k: "Role", v: <span className="capitalize">{viewer.role}</span> }, { k: "Campus", v: viewer.branchId ? branchName(viewer.branchId) : "All campuses" }, ...(teacherById.get(viewer.personId) ? [{ k: "Subjects", v: teacherById.get(viewer.personId)?.subjects.join(", ") ?? "" }] : [])];

  return (
    <>
      <PageHeader eyebrow="Settings" title="Profile and preferences" description="Who you are in the portal, how it should reach you, and what others can see." />

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-2">
          <SectionTitle title="Profile" hint="Identity is managed by the school office." />
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <Avatar name={name} size="lg" tone={student?.hifz ? "gold" : "accent"} />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-ink">{name}</p>
                <Chip tone="neutral" className="capitalize">{viewer.role}</Chip>
              </div>
            </div>
            <div className="mt-5">
              <KeyValue items={profile} />
            </div>
          </div>
        </section>
        <section className="lg:col-span-3">
          <SectionTitle title="Preferences" hint="Saved for this person; production keeps them on the profile." />
          <SettingsForm initial={preferencesFor(personId)} isStudent={Boolean(student)} />
        </section>
      </div>
    </>
  );
}
