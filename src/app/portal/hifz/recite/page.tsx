import { classifyUnit } from "@/lib/domain/srs";
import { getViewer } from "@/lib/auth/viewer";
import { ZAID_UNITS } from "@/lib/data/mock/hifz";
import { ayahLabel, segmentsFor, surahMeta } from "@/lib/quran";
import { todayISO } from "@/lib/utils";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui/primitives";
import { DeniedState, canSeeStudentHifz } from "@/components/hifz/access";
import { RecitePanel } from "@/components/hifz/recite-panel";

const DEFAULT_UNIT = "u-67c";
const RECITER = "Shaykh Mahmoud Khalil Al-Husary";

export default async function RecitePage({ searchParams }: { searchParams: Promise<{ unit?: string }> }) {
  const viewer = await getViewer();
  if (!canSeeStudentHifz(viewer)) return <DeniedState />;

  const { unit: unitParam } = await searchParams;
  const unit = ZAID_UNITS.find((u) => u.id === unitParam) ?? ZAID_UNITS.find((u) => u.id === DEFAULT_UNIT);
  if (!unit) return <EmptyState title="Unit not found" body="Pick a unit from today's queue." action={<LinkButton href="/portal/hifz" variant="soft">Back to today</LinkButton>} />;

  const today = todayISO();
  const kind = classifyUnit(unit, today);
  const segments = segmentsFor(unit.surah, unit.fromAyah, unit.toAyah);
  const surah = surahMeta(unit.surah);

  return (
    <>
      <PageHeader
        eyebrow="Listen & recite"
        title={
          <>
            {ayahLabel(unit.surah, unit.fromAyah, unit.toAyah)}{" "}
            {surah ? <span className="quran ml-2 text-[1.4rem] font-normal leading-none text-ink-2">{surah.nameArabic}</span> : null}
          </>
        }
        description={`Reference recitation: ${RECITER}. Listen, then recite back; every word is checked against the canonical text.`}
        actions={<LinkButton href="/portal/hifz" variant="ghost">Today's queue</LinkButton>}
      />
      {segments.length ? (
        <RecitePanel unitId={unit.id} kind={kind} surah={unit.surah} fromAyah={unit.fromAyah} toAyah={unit.toAyah} segments={segments} today={today} />
      ) : (
        <EmptyState title="This unit is outside the bundled verse subset" body="The demo bundles Al-Fatihah, Al-Mulk 1–15 and the last ten surahs." />
      )}
    </>
  );
}
