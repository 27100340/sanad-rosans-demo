"use client";

import { useMemo, useState } from "react";
import { CheckCheck, Eye, EyeOff, FlaskConical, Loader2, RotateCcw, Send } from "lucide-react";
import { Card, Chip, EmptyState, Progress, SectionTitle } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type {
  AllocationMode,
  AttemptQuestion,
  PaperType,
  PhysicsAllocation,
  PhysicsPaper,
  QuestionFormat,
  StudentQuestion,
  ThinkingLevel,
} from "@/lib/domain/physics";
import {
  ALLOCATION_MODES,
  ALLOCATION_MODE_BLURB,
  ALLOCATION_MODE_LABEL,
  LEVEL_BLURB,
  LEVEL_LABEL,
  PAPER_CANON,
  PAPER_DEFAULT_QUESTIONS,
  PAPER_MAX_QUESTIONS,
  PAPER_MIN_QUESTIONS,
  PAPER_TYPES,
  THINKING_LEVELS,
  pct,
  scoreTone,
} from "@/lib/domain/physics";
import { QuestionCard, type SchemeRow } from "./question-card";

export interface TopicCoverage {
  topic: string;
  total: number;
  byLevel: Record<ThinkingLevel, number>;
  authored: number;
  pastpaper: number;
}

export interface PastPaperOption {
  code: string;
  paperType: PaperType;
  questions: number;
  marks: number;
  figureDependent: number;
}

interface BuildResponse {
  paper?: PhysicsPaper;
  questions?: StudentQuestion[];
  scheme?: SchemeRow[];
  short?: boolean;
  error?: string;
}

interface MarkResponse {
  result?: { awarded: number; total: number; percent: number; perQuestion: AttemptQuestion[] };
  error?: string;
}

interface AllocateResponse {
  allocation?: PhysicsAllocation;
  error?: string;
}

interface BuiltPaper {
  paper: PhysicsPaper;
  questions: StudentQuestion[];
  scheme: Record<string, SchemeRow>;
  short: boolean;
}

type BuildMode = "drill" | "paper";

const FORMAT_OPTIONS: { value: QuestionFormat | "mixed"; label: string }[] = [
  { value: "mixed", label: "Mixed" },
  { value: "mcq", label: "Multiple choice" },
  { value: "structured", label: "Structured" },
];

const SOURCE_OPTIONS: { value: "any" | "authored" | "pastpaper"; label: string }[] = [
  { value: "any", label: "Both banks" },
  { value: "authored", label: "Department authored" },
  { value: "pastpaper", label: "Cambridge past papers" },
];

const PAST_PAPER_LIMIT = 40;

function ToggleChip({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      className={cn("rounded-full px-2.5 py-1 text-2xs font-semibold transition-colors", active ? "bg-accent text-white" : "bg-surface-2 text-ink-2 hover:bg-surface-3")}
    >
      {children}
    </button>
  );
}

function ScoreBar({ label, awarded, total }: { label: string; awarded: number; total: number }) {
  const value = pct(awarded, total);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="truncate text-xs text-ink-2">{label}</span>
        <span className="num shrink-0 text-xs font-medium text-ink">
          {awarded}/{total}
        </span>
      </div>
      <Progress value={value} tone={scoreTone(value)} />
    </div>
  );
}

