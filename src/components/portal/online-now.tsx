import { Radio } from "lucide-react";
import { Avatar, SectionTitle } from "@/components/ui/primitives";
import { onlineNow } from "@/lib/data/mock/presence";
import { personName } from "@/lib/data/mock/notify";

/** Who is in the portal right now among a set of people; rendered on the server at request time. */
export function OnlineNow({ personIds, hint }: { personIds: string[]; hint?: string }) {
  const online = onlineNow(personIds);
  return (
    <section>
      <SectionTitle title={<span className="flex items-center gap-2"><Radio size={14} className="text-ok" /> Online now</span>} hint={hint ?? "Seen in the last 90 seconds."} />
      {online.length ? (
        <div className="card divide-y divide-line">
          {online.map((p) => (
            <div key={p.personId} className="flex items-center gap-3 px-4 py-2.5">
              <span className="relative">
                <Avatar name={personName(p.personId)} size="sm" tone={p.personId.startsWith("t-") ? "gold" : "accent"} />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-ok" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{personName(p.personId)}</p>
                <p className="truncate text-xs text-ink-3">{p.label}</p>
              </div>
              <span className="num text-2xs text-ink-3">{p.secondsAgo < 15 ? "now" : `${p.secondsAgo}s ago`}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="card-quiet px-4 py-3 text-xs text-ink-3">Nobody is in the portal right now.</p>
      )}
    </section>
  );
}
