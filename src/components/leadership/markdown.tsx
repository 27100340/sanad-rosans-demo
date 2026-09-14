import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const components: Components = {
  p: ({ children }) => <p className="text-sm leading-6 text-ink-2">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-5 text-sm text-ink-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-2">{children}</ol>,
  li: ({ children }) => <li className="leading-6">{children}</li>,
  h1: ({ children }) => <h3 className="text-sm font-semibold text-ink">{children}</h3>,
  h2: ({ children }) => <h3 className="text-sm font-semibold text-ink">{children}</h3>,
  h3: ({ children }) => <h3 className="text-sm font-semibold text-ink">{children}</h3>,
  a: ({ children, href }) => (
    <a href={href} className="text-accent underline underline-offset-2">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="table">{children}</table>
    </div>
  ),
  code: ({ children }) => <code className="rounded bg-surface-2 px-1 py-0.5 text-xs">{children}</code>,
};

/** Calm Markdown rendering for AI output; safe in server and client components. */
export function Markdown({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
