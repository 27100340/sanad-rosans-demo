import type { Persona } from "./personas";
import { classById } from "@/lib/data/mock/people";
import { unreadCount } from "@/lib/data/mock/notify";
import { spacesForTeacher } from "@/lib/data/repo";

const PHONE_BAR_SLOTS = 5;

export interface NavItem {
  href: string;
  label: string;
  icon: "home" | "ask" | "branches" | "alert" | "users" | "inbox" | "calendar" | "book" | "tasks" | "insight" | "rules" | "planner" | "tutor" | "progress" | "mic" | "map" | "drill" | "family" | "megaphone" | "hifz";
  /** Unread count shown next to the label; omitted when zero. */
  badge?: number;
}

/** Notifications are keyed by the person id the messages API uses for this seat. */
function inboxBadge(p: Persona): number | undefined {
  const n = unreadCount(p.studentId ?? p.guardianId ?? p.personId);
  return n > 0 ? n : undefined;
}

export function navFor(p: Persona): NavItem[] {
  switch (p.role) {
    case "chairman":
      return [
        { href: "/portal/leadership", label: "Cockpit", icon: "home" },
        { href: "/portal/leadership/ask", label: "Ask the School", icon: "ask" },
        { href: "/portal/leadership/branches", label: "Branches", icon: "branches" },
        { href: "/portal/leadership/announcements", label: "Announcements", icon: "megaphone" },
      ];
    case "principal":
      return [
        { href: "/portal/principal", label: "Branch", icon: "home" },
        { href: "/portal/principal/at-risk", label: "At-risk students", icon: "alert" },
        { href: "/portal/principal/students", label: "Students", icon: "users" },
        { href: "/portal/principal/teachers", label: "Teachers", icon: "users" },
        { href: "/portal/principal/inbox", label: "Parent inbox", icon: "inbox" },
        { href: "/portal/principal/timetable", label: "Timetable", icon: "calendar" },
        { href: "/portal/principal/subjects", label: "Subjects", icon: "book" },
        { href: "/portal/principal/assessments", label: "Assessments", icon: "tasks" },
        { href: "/portal/principal/attendance", label: "Attendance", icon: "calendar" },
        { href: "/portal/principal/rankings", label: "Rankings", icon: "progress" },
        { href: "/portal/principal/announcements", label: "Announcements", icon: "megaphone" },
        { href: "/portal/principal/fees", label: "Fees", icon: "tasks" },
        { href: "/portal/principal/automations", label: "Automations", icon: "planner" },
        { href: "/portal/principal/audit", label: "Audit log", icon: "rules" },
        { href: "/portal/principal/access", label: "Access locks", icon: "rules" },
      ];
    case "teacher": {
      const owned = spacesForTeacher(p.personId)
        .slice(0, PHONE_BAR_SLOTS - 1)
        .map((s): NavItem => ({ href: `/portal/teach/${s.id}`, label: `${s.subject} · ${classById.get(s.classId)?.name ?? s.classId}`, icon: "tasks" }));
      return [
        { href: "/portal/teach", label: "My spaces", icon: "book" },
        { href: "/portal/teach/students", label: "Students", icon: "users" },
        { href: "/portal/teach/attendance", label: "Attendance", icon: "calendar" },
        { href: "/portal/teach/messages", label: "Messages", icon: "inbox", badge: inboxBadge(p) },
        { href: "/portal/teach/timetable", label: "Timetable", icon: "calendar" },
        { href: "/portal/teach/library", label: "Library", icon: "hifz" },
        ...owned,
      ];
    }
    case "ustadh":
      return [
        { href: "/portal/hifz/ustadh", label: "Halaqa board", icon: "hifz" },
        { href: "/portal/hifz/ustadh/s-zaid-hassan", label: "Student map", icon: "map" },
      ];
    case "student":
      if (p.studentId === "s-zaid-hassan")
        return [
          { href: "/portal/hifz", label: "Today", icon: "home" },
          { href: "/portal/hifz/recite", label: "Listen & recite", icon: "mic" },
          { href: "/portal/hifz/map", label: "My map", icon: "map" },
          { href: "/portal/hifz/drills", label: "Look-alike drills", icon: "drill" },
        ];
      return [
        { href: "/portal/learn", label: "Today", icon: "home" },
        { href: "/portal/learn/tutor", label: "Tutor", icon: "tutor" },
        { href: "/portal/learn/tests", label: "Tests", icon: "tasks" },
        { href: "/portal/learn/papers", label: "Past papers", icon: "book" },
        { href: "/portal/learn/progress", label: "Progress", icon: "progress" },
        { href: "/portal/learn/tasks", label: "Tasks", icon: "tasks" },
        { href: "/portal/learn/inbox", label: "Inbox", icon: "inbox", badge: inboxBadge(p) },
        { href: "/portal/learn/study-plan", label: "Study plan", icon: "planner" },
        { href: "/portal/learn/library", label: "Library", icon: "hifz" },
        { href: "/portal/learn/resources", label: "Resources", icon: "book" },
        { href: "/portal/learn/ranking", label: "My ranking", icon: "insight" },
        { href: "/portal/learn/leaderboard", label: "Leaderboard", icon: "drill" },
        { href: "/portal/learn/timetable", label: "Timetable", icon: "calendar" },
      ];
    case "parent":
      return [
        { href: "/portal/family", label: "Tonight's brief", icon: "family" },
        { href: "/portal/family/children", label: "My children", icon: "users" },
        { href: "/portal/family/messages", label: "Messages", icon: "inbox", badge: inboxBadge(p) },
        { href: "/portal/family/reports", label: "Reports", icon: "progress" },
      ];
    default:
      return [{ href: "/portal", label: "Home", icon: "home" }];
  }
}
