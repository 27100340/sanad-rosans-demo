"use client";

import { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles } from "lucide-react";
import type { SyllabusTopic } from "@/lib/domain/types";

const MD: Components = {
  h1: ({ children }) => <h2 className="text-xl font-semibold tracking-tight text-ink">{children}</h2>,
  h2: ({ children }) => <h3 className="mt-6 text-2xs font-semibold uppercase tracking-[0.08em] text-accent">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-4 text-sm font-semibold text-ink">{children}</h4>,
  p: ({ children }) => <p className="mt-2 text-sm leading-relaxed text-ink-2">{children}</p>,
  ul: ({ children }) => <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-2">{children}</ul>,
  ol: ({ children }) => <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-2">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  code: ({ children }) => <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-ink">{children}</code>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">
      {children}
    </a>
  ),
};

export function PlannerForm({ spaceId, syllabus }: { spaceId: string; syllabus: SyllabusTopic[] }) {
  const [topicCode, setTopicCode] = useState(syllabus[0]?.code ?? "");
  const topic = syllabus.find((t) => t.code === topicCode) ?? syllabus[0];
  const [subtopic, setSubtopic] = useState(topic?.subtopics[0] ?? "");
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pickTopic = (code: string) => {
    setTopicCode(code);
    setSubtopic(syllabus.find((t) => t.code === code)?.subtopics[0] ?? "");
  };

  const generate = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/ai/planner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ spaceId, topicCode, subtopic }) });
      if (!res.ok) return;
      const out = (await res.json()) as { markdown: string };
      setMarkdown(out.markdown);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <div className="card h-fit space-y-4 p-5">
        <div>
          <label className="label" htmlFor="topic">
            Syllabus topic
          </label>
          <select id="topic" className="input" value={topicCode} onChange={(e) => pickTopic(e.target.value)}>
            {syllabus.map((t) => (
              <option key={t.code} value={t.code}>
                {t.code} · {t.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="subtopic">
            Subtopic
          </label>
          <select id="subtopic" className="input" value={subtopic} onChange={(e) => setSubtopic(e.target.value)}>
            {topic?.subtopics.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn-primary w-full" disabled={busy} onClick={generate}>
          <Sparkles size={14} />
          {busy ? "Drafting" : "Draft 40-minute lesson"}
        </button>
        <p className="help">Grounded in this space&apos;s approved resources only.</p>
      </div>
      <div className="card min-h-64 p-6">
        {markdown ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>
            {markdown}
          </ReactMarkdown>
        ) : busy ? (
          <div className="space-y-3">
            <div className="skeleton h-6 w-2/3" />
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
          </div>
        ) : (
          <p className="text-sm text-ink-3">Choose a topic and subtopic, then draft. The plan uses the objectives, hook, activity, check and homework structure the school follows.</p>
        )}
      </div>
    </div>
  );
}
