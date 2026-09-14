import { Mic } from "lucide-react";
import type { HifzUnit, HifzUnitKind } from "@/lib/domain/types";
import { surahMeta } from "@/lib/quran";
import { Chip, LinkButton } from "@/components/ui/primitives";
import { KIND_LABEL, KIND_TONE, fmtDue, scoreTone } from "./derive";

export function QueueCard({ unit, kind, today }: { unit: HifzUnit; kind: HifzUnitKind; today: string }) {
  const surah = surahMeta(unit.surah);
  const range = unit.fromAyah === unit.toAyah ? `ayah ${unit.fromAyah}` : `ayat ${unit.fromAyah}–${unit.toAyah}`;
  return (
    <div className="card card-hover flex items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={KIND_TONE[kind]}>{KIND_LABEL[kind]}</Chip>
          <p className="truncate text-sm font-medium text-ink">
            {surah?.nameTransliterated ?? `Surah ${unit.surah}`} <span className="text-ink-3">· {range}</span>
          </p>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-ink-3">
          <span>Due {fmtDue(unit.dueDate, today).toLowerCase()}</span>
          {unit.lastScore !== null ? (
            <span className="inline-flex items-center gap-1">
              Last <Chip tone={scoreTone(unit.lastScore)}>{unit.lastScore}%</Chip>
            </span>
          ) : (
            <span>New lesson</span>
          )}
        </p>
      </div>
      <LinkButton href={`/portal/hifz/recite?unit=${unit.id}`} variant={kind === "sabaq" ? "primary" : "soft"} className="btn-sm shrink-0">
        <Mic size={14} /> Recite
      </LinkButton>
    </div>
  );
}
