"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Starts viewing the portal as `personId` and lands on `href` (or that
 * person's home). The owner seat returns with the banner in the top bar.
 */
export function ViewAsButton({ personId, href, children, variant = "soft", className, title }: { personId: string; href?: string; children: ReactNode; variant?: "primary" | "soft" | "ghost" | "outline"; className?: string; title?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const go = async () => {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/view-as", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ personId }) });
      const out = (await res.json().catch(() => ({}))) as { home?: string };
      if (!res.ok) {
        setError(true);
        return;
      }
      router.push(href ?? out.home ?? "/portal");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const cls = { primary: "btn-primary", soft: "btn-soft", ghost: "btn-ghost", outline: "btn-outline" }[variant];
  return (
    <button type="button" className={cn(cls, "btn-sm", className)} disabled={busy} onClick={() => void go()} title={title}>
      <Eye size={13} /> {busy ? "Opening" : error ? "Try again" : children}
    </button>
  );
}
