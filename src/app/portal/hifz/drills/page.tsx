import { Mic } from "lucide-react";
import { getViewer } from "@/lib/auth/viewer";
import { MUTASHABIHAT, unitsForStudent } from "@/lib/data/mock/hifz";
import { LinkButton, PageHeader } from "@/components/ui/primitives";
import { DeniedState, HIFZ_STUDENT_ID, canSeeStudentHifz } from "@/components/hifz/access";
import { unitForAyah } from "@/components/hifz/derive";
import { MutashabihCard } from "@/components/hifz/mutashabih-card";

export default async function DrillsPage() {
  const viewer = await getViewer();
  if (!canSeeStudentHifz(viewer)) return <DeniedState />;

  const units = unitsForStudent(HIFZ_STUDENT_ID);

  return (
    <>
      <PageHeader eyebrow="Mutashabihat" title="Look-alike drills" description="Verses that share a run of words and part ways on one. Read both, then recite the pair with the anchor in mind." />
      <div className="grid gap-4 lg:grid-cols-2">
        {MUTASHABIHAT.map((pair, i) => {
          const unit = unitForAyah(units, pair.a.surah, pair.a.ayah) ?? unitForAyah(units, pair.b.surah, pair.b.ayah);
          const href = unit ? `/portal/hifz/recite?unit=${unit.id}` : "/portal/hifz/recite";
          return (
            <MutashabihCard
              key={i}
              pair={pair}
              action={
                <LinkButton href={href} variant="soft" className="btn-sm">
                  <Mic size={13} /> Recite the pair
                </LinkButton>
              }
            />
          );
        })}
      </div>
    </>
  );
}
