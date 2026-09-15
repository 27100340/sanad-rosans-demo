/**
 * One activity on the shelf. Server-rendered: a link, a chip and a quiet note
 * of how often this child has played it.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Chip, type Tone } from "@/components/ui/primitives";
import { STRANDS, type PlayActivity, type PlayKind, type PlayStrand } from "@/lib/domain/play";
import { cn } from "@/lib/utils";

export const STRAND_TONE: Record<PlayStrand, Tone> = {
  literacy: "info",
  numeracy: "accent",
  shapes: "ok",
  islamic: "gold",
  urdu: "neutral",
};

const KIND_LABEL: Record<PlayKind, string> = {
  match: "Match them up",
  sort: "Sort into baskets",
  sequence: "Put them in order",
  count: "Tap the answer",
  pattern: "Find what comes next",
};

export function ActivityCard({ activity, href, plays }: { activity: PlayActivity; href: string; plays: number }) {
  return (
    <Link href={href} className="card card-hover group flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <Chip tone={STRAND_TONE[activity.strand]}>{STRANDS[activity.strand].label}</Chip>
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-ink-3 transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
      <div className="min-w-0 space-y-1">
        <h3 className={cn("text-base font-semibold text-ink", activity.script === "ur" && "urdu text-lg")} dir={activity.script === "ur" ? "rtl" : undefined}>
          {activity.title}
        </h3>
        <p className={cn("text-sm leading-relaxed text-ink-2", activity.script === "ur" && "urdu leading-loose")} dir={activity.script === "ur" ? "rtl" : undefined}>
          {activity.blurb}
        </p>
      </div>
      <p className="mt-auto flex items-center gap-2 text-2xs text-ink-3">
        <span>{KIND_LABEL[activity.kind]}</span>
        <span aria-hidden>·</span>
        <span>{plays === 0 ? "Not tried yet" : plays === 1 ? "Played once" : `Played ${plays} times`}</span>
      </p>
    </Link>
  );
}
