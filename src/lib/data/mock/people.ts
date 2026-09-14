/**
 * Mock people and classes. Names are plausible for the school's community;
 * every record is fictional. Numbers are chosen so the early-warning engine,
 * leadership comparisons, and Hifz views have something to show.
 */
import type { Guardian, Person, SchoolClass, Student, Teacher } from "@/lib/domain/types";

export const LEADERS: Person[] = [
  { id: "p-chairman", name: "Mr. Tariq Rosan", role: "chairman", branchId: null, title: "Chairman", avatarTone: "gold" },
  { id: "p-principal-gulberg", name: "Mrs. Saima Qureshi", role: "principal", branchId: "gulberg", title: "Principal, Gulberg", avatarTone: "accent" },
  { id: "p-principal-lakecity", name: "Mr. Faisal Mirza", role: "principal", branchId: "lakecity", title: "Principal, Lake City", avatarTone: "accent" },
  { id: "p-principal-paragon", name: "Mrs. Rabia Sheikh", role: "principal", branchId: "paragon", title: "Principal, Paragon City", avatarTone: "accent" },
];

export const TEACHERS: Teacher[] = [
  { id: "t-hina-raza", name: "Ms. Hina Raza", role: "teacher", branchId: "gulberg", subjects: ["Mathematics", "Mathematics D"], spaceIds: ["gulberg-g8b-maths", "gulberg-g7a-ls-maths", "gulberg-o1-ol-maths"], markingBacklog: 4, weeklyPeriods: 24, avatarTone: "accent" },
  { id: "t-sara-malik", name: "Ms. Sara Malik", role: "teacher", branchId: "gulberg", subjects: ["English Language"], spaceIds: ["gulberg-g8b-english", "gulberg-o1-ol-english"], markingBacklog: 11, weeklyPeriods: 26, avatarTone: "info" },
  { id: "t-usman-tariq", name: "Mr. Usman Tariq", role: "teacher", branchId: "gulberg", subjects: ["Science", "Physics"], spaceIds: ["gulberg-g8b-science", "gulberg-o1-ol-physics"], markingBacklog: 2, weeklyPeriods: 22, avatarTone: "ok" },
  { id: "t-ayesha-khan", name: "Ms. Ayesha Khan", role: "teacher", branchId: "gulberg", subjects: ["Islamiyat", "Arabic"], spaceIds: ["gulberg-g8b-islamiyat"], markingBacklog: 0, weeklyPeriods: 20, avatarTone: "gold" },
  { id: "t-bilal-ahmed", name: "Mr. Bilal Ahmed", role: "teacher", branchId: "gulberg", subjects: ["Urdu"], spaceIds: ["gulberg-g8b-urdu"], markingBacklog: 17, weeklyPeriods: 28, avatarTone: "warn" },
  { id: "t-qari-abdul-rehman", name: "Qari Abdul Rehman", role: "ustadh", branchId: "gulberg", subjects: ["Hifz"], spaceIds: [], markingBacklog: 0, weeklyPeriods: 30, avatarTone: "gold" },
  { id: "t-hafiz-imran", name: "Hafiz Imran Siddiqui", role: "ustadh", branchId: "gulberg", subjects: ["Hifz", "Tajweed"], spaceIds: [], markingBacklog: 0, weeklyPeriods: 30, avatarTone: "gold" },
];

type StudentSeed = [id: string, name: string, gender: "m" | "f", attendance: number, attTrend: number, avg: number, markTrend: number, guardianId?: string];

const G8B: StudentSeed[] = [
  ["s-ahmed-hassan", "Ahmed Hassan", "m", 94, 1, 71, 4, "g-nadia-hassan"],
  ["s-fatima-zubair", "Fatima Zubair", "f", 98, 0, 88, 2],
  ["s-hamza-javed", "Hamza Javed", "m", 76, -9, 52, -11],
  ["s-maryam-asif", "Maryam Asif", "f", 91, -2, 79, 1],
  ["s-ali-raza", "Ali Raza", "m", 88, -6, 63, -8],
  ["s-zainab-omer", "Zainab Omer", "f", 97, 1, 92, 3],
  ["s-bilal-sattar", "Bilal Sattar", "m", 83, -4, 58, -3],
  ["s-hira-nawaz", "Hira Nawaz", "f", 95, 0, 74, 0],
  ["s-saad-iqbal", "Saad Iqbal", "m", 90, 2, 67, 6],
  ["s-ayesha-tahir", "Ayesha Tahir", "f", 99, 0, 85, -1],
  ["s-umar-farooq", "Umar Farooq", "m", 69, -12, 47, -14],
  ["s-noor-shahid", "Noor Shahid", "f", 93, 1, 80, 5],
  ["s-taha-yousaf", "Taha Yousaf", "m", 86, -3, 61, -2],
  ["s-mahnoor-ali", "Mahnoor Ali", "f", 96, 0, 77, 2],
];

