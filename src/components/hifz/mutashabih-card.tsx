import type { ReactNode } from "react";
import type { MutashabihPair } from "@/lib/domain/types";
import { findAyah, surahMeta, uthmaniWords } from "@/lib/quran";
import { Chip } from "@/components/ui/primitives";
import { AyahMarker } from "./word-diff";

function Side({ at, fallback }: { at: { surah: number; ayah: number }; fallback: string }) {
  const ayah = findAyah(at.surah, at.ayah);
  const name = surahMeta(at.surah)?.nameTransliterated ?? `Surah ${at.surah}`;
  return (
    <div className="rounded-xl bg-surface-2 p-4">
      <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-3">
        {name} {at.surah}:{at.ayah}
      </p>
      {ayah ? (
        <p className="quran text-[1.5rem]">
          {uthmaniWords(ayah).join(" ")} <AyahMarker n={ayah.ayah} />
        </p>
      ) : (
        <p className="quran text-[1.5rem] text-ink-2">{fallback}</p>
      )}
      {ayah ? <p className="mt-1 text-xs text-ink-3">{ayah.translationEn}</p> : <p className="mt-1 text-xs text-ink-3">Outside the demo subset; shared phrase shown.</p>}
    </div>
  );
}

/** Both ayat of a look-alike pair side by side, with the differing words explained. */
export function MutashabihCard({ pair, action, highlight }: { pair: MutashabihPair; action?: ReactNode; highlight?: boolean }) {
  return (
    <div className={highlight ? "card border-warn/40 p-5" : "card p-5"}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Chip tone="warn">Look-alike</Chip>
        <p className="text-sm text-ink-2">
          Shared: <span className="quran inline text-base leading-none">{pair.sharedPhrase}</span>
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Side at={pair.a} fallback={pair.sharedPhrase} />
        <Side at={pair.b} fallback={pair.sharedPhrase} />
      </div>
      <p className="mt-3 text-sm text-ink">
        <span className="font-medium">The difference. </span>
        {pair.difference}
      </p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
