"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { AnswerPolicy, SyllabusTopic, TutorRules } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const POLICIES: { value: AnswerPolicy; label: string; help: string }[] = [
  { value: "hint-only", label: "Hint only", help: "One question or step at a time; never the final answer." },
  { value: "worked-example", label: "Worked example", help: "Works a similar question fully, then hands back." },
  { value: "full", label: "Full solution", help: "Complete solution with every step explained." },
];

const LANGUAGES: { value: TutorRules["language"]; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ur", label: "Urdu" },
  { value: "both", label: "English and Urdu" },
];

export function RulesForm({ syllabus, rules }: { syllabus: SyllabusTopic[]; rules: TutorRules }) {
  const [draft, setDraft] = useState<TutorRules>(rules);
  const [newRule, setNewRule] = useState("");
  const [saved, setSaved] = useState(false);

  const update = (changes: Partial<TutorRules>) => {
    setSaved(false);
    setDraft((d) => ({ ...d, ...changes }));
  };
  const toggleTopic = (code: string) =>
    update({ allowedTopics: draft.allowedTopics.includes(code) ? draft.allowedTopics.filter((c) => c !== code) : [...draft.allowedTopics, code] });
  const addForbidden = () => {
    const text = newRule.trim();
    if (!text) return;
    update({ forbidden: [...draft.forbidden, text] });
    setNewRule("");
  };

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(true);
      }}
    >
      <section className="card p-5">
        <p className="label">Allowed topics</p>
        <p className="help mb-3 mt-0">Tap to unlock or lock a syllabus strand for the tutor.</p>
        <div className="flex flex-wrap gap-2">
          {syllabus.map((t) => {
            const on = draft.allowedTopics.includes(t.code);
            return (
              <button key={t.code} type="button" onClick={() => toggleTopic(t.code)} className={cn(on ? "chip-accent" : "chip-neutral", "px-3 py-1.5 text-xs")} aria-pressed={on}>
                <span className="num">{t.code}</span>
                <span className="hidden sm:inline"> · {t.title.replace(/^[^:]+:\s*/, "")}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="card p-5">
          <p className="label">Answer policy</p>
          <div className="mt-2 space-y-2">
            {POLICIES.map((p) => (
              <label key={p.value} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors", draft.answerPolicy === p.value ? "border-accent bg-accent-soft/60" : "border-line hover:bg-surface-2")}>
                <input type="radio" name="policy" className="mt-1 accent-accent" checked={draft.answerPolicy === p.value} onChange={() => update({ answerPolicy: p.value })} />
                <span>
                  <span className="block text-sm font-medium text-ink">{p.label}</span>
                  <span className="block text-xs text-ink-3">{p.help}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <div className="card p-5">
            <label className="label" htmlFor="language">
              Language
            </label>
            <select id="language" className="input" value={draft.language} onChange={(e) => update({ language: e.target.value as TutorRules["language"] })}>
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <p className="help">Urdu replies are always in Urdu script.</p>
          </div>
          <div className="card p-5">
            <label className="label" htmlFor="tone">
              Tone
            </label>
            <textarea id="tone" className="input min-h-20" value={draft.tone} onChange={(e) => update({ tone: e.target.value })} />
          </div>
        </div>
      </section>

      <section className="card p-5">
        <p className="label">Forbidden</p>
        <ul className="mt-2 space-y-2">
          {draft.forbidden.map((f, i) => (
            <li key={`${f}-${i}`} className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2 text-sm text-ink">
              <span>{f}</span>
              <button type="button" className="btn-ghost btn-sm px-2" aria-label="Remove rule" onClick={() => update({ forbidden: draft.forbidden.filter((_, j) => j !== i) })}>
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input className="input" placeholder="Add a rule the tutor must never break" value={newRule} onChange={(e) => setNewRule(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addForbidden())} />
          <button type="button" className="btn-outline shrink-0" onClick={addForbidden}>
            <Plus size={14} />
            Add
          </button>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary">
          Save rules
        </button>
        {saved ? <span className="text-sm text-ok">Saved (demo)</span> : null}
      </div>
    </form>
  );
}
