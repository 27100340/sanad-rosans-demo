import { daysAgoISO, todayISO } from "@/lib/utils";

/** "Today", "Yesterday", else "14 Sep". */
export function relativeDay(iso: string): string {
  if (iso === todayISO()) return "Today";
  if (iso === daysAgoISO(1)) return "Yesterday";
  return shortDate(iso);
}

export function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Weekday initials for the last `count` days, oldest first, ending today. */
export function lastDayLabels(count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (count - 1 - i));
    return d.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 2);
  });
}

/** Drops honorifics so a teacher fits in a timetable cell: "Ms. Hina Raza" -> "Hina Raza". */
export function shortName(name: string): string {
  return name.replace(/^(Ms\.|Mr\.|Mrs\.|Dr\.|Qari|Hafiz|Ustadh)\s+/i, "");
}
