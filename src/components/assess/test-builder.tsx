"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import { Chip, SectionTitle } from "@/components/ui/primitives";
import type { Question, TestMode } from "@/lib/domain/assessment";
import { daysAgoISO } from "@/lib/utils";
import { QUESTION_TYPE, TEST_MODE } from "./labels";

export interface TopicOption {
  code: string;
  title: string;
}

interface Preview {
  questions: Question[];
  maxMarks: number;
}

interface Notice {
  tone: "ok" | "danger";
  text: string;
}

const MODES = Object.keys(TEST_MODE) as TestMode[];
const DEFAULT_CLOSE_DAYS = 7;
const DEFAULT_DURATION_MIN = 25;
const MIN_DURATION_MIN = 5;
const MAX_DURATION_MIN = 180;
const MAX_ATTEMPTS = 3;
const JSON_HEADERS = { "content-type": "application/json" };

function TopicChips({ topics, selected, onToggle }: { topics: TopicOption[]; selected: string[]; onToggle: (code: string) => void }) {
  if (!topics.length) return <p className="text-xs text-ink-3">This space has no syllabus topics yet.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {topics.map((t) => {
        const on = selected.includes(t.code);
        return (
          <button key={t.code} type="button" onClick={() => onToggle(t.code)} className={on ? "chip-accent" : "chip-neutral"} title={t.title}>
            <span className="num">{t.code}</span>
            <span className="hidden sm:inline"> · {t.title}</span>
          </button>
        );
      })}
    </div>
  );
}

function AssemblyPreview({ preview }: { preview: Preview | null }) {
  if (!preview) {
    return (
      <div className="card-quiet flex h-full min-h-32 items-center justify-center p-6 text-center">
        <p className="max-w-xs text-xs text-ink-3">Preview the assembly to see which questions the bank picks for these topics and this mode.</p>
      </div>
    );
  }
  if (!preview.questions.length) {
    return (
      <div className="card-quiet flex h-full min-h-32 items-center justify-center p-6 text-center">
        <p className="max-w-xs text-xs text-ink-3">The bank has no questions for those topics yet. Pick different topics or a different mode.</p>
      </div>
    );
  }
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-ink-2">
          {preview.questions.length} questions
        </p>
        <p className="num text-xs text-ink-3">{preview.maxMarks} marks</p>
      </div>
      <ol className="divide-y divide-line/70">
        {preview.questions.map((q, i) => (
          <li key={q.id} className="flex gap-3 py-2.5">
            <span className="num w-5 shrink-0 text-xs text-ink-3">{i + 1}.</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">{q.stem}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-2xs text-ink-3">
                <Chip tone="neutral">{QUESTION_TYPE[q.type]}</Chip>
                <span className="num">{q.topicCode}</span>
                <span className="num">{q.marks} {q.marks === 1 ? "mark" : "marks"}</span>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function TestBuilder({ spaceId, topics }: { spaceId: string; topics: TopicOption[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<TestMode>("quiz");
  const [topicCodes, setTopicCodes] = useState<string[]>([]);
  const [durationMin, setDurationMin] = useState(DEFAULT_DURATION_MIN);
  const [attemptsAllowed, setAttemptsAllowed] = useState(1);
  const [closesAt, setClosesAt] = useState(daysAgoISO(-DEFAULT_CLOSE_DAYS));
  const [preview, setPreview] = useState<Preview | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const toggleTopic = (code: string) => {
    setTopicCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
    setPreview(null);
  };

  const previewAssembly = () =>
    start(async () => {
      setNotice(null);
      const params = new URLSearchParams({ spaceId, mode });
      for (const code of topicCodes) params.append("topic", code);
      const res = await fetch(`/api/assess/tests?${params.toString()}`);
      const json = (await res.json().catch(() => ({}))) as Partial<Preview> & { error?: string };
      if (!res.ok || !json.questions) {
        setNotice({ tone: "danger", text: json.error ?? "Could not assemble a preview." });
        return;
      }
      setPreview({ questions: json.questions, maxMarks: json.maxMarks ?? 0 });
    });

  const create = () =>
    start(async () => {
      setNotice(null);
      const res = await fetch("/api/assess/tests", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ spaceId, title, mode, topicCodes, durationMin, attemptsAllowed, closesAt }),
      });
      const json = (await res.json().catch(() => ({}))) as { allocated?: number; error?: string };
      if (!res.ok) {
        setNotice({ tone: "danger", text: json.error ?? "Could not create the test." });
        return;
      }
      setNotice({ tone: "ok", text: `Test created and allocated to ${json.allocated ?? 0} students` });
      setTitle("");
      setPreview(null);
      router.refresh();
    });

  return (
    <div className="card p-5">
      <SectionTitle title="Assemble a test" hint="Pick topics; the bank assembles the questions and the whole class is allocated on creation." />
      {notice ? <p className={notice.tone === "ok" ? "chip-ok mb-4" : "chip-danger mb-4"}>{notice.text}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="space-y-3">
          <label className="label">
            Title
            <input className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Topic test: equations and sequences" />
          </label>
          <label className="label">
            Mode
            <select
              className="input mt-1"
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as TestMode);
                setPreview(null);
              }}
            >
              {MODES.map((m) => (
                <option key={m} value={m}>
                  {TEST_MODE[m].label}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className="label">Topics</span>
            <TopicChips topics={topics} selected={topicCodes} onToggle={toggleTopic} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {mode !== "quiz" ? (
              <label className="label">
                Duration (min)
                <input type="number" className="input num mt-1" min={MIN_DURATION_MIN} max={MAX_DURATION_MIN} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} />
              </label>
            ) : null}
            <label className="label">
              Attempts allowed
              <input type="number" className="input num mt-1" min={1} max={MAX_ATTEMPTS} value={attemptsAllowed} onChange={(e) => setAttemptsAllowed(Math.max(1, Math.min(MAX_ATTEMPTS, Number(e.target.value))))} />
            </label>
          </div>
          <label className="label">
            Closes on
            <input type="date" className="input mt-1" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" className="btn-outline" disabled={pending} onClick={previewAssembly}>
              <Sparkles size={14} /> Preview assembly
            </button>
            <button type="button" className="btn-primary" disabled={pending || title.trim().length < 3} onClick={create}>
              <Plus size={14} /> Create and allocate to class
            </button>
          </div>
        </div>
        <AssemblyPreview preview={preview} />
      </div>
    </div>
  );
}
