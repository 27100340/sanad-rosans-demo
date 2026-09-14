import { ClipboardCheck, Percent, Send, Users } from "lucide-react";
import { Chip, Progress, SectionTitle, Stat, type Tone } from "@/components/ui/primitives";
import { facility, pctOf, type Attempt, type Question } from "@/lib/domain/assessment";

const OPTION_LETTERS = "ABCDEFGH";
const HARD_THRESHOLD_PCT = 50;
const HARDEST_COUNT = 3;

const BANDS: { label: string; min: number; max: number; tone: Tone }[] = [
  { label: "0–39%", min: 0, max: 39, tone: "danger" },
  { label: "40–54%", min: 40, max: 54, tone: "warn" },
  { label: "55–69%", min: 55, max: 69, tone: "neutral" },
  { label: "70–84%", min: 70, max: 84, tone: "accent" },
  { label: "85–100%", min: 85, max: 100, tone: "ok" },
];

/** "B. 3x + 12" — shared by the question preview and the review queue. */
export function optionLabel(index: number, text: string): string {
  return `${OPTION_LETTERS[index] ?? index + 1}. ${text}`;
}

export function correctAnswerText(q: Pick<Question, "type" | "answer" | "options">): string {
  if (q.type !== "mcq") return q.answer;
  const index = Number(q.answer);
  const text = q.options?.[index];
  return text === undefined ? q.answer : optionLabel(index, text);
}

interface HardRow {
  number: number;
  stem: string;
  topicCode: string;
  pct: number | null;
}

function DistributionCard({ pcts, guardEvents }: { pcts: number[]; guardEvents: number }) {
  return (
    <div className="card p-5">
      <SectionTitle title="Mark distribution" hint={pcts.length ? `${pcts.length} submitted attempts` : "No submissions yet"} />
      <ul className="space-y-3">
        {BANDS.map((band) => {
          const count = pcts.filter((p) => p >= band.min && p <= band.max).length;
          return (
            <li key={band.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="num text-ink-2">{band.label}</span>
                <span className="num font-medium text-ink">{count}</span>
              </div>
              <Progress value={pctOf(count, pcts.length)} tone={band.tone} className="mt-1.5" />
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-ink-3">
        {guardEvents} exam-guard {guardEvents === 1 ? "warning" : "warnings"} across {pcts.length} {pcts.length === 1 ? "attempt" : "attempts"}
      </p>
    </div>
  );
}

function HardestCard({ rows }: { rows: HardRow[] }) {
  return (
    <div className="card p-5">
      <SectionTitle title="Hardest questions" hint="Facility index: mean share of the marks earned, lowest first" />
      {rows.some((r) => r.pct !== null) ? (
        <ol className="divide-y divide-line/70">
          {rows.map((r, i) => {
            const flagged = i < HARDEST_COUNT && r.pct !== null && r.pct < HARD_THRESHOLD_PCT;
            return (
              <li key={r.number} className="flex items-start gap-3 py-2.5">
                <span className="num w-6 shrink-0 text-xs text-ink-3">Q{r.number}</span>
                <p className="min-w-0 flex-1 truncate text-sm text-ink" title={r.stem}>
                  {r.stem}
                </p>
                <span className="num shrink-0 text-2xs text-ink-3">{r.topicCode}</span>
                {flagged ? <Chip tone="warn">{r.pct}%</Chip> : <span className="num shrink-0 text-sm font-medium text-ink">{r.pct === null ? "–" : `${r.pct}%`}</span>}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-ink-3">Facility appears once the first attempt is submitted.</p>
      )}
    </div>
  );
}

export function ResultsSummary({ allocated, attempts, questions }: { allocated: number; attempts: Attempt[]; questions: Question[] }) {
  const submitted = attempts.filter((a) => a.submittedAt);
  const pcts = submitted.map((a) => pctOf(a.total ?? 0, a.maxMarks));
  const mean = pcts.length ? Math.round(pcts.reduce((s, n) => s + n, 0) / pcts.length) : null;
  const awaiting = submitted.filter((a) => a.marking.some((m) => m.status === "ai-marked")).length;
  const guardEvents = submitted.reduce((s, a) => s + a.guardEvents, 0);
  const hardest: HardRow[] = questions
    .map((q, i) => {
      const f = facility(q, submitted);
      return { number: i + 1, stem: q.stem, topicCode: q.topicCode, pct: f === null ? null : Math.round(f * 100) };
    })
    .sort((a, b) => (a.pct ?? Number.MAX_SAFE_INTEGER) - (b.pct ?? Number.MAX_SAFE_INTEGER));

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Allocated" value={allocated} icon={<Users size={18} />} tone="accent" />
        <Stat label="Submitted" value={submitted.length} icon={<Send size={18} />} tone="info" trend={allocated ? `${pctOf(submitted.length, allocated)}% of the class` : undefined} />
        <Stat label="Mean score" value={mean === null ? "–" : `${mean}%`} icon={<Percent size={18} />} tone={mean !== null && mean < HARD_THRESHOLD_PCT ? "warn" : "ok"} />
        <Stat label="Awaiting review" value={awaiting} icon={<ClipboardCheck size={18} />} tone={awaiting ? "warn" : "neutral"} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <DistributionCard pcts={pcts} guardEvents={guardEvents} />
        <HardestCard rows={hardest} />
      </div>
    </>
  );
}
