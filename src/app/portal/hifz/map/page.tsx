import { getViewer } from "@/lib/auth/viewer";
import { planForStudent, unitsForStudent } from "@/lib/data/mock/hifz";
import { todayISO } from "@/lib/utils";
import { Card, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { DeniedState, HIFZ_STUDENT_ID, canSeeStudentHifz } from "@/components/hifz/access";
import { HifzHeatGrid } from "@/components/hifz/heat-grid";
import { UnitTable } from "@/components/hifz/unit-table";

export default async function HifzMapPage() {
  const viewer = await getViewer();
  if (!canSeeStudentHifz(viewer)) return <DeniedState />;

  const today = todayISO();
  const units = unitsForStudent(HIFZ_STUDENT_ID);
  const plan = planForStudent(HIFZ_STUDENT_ID);

  return (
    <>
      <PageHeader eyebrow="Sanad view" title="My memorisation map" description="Green is secure, amber is due, red is weak, grey is not started. The scheduler decides what comes back today." />
      <Card>
        <SectionTitle title="30 juz" hint={plan ? `${plan.juzCompleted.length} completed · juz ${plan.currentJuz} in progress` : undefined} />
        <HifzHeatGrid units={units} plan={plan} />
      </Card>
      <section>
        <SectionTitle title="Units" hint="Spaced-repetition state per memorisation block" />
        <Card className="p-0 sm:p-2">
          <UnitTable units={units} today={today} reciteLinks />
        </Card>
      </section>
    </>
  );
}
