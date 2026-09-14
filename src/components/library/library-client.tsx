"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Heart, MessageSquare, Pin, Plus, Sparkles, ThumbsUp } from "lucide-react";
import { Avatar, Chip, EmptyState, type Tone } from "@/components/ui/primitives";
import type { ForumTag, Reaction } from "@/lib/data/mock/forum";
import { cn } from "@/lib/utils";

export interface PostView {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  link?: string;
  when: string;
  helpful: number;
  helpfulByMe: boolean;
  reactions: { like: number; love: number; mine: Reaction | null };
}

export interface ThreadView {
  id: string;
  classId: string;
  tag: ForumTag;
  title: string;
  body: string;
  link?: string;
  authorId: string;
  authorName: string;
  when: string;
  lastWhen: string;
  pinned: boolean;
  posts: PostView[];
  reactions: { like: number; love: number; mine: Reaction | null };
}

const TAG: Record<ForumTag, { label: string; tone: Tone }> = { resource: { label: "Resource", tone: "accent" }, help: { label: "Help", tone: "warn" }, topic: { label: "Topic", tone: "gold" }, discussion: { label: "Discussion", tone: "info" } };
const TAGS: ForumTag[] = ["resource", "help", "topic", "discussion"];
const API = "/api/library";

async function call(method: "POST" | "PATCH", body: Record<string, unknown>): Promise<{ ok: boolean; error?: string; points?: number }> {
  try {
    const res = await fetch(API, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const out = (await res.json().catch(() => ({}))) as { error?: string; points?: number };
    return { ok: res.ok, error: out.error, points: out.points };
  } catch {
    return { ok: false, error: "Could not reach the server." };
  }
}

function Reactions({ r, onReact }: { r: PostView["reactions"]; onReact: (k: Reaction) => void }) {
  return (
    <span className="inline-flex items-center gap-1">
      <button type="button" className={cn("btn-ghost btn-sm", r.mine === "like" && "text-accent")} onClick={() => onReact("like")} aria-label="Like">
        <ThumbsUp size={13} /> {r.like || ""}
      </button>
      <button type="button" className={cn("btn-ghost btn-sm", r.mine === "love" && "text-danger")} onClick={() => onReact("love")} aria-label="Love">
        <Heart size={13} /> {r.love || ""}
      </button>
    </span>
  );
}

function LinkOut({ href }: { href: string }) {
  const external = /^https?:\/\//i.test(href);
  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="inline-flex items-center gap-1 text-xs font-medium text-accent underline underline-offset-2">
      Open the link {external ? <ExternalLink size={12} /> : null}
    </a>
  );
}

