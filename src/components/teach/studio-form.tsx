"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookPlus, Sparkles } from "lucide-react";
import { QUESTION_TYPE } from "@/components/assess/labels";
import { AiPill, Chip, SectionTitle } from "@/components/ui/primitives";
import type { Difficulty, QuestionType } from "@/lib/domain/assessment";

const API = "/api/ai/studio";
const MCQ_OPTIONS = 4;
const TYPES: QuestionType[] = ["mcq", "numeric", "short", "structured"];
const DIFFICULTIES: Difficulty[] = ["core", "extended"];

export interface StudioTopic {
  code: string;
  title: string;
}

export interface BankQuestion {
  id: string;
  topicCode: string;
  type: QuestionType;
  stem: string;
  marks: number;
  difficulty: Difficulty;
}

interface Draft {
  stem: string;
  options?: string[];
  answer: string;
  markScheme: string[];
  marks: number;
  live: boolean;
}

interface DraftOut {
  draft?: Draft;
  error?: string;
}

/** Draft one question with the studio, edit it, then send it to the subject's bank. */
export function StudioForm({ spaceId, topics, bank }: { spaceId: string; topics: StudioTopic[]; bank: BankQuestion[] }) {
  const router = useRouter();
  const [topicCode, setTopicCode] = useState(topics[0]?.code ?? "");
  const [type, setType] = useState<QuestionType>("structured");
  const [difficulty, setDifficulty] = useState<Difficulty>("core");
  const [brief, setBrief] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<"draft" | "add" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const inTopic = bank.filter((q) => q.topicCode === topicCode);
  const isMcq = type === "mcq";

  const patch = (next: Partial<Draft>) => setDraft((prev) => (prev ? { ...prev, ...next } : prev));

  /** A draft belongs to the settings it was made under, so changing them clears it. */
  const reset = () => {
    setDraft(null);
    setAdded(null);
  };

  const makeDraft = async () => {
    setBusy("draft");
    setError(null);
    setAdded(null);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ spaceId, topicCode, type, difficulty, brief: brief.trim() }),
      });
      const out = (await res.json().catch(() => ({}))) as DraftOut;
      if (!res.ok || !out.draft) {
        setError(out.error ?? "Could not draft a question.");
        return;
      }
      setDraft(out.draft);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  };

  const addToBank = async () => {
    if (!draft) return;
    setBusy("add");
    setError(null);
    try {
      const res = await fetch(API, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ spaceId, topicCode, type, difficulty, stem: draft.stem, options: draft.options, answer: draft.answer, markScheme: draft.markScheme, marks: draft.marks }),
      });
      const out = (await res.json().catch(() => ({}))) as { question?: { id: string }; error?: string };
      if (!res.ok || !out.question) {
        setError(out.error ?? "Could not add the question.");
        return;
      }
      setAdded("Added to the bank. It can be picked up by the test builder now.");
      setDraft(null);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <form
        className="card space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy && topicCode) void makeDraft();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="studio-topic">Topic</label>
            <select id="studio-topic" className="input" value={topicCode} onChange={(e) => { setTopicCode(e.target.value); reset(); }}>
              {topics.map((t) => (
                <option key={t.code} value={t.code}>{t.code} · {t.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="studio-type">Type</label>
            <select id="studio-type" className="input" value={type} onChange={(e) => { setType(e.target.value as QuestionType); reset(); }}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{QUESTION_TYPE[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="studio-difficulty">Difficulty</label>
            <select id="studio-difficulty" className="input" value={difficulty} onChange={(e) => { setDifficulty(e.target.value as Difficulty); reset(); }}>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d === "core" ? "Core" : "Extended"}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="studio-brief">Brief (optional)</label>
          <textarea
            id="studio-brief"
            className="input min-h-20"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Anything the question must include: a context, a misconception to probe, the numbers to use."
            maxLength={600}
          />
          <p className="help">Without a key the studio still drafts, from a deterministic template you can edit.</p>
        </div>

        {error ? <p className="chip-danger">{error}</p> : null}
        {added ? <p className="chip-ok">{added}</p> : null}

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={busy !== null || !topicCode}>
            <Sparkles size={14} /> {busy === "draft" ? "Drafting" : "Draft"}
          </button>
        </div>
      </form>

      {draft ? (
        <section className="card space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionTitle title="Draft" hint="Edit anything before it joins the bank." />
            <AiPill live={draft.live} />
          </div>

          <div>
            <label className="label" htmlFor="studio-stem">Stem</label>
            <textarea id="studio-stem" className="input min-h-24" value={draft.stem} onChange={(e) => patch({ stem: e.target.value })} maxLength={1000} />
          </div>

          {isMcq && draft.options ? (
            <div className="space-y-2">
              <p className="label">Options · pick the correct one</p>
              {draft.options.slice(0, MCQ_OPTIONS).map((opt, i) => (
                <label key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="studio-answer"
                    checked={Number(draft.answer) === i}
                    onChange={() => patch({ answer: String(i) })}
                    aria-label={`Option ${i + 1} is correct`}
                  />
                  <input
                    className="input py-2 text-sm"
                    value={opt}
                    aria-label={`Option ${i + 1}`}
                    maxLength={300}
                    onChange={(e) => patch({ options: draft.options?.map((o, j) => (j === i ? e.target.value : o)) })}
                  />
                </label>
              ))}
            </div>
          ) : (
            <div>
              <label className="label" htmlFor="studio-answer">Model answer</label>
              <textarea id="studio-answer" className="input min-h-20" value={draft.answer} onChange={(e) => patch({ answer: e.target.value })} maxLength={300} />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <div>
              <label className="label" htmlFor="studio-scheme">Mark scheme · one mark point per line</label>
              <textarea
                id="studio-scheme"
                className="input min-h-28"
                value={draft.markScheme.join("\n")}
                onChange={(e) => patch({ markScheme: e.target.value.split(/\r?\n/) })}
                onBlur={(e) => patch({ markScheme: e.target.value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean) })}
              />
            </div>
            <div>
              <label className="label" htmlFor="studio-marks">Marks</label>
              <input id="studio-marks" className="input num" type="number" min={1} max={10} value={draft.marks} onChange={(e) => patch({ marks: Number(e.target.value) })} />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setDraft(null)} disabled={busy !== null}>Discard</button>
            <button type="button" className="btn-primary" onClick={() => void addToBank()} disabled={busy !== null}>
              <BookPlus size={14} /> {busy === "add" ? "Adding" : "Add to bank"}
            </button>
          </div>
        </section>
      ) : null}

      <section>
        <SectionTitle title="Already in the bank" hint={`${inTopic.length} question${inTopic.length === 1 ? "" : "s"} for ${topicCode} in this subject.`} />
        {inTopic.length ? (
          <div className="card divide-y divide-line">
            {inTopic.map((q) => (
              <div key={q.id} className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{q.stem}</p>
                  <p className="mt-0.5 text-xs text-ink-3">{QUESTION_TYPE[q.type]} · {q.difficulty === "core" ? "Core" : "Extended"}</p>
                </div>
                <Chip tone="neutral">
                  <span className="num">{q.marks}</span> mark{q.marks === 1 ? "" : "s"}
                </Chip>
              </div>
            ))}
          </div>
        ) : (
          <p className="card-quiet px-4 py-3 text-xs text-ink-3">Nothing in the bank for this topic yet.</p>
        )}
      </section>
    </div>
  );
}