const HIFZ2: StudentSeed[] = [
  ["s-zaid-hassan", "Muhammad Zaid Hassan", "m", 96, 0, 0, 0, "g-nadia-hassan"],
  ["s-ibrahim-khalid", "Ibrahim Khalid", "m", 92, -3, 0, 0],
  ["s-yahya-anwar", "Yahya Anwar", "m", 88, -5, 0, 0],
  ["s-musa-rafiq", "Musa Rafiq", "m", 97, 1, 0, 0],
  ["s-hassan-nadeem", "Hassan Nadeem", "m", 79, -8, 0, 0],
  ["s-abdullah-saleem", "Abdullah Saleem", "m", 95, 0, 0, 0],
  ["s-talha-mehmood", "Talha Mehmood", "m", 90, 2, 0, 0],
  ["s-hamdan-riaz", "Hamdan Riaz", "m", 93, -1, 0, 0],
];

const O1: StudentSeed[] = [
  ["s-ali-hamza", "Ali Hamza", "m", 93, 1, 68, 5, "g-ali-hamza"],
  ["s-sana-khalid", "Sana Khalid", "f", 97, 0, 84, 2],
  ["s-daniyal-butt", "Daniyal Butt", "m", 81, -5, 55, -6],
  ["s-eman-siddiqui", "Eman Siddiqui", "f", 95, 1, 78, 3],
  ["s-rayyan-malik", "Rayyan Malik", "m", 89, -2, 62, 1],
  ["s-hafsa-tariq", "Hafsa Tariq", "f", 98, 0, 90, 4],
  ["s-owais-qadir", "Owais Qadir", "m", 74, -9, 49, -8],
  ["s-laiba-noor", "Laiba Noor", "f", 92, 0, 73, 0],
  ["s-shayan-ali", "Shayan Ali", "m", 87, -3, 66, -2],
  ["s-zoya-imran", "Zoya Imran", "f", 96, 1, 81, 2],
];

function seedStudents(seeds: StudentSeed[], branchId: "gulberg", classId: string, hifz = false): Student[] {
  return seeds.map(([id, name, gender, attendancePct, attendanceTrend, avgMark, markTrend, guardianId]) => ({
    id,
    name,
    firstName: name.replace(/^Muhammad\s+/, "").split(" ")[0],
    branchId,
    classId,
    gender,
    guardianId: guardianId ?? `g-${id.slice(2)}`,
    attendancePct,
    attendanceTrend,
    avgMark,
    markTrend,
    hifz,
  }));
}

export const STUDENTS: Student[] = [
  ...seedStudents(G8B, "gulberg", "gulberg-g8b"),
  ...seedStudents(HIFZ2, "gulberg", "gulberg-hifz2", true),
  ...seedStudents(O1, "gulberg", "gulberg-o1"),
];

export const CLASSES: SchoolClass[] = [
  { id: "gulberg-g8b", branchId: "gulberg", section: "Senior", name: "Grade 8-B", year: 8, classTeacherId: "t-hina-raza", studentIds: G8B.map((s) => s[0]) },
  { id: "gulberg-g7a", branchId: "gulberg", section: "Junior", name: "Grade 7-A", year: 7, classTeacherId: "t-sara-malik", studentIds: [] },
  { id: "gulberg-g9a", branchId: "gulberg", section: "Senior", name: "Grade 9-A", year: 9, classTeacherId: "t-usman-tariq", studentIds: [] },
  { id: "gulberg-o1", branchId: "gulberg", section: "Senior", name: "O Level 1", year: 10, classTeacherId: "t-sara-malik", studentIds: O1.map((s) => s[0]) },
  { id: "gulberg-hifz2", branchId: "gulberg", section: "Hifz", name: "Hifz Halaqa 2", year: 0, classTeacherId: "t-qari-abdul-rehman", studentIds: HIFZ2.map((s) => s[0]) },
  { id: "gulberg-hifz1", branchId: "gulberg", section: "Hifz", name: "Hifz Halaqa 1", year: 0, classTeacherId: "t-hafiz-imran", studentIds: [] },
];

export const GUARDIANS: Guardian[] = [
  { id: "g-nadia-hassan", name: "Mrs. Nadia Hassan", studentIds: ["s-ahmed-hassan", "s-zaid-hassan"], preferredLanguage: "ur", phoneMasked: "+92 3•• ••• 4821" },
  { id: "g-ali-hamza", name: "Mr. Hamza Iqbal", studentIds: ["s-ali-hamza"], preferredLanguage: "en", phoneMasked: "+92 3•• ••• 7730" },
  ...STUDENTS.filter((s) => s.guardianId !== "g-nadia-hassan" && s.guardianId !== "g-ali-hamza").map((s) => ({
    id: s.guardianId,
    name: `Parent of ${s.firstName}`,
    studentIds: [s.id],
    preferredLanguage: "en" as const,
    phoneMasked: "+92 3•• ••• ••••",
  })),
];

export const peopleById = new Map<string, Person>([...LEADERS, ...TEACHERS].map((p) => [p.id, p]));
export const teacherById = new Map(TEACHERS.map((t) => [t.id, t]));
export const studentById = new Map(STUDENTS.map((s) => [s.id, s]));
export const classById = new Map(CLASSES.map((c) => [c.id, c]));
export const guardianById = new Map(GUARDIANS.map((g) => [g.id, g]));

export function studentsInClass(classId: string): Student[] {
  return STUDENTS.filter((s) => s.classId === classId);
}