/** Class library: threads, replies, helpful marks and reactions; every mutation goes through the API and refreshes. */
export function LibraryClient({ threads, classId, className, me, canPin }: { threads: ThreadView[]; classId: string; className: string; me: string; canPin: boolean }) {
  const router = useRouter();
  const [tag, setTag] = useState<ForumTag | "">("");
  const [openId, setOpenId] = useState<string | null>(threads[0]?.id ?? null);
  const [composing, setComposing] = useState(false);
  const [newTag, setNewTag] = useState<ForumTag>("help");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [reply, setReply] = useState("");
  const [replyLink, setReplyLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);

  const shown = threads.filter((t) => !tag || t.tag === tag);
  const open = threads.find((t) => t.id === openId) ?? null;

  const run = async (method: "POST" | "PATCH", payload: Record<string, unknown>, okText?: (points?: number) => string) => {
    setBusy(true);
    setNote(null);
    const out = await call(method, payload);
    setBusy(false);
    if (!out.ok) {
      setNote({ tone: "danger", text: out.error ?? "Something went wrong." });
      return false;
    }
    if (okText) setNote({ tone: "ok", text: okText(out.points) });
    router.refresh();
    return true;
  };

  const postThread = async () => {
    if (await run("POST", { action: "thread", classId, tag: newTag, title: title.trim(), body: body.trim(), link: link.trim() || undefined }, (p) => `Posted${p ? `; +${p} contribution points` : ""}.`)) {
      setTitle("");
      setBody("");
      setLink("");
      setComposing(false);
    }
  };

  const postReply = async () => {
    if (!open) return;
    if (await run("POST", { action: "reply", threadId: open.id, body: reply.trim(), link: replyLink.trim() || undefined }, (p) => `Replied${p ? `; +${p} points` : ""}.`)) {
      setReply("");
      setReplyLink("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className={!tag ? "btn-soft btn-sm" : "btn-outline btn-sm"} onClick={() => setTag("")}>All</button>
          {TAGS.map((t) => (
            <button key={t} type="button" className={tag === t ? "btn-soft btn-sm" : "btn-outline btn-sm"} onClick={() => setTag(t)}>{TAG[t].label}</button>
          ))}
        </div>
        <button type="button" className="btn-primary btn-sm" onClick={() => setComposing((c) => !c)}>
          <Plus size={14} /> New post
        </button>
      </div>

      {note ? <p className={note.tone === "ok" ? "chip-ok" : "chip-danger"}>{note.text}</p> : null}

      {composing ? (
        <form
          className="card space-y-3 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim().length >= 3 && body.trim().length >= 3 && !busy) void postThread();
          }}
        >
          <div className="flex flex-wrap gap-1.5">
            {TAGS.map((t) => (
              <button key={t} type="button" className={newTag === t ? "btn-soft btn-sm" : "btn-outline btn-sm"} onClick={() => setNewTag(t)}>{TAG[t].label}</button>
            ))}
          </div>
          <input className="input" placeholder={newTag === "help" ? "What are you stuck on?" : newTag === "resource" ? "What are you sharing?" : "Title"} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} />
          <textarea className="input min-h-24" placeholder="Say enough that a classmate can help or use it." value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
          <input className="input" placeholder="Link (optional): a video, a page, a past-paper index" value={link} onChange={(e) => setLink(e.target.value)} maxLength={300} />
          <div className="flex items-center justify-between gap-2">
            <p className="text-2xs text-ink-3">Posting to {className}. Resources earn 10 points, topics 8, questions 5.</p>
            <button type="submit" className="btn-primary btn-sm" disabled={busy || title.trim().length < 3 || body.trim().length < 3}>{busy ? "Posting" : "Post"}</button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          {shown.length ? (
            <div className="card divide-y divide-line">
              {shown.map((t) => (
                <button key={t.id} type="button" onClick={() => setOpenId(t.id)} className={cn("flex w-full flex-col items-start gap-1 p-4 text-left transition-colors hover:bg-surface-2", t.id === openId && "bg-accent-soft/40")}>
                  <span className="flex w-full items-center gap-2">
                    <Chip tone={TAG[t.tag].tone}>{TAG[t.tag].label}</Chip>
                    {t.pinned ? <Pin size={12} className="text-gold" aria-label="Pinned" /> : null}
                    <span className="ml-auto text-2xs text-ink-3">{t.lastWhen}</span>
                  </span>
                  <span className="text-sm font-medium text-ink">{t.title}</span>
                  <span className="text-2xs text-ink-3">
                    {t.authorName} · {t.posts.length} repl{t.posts.length === 1 ? "y" : "ies"}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="Nothing here yet" body="Be the first to share a resource or ask for help." />
          )}
        </div>

        <div className="lg:col-span-3">
          {open ? (
            <article className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Avatar name={open.authorName} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{open.title}</p>
                    <p className="text-2xs text-ink-3">
                      {open.authorName} · {open.when}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Chip tone={TAG[open.tag].tone}>{TAG[open.tag].label}</Chip>
                  {canPin ? (
                    <button type="button" className={cn("btn-ghost btn-sm", open.pinned && "text-gold")} disabled={busy} onClick={() => void run("PATCH", { threadId: open.id, pin: true })} aria-label={open.pinned ? "Unpin" : "Pin"}>
                      <Pin size={13} /> {open.pinned ? "Pinned" : "Pin"}
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">{open.body}</p>
              {open.link ? <p className="mt-2"><LinkOut href={open.link} /></p> : null}
              <div className="mt-3 border-t border-line pt-2">
                <Reactions r={open.reactions} onReact={(k) => void run("PATCH", { threadId: open.id, react: k })} />
              </div>

              <div className="mt-4 space-y-3">
                {open.posts.map((p) => (
                  <div key={p.id} className="rounded-xl bg-surface-2 p-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={p.authorName} size="sm" tone={p.authorId.startsWith("t-") ? "gold" : "accent"} />
                      <p className="text-xs font-medium text-ink">{p.authorName}</p>
                      {p.authorId.startsWith("t-") ? <Chip tone="gold">Teacher</Chip> : null}
                      <span className="ml-auto text-2xs text-ink-3">{p.when}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">{p.body}</p>
                    {p.link ? <p className="mt-1"><LinkOut href={p.link} /></p> : null}
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <button type="button" className={cn("btn-ghost btn-sm", p.helpfulByMe && "text-ok")} disabled={busy || p.authorId === me} onClick={() => void run("PATCH", { threadId: open.id, postId: p.id, helpful: true })}>
                        <Sparkles size={13} /> Helpful{p.helpful ? ` · ${p.helpful}` : ""}
                      </button>
                      <Reactions r={p.reactions} onReact={(k) => void run("PATCH", { threadId: open.id, postId: p.id, react: k })} />
                    </div>
                  </div>
                ))}
                {!open.posts.length ? <p className="text-xs text-ink-3">No replies yet.</p> : null}
              </div>

              <form
                className="mt-4 space-y-2 border-t border-line pt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (reply.trim().length >= 3 && !busy) void postReply();
                }}
              >
                <textarea className="input min-h-20" placeholder={open.tag === "help" ? "Explain it the way you would to a friend." : "Add to the discussion"} value={reply} onChange={(e) => setReply(e.target.value)} maxLength={2000} />
                <div className="flex flex-wrap items-center gap-2">
                  <input className="input flex-1" placeholder="Link (optional)" value={replyLink} onChange={(e) => setReplyLink(e.target.value)} maxLength={300} />
                  <button type="submit" className="btn-primary btn-sm" disabled={busy || reply.trim().length < 3}>
                    <MessageSquare size={14} /> Reply
                  </button>
                </div>
              </form>
            </article>
          ) : (
            <EmptyState title="Pick a post" body="Open one on the left to read and reply." />
          )}
        </div>
      </div>
    </div>
  );
}
