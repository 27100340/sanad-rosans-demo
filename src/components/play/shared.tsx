"use client";

/**
 * Shared pieces for the play boards: the picture vocabulary, the tap target,
 * the star row and the per-round progress strip.
 *
 * Every board scores the same way — one point per item, awarded only when the
 * child's first tap on that item is right — so `BoardHandlers` is all a board
 * needs to talk to the runner.
 */
import type { ReactNode } from "react";
import { Bird, Check, Circle, Cloud, Droplet, Fish, Flower2, Heart, Apple, Leaf, Moon, Square, Star, Sun, Triangle, X, type LucideIcon } from "lucide-react";
import { isGlyph, type GlyphKey } from "@/lib/domain/play";
import { cn } from "@/lib/utils";

export interface BoardHandlers {
  /** Called once per item, the first time the child resolves it. */
  onScore: (correct: boolean) => void;
  /** Called when every item in the round is resolved. */
  onFinish: () => void;
}

export interface BoardProps<R> extends BoardHandlers {
  round: R;
  script: "en" | "ur";
}

/** Feedback state of a tap target. */
export type TapState = "idle" | "picked" | "right" | "wrong" | "done";

const ICONS: Record<GlyphKey, LucideIcon> = {
  star: Star,
  leaf: Leaf,
  apple: Apple,
  fish: Fish,
  bird: Bird,
  heart: Heart,
  cloud: Cloud,
  sun: Sun,
  moon: Moon,
  flower: Flower2,
  circle: Circle,
  square: Square,
  triangle: Triangle,
  drop: Droplet,
};

/**
 * A token is a picture where the label names one, and plain text otherwise —
 * which is what lets one pattern board serve both Montessori shapes and
 * Grade 6 number sequences.
 */
export function Token({ label, size = "md", className }: { label: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const box = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-9 w-9" : "h-7 w-7";
  if (isGlyph(label)) {
    const Icon = ICONS[label];
    return <Icon className={cn(box, "shrink-0", className)} aria-label={label} strokeWidth={1.75} />;
  }
  return <span className={cn(size === "lg" ? "text-xl font-semibold" : "text-base font-medium", className)}>{label}</span>;
}

/** Draws `count` copies of a picture for the counting board. */
export function GlyphTray({ glyph, count }: { glyph: GlyphKey; count: number }) {
  const Icon = ICONS[glyph];
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 rounded-2xl bg-accent-soft/60 px-4 py-6 sm:gap-4 sm:py-8">
      {Array.from({ length: count }, (_, i) => (
        <Icon key={i} className="h-9 w-9 text-accent sm:h-12 sm:w-12" strokeWidth={1.5} aria-hidden />
      ))}
      <span className="sr-only">{`${count} ${glyph}`}</span>
    </div>
  );
}

const STATE_CLASS: Record<TapState, string> = {
  idle: "border-line bg-surface text-ink hover:border-accent hover:bg-accent-soft/50",
  picked: "border-accent bg-accent-soft text-accent shadow-ring",
  right: "border-ok bg-ok-soft text-ok",
  wrong: "border-danger bg-danger-soft text-danger",
  done: "border-line bg-surface-2 text-ink-3",
};

/**
 * The one tap target on every board. Large enough for a five-year-old's finger
 * on a tablet, and the same size in both scripts.
 */
export function TapTile({
  state = "idle",
  onClick,
  disabled,
  script = "en",
  children,
  className,
}: {
  state?: TapState;
  onClick?: () => void;
  disabled?: boolean;
  script?: "en" | "ur";
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || state === "done"}
      dir={script === "ur" ? "rtl" : undefined}
      className={cn(
        "flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-center text-sm font-medium",
        "transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.97] disabled:cursor-default",
        "sm:min-h-[4rem] sm:text-base",
        script === "ur" && "urdu text-base leading-loose sm:text-lg",
        state === "right" && "scale-[1.02]",
        STATE_CLASS[state],
        className,
      )}
    >
      {children}
    </button>
  );
}

/** The small right/wrong mark that appears on a resolved tile. */
export function Verdict({ correct }: { correct: boolean }) {
  return correct ? <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} /> : <X className="h-4 w-4 shrink-0" strokeWidth={2.5} />;
}

export function Stars({ count, size = "md" }: { count: number; size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${count} of 3 stars`}>
      {[1, 2, 3].map((n) => (
        <Star key={n} className={cn(box, n <= count ? "fill-gold text-gold" : "text-line-strong")} strokeWidth={1.5} />
      ))}
    </span>
  );
}

/** One dot per item in the round, filled as the child resolves them. */
export function ProgressDots({ total, results }: { total: number; results: boolean[] }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${results.length} of ${total} done`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 w-2 rounded-full transition-colors duration-300",
            i >= results.length ? "bg-surface-3" : results[i] ? "bg-ok" : "bg-warn",
          )}
        />
      ))}
    </div>
  );
}

/** Prompt line above every board. Read aloud by an adult in the early band. */
export function BoardPrompt({ text, script }: { text: string; script: "en" | "ur" }) {
  return (
    <p dir={script === "ur" ? "rtl" : undefined} className={cn("text-base font-medium text-ink sm:text-lg", script === "ur" && "urdu text-lg leading-loose sm:text-xl")}>
      {text}
    </p>
  );
}

/** Fisher-Yates. Called once in a state initialiser, never during render. */
export function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
