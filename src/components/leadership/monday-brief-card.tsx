import { Markdown } from "@/components/leadership/markdown";
import { AiPill, Card } from "@/components/ui/primitives";
import type { MondayBrief } from "@/lib/ai/monday-brief";
import { shortDate } from "@/components/leadership/format";
import { todayISO } from "@/lib/utils";

/** The weekly narrative: what moved, what to watch, three decisions. */
export function MondayBriefCard({ brief }: { brief: MondayBrief }) {
  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow-gold">Monday Brief</p>
          <h2 className="mt-1 text-lg text-ink">Week of {shortDate(todayISO())}</h2>
        </div>
        <AiPill live={brief.live} />
      </div>
      <div className="rule-gold" />
      <Markdown text={brief.text} />
    </Card>
  );
}
