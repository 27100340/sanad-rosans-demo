/**
 * Overnight home-recitation results for the ustadh's morning queue. Zaid's
 * row comes from the real attempt log; the other two are halaqa summaries
 * (their units are not fully modelled in the demo).
 */
import { ZAID_ATTEMPTS } from "@/lib/data/mock/hifz";
import { studentById } from "@/lib/data/mock/people";
import { ayahLabel } from "@/lib/quran";
import type { MorningQueueItem } from "./morning-queue";

const EXTRA_ROWS: MorningQueueItem[] = [
  { id: "mq-ibrahim", studentId: "s-ibrahim-khalid", name: "", unitLabel: "Al-Muzzammil 73:1–10", score: 100, passed: true, omitted: 0, substituted: 0, note: "recorded by parent 9:40 pm" },
  { id: "mq-hamdan", studentId: "s-hamdan-riaz", name: "", unitLabel: "Al-Jinn 72:1–7", score: 88, passed: false, omitted: 1, substituted: 2, note: "look-alike slip flagged" },
];

export function morningQueueItems(): MorningQueueItem[] {
  const fromAttempts: MorningQueueItem[] = ZAID_ATTEMPTS.map((a) => ({
    id: `mq-${a.id}`,
    studentId: a.studentId,
    name: studentById.get(a.studentId)?.name ?? a.studentId,
    unitLabel: ayahLabel(a.surah, a.fromAyah, a.toAyah),
    score: a.score,
    passed: a.passed,
    omitted: a.omitted,
    substituted: a.substituted,
    note: a.tajweedNotes[0],
  }));
  const extras = EXTRA_ROWS.map((r) => ({ ...r, name: studentById.get(r.studentId)?.name ?? r.studentId }));
  return [...fromAttempts, ...extras];
}
