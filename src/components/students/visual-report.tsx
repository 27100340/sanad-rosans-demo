import { BarChart3, CalendarCheck, Clock3, Target, TrendingUp, Trophy } from "lucide-react";
import { masteryTone } from "@/components/teach/helpers";
import { Card, Progress, type Tone } from "@/components/ui/primitives";
import type { StudentDetail } from "@/lib/data/student-detail";
import { cn } from "@/lib/utils";

const TONE_TEXT: Record<Tone, string> = { ok: "text-ok", accent: "text-accent", warn: "text-warn", danger: "text-danger", gold: "text-gold", info: "text-info", neutral: "text-ink-3" };

function fmtSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m ? `${m}m${s ? ` ${s}s` : ""}` : `${s}s`;
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <h3 className="mb-4 flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">
        <span className="text-accent">{icon}</span>
        {title}
      </h3>
      {children}
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="card-quiet px-4 py-6 text-center text-xs text-ink-3">{text}</p>;
}

/** Accuracy over time as an inline SVG line with an area fill; labels are real text under it. */
function Trend({ points }: { points: StudentDetail["timeline"] }) {
  if (points.length < 2) return <Empty text="The trend appears after two scored sittings." />;
  const w = 620;
  const h = 150;
  const padX = 18;
  const padY = 18;
  const px = (i: number) => padX + i * ((w - 2 * padX) / Math.max(1, points.length - 1));
  const py = (v: number) => h - padY - (Math.max(0, Math.min(100, v)) / 100) * (h - 2 * padY);
  const coords = points.map((p, i) => [px(i), py(p.pct)] as const);
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1][0].toFixed(1)},${h - padY} L${coords[0][0].toFixed(1)},${h - padY} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full text-accent" preserveAspectRatio="none" role="img" aria-label="Accuracy trend">
        {[25, 50, 75, 100].map((v) => (
          <line key={v} x1={padX} x2={w - padX} y1={py(v)} y2={py(v)} stroke="currentColor" strokeOpacity={0.12} strokeDasharray="4 6" />
        ))}
        <path d={area} fill="currentColor" fillOpacity={0.1} />
        <path d={line} fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        {coords.map(([x, y], i) => (
          <circle key={points[i].date + i} cx={x} cy={y} r="4" fill="currentColor" vectorEffect="non-scaling-stroke">
            <title>{`${points[i].label}: ${points[i].pct}%`}</title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between text-2xs text-ink-3">
        <span>{points[0].label}</span>
        <span className="num font-medium text-ink">Latest {points[points.length - 1].pct}%</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}

function Bar({ label, value, note }: { label: string; value: number; note?: string }) {
  const tone = masteryTone(value);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="min-w-0 truncate text-ink-2" title={label}>{label}</span>
        <span className={cn("num shrink-0 font-semibold", TONE_TEXT[tone])}>
          {value}%{note ? <span className="font-normal text-ink-3"> · {note}</span> : null}
        </span>
      </div>
      <Progress value={value} tone={tone} />
    </div>
  );
}

function Donut({ a }: { a: StudentDetail["attendance"] }) {
  if (!a.total) return <Empty text="No attendance recorded yet." />;
  const attended = a.present + a.online;
  const p1 = (attended / a.total) * 100;
  const p2 = ((attended + a.late) / a.total) * 100;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="grid h-32 w-32 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(rgb(var(--ok)) 0 ${p1}%, rgb(var(--warn)) 0 ${p2}%, rgb(var(--danger)) 0)` }}>
        <div className="grid h-[98px] w-[98px] place-items-center rounded-full bg-surface text-center">
          <div>
            <p className="num text-2xl font-semibold text-ink">{a.pct ?? 0}%</p>
            <p className="text-2xs uppercase tracking-[0.08em] text-ink-3">attended</p>
          </div>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-3 gap-2 text-center">
        {[
          ["Present", attended, "text-ok"],
          ["Late", a.late, "text-warn"],
          ["Absent", a.absent, "text-danger"],
        ].map(([l, v, c]) => (
          <div key={String(l)} className="rounded-xl border border-line p-3">
            <p className={cn("num text-xl font-semibold", String(c))}>{v}</p>
            <p className="text-2xs uppercase tracking-[0.08em] text-ink-3">{l}</p>
          </div>
        ))}
      </div>
      {a.excluded ? <p className="w-full text-2xs text-ink-3">{a.excluded} approved absence{a.excluded === 1 ? "" : "s"} excluded from the percentage.</p> : null}
    </div>
  );
}

