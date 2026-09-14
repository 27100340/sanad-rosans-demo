import { getViewer } from "@/lib/auth/viewer";
import { HALAQA_2, planForStudent, unitsForStudent, ZAID_ATTEMPTS } from "@/lib/data/mock/hifz";
import { studentById } from "@/lib/data/mock/people";
import { surahMeta } from "@/lib/quran";
import { pct, todayISO } from "@/lib/utils";
import { Card, Chip, EmptyState, KeyValue, LinkButton, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { DeniedState, canSeeUstadh } from "@/components/hifz/access";
import { riskLabel, riskTone, securePct } from "@/components/hifz/derive";
import { HifzHeatGrid } from "@/components/hifz/heat-grid";
import { UnitTable } from "@/components/hifz/unit-table";
import { AttemptList } from "@/components/hifz/attempt-list";

export default async function UstadhStudentPage({ params }: { params: Promise<{ studentId: string }> }) {
  const viewer = await getViewer();
  if (!canSeeUstadh(viewer)) return <DeniedState />;

  const { studentId } = await params;
  const student = studentById.get(studentId);
  const row = HALAQA_2.find((r) => r.studentId === studentId);
  const plan = planForStudent(studentId);
  const units = unitsForStudent(studentId);
  const attempts = ZAID_ATTEMPTS.filter((a) => a.studentId === studentId);
  const today = todayISO();
  const back = <LinkButton href="/portal/hifz/ustadh" variant="ghost">Halaqa board</LinkButton>;

  if (!student || !row) {
    return (
      <>
        <PageHeader eyebrow="Student map" title="Student not in this halaqa" actions={back} />
        <EmptyState title="No Hifz record for this id" body="Pick a student from the halaqa board." />
      </>
    );
  }

  const risk = <Chip tone={riskTone(row.securePct, row.overdueManzil)}>{riskLabel(row.securePct, row.overdueManzil)}</Chip>;

  if (!plan) {
    return (
      <>
        <PageHeader eyebrow="Student map" title={student.name} description={`Currently on ${row.currentSurah}`} actions={back} />
        <Card>
          <SectionTitle title="Halaqa summary" action={risk} />
          <KeyValue
            items={[
              { k: "Juz completed", v: row.juzCompleted },
              { k: "Secure", v: pct(row.securePct) },
              { k: "Weak units", v: row.weakUnits },
              { k: "Overdue manzil", v: row.overdueManzil },
              { k: "Last sabaq", v: pct(row.lastSabaqScore) },
              { k: "Home recitations this week", v: row.homeRecitationsThisWeek },
            ]}
          />
        </Card>
        <EmptyState title="Unit-level map not modelled for this student" body="The demo carries full spaced-repetition state for Muhammad Zaid Hassan; other students show their halaqa summary." />
      </>
    );
  }

  const currentSurah = surahMeta(plan.currentSurah);
  return (
    <>
      <PageHeader
        eyebrow="Student map"
        title={student.name}
        description={`Juz ${plan.currentJuz} · ${currentSurah?.nameTransliterated ?? row.currentSurah} · ${plan.dailySabaqAyat} ayat sabaq a day · target ${plan.targetCompletionYear}`}
        actions={back}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle title="Memorisation map" hint={`${plan.juzCompleted.length} juz completed`} />
          <HifzHeatGrid units={units} plan={plan} />
        </Card>
        <Card>
          <SectionTitle title="Plan" action={risk} />
          <KeyValue
            items={[
              { k: "Secure units", v: pct(securePct(units)) },
              { k: "Weak units", v: units.filter((u) => u.status === "weak").length },
              { k: "Overdue manzil", v: row.overdueManzil },
              { k: "Last sabaq", v: pct(row.lastSabaqScore) },
              { k: "Home recitations", v: `${row.homeRecitationsThisWeek} this week` },
              { k: "Juz completed", v: plan.juzCompleted.join(", ") || "none" },
            ]}
          />
        </Card>
      </div>
      <section>
        <SectionTitle title="Units" hint="Spaced-repetition state" />
        <Card className="p-0 sm:p-2">
          <UnitTable units={units} today={today} />
        </Card>
      </section>
      <section>
        <SectionTitle title="Recent attempts" hint="Word diff from the checker" />
        {attempts.length ? <AttemptList attempts={attempts} /> : <EmptyState title="No attempts yet" />}
      </section>
    </>
  );
}
