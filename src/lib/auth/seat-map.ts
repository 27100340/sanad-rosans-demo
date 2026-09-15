/**
 * Every screen in the portal, grouped by the seat that owns it, for the super
 * admin's control centre. `needs` records what a view requires beyond a role:
 * an owner seat can open "school" views directly, while "person" views only
 * make sense as somebody (a teacher's own spaces, a student's own tests), so
 * the control centre offers them through "view as".
 */
import type { Role } from "@/lib/domain/types";

export type SeatKey = "leadership" | "principal" | "coordinator" | "finance" | "teacher" | "ustadh" | "student" | "parent";

export interface SeatView {
  label: string;
  href: string;
  /** school: openable as the owner. person: opens as the person being viewed. */
  needs: "school" | "person";
  note?: string;
}

export interface Seat {
  key: SeatKey;
  name: string;
  role: Role;
  blurb: string;
  /** Person to view as when a view needs one, chosen so the seat has real data. */
  sample: string;
  views: SeatView[];
}

export const SEATS: Seat[] = [
  {
    key: "leadership",
    name: "Leadership",
    role: "chairman",
    blurb: "Every campus at once: the cockpit, plain-language questions over live figures, and school-wide announcements.",
    sample: "p-chairman",
    views: [
      { label: "Cockpit", href: "/portal/leadership", needs: "school" },
      { label: "Ask the School", href: "/portal/leadership/ask", needs: "school" },
      { label: "Branches", href: "/portal/leadership/branches", needs: "school" },
      { label: "Announcements", href: "/portal/leadership/announcements", needs: "school" },
    ],
  },
  {
    key: "principal",
    name: "Principal",
    role: "principal",
    blurb: "One campus end to end: students, staff, attendance, assessment, money, automation and the audit trail.",
    sample: "p-principal-gulberg",
    views: [
      { label: "Branch overview", href: "/portal/principal", needs: "school" },
      { label: "Students", href: "/portal/principal/students", needs: "school" },
      { label: "At-risk students", href: "/portal/principal/at-risk", needs: "school" },
      { label: "Teachers", href: "/portal/principal/teachers", needs: "school" },
      { label: "Parent inbox", href: "/portal/principal/inbox", needs: "school" },
      { label: "Attendance", href: "/portal/principal/attendance", needs: "school" },
      { label: "Timetable", href: "/portal/principal/timetable", needs: "school" },
      { label: "Subjects", href: "/portal/principal/subjects", needs: "school" },
      { label: "Assessments", href: "/portal/principal/assessments", needs: "school" },
      { label: "Rankings", href: "/portal/principal/rankings", needs: "school" },
      { label: "Announcements", href: "/portal/principal/announcements", needs: "school" },
      { label: "Fees", href: "/portal/principal/fees", needs: "school" },
      { label: "Automations", href: "/portal/principal/automations", needs: "school" },
      { label: "Audit log", href: "/portal/principal/audit", needs: "school" },
      { label: "Access locks", href: "/portal/principal/access", needs: "school" },
    ],
  },
  {
    key: "coordinator",
    name: "Coordinator",
    role: "coordinator",
    blurb: "The section's day: open registers, the students who need watching and the parent queue.",
    sample: "p-coordinator-gulberg",
    views: [{ label: "Coordinator desk", href: "/portal/coordinator", needs: "school" }],
  },
  {
    key: "finance",
    name: "Finance",
    role: "finance",
    blurb: "Fees in, expenses and payroll out, budgets against actuals. Approval is separated from recording.",
    sample: "p-finance-gulberg",
    views: [
      { label: "Finance workspace", href: "/portal/finance", needs: "school" },
      { label: "Fees and receipts", href: "/portal/principal/fees", needs: "school" },
      { label: "People and appraisal", href: "/portal/hr", needs: "school" },
    ],
  },
  {
    key: "teacher",
    name: "Teacher",
    role: "teacher",
    blurb: "A subject space per class: assignments, tests, marking, analytics, proctoring and the class library.",
    sample: "t-hina-raza",
    views: [
      { label: "My spaces", href: "/portal/teach", needs: "person" },
      { label: "Students", href: "/portal/teach/students", needs: "person" },
      { label: "Attendance", href: "/portal/teach/attendance", needs: "person" },
      { label: "Messages", href: "/portal/teach/messages", needs: "person" },
      { label: "Timetable", href: "/portal/teach/timetable", needs: "person" },
      { label: "Class library", href: "/portal/teach/library", needs: "person" },
      { label: "Proctoring", href: "/portal/teach/proctoring", needs: "person" },
      { label: "Analytics", href: "/portal/teach/analytics", needs: "person" },
      { label: "Academic pathways", href: "/portal/teaching", needs: "school" },
      { label: "Physics department", href: "/portal/physics/overview", needs: "person" },
      { label: "Physics review queue", href: "/portal/physics/review", needs: "person" },
      { label: "Subject space", href: "/portal/teach/gulberg-g8b-maths", needs: "school", note: "Grade 8-B Mathematics; tabs cover assignments, tests, studio, papers, class, performance, insight, rules and planner." },
    ],
  },
  {
    key: "ustadh",
    name: "Hifz (ustadh)",
    role: "ustadh",
    blurb: "The halaqa: who is due, who is slipping, and the marking desk where recitations are judged by a human.",
    sample: "t-qari-abdul-rehman",
    views: [
      { label: "Halaqa board", href: "/portal/hifz/ustadh", needs: "school" },
      { label: "Marking desk", href: "/portal/hifz/ustadh/mark", needs: "school" },
      { label: "Student map", href: "/portal/hifz/ustadh/s-zaid-hassan", needs: "school" },
    ],
  },
  {
    key: "student",
    name: "Student",
    role: "student",
    blurb: "Today, the tutor, tests and past papers, tasks and study plan, library, ranking and leaderboard.",
    sample: "s-ahmed-hassan",
    views: [
      { label: "Today", href: "/portal/learn", needs: "person" },
      { label: "Tutor", href: "/portal/learn/tutor", needs: "person" },
      { label: "Tests", href: "/portal/learn/tests", needs: "person" },
      { label: "Past papers", href: "/portal/learn/papers", needs: "person" },
      { label: "Tasks", href: "/portal/learn/tasks", needs: "person" },
      { label: "Study plan", href: "/portal/learn/study-plan", needs: "person" },
      { label: "Progress", href: "/portal/learn/progress", needs: "person" },
      { label: "My ranking", href: "/portal/learn/ranking", needs: "person" },
      { label: "Leaderboard", href: "/portal/learn/leaderboard", needs: "person" },
      { label: "Class library", href: "/portal/learn/library", needs: "person" },
      { label: "Resources", href: "/portal/learn/resources", needs: "person" },
      { label: "Inbox", href: "/portal/learn/inbox", needs: "person" },
      { label: "Timetable", href: "/portal/learn/timetable", needs: "person" },
      { label: "Physics Studio", href: "/portal/physics", needs: "person" },
      { label: "Physics library", href: "/portal/physics/library", needs: "person" },
    ],
  },
  {
    key: "parent",
    name: "Parent",
    role: "parent",
    blurb: "Tonight's brief, each child with fees, the teacher thread and printable term reports.",
    sample: "g-nadia-hassan",
    views: [
      { label: "Tonight's brief", href: "/portal/family", needs: "person" },
      { label: "My children", href: "/portal/family/children", needs: "person" },
      { label: "Messages", href: "/portal/family/messages", needs: "person" },
      { label: "Reports", href: "/portal/family/reports", needs: "person" },
      { label: "Home learning", href: "/portal/learning", needs: "person" },
    ],
  },
];

/** Early-years and primary seats sit on different screens from the senior ones. */
export const EXTRA_VIEWS: { label: string; href: string; sample: string; note: string }[] = [
  { label: "Early years learning", href: "/portal/learning", sample: "g-early", note: "Adult-guided activities and observations, as a Montessori guardian sees them." },
  { label: "Primary learning", href: "/portal/learning", sample: "s-primary-3", note: "Guardian-supported activities for a Grade 3 learner." },
  { label: "Play and practise", href: "/portal/play", sample: "s-primary-3", note: "Practice activities for the early and primary bands." },
  { label: "Hifz student", href: "/portal/hifz", sample: "s-zaid-hassan", note: "Today's sabaq, recitation and the mistake map." },
  { label: "Hifz recitation", href: "/portal/hifz/recite", sample: "s-zaid-hassan", note: "Listen, recite back and get word-level feedback." },
  { label: "Montessori teacher", href: "/portal/teaching", sample: "t-montessori", note: "Play-based lesson pathways and developmental observations." },
  { label: "Primary teacher", href: "/portal/teaching", sample: "t-primary", note: "Structured pathways for Grades 1 to 6." },
];