/** The graphical intelligence report: evidence, ranks and strategy for one student. */
export function VisualReport({ d, branchName, schoolName }: { d: StudentDetail; branchName: string; schoolName: string }) {
  const k = d.kpi;
  const composite = k ? Math.round(k.composite) : null;
  return (
    <section className="space-y-4">
      {k ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Class rank", `#${k.rankClass}`, `of ${k.outOfClass} in ${d.className}`],
            ["Branch rank", `#${k.rankBranch}`, `of ${k.outOfBranch} in ${branchName}`],
            ["School rank", `#${k.rankSchool}`, `of ${k.outOfSchool} across ${schoolName}`],
            ["Performance Index", `${composite}`, "six pillars, 0 to 100"],
          ].map(([label, value, sub], i) => (
            <Card key={label} className="p-4">
              <div className="flex items-center justify-between">
                <Trophy size={14} className={i < 3 ? "text-gold" : "text-accent"} />
                <span className="num text-2xl font-semibold text-ink">{value}</span>
              </div>
              <p className="mt-2 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">{label}</p>
              <p className="text-2xs text-ink-2">{sub}</p>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Accuracy over time" icon={<TrendingUp size={14} />}>
          <Trend points={d.timeline} />
        </Panel>
        <Panel title="Topic mastery" icon={<Target size={14} />}>
          {d.mastery.length ? (
            <div className="space-y-3">
              {d.mastery.slice(0, 8).map((m) => <Bar key={m.code} label={`${m.code} · ${m.title}`} value={m.score} />)}
            </div>
          ) : (
            <Empty text="Mastery appears once a test is published." />
          )}
        </Panel>
        <Panel title="Results" icon={<BarChart3 size={14} />}>
          {d.results.length ? (
            <div className="space-y-3">
              {d.results.slice(0, 6).map((r) => <Bar key={`${r.kind}-${r.title}-${r.date}`} label={r.title} value={r.pct} note={`${r.score}/${r.total}`} />)}
            </div>
          ) : (
            <Empty text="No published tests or finished papers yet." />
          )}
        </Panel>
        <Panel title="Attendance composition" icon={<CalendarCheck size={14} />}>
          <Donut a={d.attendance} />
        </Panel>
        <Panel title="Time management" icon={<Clock3 size={14} />}>
          {d.timeManagement ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Tracked", `${d.timeManagement.tracked} Q`],
                ["Within target", `${d.timeManagement.withinTargetPct}%`],
                ["Spent / target", `${fmtSeconds(d.timeManagement.spent)} / ${fmtSeconds(d.timeManagement.expected)}`],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-line px-2 py-3">
                  <p className="num text-sm font-semibold text-ink">{v}</p>
                  <p className="mt-1 text-2xs uppercase tracking-[0.08em] text-ink-3">{l}</p>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="Per-question timing appears after a past paper sat at the paper's own pace." />
          )}
        </Panel>
        <Panel title="Recommended strategy" icon={<Target size={14} />}>
          <ol className="space-y-2">
            {d.recommendations.map((r, i) => (
              <li key={r} className="flex gap-3 rounded-xl bg-surface-2 px-3 py-2.5 text-xs text-ink-2">
                <span className="num font-semibold text-accent">{String(i + 1).padStart(2, "0")}</span>
                <span>{r}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </section>
  );
}
