import type { Persona } from "./personas";
import { classById, studentById } from "@/lib/data/mock/people";
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
    case "finance":
      return [{ href: "/portal/finance", label: "Finance", icon: "tasks" }, { href: "/portal/principal/fees", label: "Fees & receipts", icon: "tasks" }];
    case "chairman":
      return [
        { href: "/portal/leadership", label: "Cockpit", icon: "home" },
        { href: "/portal/finance", label: "Finance", icon: "tasks" },
        { href: "/portal/hr", label: "People & appraisal", icon: "users" },
        { href: "/portal/teaching", label: "Academic pathways", icon: "book" },
        { href: "/portal/leadership/ask", label: "Ask the School", icon: "ask" },
        { href: "/portal/leadership/branches", label: "Branches", icon: "branches" },
        { href: "/portal/leadership/announcements", label: "Announcements", icon: "megaphone" },
      ];
    case "principal":
      return [
        { href: "/portal/principal", label: "Branch", icon: "home" },
        { href: "/portal/finance", label: "Finance", icon: "tasks" },
        { href: "/portal/hr", label: "People & appraisal", icon: "users" },
        { href: "/portal/teaching", label: "Academic pathways", icon: "book" },
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
    case "coordinator":
      return [
        { href: "/portal/coordinator", label: "Desk", icon: "home" },
        { href: "/portal/teaching", label: "Academic pathways", icon: "book" },
        { href: "/portal/principal/attendance", label: "Daily attendance", icon: "calendar" },
        { href: "/portal/principal/students", label: "Students", icon: "users" },
        { href: "/portal/principal/timetable", label: "Timetable", icon: "calendar" },
        { href: "/portal/principal/announcements", label: "Announcements", icon: "megaphone" },
        { href: "/portal/principal/inbox", label: "Parent inbox", icon: "inbox" },
      ];
    case "teacher": {
      const owned = spacesForTeacher(p.personId)
        .slice(0, PHONE_BAR_SLOTS - 1)
        .map((s): NavItem => ({ href: `/portal/teach/${s.id}`, label: `${s.subject} · ${classById.get(s.classId)?.name ?? s.classId}`, icon: "tasks" }));
      return [
        { href: "/portal/teach", label: "My spaces", icon: "book" },
        { href: "/portal/teaching", label: "Lesson pathways", icon: "planner" },
        { href: "/portal/hr", label: "My appraisal", icon: "users" },
        { href: "/portal/teach/students", label: "Students", icon: "users" },
        { href: "/portal/teach/attendance", label: "Attendance", icon: "calendar" },
        { href: "/portal/teach/messages", label: "Messages", icon: "inbox", badge: inboxBadge(p) },
        { href: "/portal/teach/timetable", label: "Timetable", icon: "calendar" },
        { href: "/portal/teach/library", label: "Library", icon: "hifz" },
        { href: "/portal/teach/proctoring", label: "Proctoring", icon: "rules" },
        { href: "/portal/teach/analytics", label: "Analytics", icon: "insight" },
        // Physics is its own department surface: one entry point, and the overview
        // links on to the exam lab and the review queue rather than spending three
        // sidebar slots on them.
        { href: "/portal/physics/overview", label: "Physics", icon: "insight" },
        { href: "/portal/physics/review", label: "Physics review", icon: "rules" },
        ...owned,
      ];
    }
    case "ustadh":
      return [
        { href: "/portal/hifz/ustadh", label: "Halaqa board", icon: "hifz" },
        // The qari hears each recording and marks it on the Hifz rubric; this is
        // the authoritative assessment, not the experimental AI check.
        { href: "/portal/hifz/ustadh/mark", label: "Marking desk", icon: "rules" },
        { href: "/portal/hr", label: "My appraisal", icon: "users" },
        { href: "/portal/hifz/ustadh/s-zaid-hassan", label: "Student map", icon: "map" },
      ];
    case "student":
      if (p.studentId && (classById.get(studentById.get(p.studentId)?.classId ?? "")?.year ?? 10) <= 6 && !studentById.get(p.studentId)?.hifz)
        return [
          { href: "/portal/learning", label: "My learning", icon: "book" },
          // Practice activities for the early and primary bands. Deliberately
          // not offered to Senior or Hifz seats, who have the tutor and tests.
          { href: "/portal/play", label: "Play & practise", icon: "drill" },
          { href: "/portal/learn/inbox", label: "Inbox", icon: "inbox" },
        ];
      if (p.studentId === "s-zaid-hassan")
        return [
          { href: "/portal/hifz", label: "Today", icon: "home" },
          { href: "/portal/hifz/recite", label: "Listen & recite", icon: "mic" },
          { href: "/portal/hifz/submissions", label: "My recitations", icon: "tasks" },
          { href: "/portal/hifz/map", label: "My map", icon: "map" },
          { href: "/portal/hifz/drills", label: "Look-alike drills", icon: "drill" },
        ];
      return [
        { href: "/portal/learn", label: "Today", icon: "home" },
        { href: "/portal/learning", label: "Learning journey", icon: "book" },
        { href: "/portal/learn/tutor", label: "Tutor", icon: "tutor" },
        // The study AI for Physics. Students get the Studio and the verified
        // library; the exam lab and the review queue are staff surfaces.
        { href: "/portal/physics", label: "Physics Studio", icon: "insight" },
        { href: "/portal/physics/library", label: "Physics library", icon: "book" },
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
        { href: "/portal/learning", label: "Home learning", icon: "book" },
        // Shows an empty state for a parent whose children are all Senior/Hifz.
        { href: "/portal/play", label: "Play & practise", icon: "drill" },
        { href: "/portal/family/children", label: "My children", icon: "users" },
        { href: "/portal/family/messages", label: "Messages", icon: "inbox", badge: inboxBadge(p) },
        { href: "/portal/family/reports", label: "Reports", icon: "progress" },
      ];
    default:
      return [{ href: "/portal", label: "Home", icon: "home" }];
  }
}
