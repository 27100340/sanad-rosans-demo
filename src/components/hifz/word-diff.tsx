import type { WordDiff, WordState } from "@/lib/domain/types";
import { arabicNumeral, type AyahSegment } from "@/lib/quran";

const STATE_CLASS: Record<WordState, string> = { ok: "w-ok", sub: "w-sub", miss: "w-miss", ins: "w-ins" };

export function AyahMarker({ n }: { n: number }) {
  return <span className="mx-1 text-[0.6em] text-accent select-none">﴿{arabicNumeral(n)}﴾</span>;
}

/** Canonical Uthmani words for the segments with no diff applied. */
export function CanonicalText({ segments }: { segments: AyahSegment[] }) {
  return (
    <p className="quran">
      {segments.map((seg) => (
        <span key={seg.ayah}>
          {seg.words.join(" ")} <AyahMarker n={seg.ayah} />{" "}
        </span>
      ))}
    </p>
  );
}

/**
 * Renders the diff over the ORIGINAL Uthmani words. `segments` provide the
 * display words; when their count does not match the diff's canonical word
 * count, the normalised `expected` text is shown instead.
 */
export function WordDiffView({ words, segments, className }: { words: WordDiff[]; segments: AyahSegment[]; className?: string }) {
  const display = segments.flatMap((s) => s.words);
  const canonicalCount = words.filter((w) => w.state !== "ins").length;
  const aligned = display.length === canonicalCount;
  const ayahEnd = new Map<number, number>();
  let cursor = 0;
  for (const seg of segments) {
    cursor += seg.words.length;
    ayahEnd.set(cursor - 1, seg.ayah);
  }
  return (
    <p className={className ?? "quran"}>
      {words.map((w, i) => {
        const text = w.state === "ins" ? (w.heard ?? "") : aligned ? display[w.index] : (w.expected ?? "");
        const marker = w.state !== "ins" && aligned ? ayahEnd.get(w.index) : undefined;
        return (
          <span key={i}>
            <span className={STATE_CLASS[w.state]} title={w.state === "sub" ? `heard: ${w.heard ?? ""}` : undefined}>
              {text}
            </span>{" "}
            {marker !== undefined ? (
              <>
                <AyahMarker n={marker} />{" "}
              </>
            ) : null}
          </span>
        );
      })}
    </p>
  );
}

export function DiffLegend() {
  const items: { cls: string; label: string }[] = [
    { cls: "w-ok", label: "correct" },
    { cls: "w-sub", label: "substituted" },
    { cls: "w-miss", label: "omitted" },
    { cls: "w-ins", label: "inserted" },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-2xs text-ink-3">
      {items.map((it) => (
        <span key={it.cls} className="inline-flex items-center gap-1.5">
          <span className={`${it.cls} inline-block h-3 w-5 rounded-sm border border-line`} /> {it.label}
        </span>
      ))}
    </div>
  );
}
