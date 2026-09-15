/**
 * Domain types. Pure; no IO. Mirrors the production schema in
 * general-spec/02-architecture.md. The demo's mock repositories return
 * exactly these shapes, so Supabase can replace them without touching UI.
 */
import type { BranchId } from "@/lib/config/school";

export type Role =
  | "chairman"
  | "principal"
  | "coordinator"
  | "teacher"
  | "ustadh"
  | "student"
  | "parent"
  | "registrar"
  | "finance";

export type SectionName = "Montessori" | "Junior" | "Senior" | "Hifz";

export interface Person {
  id: string;
  name: string;
  role: Role;
  branchId: BranchId | null; // chairman: null (all branches)
  title?: string; // e.g. "Principal, Gulberg"
  avatarTone?: "accent" | "gold" | "info" | "ok" | "warn";
}

export interface SchoolClass {
  id: string;
  branchId: BranchId;
  section: SectionName;
  name: string; // "Grade 8-B", "Hifz Halaqa 2"
  year: number; // grade number; Hifz uses 0
  classTeacherId: string;
  studentIds: string[];
}

export interface Student {
  id: string;
  name: string;
  firstName: string;
  branchId: BranchId;
  classId: string;
  gender: "m" | "f";
  guardianId: string;
  attendancePct: number; // this term
  attendanceTrend: number; // delta vs last month, percentage points
  avgMark: number; // this term
  markTrend: number; // delta vs last term
  hifz?: boolean;
}

export interface Guardian {
  id: string;
  name: string;
  studentIds: string[];
  preferredLanguage: "en" | "ur";
  phoneMasked: string;
}

export interface Teacher extends Person {
  role: "teacher" | "ustadh";
  subjects: string[];
  spaceIds: string[];
  markingBacklog: number; // ungraded submissions
  weeklyPeriods: number;
}

export type ResourceKind = "syllabus" | "past-papers" | "textbook" | "video" | "notes" | "worksheet" | "link";
export type ResourceStatus = "approved" | "pending" | "draft";

export interface Resource {
  id: string;
  title: string;
  kind: ResourceKind;
  url: string; // genuine URL or internal path
  source: string; // "Cambridge International", "Khan Academy", "Teacher upload"
  status: ResourceStatus;
  tutorMayCite: boolean;
  topicCodes?: string[];
}

export type AnswerPolicy = "hint-only" | "worked-example" | "full";

export interface TutorRules {
  allowedTopics: string[]; // syllabus codes or topic names
  answerPolicy: AnswerPolicy;
  language: "en" | "ur" | "both";
  tone: string;
  forbidden: string[]; // e.g. "never give the final numeric answer"
}

export interface SyllabusTopic {
  code: string;
  title: string;
  subtopics: string[];
}

export interface SubjectSpace {
  id: string;
  branchId: BranchId;
  classId: string;
  teacherId: string;
  subject: string;
  subjectId?: string; // catalogue id (lib/data/mock/subjects.ts); seeded spaces resolve by name
  subjectCode?: string; // e.g. "4024" Cambridge O Level Mathematics D
  syllabus: SyllabusTopic[];
  resources: Resource[];
  tutorRules: TutorRules;
  misconceptions: { tag: string; count: number; example: string }[];
  masteryByTopic: { code: string; title: string; classAvg: number }[];
}

export type SubmissionStatus = "pending" | "ai-marked" | "teacher-approved";

export interface MarkPoint {
  label: string;
  earned: boolean;
  evidence: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  answer: string;
  status: SubmissionStatus;
  awarded?: number;
  points?: MarkPoint[];
  feedback?: string;
}

export interface Assignment {
  id: string;
  spaceId: string;
  title: string;
  topicCode: string;
  dueDate: string; // ISO
  maxMarks: number;
  question: string;
  markScheme: string[]; // one line per mark point
  instructions?: string;
  createdBy?: string;
  submissions: Submission[];
}

export type RiskLevel = "high" | "medium" | "watch";

export interface RiskFlag {
  studentId: string;
  level: RiskLevel;
  score: number; // 0-100
  reasons: string[];
  ownerId: string; // teacher or ustadh responsible
}

export interface TarbiyahLog {
  id: string;
  studentId: string;
  teacherId: string;
  date: string;
  kind: "punctuality" | "salah" | "akhlaq" | "helpfulness" | "effort" | "concern";
  positive: boolean;
  note: string;
}

export interface Announcement {
  id: string;
  scope: "school" | BranchId;
  authorId: string;
  date: string;
  title: string;
  body: string;
}

export interface TimetableEntry {
  classId: string;
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
  period: number; // 1..8
  subject: string;
  teacherId: string;
  room: string;
}

export interface ParentMessage {
  id: string;
  branchId: BranchId;
  guardianId: string;
  date: string;
  text: string;
  triage?: "urgent" | "routine" | "praise";
}

export interface BranchStats {
  branchId: BranchId;
  students: number;
  teachers: number;
  attendanceToday: number; // %
  attendanceTrend: number; // pp vs last week
  avgMark: number;
  feeCollectedPct: number; // this month
  feeCollectedPKR: number;
  atRisk: number;
  hifzStudents: number;
  markingBacklog: number;
}

/* ---------------- Hifz ---------------- */

export interface Ayah {
  surah: number;
  ayah: number;
  textUthmani: string;
  textSimple: string; // without diacritics
  translationEn: string;
  audioUrl: string; // per-ayah MP3
}

export interface Surah {
  number: number;
  nameArabic: string;
  nameEnglish: string;
  nameTransliterated: string;
  ayahCount: number;
  juz: number;
}

export type HifzUnitKind = "sabaq" | "sabqi" | "manzil";

export interface HifzUnit {
  id: string;
  studentId: string;
  surah: number;
  fromAyah: number;
  toAyah: number;
  // spaced-repetition state (SM-2 adapted)
  ease: number; // 1.3 .. 2.8
  intervalDays: number;
  dueDate: string; // ISO
  lastScore: number | null; // 0..100
  reviews: number;
  lapses: number;
  status: "new" | "learning" | "secure" | "weak";
}

export interface HifzPlan {
  studentId: string;
  ustadhId: string;
  currentJuz: number;
  currentSurah: number;
  dailySabaqAyat: number;
  juzCompleted: number[]; // e.g. [30, 29, 28]
  targetCompletionYear: number;
}

export type WordState = "ok" | "sub" | "miss" | "ins";

export interface WordDiff {
  expected: string | null; // canonical word (null for inserted)
  heard: string | null; // transcribed word (null for omitted)
  state: WordState;
  index: number; // position in canonical text; inserted words take the index of the following canonical word
}

export interface RecitationResult {
  surah: number;
  fromAyah: number;
  toAyah: number;
  transcript: string;
  words: WordDiff[];
  correct: number;
  substituted: number;
  omitted: number;
  inserted: number;
  score: number; // 0..100
  passed: boolean;
  tajweedNotes: string[];
  source: "gemini" | "whisper" | "browser-speech" | "simulated";
}

export interface RecitationAttempt extends RecitationResult {
  id: string;
  studentId: string;
  unitId: string;
  date: string;
}

export interface MutashabihPair {
  a: { surah: number; ayah: number };
  b: { surah: number; ayah: number };
  sharedPhrase: string;
  difference: string;
}
