import type { Announcement, ParentMessage, TarbiyahLog, TimetableEntry } from "@/lib/domain/types";
import { daysAgoISO } from "@/lib/utils";

export const ANNOUNCEMENTS: Announcement[] = [
  { id: "an-1", scope: "school", authorId: "p-chairman", date: daysAgoISO(1), title: "STEAM Fest 2026 dates confirmed", body: "All three campuses will host STEAM Fest in the second week of October. Heads of section to submit project lists by Friday." },
  { id: "an-2", scope: "gulberg", authorId: "p-principal-gulberg", date: daysAgoISO(2), title: "Term 1 parent-teacher meetings", body: "PTMs for Junior and Senior sections on Saturday 26 September, 9:00 to 13:00. Slots open in the parent portal." },
  { id: "an-3", scope: "gulberg", authorId: "t-qari-abdul-rehman", date: daysAgoISO(3), title: "Hifz Halaqa 2: manzil week", body: "This week every student recites one full juz of manzil to the ustadh. Parents: please record evening recitations in the app." },
];

export const PARENT_MESSAGES: ParentMessage[] = [
  { id: "pm-1", branchId: "gulberg", guardianId: "g-hamza-javed", date: daysAgoISO(0), text: "Hamza has had a fever for three days and the doctor says one more week of rest. He is worried about missing the Maths test.", triage: "urgent" },
  { id: "pm-2", branchId: "gulberg", guardianId: "g-umar-farooq", date: daysAgoISO(0), text: "We have moved house and the van has not been picking Umar up on time. Can the transport office call me?", triage: "urgent" },
  { id: "pm-3", branchId: "gulberg", guardianId: "g-zainab-omer", date: daysAgoISO(1), text: "Zainab came home so excited about the science fair project. Thank you to Mr. Usman for the encouragement.", triage: "praise" },
  { id: "pm-4", branchId: "gulberg", guardianId: "g-saad-iqbal", date: daysAgoISO(1), text: "Is the Term 1 fee due date the 10th or the 15th? The voucher says 10th but the message said 15th.", triage: "routine" },
  { id: "pm-5", branchId: "gulberg", guardianId: "g-nadia-hassan", date: daysAgoISO(2), text: "Zaid's evening recitation was recorded but the app says it is still processing. Did Qari sahib receive it?", triage: "routine" },
  { id: "pm-6", branchId: "gulberg", guardianId: "g-hassan-nadeem", date: daysAgoISO(2), text: "Hassan says he is being teased in the van. Please look into it.", triage: "urgent" },
];

const P = (day: TimetableEntry["day"], period: number, subject: string, teacherId: string, room = "S-204"): TimetableEntry => ({ classId: "gulberg-g8b", day, period, subject, teacherId, room });

export const TIMETABLE_G8B: TimetableEntry[] = [
  P("Mon", 1, "Mathematics", "t-hina-raza"), P("Mon", 2, "English", "t-sara-malik"), P("Mon", 3, "Quran & Islamiyat", "t-ayesha-khan"), P("Mon", 4, "Science", "t-usman-tariq", "Lab 1"), P("Mon", 5, "Urdu", "t-bilal-ahmed"), P("Mon", 6, "Mathematics", "t-hina-raza"),
  P("Tue", 1, "English", "t-sara-malik"), P("Tue", 2, "Mathematics", "t-hina-raza"), P("Tue", 3, "Science", "t-usman-tariq", "Lab 1"), P("Tue", 4, "Quran & Islamiyat", "t-ayesha-khan"), P("Tue", 5, "Urdu", "t-bilal-ahmed"), P("Tue", 6, "Arabic", "t-ayesha-khan"),
  P("Wed", 1, "Mathematics", "t-hina-raza"), P("Wed", 2, "Science", "t-usman-tariq", "Lab 1"), P("Wed", 3, "English", "t-sara-malik"), P("Wed", 4, "Urdu", "t-bilal-ahmed"), P("Wed", 5, "Quran & Islamiyat", "t-ayesha-khan"), P("Wed", 6, "Sports", "t-usman-tariq", "Field"),
  P("Thu", 1, "Science", "t-usman-tariq", "Lab 1"), P("Thu", 2, "Mathematics", "t-hina-raza"), P("Thu", 3, "Urdu", "t-bilal-ahmed"), P("Thu", 4, "English", "t-sara-malik"), P("Thu", 5, "Arabic", "t-ayesha-khan"), P("Thu", 6, "Library", "t-sara-malik", "Library"),
  P("Fri", 1, "Mathematics", "t-hina-raza"), P("Fri", 2, "Quran & Islamiyat", "t-ayesha-khan"), P("Fri", 3, "English", "t-sara-malik"), P("Fri", 4, "Science", "t-usman-tariq", "Lab 1"),
];

export const TARBIYAH_LOGS: TarbiyahLog[] = [
  { id: "tb-1", studentId: "s-ahmed-hassan", teacherId: "t-ayesha-khan", date: daysAgoISO(0), kind: "helpfulness", positive: true, note: "Stayed back to help a classmate set up the salah mats." },
  { id: "tb-2", studentId: "s-ahmed-hassan", teacherId: "t-hina-raza", date: daysAgoISO(1), kind: "effort", positive: true, note: "Showed every step in the equations homework and checked his answer." },
  { id: "tb-3", studentId: "s-hamza-javed", teacherId: "t-bilal-ahmed", date: daysAgoISO(2), kind: "punctuality", positive: false, note: "Late to first period three times this week." },
  { id: "tb-4", studentId: "s-umar-farooq", teacherId: "t-hina-raza", date: daysAgoISO(1), kind: "concern", positive: false, note: "Seems withdrawn; did not attempt the class task. Suggest a quiet word with the parent." },
  { id: "tb-5", studentId: "s-zainab-omer", teacherId: "t-usman-tariq", date: daysAgoISO(1), kind: "akhlaq", positive: true, note: "Thanked the lab assistant without being prompted." },
  { id: "tb-6", studentId: "s-zaid-hassan", teacherId: "t-qari-abdul-rehman", date: daysAgoISO(0), kind: "salah", positive: true, note: "Led the Zuhr salah for the halaqa with correct tajweed." },
];

/** Seven-day attendance heat by class for the Gulberg branch (percent present). */
export const ATTENDANCE_HEAT_GULBERG: { classId: string; className: string; days: number[] }[] = [
  { classId: "gulberg-mont-a", className: "Montessori A", days: [96, 97, 95, 98, 96, 97, 96] },
  { classId: "gulberg-g3a", className: "Grade 3-A", days: [94, 95, 93, 96, 95, 94, 95] },
  { classId: "gulberg-g5b", className: "Grade 5-B", days: [92, 91, 93, 90, 92, 91, 92] },
  { classId: "gulberg-g7a", className: "Grade 7-A", days: [95, 94, 96, 95, 93, 95, 94] },
  { classId: "gulberg-g8b", className: "Grade 8-B", days: [93, 90, 86, 88, 85, 89, 87] },
  { classId: "gulberg-g9a", className: "Grade 9-A", days: [91, 92, 90, 93, 92, 91, 92] },
  { classId: "gulberg-o1", className: "O Level 1", days: [89, 90, 91, 88, 90, 89, 90] },
  { classId: "gulberg-hifz1", className: "Hifz Halaqa 1", days: [97, 98, 97, 96, 98, 97, 98] },
  { classId: "gulberg-hifz2", className: "Hifz Halaqa 2", days: [95, 93, 91, 92, 90, 91, 92] },
];
