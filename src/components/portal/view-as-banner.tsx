"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";

function useExit() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const exit = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/view-as", { method: "DELETE" });
      const out = (await res.json().catch(() => ({}))) as { home?: string };
      router.push(out.home ?? "/portal/admin");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };
  return { busy, exit };
}

/**
 * Shown at the top of the page while the owner seat is viewing as somebody,
 * including on a locked seat. The top bar carries the same action so the way
 * back is reachable without scrolling.
 */
export function ViewAsBanner({ label, role }: { label: string; role: string }) {
  const { busy, exit } = useExit();
  return (
    <div className="relative z-30 flex flex-wrap items-center justify-between gap-2 border-b border-gold/40 bg-gold-soft px-4 py-2 text-gold sm:px-8 md:pl-[16.5rem]">
      <p className="flex min-w-0 items-center gap-2 text-xs">
        <Eye size={14} className="shrink-0" />
        <span className="min-w-0">
          Super admin · viewing the portal as <b className="font-semibold">{label}</b> <span className="capitalize opacity-80">({role})</span>. Anything you do is recorded against this person.
        </span>
      </p>
      <button type="button" className="btn-outline btn-sm shrink-0" disabled={busy} onClick={() => void exit()}>
        <X size={13} /> {busy ? "Leaving" : "Return to super admin"}
      </button>
    </div>
  );
}

/** Compact twin for the top bar, so the exit is always on screen. */
export function ExitViewAs({ className }: { className?: string }) {
  const { busy, exit } = useExit();
  return (
    <button type="button" className={cn("btn-gold btn-sm px-2.5", className)} disabled={busy} onClick={() => void exit()} title="Return to the super admin seat" aria-label="Return to the super admin seat">
      <Eye size={14} />
      <span className="hidden sm:inline">{busy ? "Leaving" : "Exit view as"}</span>
    </button>
  );
}
