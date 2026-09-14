/**
 * Class library and forum: threads tagged resource / help / topic /
 * discussion, replies, "helpful" marks and one reaction per person. Scoped by
 * class so students only see their own class; a teacher sees every class they
 * teach. Seeded for Grade 8-B and O Level 1. Production: forum tables plus a
 * private bucket for attachments.
 */
import { singleton } from "../store";
import { daysAgoISO } from "@/lib/utils";

export type ForumTag = "resource" | "help" | "topic" | "discussion";
export type Reaction = "like" | "love";

export interface ForumPost {
  id: string;
  authorId: string;
  body: string;
  link?: string;
  at: string; // ISO datetime
  helpfulBy: string[];
  reactions: Record<Reaction, string[]>;
}

export interface ForumThread {
  id: string;
  classId: string;
  spaceId?: string;
  tag: ForumTag;
  title: string;
  body: string;
  link?: string;
  authorId: string;
  at: string;
  lastAt: string;
  pinned?: boolean;
  posts: ForumPost[];
  reactions: Record<Reaction, string[]>;
}

export const TAG_LABEL: Record<ForumTag, string> = { resource: "Resource", help: "Help", topic: "Topic", discussion: "Discussion" };

const MAX_THREADS = 500;

function at(daysBack: number, time: string): string {
  return `${daysAgoISO(daysBack)}T${time}:00`;
}

const none = (): Record<Reaction, string[]> => ({ like: [], love: [] });

function seedThreads(): ForumThread[] {
  return [
    {
      id: "th-g8b-1", classId: "gulberg-g8b", spaceId: "gulberg-g8b-maths", tag: "resource", pinned: true,
      title: "Corbettmaths: solving equations with brackets (video + practice)", body: "The clip Ms. Raza mentioned. The practice questions at the end match our Week 6 notes exactly.",
      link: "https://corbettmaths.com/2013/02/06/solving-equations-with-brackets/", authorId: "s-zainab-omer", at: at(6, "18:20"), lastAt: at(2, "20:10"),
      reactions: { like: ["s-ahmed-hassan", "s-fatima-zubair", "s-saad-iqbal"], love: ["s-noor-shahid"] },
      posts: [
        { id: "po-g8b-1a", authorId: "s-ahmed-hassan", body: "Watched it twice; the bit about writing the expanded line first fixed my sign slips.", at: at(4, "19:05"), helpfulBy: ["s-zainab-omer"], reactions: none() },
        { id: "po-g8b-1b", authorId: "t-hina-raza", body: "Good find, Zainab. I have added it to the space resources so the tutor can cite it.", at: at(2, "20:10"), helpfulBy: ["s-ahmed-hassan", "s-fatima-zubair"], reactions: none() },
      ],
    },
    {
      id: "th-g8b-2", classId: "gulberg-g8b", spaceId: "gulberg-g8b-maths", tag: "help",
      title: "Why is 7 - 2n decreasing? I keep writing increasing", body: "Question 5 on the topic test. The terms go 5, 3, 1 but I wrote increasing. What should I be looking at?",
      authorId: "s-ahmed-hassan", at: at(1, "17:40"), lastAt: at(1, "18:30"), reactions: none(),
      posts: [
        { id: "po-g8b-2a", authorId: "s-fatima-zubair", body: "Look at the number in front of n. If it is negative the terms fall each time, so the sequence is decreasing. Check with the first two terms: 5 then 3.", at: at(1, "18:02"), helpfulBy: ["s-ahmed-hassan", "s-hira-nawaz"], reactions: { like: ["s-ahmed-hassan"], love: [] } },
        { id: "po-g8b-2b", authorId: "s-noor-shahid", body: "Also: 'increasing' means each term is bigger than the one before. Say the terms out loud and it is obvious.", at: at(1, "18:30"), helpfulBy: ["s-ahmed-hassan"], reactions: none() },
      ],
    },
    {
      id: "th-g8b-3", classId: "gulberg-g8b", spaceId: "gulberg-g8b-science", tag: "topic",
      title: "Does mass really disappear when paper burns?", body: "Mr. Tariq said the ash weighs less but the mass is not destroyed. Where does it go? Can we test it in the lab with a closed container?",
      authorId: "s-saad-iqbal", at: at(3, "13:10"), lastAt: at(3, "15:45"), reactions: { like: ["s-zainab-omer", "s-ahmed-hassan"], love: [] },
      posts: [
        { id: "po-g8b-3a", authorId: "t-usman-tariq", body: "Great question for Thursday. The missing mass leaves as gases (carbon dioxide and water vapour). A sealed flask on a balance shows no change. We will do it.", at: at(3, "15:45"), helpfulBy: ["s-saad-iqbal", "s-zainab-omer", "s-maryam-asif"], reactions: { like: [], love: ["s-saad-iqbal"] } },
      ],
    },
    {
      id: "th-o1-1", classId: "gulberg-o1", spaceId: "gulberg-o1-ol-maths", tag: "resource",
      title: "4024 June 2024 Paper 2: my worked solutions for Q1 to Q5", body: "Typed up after Tuesday's sitting. Corrections welcome; Q4(b) I am not sure about.",
      link: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-o-level-mathematics-d-4024/past-papers/", authorId: "s-hafsa-tariq", at: at(2, "21:00"), lastAt: at(1, "07:50"),
      reactions: { like: ["s-ali-hamza", "s-sana-khalid", "s-eman-siddiqui"], love: [] },
      posts: [
        { id: "po-o1-1a", authorId: "s-ali-hamza", body: "Q4(b): you need to eliminate y, not x. Multiply the first equation by 2 first.", at: at(1, "07:50"), helpfulBy: ["s-hafsa-tariq"], reactions: none() },
      ],
    },
    {
      id: "th-o1-2", classId: "gulberg-o1", spaceId: "gulberg-o1-ol-physics", tag: "discussion",
      title: "Physics P1: how are you timing the 40 MCQs?", body: "I ran out of time at Q34 in practice. Anyone have a strategy that works?",
      authorId: "s-sana-khalid", at: at(4, "16:30"), lastAt: at(4, "19:00"), reactions: none(),
      posts: [
        { id: "po-o1-2a", authorId: "s-hafsa-tariq", body: "90 seconds a question, and skip anything with a calculation longer than three lines on the first pass. Come back at the end.", at: at(4, "19:00"), helpfulBy: ["s-sana-khalid", "s-rayyan-malik"], reactions: { like: ["s-sana-khalid"], love: [] } },
      ],
    },
  ];
}

