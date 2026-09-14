"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowRight } from "lucide-react";
import type { Persona } from "@/lib/auth/personas";
import { cn } from "@/lib/utils";

/** Landing-page card that sets the demo persona cookie and enters the portal. */
export function PersonaEntry({ persona, className }: { persona: Persona; className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await fetch("/api/persona", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: persona.id }) });
          router.push(persona.home);
        })
      }
      className={cn("card card-hover group flex w-full flex-col items-start gap-2 p-5 text-left", pending && "opacity-60", className)}
    >
      <span className="chip-accent capitalize">{persona.role}</span>
      <span className="text-base font-semibold text-ink">{persona.label}</span>
      <span className="text-sm text-ink-2">{persona.blurb}</span>
      <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent">
        Enter <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
