"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Chip, EmptyState, LinkButton } from "@/components/ui/primitives";
import type { Paper } from "@/lib/data/pastpapers";
import { SUBJECT_BY_CODE } from "@/lib/data/pastpapers";
import type { PaperAttempt } from "@/lib/domain/assessment";
import { pctOf } from "@/lib/domain/assessment";
import { cn } from "@/lib/utils";
import { PAPER_TYPE_LABEL } from "./paper-analytics";

/** A sitting as the hub needs it: plain, no answers. */
export interface HubAttempt {
  id: string;
  code: string;
  paperKey: string;
  total: number;
  maxMarks: number;
  finishedAt?: string;
  answered: number;
  questions: number;
}

export interface PapersHubProps {
  papers: Paper[];
  ownCodes: string[];
  attempts: HubAttempt[];
}

type Pace = PaperAttempt["pace"];

interface StartOut {
  attempt?: { id: string };
  error?: string;
}

/** Component label from the variant, e.g. "21" -> "P2", "1" -> "P1". */
function componentOf(paper: Paper): string {
  return `P${paper.paper.charAt(0)}`;
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn("chip transition-colors", active ? "bg-accent text-white" : "bg-surface-2 text-ink-2 hover:bg-surface-3")}>
      {children}
    </button>
  );
}

function toggle(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function PaperCard({ paper, own, open, best, pace, starting, onStart }: { paper: Paper; own: boolean; open?: HubAttempt; best?: HubAttempt; pace: Pace; starting: boolean; onStart: () => void }) {
  const subject = SUBJECT_BY_CODE[paper.code]?.name ?? paper.code;
  return (
    <div className="card flex flex-col gap-4 p-5">
      <div className="min-w-0">
        <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">
          {subject}
          {own ? " · your subject" : ""}
        </p>
        <p className="mt-1 text-sm font-medium text-ink">{paper.label}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip tone={paper.type === "mcq" ? "info" : "accent"}>{PAPER_TYPE_LABEL[paper.type]}</Chip>
          <Chip>{paper.questions} questions</Chip>
          <Chip>{paper.marks} marks</Chip>
          <Chip>{paper.durationMin} min</Chip>
          {paper.hasInsert ? <Chip tone="gold">Insert</Chip> : null}
        </div>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        {best ? (
          <p className="num text-xs text-ink-2">
            Best <span className="font-semibold text-ink">{pctOf(best.total, best.maxMarks)}%</span> · {best.total}/{best.maxMarks}
          </p>
        ) : (
          <p className="text-xs text-ink-3">Not sat yet</p>
        )}
        {open ? (
          <LinkButton href={`/portal/learn/papers/${open.id}`} variant="soft" className="btn-sm">
            Continue · {open.answered}/{open.questions}
          </LinkButton>
        ) : (
          <button type="button" className="btn-primary btn-sm" onClick={onStart} disabled={starting}>
            {starting ? "Starting…" : pace === "paper" ? "Start at paper pace" : "Start untimed"}
          </button>
        )}
      </div>
    </div>
  );
}

export function PapersHub({ papers, ownCodes, attempts }: PapersHubProps) {
  const router = useRouter();
  const allCodes = useMemo(() => [...new Set(papers.map((p) => p.code))], [papers]);
  const allComponents = useMemo(() => [...new Set(papers.map(componentOf))].sort(), [papers]);
  const own = useMemo(() => new Set(ownCodes), [ownCodes]);

  const [subjects, setSubjects] = useState<Set<string>>(() => new Set(ownCodes.length ? ownCodes.filter((c) => allCodes.includes(c)) : allCodes));
  const [components, setComponents] = useState<Set<string>>(() => new Set(allComponents));
  const [pace, setPace] = useState<Pace>("paper");
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      papers
        .filter((p) => subjects.has(p.code) && components.has(componentOf(p)))
        .sort((a, b) => Number(own.has(b.code)) - Number(own.has(a.code)) || a.code.localeCompare(b.code) || b.year - a.year || a.paper.localeCompare(b.paper)),
    [papers, subjects, components, own],
  );

  const openFor = (p: Paper) => attempts.find((a) => a.code === p.code && a.paperKey === p.paperKey && !a.finishedAt);
  const bestFor = (p: Paper) =>
    attempts.filter((a) => a.code === p.code && a.paperKey === p.paperKey && a.finishedAt).reduce<HubAttempt | undefined>((best, a) => (!best || pctOf(a.total, a.maxMarks) > pctOf(best.total, best.maxMarks) ? a : best), undefined);

  const start = async (p: Paper) => {
    const key = `${p.code}/${p.paperKey}`;
    setStarting(key);
    setError(null);
    try {
      const res = await fetch("/api/assess/papers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: p.code, paperKey: p.paperKey, pace }) });
      const out = (await res.json().catch(() => ({}))) as StartOut;
      if (!res.ok || !out.attempt) throw new Error(out.error ?? "Could not start the paper");
      router.push(`/portal/learn/papers/${out.attempt.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the paper");
      setStarting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-ink-3">Subject</span>
          {allCodes.map((code) => (
            <FilterChip key={code} active={subjects.has(code)} onClick={() => setSubjects((s) => toggle(s, code))}>
              {SUBJECT_BY_CODE[code]?.name ?? code}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-ink-3">Component</span>
          {allComponents.map((c) => (
            <FilterChip key={c} active={components.has(c)} onClick={() => setComponents((s) => toggle(s, c))}>
              {c}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-ink-3">Timing</span>
          <FilterChip active={pace === "paper"} onClick={() => setPace("paper")}>
            Paper pace
          </FilterChip>
          <FilterChip active={pace === "untimed"} onClick={() => setPace("untimed")}>
            Untimed
          </FilterChip>
          <span className="ml-1 text-2xs text-ink-3">{pace === "paper" ? "A clock per question at the exam's own pace." : "No clock; take as long as you need."}</span>
        </div>
      </div>

      {error ? <p className="chip-danger">{error}</p> : null}

      {visible.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <PaperCard key={`${p.code}/${p.paperKey}`} paper={p} own={own.has(p.code)} open={openFor(p)} best={bestFor(p)} pace={pace} starting={starting === `${p.code}/${p.paperKey}`} onStart={() => void start(p)} />
          ))}
        </div>
      ) : (
        <EmptyState title="No papers match" body="Turn a subject or component filter back on." />
      )}
    </div>
  );
}
