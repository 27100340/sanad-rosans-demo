/** Server-side shaping of forum threads for the client library: names and dates resolved, per-viewer flags computed. */
import { relativeStamp } from "@/components/leadership/format";
import type { PostView, ThreadView } from "@/components/library/library-client";
import type { ForumPost, ForumThread, Reaction } from "./mock/forum";
import { personName } from "./mock/notify";

function reactionsView(r: Record<Reaction, string[]>, me: string) {
  return { like: r.like.length, love: r.love.length, mine: (r.like.includes(me) ? "like" : r.love.includes(me) ? "love" : null) as Reaction | null };
}

function postView(p: ForumPost, me: string): PostView {
  return { id: p.id, authorId: p.authorId, authorName: personName(p.authorId), body: p.body, link: p.link, when: relativeStamp(p.at), helpful: p.helpfulBy.length, helpfulByMe: p.helpfulBy.includes(me), reactions: reactionsView(p.reactions, me) };
}

export function threadView(t: ForumThread, me: string): ThreadView {
  return {
    id: t.id,
    classId: t.classId,
    tag: t.tag,
    title: t.title,
    body: t.body,
    link: t.link,
    authorId: t.authorId,
    authorName: personName(t.authorId),
    when: relativeStamp(t.at),
    lastWhen: relativeStamp(t.lastAt),
    pinned: Boolean(t.pinned),
    posts: t.posts.map((p) => postView(p, me)),
    reactions: reactionsView(t.reactions, me),
  };
}
