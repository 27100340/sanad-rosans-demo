/**
 * Contribution points: the behaviours the school rewards in the class
 * library (sharing, helping, raising topics). One record per person; the
 * monthly figure resets each calendar month. Seeded so the boards are not
 * empty on the first open. Production: a contributions table.
 */
import { singleton } from "../store";

export type ContribKind = "thread" | "resource" | "answer" | "helpful" | "topic";

export const POINTS: Record<ContribKind, number> = { thread: 5, topic: 8, resource: 10, answer: 6, helpful: 12 };

export const POINTS_GUIDE: { kind: ContribKind; label: string; pts: number }[] = [
  { kind: "resource", label: "Share a resource in the library", pts: POINTS.resource },
  { kind: "helpful", label: "Be marked helpful by a classmate or teacher", pts: POINTS.helpful },
  { kind: "topic", label: "Raise a new topic", pts: POINTS.topic },
  { kind: "answer", label: "Answer or help on someone's post", pts: POINTS.answer },
  { kind: "thread", label: "Start a discussion or ask for help", pts: POINTS.thread },
];

export interface Contrib {
  personId: string;
  total: number;
  month: string; // YYYY-MM
  monthPoints: number;
  breakdown: Partial<Record<ContribKind, number>>;
}

function thisMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function seed(personId: string, total: number, monthPoints: number, breakdown: Partial<Record<ContribKind, number>>): [string, Contrib] {
  return [personId, { personId, total, month: thisMonth(), monthPoints, breakdown }];
}

export const CONTRIB: Map<string, Contrib> = singleton("contrib", () => new Map<string, Contrib>([
  seed("s-zainab-omer", 64, 28, { resource: 3, helpful: 2, answer: 1, thread: 1 }),
  seed("s-fatima-zubair", 47, 17, { resource: 2, answer: 3, helpful: 1 }),
  seed("s-ahmed-hassan", 21, 11, { thread: 1, answer: 1, resource: 1 }),
  seed("s-noor-shahid", 18, 6, { answer: 3 }),
  seed("s-saad-iqbal", 13, 13, { topic: 1, thread: 1 }),
  seed("s-maryam-asif", 10, 0, { resource: 1 }),
  seed("s-hira-nawaz", 6, 6, { answer: 1 }),
  seed("s-hafsa-tariq", 34, 22, { resource: 2, helpful: 1, thread: 1 }),
  seed("s-sana-khalid", 28, 10, { resource: 1, answer: 3 }),
  seed("s-ali-hamza", 16, 16, { thread: 1, answer: 1, topic: 1 }) as [string, Contrib],
]));

export function contribFor(personId: string): Contrib | null {
  const c = CONTRIB.get(personId);
  if (!c) return null;
  return c.month === thisMonth() ? c : { ...c, monthPoints: 0 };
}

export function award(personId: string, kind: ContribKind, times = 1): Contrib {
  const m = thisMonth();
  const cur = CONTRIB.get(personId) ?? { personId, total: 0, month: m, monthPoints: 0, breakdown: {} };
  if (cur.month !== m) {
    cur.month = m;
    cur.monthPoints = 0;
  }
  const pts = POINTS[kind] * times;
  cur.total += pts;
  cur.monthPoints += pts;
  cur.breakdown[kind] = (cur.breakdown[kind] ?? 0) + times;
  CONTRIB.set(personId, cur);
  return cur;
}

export interface ContribRow {
  personId: string;
  total: number;
  monthPoints: number;
}

/** Boards restricted to a set of people (a class), best first. */
export function contributionBoards(personIds: string[], limit = 10): { month: string; allTime: ContribRow[]; monthly: ContribRow[] } {
  const rows: ContribRow[] = personIds.map((id) => {
    const c = contribFor(id);
    return { personId: id, total: c?.total ?? 0, monthPoints: c?.monthPoints ?? 0 };
  });
  return {
    month: thisMonth(),
    allTime: [...rows].filter((r) => r.total > 0).sort((a, b) => b.total - a.total).slice(0, limit),
    monthly: [...rows].filter((r) => r.monthPoints > 0).sort((a, b) => b.monthPoints - a.monthPoints).slice(0, limit),
  };
}
