import { Chip, EmptyState, Progress } from "@/components/ui/primitives";
import type { Paper } from "@/lib/data/pastpapers";

export interface HardQuestion {
  qnum: number;
  marks: number;
  /** Mean fraction of the marks awarded across class attempts that answered it, 0..1. */
  meanFraction: number;
  /** Class attempts that answered it. */
  sample: number;
}

export interface PaperClassRow {
  paper: Paper;
  sittings: number;
  /** Absent when no class sitting has answered anything yet. */
  meanPct?: number;
  hardest: HardQuestion[];
  /** First question crop, so the teacher can eyeball the paper. */
  previewImg?: string;
}

const HARD_THRESHOLD = 0.5;

export const PAPER_TYPE_LABEL = { mcq: "Multiple choice, auto-marked", structured: "Structured, AI-marked" } as const;

function PaperCard({ row }: { row: PaperClassRow }) {
  const { paper } = row;
  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{paper.label}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip tone={paper.type === "mcq" ? "info" : "accent"}>{PAPER_TYPE_LABEL[paper.type]}</Chip>
            <Chip>{paper.questions} questions</Chip>
            <Chip>{paper.marks} marks</Chip>
            <Chip>{paper.durationMin} min</Chip>
            {paper.hasInsert ? <Chip tone="gold">Insert</Chip> : null}
          </div>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-2xs font-medium text-ink-3">Sittings</p>
            <p className="num text-lg font-semibold text-ink">{row.sittings}</p>
          </div>
          <div>
            <p className="text-2xs font-medium text-ink-3">Mean</p>
            <p className="num text-lg font-semibold text-ink">{row.meanPct === undefined ? "—" : `${row.meanPct}%`}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="label">Hardest questions</p>
        {row.hardest.length ? (
          <ul className="space-y-2">
            {row.hardest.map((h) => {
              const pct = Math.round(h.meanFraction * 100);
              const hard = h.meanFraction < HARD_THRESHOLD;
              return (
                <li key={h.qnum} className="flex items-center gap-3 text-xs">
                  <span className="num w-8 shrink-0 font-semibold text-ink">Q{h.qnum}</span>
                  <Progress value={pct} tone={hard ? "warn" : "accent"} className="flex-1" />
                  <span className="num w-10 shrink-0 text-right text-ink-2">{pct}%</span>
                  <span className="num hidden w-16 shrink-0 text-ink-3 sm:inline">
                    {h.sample} {h.sample === 1 ? "script" : "scripts"}
                  </span>
                  {hard ? <Chip tone="warn">Below half</Chip> : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-ink-3">No class answers yet. Hardest questions appear once students have sat this paper.</p>
        )}
      </div>

      {row.previewImg ? (
        <details>
          <summary className="cursor-pointer text-xs font-medium text-accent">Preview the first question</summary>
          <img src={row.previewImg} alt={`${paper.label} question 1`} loading="lazy" className="mt-3 h-auto w-full max-w-full rounded-xl border border-line bg-white" />
        </details>
      ) : null}
    </div>
  );
}

export function PaperAnalytics({ rows }: { rows: PaperClassRow[] }) {
  if (!rows.length) return <EmptyState title="No papers in the bank" body="Papers are sliced into the bank by tools/papers/slice.py." />;
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
      {rows.map((r) => (
        <PaperCard key={`${r.paper.code}/${r.paper.paperKey}`} row={r} />
      ))}
    </div>
  );
}
