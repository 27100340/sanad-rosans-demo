/**
 * Live presence: each signed-in person's beacon records where they are;
 * "online now" is whoever was seen in the last 90 seconds. Seeded with a
 * few students so the widget has life on first open. Production: a tiny
 * presence table or a Redis key per person.
 */
import { singleton } from "../store";

export const ONLINE_WINDOW_MS = 90_000;

export interface Presence {
  personId: string;
  path: string;
  ts: number;
}

export interface OnlinePerson extends Presence {
  label: string;
  secondsAgo: number;
}

const LABELS: [prefix: string, label: string][] = [
  ["/portal/learn/tests/", "Sitting a test"],
  ["/portal/learn/papers/", "Sitting a past paper"],
  ["/portal/learn/tutor", "With the tutor"],
  ["/portal/learn/tasks", "On their tasks"],
  ["/portal/learn/library", "In the library"],
  ["/portal/learn/study-plan", "On the study plan"],
  ["/portal/learn/assignments", "On an assignment"],
  ["/portal/learn", "On Today"],
  ["/portal/hifz/recite", "Reciting"],
  ["/portal/hifz", "Hifz"],
  ["/portal/teach/attendance", "Taking a register"],
  ["/portal/teach/students", "Reviewing students"],
  ["/portal/teach", "Teaching"],
  ["/portal/principal", "Running the branch"],
  ["/portal/family", "Family portal"],
];

export function activityLabel(path: string): string {
  const p = path.split("?")[0];
  return LABELS.find(([prefix]) => p.startsWith(prefix))?.[1] ?? "In the portal";
}

function seed(): Map<string, Presence> {
  const now = Date.now();
  return new Map<string, Presence>([
    ["s-fatima-zubair", { personId: "s-fatima-zubair", path: "/portal/learn/tutor", ts: now - 12_000 }],
    ["s-zainab-omer", { personId: "s-zainab-omer", path: "/portal/learn/library", ts: now - 25_000 }],
    ["s-saad-iqbal", { personId: "s-saad-iqbal", path: "/portal/learn/tasks", ts: now - 40_000 }],
    ["s-hafsa-tariq", { personId: "s-hafsa-tariq", path: "/portal/learn/papers/x", ts: now - 8_000 }],
    ["t-usman-tariq", { personId: "t-usman-tariq", path: "/portal/teach/attendance", ts: now - 30_000 }],
  ]);
}

export const PRESENCE: Map<string, Presence> = singleton("presence", seed);

export function recordPresence(personId: string, path: string, now = Date.now()): void {
  PRESENCE.set(personId, { personId, path: path.slice(0, 200), ts: now });
}

export function onlineNow(personIds: string[], now = Date.now(), windowMs = ONLINE_WINDOW_MS): OnlinePerson[] {
  return personIds
    .map((id) => PRESENCE.get(id))
    .filter((p): p is Presence => Boolean(p) && now - (p as Presence).ts < windowMs)
    .map((p) => ({ ...p, label: activityLabel(p.path), secondsAgo: Math.max(0, Math.round((now - p.ts) / 1000)) }))
    .sort((a, b) => a.secondsAgo - b.secondsAgo);
}
