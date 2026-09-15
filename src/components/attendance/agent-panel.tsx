"use client";

/**
 * Marking by note. The teacher writes what happened in the period, the agent
 * proposes a change set, and nothing reaches the register until the teacher
 * confirms it.
 *
 * Three rules hold this together and are all visible on screen:
 *   - the proposal is a diff, showing each child's current mark and the new one;
 *   - a name the agent could not pin to exactly one child becomes a question,
 *     never a mark, and the students behind it are left alone until answered;
 *   - unticking a line removes it, and the server applies its own stored copy,
 *     so the browser can only ever subtract from what the agent proposed.
 */
import { useState } from "react";
import { AlertTriangle, ArrowRight, Check, HelpCircle, Sparkles, Trash2 } from "lucide-react";
import { AiPill, Chip, SectionTitle } from "@/components/ui/primitives";
import type { RegisterProposal, RegisterRowState } from "@/lib/data/attendance-register";
import { ATTENDANCE_LABEL } from "@/lib/domain/attendance";
import { cn } from "@/lib/utils";
import { StatusCode } from "./status-codes";

const API = "/api/attendance/agent";
const MESSAGE_MAX_CHARS = 1500;
const NETWORK_ERROR = "Could not reach the server.";

const EXAMPLES = [
  "Everyone present except Umar and Hamza",
  "Ali Raza late, Owais bunked last period, rest present",
  "Absent: Ahmed Hassan, Zaid. Late: Bilal",
];

const SOURCE_LABEL: Record<RegisterProposal["source"], string> = {
  groq: "Read by the agent",
  local: "Read by local name matching",
};

interface Reply {
  proposal?: RegisterProposal | null;
  rows?: RegisterRowState[];
  applied?: { studentId: string; studentName: string }[];
  summary?: string;
  error?: string;
}

async function call(body: unknown): Promise<{ ok: boolean; json: Reply }> {
  try {
    const res = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const json = (await res.json().catch(() => ({}))) as Reply;
    return { ok: res.ok, json: res.ok ? json : { error: json.error ?? "Something went wrong." } };
  } catch {
    return { ok: false, json: { error: NETWORK_ERROR } };
  }
}

