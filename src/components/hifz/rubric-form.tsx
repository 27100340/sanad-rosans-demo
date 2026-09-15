"use client";

import { useMemo, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import type { HifzUnitKind } from "@/lib/domain/types";
import type { HifzBandId, HifzCriterionId, HifzMarkOutcome, HifzRubricCriterion, HifzRubricMark } from "@/lib/domain/hifz-marking";
import {
  HIFZ_BANDS,
  HIFZ_OUTCOMES,
  HIFZ_RUBRIC,
  MAX_COMMENT_CHARS,
  MAX_LUQMAS,
  OUTCOME_HINT,
  OUTCOME_LABEL,
  bandById,
  criterionPoints,
  missingCriteria,
  rubricScore,
  suggestedOutcome,
} from "@/lib/domain/hifz-marking";
import { Chip } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { BAND_TONE, OUTCOME_TONE } from "./rubric-summary";

type Selection = Partial<Record<HifzCriterionId, HifzBandId>>;

interface Props {
  submissionId: string;
  unitKind: HifzUnitKind;
  /** Called after the mark is recorded, so the desk can refresh from the server. */
  onMarked: () => void;
}

function CriterionBlock({ criterion, selected, onSelect }: { criterion: HifzRubricCriterion; selected: HifzBandId | undefined; onSelect: (band: HifzBandId) => void }) {
  const band = selected ? bandById(selected) : undefined;
  return (
    <fieldset className="border-t border-line pt-4">
      <legend className="sr-only">{criterion.label}</legend>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className="text-sm font-medium text-ink">{criterion.label}</p>
        <span className="quran text-[1rem] leading-none text-ink-3">{criterion.arabic}</span>
        <Chip tone={band ? BAND_TONE[band.id] : "neutral"} className="ml-auto">
          {band ? `${criterionPoints(criterion, band)} / ${criterion.weight}` : `${criterion.weight} pts`}
        </Chip>
      </div>
      <p className="mt-0.5 text-xs text-ink-3">{criterion.hint}</p>
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
        {HIFZ_BANDS.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected === option.id}
            onClick={() => onSelect(option.id)}
            title={`${option.term} (${option.arabic}) — ${criterion.descriptors[option.id]}`}
            className={cn(
              "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
              selected === option.id ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-ink-2 hover:bg-surface-2",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {band ? (
        <p className="mt-2 text-xs text-ink-2">
          <span className="font-medium">
            {band.term} <span className="quran text-[0.95rem] leading-none text-ink-3">{band.arabic}</span>
          </span>{" "}
          — {criterion.descriptors[band.id]}
        </p>
      ) : (
        <p className="mt-2 text-xs text-ink-3">Not yet marked.</p>
      )}
    </fieldset>
  );
}

function LuqmaStepper({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const clamp = (next: number) => onChange(Math.max(0, Math.min(MAX_LUQMAS, next)));
  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl border border-line-strong bg-surface">
      <button type="button" onClick={() => clamp(value - 1)} disabled={value <= 0} className="btn-ghost rounded-none px-3" aria-label="One fewer luqmah">
        <Minus size={14} />
      </button>
      <span className="num w-10 text-center text-sm font-semibold text-ink">{value}</span>
      <button type="button" onClick={() => clamp(value + 1)} disabled={value >= MAX_LUQMAS} className="btn-ghost rounded-none px-3" aria-label="One more luqmah">
        <Plus size={14} />
      </button>
    </div>
  );
}

/** The qari's marking form. The score is recomputed on the server from these bands. */
export function RubricForm({ submissionId, unitKind, onMarked }: Props) {
  const [selection, setSelection] = useState<Selection>({});
  const [luqmas, setLuqmas] = useState(0);
  const [outcome, setOutcome] = useState<HifzMarkOutcome | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const marks = useMemo<HifzRubricMark[]>(
    () =>
      HIFZ_RUBRIC.flatMap((criterion) => {
        const bandId = selection[criterion.id];
        return bandId ? [{ criterionId: criterion.id, bandId }] : [];
      }),
    [selection],
  );
  const missing = useMemo(() => missingCriteria(marks), [marks]);
  const score = useMemo(() => rubricScore(marks), [marks]);
  const suggestion = useMemo(() => (missing.length ? null : suggestedOutcome(unitKind, score, luqmas)), [missing.length, unitKind, score, luqmas]);

  async function submit() {
    if (!outcome || missing.length) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/hifz/submission/${submissionId}/mark`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marks, luqmas, outcome, comment }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      onMarked();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The mark was not saved. Nothing was recorded.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {HIFZ_RUBRIC.map((criterion) => (
        <CriterionBlock
          key={criterion.id}
          criterion={criterion}
          selected={selection[criterion.id]}
          onSelect={(band) => setSelection((prev) => ({ ...prev, [criterion.id]: band }))}
        />
      ))}

      <div className="border-t border-line pt-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div>
            <p className="label">Luqmas given</p>
            <LuqmaStepper value={luqmas} onChange={setLuqmas} />
          </div>
          <div className="ml-auto text-right">
            <p className="label">Weighted total</p>
            <p className="num text-2xl font-semibold leading-none text-ink">{missing.length ? "—" : `${score}%`}</p>
          </div>
        </div>
        {missing.length ? <p className="mt-2 text-xs text-ink-3">Still to mark: {missing.map((c) => c.label).join(", ")}.</p> : null}
      </div>

      <div className="border-t border-line pt-4">
        <p className="label">Outcome</p>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
          {HIFZ_OUTCOMES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={outcome === option}
              onClick={() => setOutcome(option)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                outcome === option ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-ink-2 hover:bg-surface-2",
              )}
            >
              <span className="block text-sm font-medium">{OUTCOME_LABEL[option]}</span>
              <span className="block text-2xs opacity-80">{OUTCOME_HINT[option]}</span>
            </button>
          ))}
        </div>
        {suggestion ? (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-3">
            The rubric points to <Chip tone={OUTCOME_TONE[suggestion]}>{OUTCOME_LABEL[suggestion]}</Chip> — a suggestion only; the outcome you record is the one that counts.
          </p>
        ) : null}
      </div>

      <div className="border-t border-line pt-4">
        <label className="label" htmlFor={`comment-${submissionId}`}>
          Comment for the student (optional)
        </label>
        <textarea
          id={`comment-${submissionId}`}
          rows={3}
          value={comment}
          maxLength={MAX_COMMENT_CHARS}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What to fix before the next hearing."
          className="input resize-y"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={submit} disabled={busy || Boolean(missing.length) || !outcome} className="btn-primary">
          <Check size={14} /> {busy ? "Recording…" : "Record mark"}
        </button>
        <p className="text-2xs text-ink-3">Recording the mark updates the student&apos;s memorisation record and sets the next due date.</p>
      </div>
      {error ? <p className="text-xs text-warn">{error}</p> : null}
    </div>
  );
}
