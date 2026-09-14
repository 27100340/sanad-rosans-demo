import Link from "next/link";
import { Building2, Info, Rocket, School, Trophy, Users } from "lucide-react";
import { Card, Chip, Progress, type Tone } from "@/components/ui/primitives";
import type { KpiStudent } from "@/lib/data/kpi";
import { KPI_WEIGHTS, PILLAR_INFO, PILLAR_ORDER, kpiBand } from "@/lib/domain/kpi";
import { cn } from "@/lib/utils";

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

const TONE_TEXT: Record<Tone, string> = { ok: "text-ok", accent: "text-accent", warn: "text-warn", danger: "text-danger", gold: "text-gold", info: "text-info", neutral: "text-ink-3" };

export function GaugeRing({ score, caption }: { score: number; caption: string }) {
  const band = kpiBand(score);
  const filled = (Math.max(0, Math.min(100, score)) / 100) * RING_C;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90" role="img" aria-label={`${caption} ${score}`}>
          <circle cx="60" cy="60" r={RING_R} fill="none" stroke="currentColor" className="text-surface-3" strokeWidth="10" />
          <circle cx="60" cy="60" r={RING_R} fill="none" stroke="currentColor" className={TONE_TEXT[band.tone]} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${filled} ${RING_C}`} />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="num text-3xl font-semibold text-ink">{Math.round(score)}</p>
            <p className={cn("text-2xs font-semibold uppercase tracking-[0.08em]", TONE_TEXT[band.tone])}>{band.label}</p>
          </div>
        </div>
      </div>
      <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">{caption}</p>
    </div>
  );
}

function RankBadge({ icon, label, rank, outOf }: { icon: React.ReactNode; label: string; rank: number; outOf: number }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="tile-accent">{icon}</span>
      <div className="min-w-0">
        <p className="num text-lg font-semibold text-ink">
          #{rank} <span className="text-sm font-normal text-ink-3">of {outOf}</span>
        </p>
        <p className="truncate text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">{label}</p>
      </div>
    </div>
  );
}

export function PillarBars({ me }: { me: KpiStudent }) {
  return (
    <Card className="space-y-4">
      {PILLAR_ORDER.map((k) => {
        const p = me.pillars[k];
        const band = kpiBand(p.score);
        return (
          <div key={k}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <p className="text-sm text-ink">
                {PILLAR_INFO[k].label} <span className="ml-1 text-2xs uppercase tracking-[0.08em] text-ink-3">weight {KPI_WEIGHTS[k]}</span>
              </p>
              <p className={cn("num text-xs font-semibold", TONE_TEXT[band.tone])}>{p.score}</p>
            </div>
            <Progress value={p.score} tone={band.tone} />
            <p className="mt-1 text-xs leading-5 text-ink-3">{p.detail}</p>
          </div>
        );
      })}
    </Card>
  );
}

/** The student's own Performance Index page body; the staff view reuses PillarBars. */
export function KpiStudentView({ me, branchName, schoolName, computedAt }: { me: KpiStudent; branchName: string; schoolName: string; computedAt: string }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <Card className="flex items-center justify-center p-6">
          <GaugeRing score={me.composite} caption="Performance Index" />
        </Card>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <RankBadge icon={<Users size={16} />} label={`in ${me.className}`} rank={me.rankClass} outOf={me.outOfClass} />
            <RankBadge icon={<Building2 size={16} />} label={`in ${branchName}`} rank={me.rankBranch} outOf={me.outOfBranch} />
            <RankBadge icon={<School size={16} />} label={`across ${schoolName}`} rank={me.rankSchool} outOf={me.outOfSchool} />
          </div>
          <PillarBars me={me} />
        </div>
      </div>

      {me.advice.length ? (
        <section className="card border-accent/30 p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Rocket size={16} className="text-accent" /> How to climb
          </h2>
          <p className="mt-1 text-xs text-ink-3">Your three biggest opportunities right now, with the index gain each one is worth.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {me.advice.map((a) => (
              <Link key={a.pillar} href={a.href} className="card-hover card p-4">
                <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">{PILLAR_INFO[a.pillar].label}</p>
                <p className="mt-1.5 text-sm text-ink">{a.text}</p>
                <p className="num mt-2 text-xs font-semibold text-ok">+{a.gain} points</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <details className="card p-5 text-sm text-ink-2">
        <summary className="flex cursor-pointer items-center gap-2 font-medium text-ink">
          <Info size={15} className="text-accent" /> How the index is calculated
        </summary>
        <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-ink-3">
          {PILLAR_ORDER.map((k) => (
            <li key={k}>
              <span className="font-medium text-ink-2">{PILLAR_INFO[k].label} ({KPI_WEIGHTS[k]}%)</span> · {PILLAR_INFO[k].blurb}
            </li>
          ))}
          <li className="pt-1">Volume terms are log-scaled and capped, so grinding never beats genuine mastery. Pillars with nothing to assess yet score a neutral 50, except Contribution, which starts at 0 because it is entirely in your hands.</li>
        </ul>
      </details>

      <p className="flex items-center gap-2 text-2xs text-ink-3">
        <Trophy size={12} /> Snapshot computed {new Date(computedAt).toLocaleString("en-GB")}. <Chip tone="neutral">refreshes on every open in the demo</Chip>
      </p>
    </div>
  );
}