export function AgentPanel({
  lessonId,
  roster,
  live,
  disabled,
  onApplied,
}: {
  lessonId: string;
  roster: { studentId: string; name: string }[];
  live: boolean;
  disabled: boolean;
  onApplied: (rows: RegisterRowState[]) => void;
}) {
  const [message, setMessage] = useState("");
  const [proposal, setProposal] = useState<RegisterProposal | null>(null);
  const [dropped, setDropped] = useState<string[]>([]);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setProposal(null);
    setDropped([]);
    setPicked({});
  };

  const run = async (body: object) => {
    setBusy(true);
    setError(null);
    const { ok, json } = await call({ lessonId, ...body });
    if (!ok) setError(json.error ?? "Something went wrong.");
    else if (json.rows) {
      onApplied(json.rows);
      setSummary(json.summary ?? null);
      reset();
      setMessage("");
    } else {
      setProposal(json.proposal ?? null);
      setDropped([]);
      setSummary(null);
    }
    setBusy(false);
  };

  const keeping = proposal ? proposal.changes.filter((c) => !dropped.includes(c.studentId)) : [];

  return (
    <section className="card space-y-4 p-4 sm:p-5">
      <SectionTitle
        title="Mark by note"
        hint="Describe the period in your own words. The agent proposes the marks; you confirm before anything is written."
        action={<AiPill live={live} />}
      />

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy && message.trim()) void run({ message });
        }}
      >
        <textarea
          className="input min-h-20 resize-y"
          aria-label="What happened in this period"
          placeholder="Everyone present except Umar and Hamza"
          maxLength={MESSAGE_MAX_CHARS}
          value={message}
          disabled={disabled || busy}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className="btn-primary btn-sm" disabled={disabled || busy || !message.trim()}>
            <Sparkles size={14} /> {busy ? "Reading…" : "Propose marks"}
          </button>
          {EXAMPLES.map((example) => (
            <button key={example} type="button" className="btn-outline btn-sm" disabled={disabled || busy} onClick={() => setMessage(example)}>
              {example}
            </button>
          ))}
        </div>
      </form>

      {error ? <p className="chip-danger">{error}</p> : null}
      {summary ? (
        <p className="flex items-start gap-2 text-xs text-ink-2">
          <Check size={14} className="mt-0.5 shrink-0 text-ok" />
          {summary}
        </p>
      ) : null}

      {proposal ? (
        <div className="space-y-4" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={proposal.source === "groq" ? "accent" : "neutral"}>{SOURCE_LABEL[proposal.source]}</Chip>
            <p className="text-xs text-ink-2">{proposal.headline}</p>
          </div>

          {proposal.questions.length ? (
            <ul className="space-y-2">
              {proposal.questions.map((question) => {
                const options = question.candidates.length ? question.candidates : roster;
                return (
                  <li key={question.id} className="rounded-xl border border-warn/40 bg-warn-soft/50 p-3">
                    <p className="flex items-start gap-2 text-xs font-medium text-ink">
                      <HelpCircle size={14} className="mt-0.5 shrink-0 text-warn" />
                      {question.question}
                    </p>
                    <div className="mt-2 flex flex-col gap-2 pl-6 sm:flex-row sm:items-center">
                      <select
                        className="input py-2 text-xs"
                        aria-label={`Student meant by ${question.query}`}
                        value={picked[question.id] ?? ""}
                        disabled={busy}
                        onChange={(e) => setPicked((prev) => ({ ...prev, [question.id]: e.target.value }))}
                      >
                        <option value="">Choose a student…</option>
                        {options.map((option) => (
                          <option key={option.studentId} value={option.studentId}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn-soft btn-sm shrink-0"
                        disabled={busy || !picked[question.id]}
                        onClick={() => void run({ proposalId: proposal.id, answers: [{ questionId: question.id, studentId: picked[question.id] }] })}
                      >
                        Mark {ATTENDANCE_LABEL[question.status].toLowerCase()}
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-sm shrink-0"
                        disabled={busy}
                        onClick={() => void run({ proposalId: proposal.id, answers: [{ questionId: question.id, studentId: null }] })}
                      >
                        Not a name
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {proposal.changes.length ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-8">Apply</th>
                    <th>Student</th>
                    <th>Change</th>
                    <th>From your note</th>
                  </tr>
                </thead>
                <tbody>
                  {proposal.changes.map((change) => {
                    const keep = !dropped.includes(change.studentId);
                    return (
                      <tr key={change.studentId} className={cn(!keep && "opacity-45")}>
                        <td>
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-accent"
                            aria-label={`Apply the change for ${change.studentName}`}
                            checked={keep}
                            disabled={busy}
                            onChange={() => setDropped((prev) => (keep ? [...prev, change.studentId] : prev.filter((id) => id !== change.studentId)))}
                          />
                        </td>
                        <td className="whitespace-nowrap font-medium">{change.studentName}</td>
                        <td>
                          <span className="flex items-center gap-1.5">
                            <StatusCode status={change.from} />
                            <ArrowRight size={12} className="text-ink-3" />
                            <StatusCode status={change.to} />
                            <span className="text-xs text-ink-2">{ATTENDANCE_LABEL[change.to]}</span>
                          </span>
                          {change.warning ? (
                            <span className="mt-1 flex items-start gap-1 text-2xs text-warn">
                              <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                              {change.warning}
                            </span>
                          ) : null}
                        </td>
                        <td className="text-xs text-ink-3">{change.note ? `${change.evidence} · ${change.note}` : change.evidence}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="card-quiet px-3 py-2 text-xs text-ink-3">Nothing in that note changes a mark. The register already says this.</p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-2xs text-ink-3">
              {proposal.questions.length
                ? `${proposal.questions.length} unanswered question${proposal.questions.length === 1 ? "" : "s"} — those students stay as they are.`
                : "Every name in your note matched one student on this register."}
            </p>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={() => void run({ proposalId: proposal.id, discard: true })}>
                <Trash2 size={14} /> Discard
              </button>
              <button
                type="button"
                className="btn-primary btn-sm"
                disabled={busy || !keeping.length}
                onClick={() => void run({ proposalId: proposal.id, confirmed: true, skip: dropped })}
              >
                <Check size={14} /> Apply {keeping.length} change{keeping.length === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
