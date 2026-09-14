"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, UserRound } from "lucide-react";
import { PERSONAS } from "@/lib/auth/personas";
import { cn } from "@/lib/utils";

export function PersonaSwitcher({ currentId, compact = false }: { currentId: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const current = PERSONAS.find((p) => p.id === currentId) ?? PERSONAS[0];

  function choose(id: string) {
    setOpen(false);
    start(async () => {
      const res = await fetch("/api/persona", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
      const json = (await res.json()) as { home: string };
      router.push(json.home);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn("btn-outline gap-2", compact ? "btn-sm" : "", pending && "opacity-60")}
        aria-haspopup="listbox"
        aria-label={`Switch persona: ${current.label}`}
        aria-expanded={open}
      >
        <UserRound size={14} className="text-accent" />
        <span className="hidden max-w-[10rem] truncate sm:inline">{current.label}</span>
        <ChevronDown size={14} className="hidden text-ink-3 sm:block" />
      </button>
      {open ? (
        <>
          <button type="button" aria-label="Close" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
          <ul role="listbox" className="absolute right-0 z-40 mt-2 max-h-[70dvh] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-pop">
            <li className="px-3 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-3">View the school as</li>
            {PERSONAS.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={p.id === current.id}
                  onClick={() => choose(p.id)}
                  className={cn("flex w-full flex-col items-start rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface-2", p.id === current.id && "bg-accent-soft")}
                >
                  <span className="text-sm font-medium text-ink">{p.label}</span>
                  <span className="text-xs text-ink-3">{p.blurb}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
