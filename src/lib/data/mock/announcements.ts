/**
 * Announcements: seeds from comms.ts plus the ones leadership and principals
 * publish at runtime, in a singleton so every route sees them.
 */
import type { Announcement } from "@/lib/domain/types";
import type { BranchId } from "@/lib/config/school";
import { singleton } from "../store";
import { ANNOUNCEMENTS } from "./comms";

const EXTRA: Announcement[] = singleton("announcementsExtra", () => []);

export function allAnnouncements(): Announcement[] {
  return [...EXTRA, ...ANNOUNCEMENTS].sort((a, b) => b.date.localeCompare(a.date));
}

/** School-wide plus the branch's own; null branch means the chairman's view of everything. */
export function announcementsFor(branchId: BranchId | null): Announcement[] {
  return allAnnouncements().filter((a) => branchId === null || a.scope === "school" || a.scope === branchId);
}

export function addAnnouncement(input: Omit<Announcement, "id">): Announcement {
  const a: Announcement = { ...input, id: `an-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}` };
  EXTRA.unshift(a);
  return a;
}
