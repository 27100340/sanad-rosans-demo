"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import type { ThreadMessage } from "@/lib/data/mock/learn-extra";
import { cn } from "@/lib/utils";

export function MessageThread({ teacherName, parentName, messages }: { teacherName: string; parentName: string; messages: ThreadMessage[] }) {
  const [thread, setThread] = useState(messages);
  const [draft, setDraft] = useState("");

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setThread((t) => [...t, { id: `local-${t.length}`, from: "parent", date: new Date().toISOString().slice(0, 10), text }]);
    setDraft("");
  };

  return (
    <div className="card flex flex-col">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Avatar name={teacherName} tone="accent" size="sm" />
        <div>
          <p className="text-sm font-semibold text-ink">{teacherName}</p>
          <p className="text-xs text-ink-3">Class teacher</p>
        </div>
      </div>
      <div className="space-y-4 p-5">
        {thread.map((m) => {
          const mine = m.from === "parent";
          return (
            <div key={m.id} className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}>
              <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed", mine ? "rounded-br-md bg-accent text-white" : "rounded-bl-md bg-surface-2 text-ink")}>{m.text}</div>
              <span className="num text-2xs text-ink-3">
                {mine ? parentName : teacherName} · {m.date}
              </span>
            </div>
          );
        })}
      </div>
      <form
        className="flex gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input className="input" placeholder="Write to the class teacher" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Message" />
        <button type="submit" className="btn-primary shrink-0 px-3" disabled={!draft.trim()} aria-label="Send">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
