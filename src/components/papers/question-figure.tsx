import { cn } from "@/lib/utils";

/** Question crops stacked in reading order, with the reading insert (when the paper has one) above, toggled by the caller. Server-safe. */
export function QuestionFigure({ img, insertImg, insertOpen, refLabel, marks, className }: { img: string[]; insertImg: string[]; insertOpen: boolean; refLabel: string; marks: number; className?: string }) {
  return (
    <figure className={cn("space-y-3", className)}>
      {insertOpen && insertImg.length ? (
        <div className="space-y-2 rounded-xl border border-line bg-surface-2 p-2 sm:p-3">
          <p className="px-1 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">Reading insert</p>
          {insertImg.map((src, i) => (
            <img key={src} src={src} alt={`Insert page ${i + 1}`} loading="lazy" className="h-auto w-full max-w-full rounded-lg border border-line bg-white" />
          ))}
        </div>
      ) : null}
      {img.map((src, i) => (
        <img key={src} src={src} alt={`${refLabel}${img.length > 1 ? ` part ${i + 1}` : ""}`} className="h-auto w-full max-w-full rounded-xl border border-line bg-white" />
      ))}
      <figcaption className="num text-2xs text-ink-3">
        {refLabel} · {marks} {marks === 1 ? "mark" : "marks"} · © UCLES · reproduced for classroom practice
      </figcaption>
    </figure>
  );
}
