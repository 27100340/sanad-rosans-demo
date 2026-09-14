"use client";

import Link from "next/link";
import { Repeat } from "lucide-react";
import type { CheckResponse } from "@/app/api/hifz/check/route";
import type { AyahSegment } from "@/lib/quran";
import { Chip, type Tone } from "@/components/ui/primitives";
import { fmtDue, STATUS_TONE } from "./derive";
import { MutashabihCard } from "./mutashabih-card";
import { DiffLegend, WordDiffView } from "./word-diff";

const SOURCE_LABEL: Record<CheckResponse["result"]["source"], string> = {
  gemini: "Gemini audio",
  "browser-speech": "Browser speech",
  simulated: "Simulated",
};

const COUNT_TEXT: Partial<Record<Tone, string>> = { warn: "text-warn", danger: "text-danger", info: "text-info" };

function Count({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-2">
      <p className="text-2xs font-medium uppercase tracking-wide text-ink-3">{label}</p>
      <p className={`num mt-0.5 text-lg font-semibold ${COUNT_TEXT[tone] ?? "text-ink"}`}>{value}</p>
    </div>
  );
}

export function ResultView({ data, segments, today }: { data: CheckResponse; segments: AyahSegment[]; today: string }) {
  const { result, unit, mutashabihat } = data;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={result.passed ? "ok" : "warn"}>{result.passed ? "Passed" : "Recite again"}</Chip>
        <span className="num text-2xl font-semibold text-ink">{result.score}%</span>
        <span className="ml-auto inline-flex items-center gap-2">
          <Chip tone={result.source === "simulated" ? "neutral" : "info"}>{SOURCE_LABEL[result.source]}</Chip>
          {data.live ? <Chip tone="ok">AI live</Chip> : null}
        </span>
      </div>

      <div className="rounded-2xl bg-surface-2/60 px-4 py-3">
        <WordDiffView words={result.words} segments={segments} />
      </div>
      <DiffLegend />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Count label="Correct" value={result.correct} tone="neutral" />
        <Count label="Substituted" value={result.substituted} tone={result.substituted ? "warn" : "neutral"} />
        <Count label="Omitted" value={result.omitted} tone={result.omitted ? "danger" : "neutral"} />
        <Count label="Inserted" value={result.inserted} tone={result.inserted ? "info" : "neutral"} />
      </div>

      {result.tajweedNotes.length > 0 ? (
        <div className="rounded-xl border border-line p-4">
          <p className="mb-1.5 text-xs font-medium text-ink-2">
            Tajweed notes <span className="text-ink-3">· suggested, for the Ustadh to confirm</span>
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
            {result.tajweedNotes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {unit ? (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
          Unit updated:
          <Chip tone={STATUS_TONE[unit.status]}>{unit.status}</Chip>
          <span className="num">
            next due {fmtDue(unit.dueDate, today).toLowerCase()} · interval {unit.intervalDays}d · ease {unit.ease.toFixed(2)}
          </span>
        </p>
      ) : null}

      {mutashabihat.map((pair, i) => (
        <MutashabihCard
          key={i}
          pair={pair}
          highlight
          action={
            <Link href="/portal/hifz/drills" className="btn-soft btn-sm">
              <Repeat size={13} /> Drill now
            </Link>
          }
        />
      ))}
    </div>
  );
}
