"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, X, ArrowUpRight } from "lucide-react";
import Link from "next/link";

/**
 * Staff seats only. This mirrors ASSISTANT_ROLES in lib/ai/assistant-agent.ts,
 * which is the server-side gate; that module reads the mock stores, so it
 * cannot be imported into a client component. This copy only hides the button.
 */
const ASSISTANT_ROLES = ["chairman", "principal", "coordinator", "teacher", "ustadh", "finance"];

export function assistantEnabledFor(role: string): boolean {
  return ASSISTANT_ROLES.includes(role);
}

/** Openers that map to a tool this seat actually has. */
const SUGGESTIONS: Record<string, string[]> = {
  chairman: ["Summarise finance", "Who is at risk?", "Marking backlog"],
  // `canFinance` includes the principal, so the finance opener belongs here too:
  // dropping it hid a tool the seat actually has.
  principal: ["Summarise finance", "Who is at risk?", "Urgent parent messages", "Attendance this term"],
  coordinator: ["Today's timetable", "Urgent parent messages", "Attendance this term"],
  finance: ["Summarise finance", "What is still outstanding?"],
  teacher: ["What needs marking?", "Today's timetable", "Create lesson draft"],
  ustadh: ["My appraisal", "Who is at risk?"],
};

const ASSISTANT_NAMES: Record<string, string> = {
  chairman: "Operations assistant",
  principal: "Operations assistant",
  finance: "Operations assistant",
  coordinator: "Section assistant",
  ustadh: "Hifz guide",
  teacher: "Teaching assistant",
};

const DEFAULT_NAME = "Sanad guide";
const MESSAGE_MAX_CHARS = 1000;

interface Answer {
  reply: string;
  mode: string;
  tool?: string;
  links?: { href: string; label: string }[];
  proposal?: { tool: string; classes: { id: string; name: string }[] };
}

/** "finance_summary, navigate" reads as "finance summary · navigate". */
function toolLabel(tool: string): string {
  return tool
    .split(", ")
    .map((name) => name.replace(/_/g, " "))
    .join(" · ");
}

export function SchoolAssistant({
  role,
  personaId,
}: {
  role: string;
  personaId: string;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(false);
  const [classId, setClassId] = useState("");
  const path = usePathname();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setAnswer(null);
    setMessage("");
    setOpen(false);
  }, [personaId]);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  const name = ASSISTANT_NAMES[role] ?? DEFAULT_NAME;
  const openers = [...(SUGGESTIONS[role] ?? []), "Show my sections"];
  async function ask(body: object) {
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setAnswer(j);
      setClassId(j.proposal?.classes[0]?.id ?? "");
      if (j.tool === "create_lesson_draft" && !j.proposal) router.refresh();
    } catch (e) {
      setAnswer({
        reply:
          e instanceof Error
            ? e.message
            : "The assistant is unavailable. Try again.",
        mode: "error",
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-white shadow-lg md:bottom-6"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="sanad-assistant"
      >
        <Sparkles size={18} />
        <span className="text-sm font-semibold">Assistant</span>
      </button>
      {open && (
        <section
          id="sanad-assistant"
          role="dialog"
          aria-label={name}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          className="fixed bottom-36 right-3 z-40 flex max-h-[65dvh] w-[calc(100%-1.5rem)] max-w-sm flex-col rounded-2xl border border-line bg-surface shadow-xl md:bottom-24 md:right-6"
        >
          <header className="flex items-center justify-between border-b border-line p-4">
            <div>
              <h2 className="font-semibold">{name}</h2>
              <p className="text-xs text-ink-3">
                Answers from your seat's own records
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="p-2"
            >
              <X size={18} />
            </button>
          </header>
          <div className="space-y-3 overflow-y-auto p-4">
            <p className="text-sm text-ink-2">
              Ask a question, check a summary, or prepare an action for your
              review. Nothing is written without your confirmation.
            </p>
            <div className="flex flex-wrap gap-2">
              {openers.map((q) => (
                <button
                  key={q}
                  disabled={busy}
                  className="btn-outline btn-sm"
                  onClick={() => {
                    setMessage(q);
                    void ask({ message: q, path });
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
            {answer && (
              <div aria-live="polite" className="space-y-3">
                <p className="text-2xs uppercase text-accent">
                  {answer.mode}
                  {answer.tool && ` · ${toolLabel(answer.tool)}`}
                </p>
                <p className="text-sm whitespace-pre-wrap">{answer.reply}</p>
                {/* The figures come from a model writing prose, so the demo
                    disclaimer cannot live in its wording. Render it here, where
                    it is guaranteed on every answer drawn from seeded records. */}
                {answer.tool && answer.tool !== "navigate" && (
                  <p className="text-2xs text-ink-3">
                    Figures are fictional demonstration records.
                  </p>
                )}
                {answer.links?.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-xl bg-canvas p-3 text-sm text-accent"
                  >
                    {l.label}
                    <ArrowUpRight size={15} />
                  </Link>
                ))}
                {answer.proposal && (
                  <div className="space-y-2">
                    <label className="text-sm block">
                      Class
                      <select
                        className="input mt-1 w-full"
                        value={classId}
                        onChange={(e) => setClassId(e.target.value)}
                      >
                        {answer.proposal.classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      disabled={busy}
                      className="btn-primary btn-sm"
                      onClick={() =>
                        ask({
                          execute: answer.proposal!.tool,
                          confirmed: true,
                          classId,
                        })
                      }
                    >
                      Confirm: create draft
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <form
            className="flex gap-2 border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void ask({ message, path });
            }}
          >
            <input
              ref={input}
              aria-label="Ask your assistant"
              maxLength={MESSAGE_MAX_CHARS}
              required
              className="input min-w-0 flex-1"
              placeholder="Ask about your seat…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button className="btn-primary btn-sm" disabled={busy}>
              {busy ? "Working…" : "Ask"}
            </button>
          </form>
        </section>
      )}
    </>
  );
}
