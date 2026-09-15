import type { RecitationAttempt } from "@/lib/domain/types";
import { compareRecitation } from "@/lib/quran/diff";
import { ayahLabel, canonicalText, segmentsFor } from "@/lib/quran";
import { Chip } from "@/components/ui/primitives";
import { scoreTone } from "./derive";
import { WordDiffView } from "./word-diff";

const SOURCE_LABEL: Record<RecitationAttempt["source"], string> = { gemini: "Gemini audio", whisper: "Whisper audio", "browser-speech": "Browser speech", simulated: "Simulated" };

/** Past attempts with the word diff re-derived from the stored transcript when it was not persisted. */
export function AttemptList({ attempts }: { attempts: RecitationAttempt[] }) {
  return (
    <ul className="space-y-4">
      {attempts.map((a) => {
        const segments = segmentsFor(a.surah, a.fromAyah, a.toAyah);
        const words = a.words.length ? a.words : compareRecitation(canonicalText(a.surah, a.fromAyah, a.toAyah), a.transcript, { source: a.source, surah: a.surah, fromAyah: a.fromAyah, toAyah: a.toAyah }).words;
        return (
          <li key={a.id} className="card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-ink">{ayahLabel(a.surah, a.fromAyah, a.toAyah)}</p>
              <span className="text-xs text-ink-3">{a.date}</span>
              <span className="ml-auto inline-flex items-center gap-2">
                <Chip tone={scoreTone(a.score)}>{a.score}%</Chip>
                <Chip tone={a.passed ? "ok" : "warn"}>{a.passed ? "Passed" : "Recite again"}</Chip>
                <Chip tone="neutral">{SOURCE_LABEL[a.source]}</Chip>
              </span>
            </div>
            <div className="mt-3 rounded-xl bg-surface-2/60 px-4 py-2">
              <WordDiffView words={words} segments={segments} className="quran text-[1.5rem]" />
            </div>
            <p className="num mt-2 text-xs text-ink-3">
              {a.correct} correct · {a.substituted} substituted · {a.omitted} omitted · {a.inserted} inserted
            </p>
            {a.tajweedNotes.length ? (
              <p className="mt-1 text-xs text-ink-2">
                Tajweed: {a.tajweedNotes.join("; ")} <span className="text-ink-3">(suggested, for the Ustadh)</span>
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
