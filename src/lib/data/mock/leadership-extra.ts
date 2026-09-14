/**
 * Extra mock data for the leadership and principal seats: suggested
 * questions for Ask the School and today's timetable exceptions.
 */
import type { BranchId } from "@/lib/config/school";

export const SUGGESTED_QUESTIONS: string[] = [
  "Where are we losing students this term?",
  "Compare Grade 8 Mathematics across branches",
  "Which teachers have the biggest marking backlog?",
  "Which branch needs attention on attendance?",
];

export interface TimetableException {
  id: string;
  branchId: BranchId;
  kind: "substitution" | "facility" | "event";
  period: string;
  text: string;
}

export const TODAY_EXCEPTIONS: TimetableException[] = [
  { id: "ex-1", branchId: "gulberg", kind: "substitution", period: "P3 to P5", text: "Ms. Sara Malik on leave; Mr. Bilal Ahmed covers Grade 8-B English." },
  { id: "ex-2", branchId: "gulberg", kind: "facility", period: "All day", text: "Lab 1 closed for gas-line inspection; Science moves to S-210." },
  { id: "ex-3", branchId: "gulberg", kind: "event", period: "After P6", text: "PTM slots open for the Senior section; 14 of 40 slots booked." },
];

export const TIMETABLE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
export const TIMETABLE_PERIODS = [1, 2, 3, 4, 5, 6] as const;
