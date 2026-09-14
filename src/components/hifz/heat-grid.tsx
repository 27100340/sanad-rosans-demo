import type { HifzPlan, HifzUnit } from "@/lib/domain/types";
import { HeatCell } from "@/components/ui/primitives";
import { juzHeat, surahHeat, type HeatCellData } from "./derive";

function Legend() {
  const items: { label: string; value: number | null }[] = [
    { label: "Secure", value: 100 },
    { label: "Due", value: 75 },
    { label: "Weak", value: 40 },
    { label: "Not started", value: null },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-ink-3">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <HeatCell value={it.value} size="sm" /> {it.label}
        </span>
      ))}
    </div>
  );
}

function CellRow({ cells, compact }: { cells: HeatCellData[]; compact?: boolean }) {
  return (
    <div className={compact ? "flex flex-wrap gap-1" : "grid grid-cols-10 gap-1.5 sm:grid-cols-[repeat(15,minmax(0,1fr))]"}>
      {cells.map((c) => (
        <HeatCell key={c.key} value={c.value} label={c.label} size={compact ? "sm" : "md"} />
      ))}
    </div>
  );
}

/** The Sanad view: 30 juz plus a per-unit row for the bundled surah subset. */
export function HifzHeatGrid({ units, plan }: { units: HifzUnit[]; plan: HifzPlan | undefined }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-ink-2">30 juz</p>
          <p className="num text-2xs text-ink-3">Juz 1 → 30, left to right</p>
        </div>
        <CellRow cells={juzHeat(units, plan)} />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-ink-2">Units in the bundled surahs</p>
        <CellRow cells={surahHeat(units)} compact />
      </div>
      <Legend />
    </div>
  );
}
