"use client";

import { useEffect, useState } from "react";
import { Chip } from "@/components/ui/primitives";
import type { BriefLanguage, BriefOutput } from "@/lib/ai/brief";
import { cn } from "@/lib/utils";

export interface BriefCardData {
  studentId: string;
  firstName: string;
  className: string;
  hifz: boolean;
  en: BriefOutput;
  ur: BriefOutput;
}

const ACTION_LABEL: Record<BriefLanguage, string> = { en: "One action tonight", ur: "آج رات ایک کام" };

function BriefCard({ card, brief, language }: { card: BriefCardData; brief: BriefOutput; language: BriefLanguage }) {
  const ur = language === "ur";
  return (
    <article className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-ink">{card.firstName}</p>
          <p className="text-xs text-ink-3">{card.className}</p>
        </div>
        <Chip tone={card.hifz ? "gold" : "accent"}>{card.hifz ? "Hifz" : "Senior"}</Chip>
      </div>
      <div className={cn("space-y-4 px-5 py-5", ur && "urdu text-right")}>
        <h3 className={cn("font-display text-lg font-medium leading-snug text-ink", ur && "font-urdu text-xl")}>{brief.headline}</h3>
        <ul className={cn("space-y-2 text-sm text-ink-2", ur && "text-base")}>
          {brief.lines.map((line, i) => (
            <li key={i} className={cn("border-line pl-3", ur ? "border-r-2 pl-0 pr-3" : "border-l-2")}>
              {line}
            </li>
          ))}
        </ul>
        <div className="rounded-xl bg-accent-soft/70 p-4">
          <p className={cn("text-2xs font-semibold uppercase tracking-[0.08em] text-accent", ur && "font-urdu normal-case tracking-normal")}>{ACTION_LABEL[language]}</p>
          <p className={cn("mt-1 text-sm font-medium text-ink", ur && "text-base")}>{brief.action}</p>
        </div>
      </div>
    </article>
  );
}

export function BriefBoard({ cards, aiLive }: { cards: BriefCardData[]; aiLive: boolean }) {
  const [language, setLanguage] = useState<BriefLanguage>("en");
  const [live, setLive] = useState<Record<string, BriefOutput>>({});

  useEffect(() => {
    if (!aiLive) return;
    let cancelled = false;
    for (const card of cards) {
      const key = `${card.studentId}:${language}`;
      if (live[key]) continue;
      fetch("/api/ai/brief", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ studentId: card.studentId, language }) })
        .then((r) => (r.ok ? (r.json() as Promise<BriefOutput>) : null))
        .then((out) => {
          if (out && !cancelled) setLive((prev) => ({ ...prev, [key]: out }));
        })
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, [aiLive, cards, language, live]);

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-xl border border-line bg-surface p-1" role="tablist" aria-label="Brief language">
        {(["en", "ur"] as BriefLanguage[]).map((l) => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={language === l}
            onClick={() => setLanguage(l)}
            className={cn("rounded-lg px-4 py-1.5 text-sm font-medium transition-colors", language === l ? "bg-accent text-white" : "text-ink-2 hover:bg-surface-2")}
          >
            {l === "en" ? "English" : "اردو"}
          </button>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {cards.map((card) => (
          <BriefCard key={card.studentId} card={card} brief={live[`${card.studentId}:${language}`] ?? card[language]} language={language} />
        ))}
      </div>
    </div>
  );
}
