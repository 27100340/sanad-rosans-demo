/**
 * Class library. POST starts a thread or replies; PATCH toggles a helpful
 * mark, sets a reaction, or (staff) pins. Students act in their own class,
 * teachers in the classes they teach, the principal and chairman in their
 * branch. Contribution points are awarded to students; replies and helpful
 * marks notify the author.
 */
import { mayUseClass } from "@/lib/auth/manage";
import { getViewer } from "@/lib/auth/viewer";
import type { Persona } from "@/lib/auth/personas";
import { award, POINTS, type ContribKind } from "@/lib/data/mock/contribution";
import { addPost, createThread, react, threadById, toggleHelpful, togglePin, type ForumTag } from "@/lib/data/mock/forum";
import { audit, notify, personName } from "@/lib/data/mock/notify";
import { classById, studentById } from "@/lib/data/mock/people";

const TAGS: ForumTag[] = ["resource", "help", "topic", "discussion"];

function actorId(viewer: Persona): string {
  return viewer.studentId ?? viewer.personId;
}

function isStudent(id: string): boolean {
  return studentById.has(id);
}

function libraryHref(viewer: Persona, classId: string): string {
  return viewer.role === "student" ? "/portal/learn/library" : `/portal/teach/library?class=${encodeURIComponent(classId)}`;
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  const body = (await req.json().catch(() => ({}))) as { action?: string; classId?: string; threadId?: string; tag?: string; title?: string; body?: string; link?: string };
  const me = actorId(viewer);
  const text = (body.body ?? "").trim().slice(0, 2000);
  const link = typeof body.link === "string" && /^(https?:\/\/|\/)/.test(body.link.trim()) ? body.link.trim().slice(0, 300) : undefined;
  if (text.length < 3) return Response.json({ error: "Write something first." }, { status: 400 });

  if (body.action === "thread") {
    const tag = TAGS.includes(body.tag as ForumTag) ? (body.tag as ForumTag) : "discussion";
    const title = (body.title ?? "").trim().slice(0, 140);
    if (title.length < 3) return Response.json({ error: "Give it a title." }, { status: 400 });
    if (!body.classId || !mayUseClass(viewer, body.classId)) return Response.json({ error: "forbidden" }, { status: 403 });
    const thread = createThread({ classId: body.classId, tag, title, body: text, link, authorId: me });
    let points = 0;
    if (isStudent(me)) {
      const kind: ContribKind = tag === "resource" || link ? "resource" : tag === "topic" ? "topic" : "thread";
      award(me, kind);
      points = POINTS[kind];
    }
    if (!isStudent(me)) audit(viewer.personId, "library.post", "thread", thread.id, { className: classById.get(body.classId)?.name, title });
    return Response.json({ thread: { id: thread.id }, points });
  }

  if (body.action === "reply") {
    const thread = body.threadId ? threadById(body.threadId) : undefined;
    if (!thread || !mayUseClass(viewer, thread.classId)) return Response.json({ error: "forbidden" }, { status: 403 });
    const post = addPost(thread, { authorId: me, body: text, link });
    let points = 0;
    if (isStudent(me)) {
      award(me, "answer");
      points = POINTS.answer;
      if (link) {
        award(me, "resource");
        points += POINTS.resource;
      }
    }
    if (thread.authorId !== me) notify({ personIds: [thread.authorId] }, { kind: "message", title: `${personName(me)} replied to “${thread.title}”`, body: text.slice(0, 200), href: libraryHref({ ...viewer, role: isStudent(thread.authorId) ? "student" : viewer.role }, thread.classId), fromId: me });
    return Response.json({ post: { id: post.id }, points });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const viewer = await getViewer();
  const body = (await req.json().catch(() => ({}))) as { threadId?: string; postId?: string; helpful?: boolean; react?: string; pin?: boolean };
  const me = actorId(viewer);
  const thread = body.threadId ? threadById(body.threadId) : undefined;
  if (!thread || !mayUseClass(viewer, thread.classId)) return Response.json({ error: "forbidden" }, { status: 403 });

  if (body.helpful && body.postId) {
    const out = toggleHelpful(thread, body.postId, me);
    if (!out) return Response.json({ error: "unknown post" }, { status: 400 });
    if (out.awardTo && isStudent(out.awardTo)) {
      award(out.awardTo, "helpful");
      notify({ personIds: [out.awardTo] }, { kind: "message", title: `${personName(me)} found your answer helpful`, body: `On “${thread.title}”. +${POINTS.helpful} contribution points.`, href: "/portal/learn/library", fromId: me });
    }
    return Response.json({ on: out.on });
  }
  if (body.react === "like" || body.react === "love") {
    const r = react(thread, body.postId ?? null, body.react, me);
    return r ? Response.json({ reactions: r }) : Response.json({ error: "unknown post" }, { status: 400 });
  }
  if (body.pin) {
    if (viewer.role === "student") return Response.json({ error: "forbidden" }, { status: 403 });
    const pinned = togglePin(thread);
    audit(viewer.personId, pinned ? "library.pin" : "library.unpin", "thread", thread.id, { title: thread.title });
    return Response.json({ pinned });
  }
  return Response.json({ error: "unknown action" }, { status: 400 });
}
