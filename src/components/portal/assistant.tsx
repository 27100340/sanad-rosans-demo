"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, X, ArrowUpRight } from "lucide-react";
import Link from "next/link";
interface Answer {
  reply: string;
  mode: string;
  tool?: string;
  links?: { href: string; label: string }[];
  proposal?: { tool: string; classes: { id: string; name: string }[] };
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
  const name =
    role === "finance" || role === "chairman" || role === "principal"
      ? "Operations assistant"
      : role === "ustadh"
        ? "Hifz guide"
        : role === "teacher"
          ? "Teaching assistant"
          : "Sanad guide";
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
      if (j.tool === "create_lesson_draft") router.refresh();
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
                Your seat's navigation & tools
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
              Find a section, check a summary or prepare an action for review.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Show my sections",
                ...(["principal", "chairman", "finance"].includes(role)
                  ? ["Summarise finance"]
                  : role === "teacher"
                    ? ["Create lesson draft"]
                    : []),
              ].map((q) => (
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
                  {answer.tool && ` · ${answer.tool}`}
                </p>
                <p className="text-sm whitespace-pre-wrap">{answer.reply}</p>
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
              maxLength={1000}
              required
              className="input min-w-0 flex-1"
              placeholder="Take me to…"
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