export function ExamLab({
  topics,
  coverage,
  pastPapers,
  className,
  classSize,
  aiLive,
}: {
  topics: string[];
  coverage: TopicCoverage[];
  pastPapers: PastPaperOption[];
  className: string;
  classSize: number;
  aiLive: boolean;
}) {
  const [buildMode, setBuildMode] = useState<BuildMode>("drill");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [levels, setLevels] = useState<ThinkingLevel[]>([...THINKING_LEVELS]);
  const [format, setFormat] = useState<QuestionFormat | "mixed">("mixed");
  const [paperType, setPaperType] = useState<PaperType | "any">("any");
  const [source, setSource] = useState<"any" | "authored" | "pastpaper">("any");
  const [includeFigureQuestions, setIncludeFigureQuestions] = useState(false);
  const [count, setCount] = useState(PAPER_DEFAULT_QUESTIONS);
  const [topUp, setTopUp] = useState(false);
  const [code, setCode] = useState(pastPapers[0]?.code ?? "");

  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [built, setBuilt] = useState<BuiltPaper | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [showScheme, setShowScheme] = useState(false);
  const [marking, setMarking] = useState(false);
  const [result, setResult] = useState<MarkResponse["result"] | null>(null);

  const [allocMode, setAllocMode] = useState<AllocationMode>("assignment_help");
  const [allocInstructions, setAllocInstructions] = useState("");
  const [allocDue, setAllocDue] = useState("");
  const [allocating, setAllocating] = useState(false);
  const [allocated, setAllocated] = useState<PhysicsAllocation | null>(null);

  const available = useMemo(() => {
    const rows = selectedTopics.length ? coverage.filter((c) => selectedTopics.includes(c.topic)) : coverage;
    return rows.reduce((sum, row) => {
      const byLevel = levels.reduce((inner, level) => inner + row.byLevel[level], 0);
      if (source === "authored") return sum + Math.min(byLevel, row.authored);
      if (source === "pastpaper") return sum + Math.min(byLevel, row.pastpaper);
      return sum + byLevel;
    }, 0);
  }, [coverage, selectedTopics, levels, source]);

  const toggleTopic = (topic: string) => setSelectedTopics((t) => (t.includes(topic) ? t.filter((x) => x !== topic) : [...t, topic]));
  const toggleLevel = (level: ThinkingLevel) => setLevels((l) => (l.includes(level) ? l.filter((x) => x !== level) : [...l, level]));

  const resetSitting = () => {
    setResponses({});
    setResult(null);
    setShowScheme(false);
    setAllocated(null);
  };

  const build = async () => {
    if (building || (buildMode === "drill" && !levels.length)) return;
    setBuilding(true);
    setError(null);
    resetSitting();
    try {
      const body =
        buildMode === "paper"
          ? { mode: "paper", code, includeFigureQuestions }
          : { mode: "drill", topics: selectedTopics, levels, format, paperType, source, includeFigureQuestions, count, topUp };
      const res = await fetch("/api/physics/exam", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const out = (await res.json().catch(() => ({}))) as BuildResponse;
      if (!res.ok || !out.paper || !out.questions) {
        setError(out.error ?? "Could not build a paper from that selection.");
        return;
      }
      setBuilt({
        paper: out.paper,
        questions: out.questions,
        scheme: Object.fromEntries((out.scheme ?? []).map((row) => [row.id, row])),
        short: out.short === true,
      });
    } catch {
      setError("Could not reach the Exam Lab. Check your connection and try again.");
    } finally {
      setBuilding(false);
    }
  };

  const mark = async () => {
    if (!built || marking) return;
    setMarking(true);
    setError(null);
    try {
      const res = await fetch("/api/physics/exam/mark", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paperId: built.paper.id, responses }),
      });
      const out = (await res.json().catch(() => ({}))) as MarkResponse;
      if (!res.ok || !out.result) {
        setError(out.error ?? "Could not mark that attempt.");
        return;
      }
      setResult(out.result);
      setShowScheme(true);
    } catch {
      setError("Could not reach the marker. Check your connection and try again.");
    } finally {
      setMarking(false);
    }
  };

  const allocate = async () => {
    if (!built || allocating) return;
    setAllocating(true);
    setError(null);
    try {
      const res = await fetch("/api/physics/allocate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paperId: built.paper.id, mode: allocMode, instructions: allocInstructions, dueAt: allocDue || null }),
      });
      const out = (await res.json().catch(() => ({}))) as AllocateResponse;
      if (!res.ok || !out.allocation) {
        setError(out.error ?? "Could not set that paper.");
        return;
      }
      setAllocated(out.allocation);
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setAllocating(false);
    }
  };

  const markedFor = (questionId: string) => result?.perQuestion.find((m) => m.id === questionId);
  const byTopic = useMemo(() => {
    if (!result || !built) return [];
    const map = new Map<string, { awarded: number; total: number }>();
    for (const m of result.perQuestion) {
      const row = map.get(m.topic) ?? { awarded: 0, total: 0 };
      map.set(m.topic, { awarded: row.awarded + (m.earned ?? 0), total: row.total + m.marks });
    }
    return [...map.entries()].map(([topic, v]) => ({ topic, ...v }));
  }, [result, built]);

  const byLevel = useMemo(() => {
    if (!result) return [];
    return THINKING_LEVELS.map((level) => {
      const rows = result.perQuestion.filter((m) => m.level === level);
      return { level, awarded: rows.reduce((s, m) => s + (m.earned ?? 0), 0), total: rows.reduce((s, m) => s + m.marks, 0) };
    }).filter((row) => row.total > 0);
  }, [result]);

  return (
    <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
      {/* ---------------- Builder ---------------- */}
      <div className="lg:col-span-2">
        <Card className="space-y-4">
          <div className="flex rounded-xl bg-surface-2 p-1">
            {(["drill", "paper"] as BuildMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setBuildMode(m)}
                aria-pressed={buildMode === m}
                className={cn("flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors", buildMode === m ? "bg-surface text-ink shadow-sm" : "text-ink-3 hover:text-ink")}
              >
                {m === "drill" ? "Build a drill" : "Real past paper"}
              </button>
            ))}
          </div>

          {buildMode === "paper" ? (
            <>
              <div>
                <label htmlFor="paper-code" className="mb-1.5 block text-xs font-semibold text-ink">
                  Cambridge paper
                </label>
                <select id="paper-code" value={code} onChange={(e) => setCode(e.target.value)} className="input">
                  {pastPapers.slice(0, PAST_PAPER_LIMIT).map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code} · {PAPER_CANON[p.paperType].short} · {p.questions} questions
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-2xs leading-5 text-ink-3">
                  {pastPapers.length} papers in the bank, text-extracted and classified by strand and thinking level.
                </p>
              </div>
              {pastPapers.find((p) => p.code === code)?.figureDependent ? (
                <p className="text-2xs leading-5 text-warn">
                  {pastPapers.find((p) => p.code === code)?.figureDependent} question(s) in this paper refer to a diagram the portal does not hold, and are left out unless you include them below.
                </p>
              ) : null}
            </>
          ) : (
            <>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-ink">Strands</p>
                <div className="flex flex-wrap gap-1.5">
                  <ToggleChip active={!selectedTopics.length} onClick={() => setSelectedTopics([])}>
                    Whole syllabus
                  </ToggleChip>
                  {topics.map((t) => (
                    <ToggleChip key={t} active={selectedTopics.includes(t)} onClick={() => toggleTopic(t)} title={t}>
                      {t}
                    </ToggleChip>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-semibold text-ink">Thinking level</p>
                <div className="grid gap-2">
                  {THINKING_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => toggleLevel(level)}
                      aria-pressed={levels.includes(level)}
                      className={cn(
                        "rounded-xl border px-3.5 py-2 text-left transition-colors",
                        levels.includes(level) ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-surface-2",
                      )}
                    >
                      <span className={cn("block text-sm font-medium", levels.includes(level) ? "text-accent" : "text-ink")}>
                        {level} · {LEVEL_LABEL[level]}
                      </span>
                      <span className="mt-0.5 block text-2xs leading-4 text-ink-3">{LEVEL_BLURB[level]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="exam-format" className="mb-1.5 block text-xs font-semibold text-ink">
                    Format
                  </label>
                  <select id="exam-format" value={format} onChange={(e) => setFormat(e.target.value as QuestionFormat | "mixed")} className="input">
                    {FORMAT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="exam-paper" className="mb-1.5 block text-xs font-semibold text-ink">
                    Paper
                  </label>
                  <select id="exam-paper" value={paperType} onChange={(e) => setPaperType(e.target.value as PaperType | "any")} className="input">
                    <option value="any">Any</option>
                    {PAPER_TYPES.map((p) => (
                      <option key={p} value={p}>
                        {p} · {PAPER_CANON[p].short}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="exam-source" className="mb-1.5 block text-xs font-semibold text-ink">
                    Bank
                  </label>
                  <select id="exam-source" value={source} onChange={(e) => setSource(e.target.value as "any" | "authored" | "pastpaper")} className="input">
                    {SOURCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="exam-count" className="mb-1.5 block text-xs font-semibold text-ink">
                    Questions
                  </label>
                  <input
                    id="exam-count"
                    type="number"
                    min={PAPER_MIN_QUESTIONS}
                    max={PAPER_MAX_QUESTIONS}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="input num"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 text-xs leading-5 text-ink-2">
                <input type="checkbox" checked={topUp} onChange={(e) => setTopUp(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-line-strong accent-accent" />
                <span>
                  Let the studio write extra questions when the banks run short
                  {aiLive ? "" : " (no model is configured, so the paper will simply be shorter)"}.
                </span>
              </label>
            </>
          )}

          <label className="flex items-start gap-2 text-xs leading-5 text-ink-2">
            <input
              type="checkbox"
              checked={includeFigureQuestions}
              onChange={(e) => setIncludeFigureQuestions(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-line-strong accent-accent"
            />
            <span>Include questions that refer to a diagram the portal does not hold. They will read incompletely.</span>
          </label>

          <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
            {buildMode === "drill" ? (
              <p className="text-2xs text-ink-3">
                <span className="num font-semibold text-ink">{available}</span> banked question{available === 1 ? "" : "s"} match this
              </p>
            ) : (
              <p className="text-2xs text-ink-3">Exact Cambridge order and marks</p>
            )}
            <button type="button" onClick={build} disabled={building || (buildMode === "drill" && !levels.length)} className="btn-primary btn-sm shrink-0">
              {building ? <Loader2 size={13} className="animate-spin" /> : <FlaskConical size={13} />}
              Build paper
            </button>
          </div>
        </Card>
      </div>

      {/* ---------------- Paper ---------------- */}
      <div className="space-y-4 lg:col-span-3">
        {error ? <div className="rounded-xl border border-danger/30 bg-danger-soft/50 px-4 py-3 text-sm text-danger">{error}</div> : null}

        {!built ? (
          <EmptyState
            title="No paper built yet"
            body="Build a drill from the tagged banks, or reproduce a real Cambridge paper question for question. Either way you can answer it here and see exactly what the class will get back."
          />
        ) : (
          <>
            <Card className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{built.paper.title}</p>
                  <p className="num mt-0.5 text-2xs text-ink-3">
                    {built.questions.length} questions · {built.paper.totalMarks} marks · {built.paper.durationMin} min
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  {built.paper.mode === "paper" ? <Chip tone="accent">Exact past paper</Chip> : <Chip tone="info">Drill</Chip>}
                  {built.paper.briefingLive ? <Chip tone="info">Briefing written live</Chip> : <Chip tone="neutral">Briefing scripted</Chip>}
                  {built.paper.aiAssembled ? <Chip tone="warn">Includes AI-written questions</Chip> : <Chip tone="ok">All from the banks</Chip>}
                </div>
              </div>

              <div className="rounded-xl bg-surface-2 p-3.5">
                <p className="eyebrow mb-1.5">Examiner&apos;s briefing</p>
                {built.paper.briefing.split("\n").map((line, i) => (
                  <p key={i} className={cn("text-xs leading-6", line.startsWith("-") ? "text-ink-2" : "text-ink")}>
                    {line}
                  </p>
                ))}
              </div>

              {built.short ? (
                <p className="text-2xs leading-5 text-warn">
                  The banks could not fill the whole request, so this paper is shorter than you asked for. Widen the strands, the levels or the format.
                </p>
              ) : null}
              {built.paper.aiAssembled ? (
                <p className="text-2xs leading-5 text-warn">
                  Questions badged AI-written were drafted by the model, not by the department and not by Cambridge. Read them and their mark schemes before
                  you set this paper.
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
                <button type="button" onClick={() => setShowScheme((s) => !s)} className="btn-outline btn-sm">
                  {showScheme ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showScheme ? "Hide mark scheme" : "Show mark scheme"}
                </button>
                <button type="button" onClick={mark} disabled={marking} className="btn-soft btn-sm">
                  {marking ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
                  Mark this attempt
                </button>
                {result ? (
                  <button type="button" onClick={resetSitting} className="btn-ghost btn-sm">
                    <RotateCcw size={13} /> Clear answers
                  </button>
                ) : null}
              </div>
            </Card>

            {result ? (
              <Card className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="eyebrow">Marked instantly</p>
                    <p className="num text-2xl font-semibold leading-none text-ink">
                      {result.awarded}
                      <span className="text-base text-ink-3"> / {result.total}</span>
                    </p>
                  </div>
                  <Chip tone={scoreTone(result.percent)}>{result.percent}%</Chip>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2.5">
                    <p className="text-xs font-semibold text-ink">By strand</p>
                    {byTopic.map((row) => (
                      <ScoreBar key={row.topic} label={row.topic} awarded={row.awarded} total={row.total} />
                    ))}
                  </div>
                  <div className="space-y-2.5">
                    <p className="text-xs font-semibold text-ink">By thinking level</p>
                    {byLevel.map((row) => (
                      <ScoreBar key={row.level} label={`${row.level} · ${LEVEL_LABEL[row.level]}`} awarded={row.awarded} total={row.total} />
                    ))}
                  </div>
                </div>
              </Card>
            ) : null}

            {/* ---------------- Set for the class ---------------- */}
            <Card className="space-y-3">
              <SectionTitle title="Set for the class" hint={`${className} · ${classSize} students`} />
              {allocated ? (
                <div className="rounded-xl border border-ok/30 bg-ok-soft/50 p-3.5">
                  <p className="text-sm font-medium text-ink">Set as {ALLOCATION_MODE_LABEL[allocated.mode].toLowerCase()}.</p>
                  <p className="mt-1 text-xs leading-5 text-ink-2">
                    {allocated.studentIds.length} students can now see &ldquo;{allocated.title}&rdquo; under their Physics assignments
                    {allocated.dueAt ? `, due ${allocated.dueAt}` : ""}.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-2">
                    {ALLOCATION_MODES.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setAllocMode(m)}
                        aria-pressed={allocMode === m}
                        className={cn(
                          "rounded-xl border px-3.5 py-2 text-left transition-colors",
                          allocMode === m ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-surface-2",
                        )}
                      >
                        <span className={cn("block text-sm font-medium", allocMode === m ? "text-accent" : "text-ink")}>{ALLOCATION_MODE_LABEL[m]}</span>
                        <span className="mt-0.5 block text-2xs leading-4 text-ink-3">{ALLOCATION_MODE_BLURB[m]}</span>
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="alloc-due" className="mb-1.5 block text-xs font-semibold text-ink">
                        Due
                      </label>
                      <input id="alloc-due" type="date" value={allocDue} onChange={(e) => setAllocDue(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label htmlFor="alloc-note" className="mb-1.5 block text-xs font-semibold text-ink">
                        Instructions
                      </label>
                      <input id="alloc-note" value={allocInstructions} onChange={(e) => setAllocInstructions(e.target.value)} placeholder="Optional" className="input" />
                    </div>
                  </div>
                  <button type="button" onClick={allocate} disabled={allocating} className="btn-primary btn-sm self-start">
                    {allocating ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Set for {classSize} students
                  </button>
                </>
              )}
            </Card>

            <div className="space-y-4">
              <SectionTitle title="The paper" hint="Answer it yourself to see exactly what the class will get back." />
              {built.questions.map((q, index) => (
                <QuestionCard
                  key={q.id}
                  index={index}
                  question={q}
                  scheme={built.scheme[q.id]}
                  showScheme={showScheme}
                  marked={markedFor(q.id)}
                  response={responses[q.id] ?? ""}
                  onRespond={(value) => setResponses((r) => ({ ...r, [q.id]: value }))}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