export const THREADS: ForumThread[] = singleton("forumThreads", seedThreads);

function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function threadsForClass(classId: string, tag?: ForumTag): ForumThread[] {
  return THREADS.filter((t) => t.classId === classId && (!tag || t.tag === tag)).sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.lastAt.localeCompare(a.lastAt));
}

export function threadById(id: string): ForumThread | undefined {
  return THREADS.find((t) => t.id === id);
}

export function createThread(input: Pick<ForumThread, "classId" | "spaceId" | "tag" | "title" | "body" | "link" | "authorId">, now = new Date().toISOString()): ForumThread {
  const thread: ForumThread = { ...input, id: nextId("th"), at: now, lastAt: now, posts: [], reactions: none() };
  THREADS.unshift(thread);
  if (THREADS.length > MAX_THREADS) THREADS.length = MAX_THREADS;
  return thread;
}

export function addPost(thread: ForumThread, input: Pick<ForumPost, "authorId" | "body" | "link">, now = new Date().toISOString()): ForumPost {
  const post: ForumPost = { ...input, id: nextId("po"), at: now, helpfulBy: [], reactions: none() };
  thread.posts.push(post);
  thread.lastAt = now;
  return post;
}

/** Toggles a helpful mark; returns the post author when the mark newly lands on someone else's post. */
export function toggleHelpful(thread: ForumThread, postId: string, byId: string): { on: boolean; awardTo?: string } | null {
  const post = thread.posts.find((p) => p.id === postId);
  if (!post) return null;
  const had = post.helpfulBy.includes(byId);
  post.helpfulBy = had ? post.helpfulBy.filter((x) => x !== byId) : [...post.helpfulBy, byId];
  return { on: !had, awardTo: !had && post.authorId !== byId ? post.authorId : undefined };
}

/** One reaction per person per item; picking the same one again clears it. */
export function react(thread: ForumThread, postId: string | null, kind: Reaction, byId: string): Record<Reaction, string[]> | null {
  const target = postId ? thread.posts.find((p) => p.id === postId) : thread;
  if (!target) return null;
  const already = target.reactions[kind].includes(byId);
  for (const k of Object.keys(target.reactions) as Reaction[]) target.reactions[k] = target.reactions[k].filter((x) => x !== byId);
  if (!already) target.reactions[kind].push(byId);
  return target.reactions;
}

export function togglePin(thread: ForumThread): boolean {
  thread.pinned = !thread.pinned;
  return Boolean(thread.pinned);
}
