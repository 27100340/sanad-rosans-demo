import type { HifzUnit } from "@/lib/domain/types";
import type { HifzBandId, HifzMark, HifzMarkOutcome, HifzRubricBand, HifzRubricCriterion } from "@/lib/domain/hifz-marking";
import { HIFZ_RUBRIC, OUTCOME_HINT, OUTCOME_LABEL, bandFor, criterionPoints } from "@/lib/domain/hifz-marking";
import { Chip, Progress, type Tone } from "@/components/ui/primitives";
import { STATUS_TONE, fmtDue } from "./derive";

export const OUTCOME_TONE: Record<HifzMarkOutcome, Tone> = { pass: "ok", repeat: "warn", "needs-work": "danger" };
export const BAND_TONE: Record<HifzBandId, Tone> = { mumtaz: "ok", "jayyid-jiddan": "ok", jayyid: "info", maqbul: "warn", daif: "danger" };

/** dd Mmm, HH:MM from an ISO datetime, in the reader's locale. */
export function fmtWhen(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso;
  return at.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function CriterionRow({ criterion, band }: { criterion: HifzRubricCriterion; band: HifzRubricBand }) {
  return (
    <li className="py-2.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className="text-sm font-medium text-ink">{criterion.label}</p>
        <span className="quran text-[1rem] leading-none text-ink-3">{criterion.arabic}</span>
        <span className="num ml-auto text-xs text-ink-3">
          {criterionPoints(criterion, band)} / {criterion.weight}
        </span>
        <Chip tone={BAND_TONE[band.id]}>{band.term}</Chip>
      </div>
      <Progress value={band.fraction * 100} tone={BAND_TONE[band.id]} className="mt-1.5" />
      <p className="mt-1.5 text-xs text-ink-3">{criterion.descriptors[band.id]}</p>
    </li>
  );
}

/** A completed mark, as both the qari and the student see it. */
export function RubricSummary({ mark, unit, today }: { mark: HifzMark; unit: HifzUnit | null; today: string }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Chip tone={OUTCOME_TONE[mark.outcome]}>{OUTCOME_LABEL[mark.outcome]}</Chip>
        <span className="num text-2xl font-semibold leading-none text-ink">{mark.score}%</span>
        <span className="text-xs text-ink-3">{OUTCOME_HINT[mark.outcome]}</span>
        <Chip tone={mark.luqmas ? "warn" : "neutral"} className="ml-auto">
          {mark.luqmas} {mark.luqmas === 1 ? "luqmah" : "luqmas"}
        </Chip>
      </div>

      <ul className="divide-y divide-line border-y border-line">
        {HIFZ_RUBRIC.map((criterion) => {
          const band = bandFor(mark.marks, criterion.id);
          return band ? <CriterionRow key={criterion.id} criterion={criterion} band={band} /> : null;
        })}
      </ul>

      {mark.comment ? (
        <div className="rounded-xl bg-surface-2/60 px-4 py-3">
          <p className="text-2xs font-medium uppercase tracking-wide text-ink-3">Ustadh&apos;s comment</p>
          <p className="mt-1 text-sm text-ink">{mark.comment}</p>
        </div>
      ) : null}

      <p className="text-xs text-ink-3">
        Marked by {mark.markedByName} on {fmtWhen(mark.markedAt)}. The score is the weighted rubric total, not an AI estimate.
      </p>

      {unit ? (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
          Memorisation record updated:
          <Chip tone={STATUS_TONE[unit.status]}>{unit.status}</Chip>
          <span className="num">
            next due {fmtDue(unit.dueDate, today).toLowerCase()} · interval {unit.intervalDays}d · ease {unit.ease.toFixed(2)}
          </span>
        </p>
      ) : null}
    </div>
  );
}
