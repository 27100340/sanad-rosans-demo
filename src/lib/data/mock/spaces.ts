/**
 * Subject Spaces. Syllabus strands and resource links are genuine (Cambridge
 * Lower Secondary Stage 8 and the O Level pages the school will progress to);
 * class analytics are mock.
 */
import type { Assignment, SubjectSpace, Submission } from "@/lib/domain/types";
import { daysAgoISO } from "@/lib/utils";
import { classById } from "./people";
import { SUBJECTS, buildSpace } from "./subjects";
import { singleton } from "../store";

const MATHS_STAGE8: SubjectSpace["syllabus"] = [
  { code: "8Ni", title: "Number: integers, powers and roots", subtopics: ["Negative numbers", "Squares, cubes and roots", "Laws of indices", "Standard form"] },
  { code: "8Nf", title: "Number: fractions, decimals, percentages, ratio", subtopics: ["Recurring decimals", "Percentage change", "Ratio and proportion", "Compound measures"] },
  { code: "8Ae", title: "Algebra: expressions, formulae and equations", subtopics: ["Expanding brackets", "Factorising", "Linear equations", "Changing the subject", "Inequalities"] },
  { code: "8As", title: "Algebra: sequences, functions and graphs", subtopics: ["nth term", "Linear functions", "Gradient and intercept", "Simultaneous equations (graphical)"] },
  { code: "8Gg", title: "Geometry: angles, shapes and constructions", subtopics: ["Angles in parallel lines", "Polygons", "Bearings", "Constructions"] },
  { code: "8Gm", title: "Geometry: measurement", subtopics: ["Area of trapezia and circles", "Volume of prisms", "Surface area", "Circumference"] },
  { code: "8Gp", title: "Geometry: position and transformation", subtopics: ["Reflection, rotation, translation", "Enlargement", "Coordinates and midpoints"] },
  { code: "8Ss", title: "Statistics", subtopics: ["Frequency tables", "Averages and range", "Scatter graphs", "Pie charts"] },
  { code: "8Sp", title: "Probability", subtopics: ["Probability scale", "Mutually exclusive events", "Experimental vs theoretical", "Sample space diagrams"] },
];

const SEED_SPACES: SubjectSpace[] = [
  {
    id: "gulberg-g8b-maths",
    branchId: "gulberg",
    classId: "gulberg-g8b",
    teacherId: "t-hina-raza",
    subject: "Mathematics",
    subjectCode: "Cambridge Lower Secondary Stage 8 (0862)",
    syllabus: MATHS_STAGE8,
    resources: [
      { id: "r1", title: "Cambridge Lower Secondary Mathematics curriculum framework", kind: "syllabus", url: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-lower-secondary/curriculum/mathematics/", source: "Cambridge International", status: "approved", tutorMayCite: true },
      { id: "r2", title: "Cambridge O Level Mathematics D (4024) syllabus and past papers", kind: "past-papers", url: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-o-level-mathematics-d-4024/past-papers/", source: "Cambridge International", status: "approved", tutorMayCite: true },
      { id: "r3", title: "Khan Academy · 8th grade mathematics", kind: "video", url: "https://www.khanacademy.org/math/cc-eighth-grade-math", source: "Khan Academy", status: "approved", tutorMayCite: true, topicCodes: ["8Ae", "8As", "8Gg"] },
      { id: "r4", title: "Corbettmaths · videos and practice by topic", kind: "worksheet", url: "https://corbettmaths.com/contents/", source: "Corbettmaths", status: "approved", tutorMayCite: true },
      { id: "r5", title: "OpenStax · Prealgebra 2e (open textbook)", kind: "textbook", url: "https://openstax.org/details/books/prealgebra-2e", source: "OpenStax", status: "approved", tutorMayCite: true },
      { id: "r6", title: "Linear equations · class notes (Week 6)", kind: "notes", url: "/portal/teach/gulberg-g8b-maths/resources/r6", source: "Teacher upload", status: "approved", tutorMayCite: true, topicCodes: ["8Ae"] },
      { id: "r7", title: "Term 1 revision pack", kind: "worksheet", url: "/portal/teach/gulberg-g8b-maths/resources/r7", source: "Teacher upload", status: "pending", tutorMayCite: false },
    ],
    tutorRules: {
      allowedTopics: ["8Ni", "8Nf", "8Ae", "8As"],
      answerPolicy: "hint-only",
      language: "both",
      tone: "Warm, patient, asks one question at a time, praises effort not talent.",
      forbidden: ["Never give the final numeric answer to a homework question", "Never reveal the mark scheme", "Do not help with topics after 8As until the teacher unlocks them"],
    },
    misconceptions: [
      { tag: "sign-error-moving-terms", count: 19, example: "3x + 5 = 20 → 3x = 25" },
      { tag: "divides-only-one-side", count: 12, example: "2x = 10 → x = 10" },
      { tag: "expands-bracket-partially", count: 9, example: "3(x + 4) = 3x + 4" },
      { tag: "confuses-gradient-intercept", count: 7, example: "y = 2x + 3 has gradient 3" },
      { tag: "nth-term-uses-position-plus-difference", count: 5, example: "5, 8, 11 → nth term n + 3" },
    ],
    masteryByTopic: [
      { code: "8Ni", title: "Integers, powers, roots", classAvg: 81 },
      { code: "8Nf", title: "Fractions, %, ratio", classAvg: 74 },
      { code: "8Ae", title: "Expressions and equations", classAvg: 62 },
      { code: "8As", title: "Sequences and graphs", classAvg: 58 },
    ],
  },
  {
    id: "gulberg-g8b-english",
    branchId: "gulberg",
    classId: "gulberg-g8b",
    teacherId: "t-sara-malik",
    subject: "English Language",
    subjectCode: "Cambridge Lower Secondary Stage 8 (0861)",
    syllabus: [
      { code: "8R", title: "Reading", subtopics: ["Inference", "Writer's purpose", "Language analysis"] },
      { code: "8W", title: "Writing", subtopics: ["Narrative", "Persuasive", "Summary"] },
      { code: "8SL", title: "Speaking and listening", subtopics: ["Presentations", "Discussion"] },
    ],
    resources: [
      { id: "e1", title: "Cambridge Lower Secondary English curriculum framework", kind: "syllabus", url: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-lower-secondary/curriculum/english/", source: "Cambridge International", status: "approved", tutorMayCite: true },
      { id: "e2", title: "Cambridge O Level English Language (1123)", kind: "past-papers", url: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-o-level-english-language-1123/", source: "Cambridge International", status: "approved", tutorMayCite: true },
    ],
    tutorRules: { allowedTopics: ["8R", "8W"], answerPolicy: "worked-example", language: "en", tone: "Encouraging editor.", forbidden: ["Never write the essay for the student"] },
    misconceptions: [
      { tag: "comma-splice", count: 22, example: "It was late, we went home." },
      { tag: "no-evidence-for-inference", count: 14, example: "The writer feels sad." },
    ],
    masteryByTopic: [
      { code: "8R", title: "Reading", classAvg: 72 },
      { code: "8W", title: "Writing", classAvg: 66 },
    ],
  },
  {
    id: "gulberg-g8b-science",
    branchId: "gulberg",
    classId: "gulberg-g8b",
    teacherId: "t-usman-tariq",
    subject: "Science",
    subjectCode: "Cambridge Lower Secondary Stage 8 (0893)",
    syllabus: [
      { code: "8B", title: "Biology", subtopics: ["Respiration", "Ecosystems", "Diet"] },
      { code: "8C", title: "Chemistry", subtopics: ["Particle model", "Elements and compounds", "Reactions"] },
      { code: "8P", title: "Physics", subtopics: ["Forces", "Light", "Magnetism"] },
    ],
    resources: [
      { id: "s1", title: "Cambridge Lower Secondary Science curriculum framework", kind: "syllabus", url: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-lower-secondary/curriculum/science/", source: "Cambridge International", status: "approved", tutorMayCite: true },
      { id: "s2", title: "PhET interactive simulations", kind: "link", url: "https://phet.colorado.edu/en/simulations/browse", source: "University of Colorado", status: "approved", tutorMayCite: true },
    ],
    tutorRules: { allowedTopics: ["8B", "8C", "8P"], answerPolicy: "hint-only", language: "both", tone: "Curious lab partner.", forbidden: [] },
    misconceptions: [{ tag: "mass-lost-in-reaction", count: 10, example: "The ash weighs less so mass was destroyed." }],
    masteryByTopic: [
      { code: "8B", title: "Biology", classAvg: 78 },
      { code: "8C", title: "Chemistry", classAvg: 69 },
      { code: "8P", title: "Physics", classAvg: 64 },
    ],
  },
  {
    id: "gulberg-g8b-islamiyat",
    branchId: "gulberg",
    classId: "gulberg-g8b",
    teacherId: "t-ayesha-khan",
    subject: "Islamiyat",
    subjectCode: "Towards Cambridge O Level Islamiyat (2058)",
    syllabus: [
      { code: "I1", title: "Quran passages and themes", subtopics: ["Selected surahs", "Tafsir themes"] },
      { code: "I2", title: "Life of the Prophet ﷺ", subtopics: ["Makkan period", "Madinan period"] },
      { code: "I3", title: "Articles of faith and pillars", subtopics: ["Tawhid", "Salah", "Zakat", "Hajj"] },
    ],
    resources: [
      { id: "i1", title: "Cambridge O Level Islamiyat (2058) syllabus", kind: "syllabus", url: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-o-level-islamiyat-2058/", source: "Cambridge International", status: "approved", tutorMayCite: true },
      { id: "i2", title: "Quran.com · text, translation and tafsir", kind: "link", url: "https://quran.com", source: "Quran Foundation", status: "approved", tutorMayCite: true },
    ],
    tutorRules: { allowedTopics: ["I1", "I2", "I3"], answerPolicy: "worked-example", language: "both", tone: "Respectful, cites sources, never issues rulings.", forbidden: ["Never give fatwa; refer to the teacher"] },
    misconceptions: [],
    masteryByTopic: [
      { code: "I1", title: "Quran", classAvg: 84 },
      { code: "I2", title: "Seerah", classAvg: 79 },
    ],
  },
];

/** Ms. Hina Raza's second space, seeded exactly as the principal's assign form seeds one. */
function seedSpaces(): SubjectSpace[] {
  const spaces = [...SEED_SPACES];
  const lsMaths = SUBJECTS.find((s) => s.id === "ls-maths");
  const g7a = classById.get("gulberg-g7a");
  if (lsMaths && g7a) spaces.push(buildSpace(lsMaths, g7a, "t-hina-raza"));
  // O Level 1: the Cambridge subjects whose past papers are in the bank.
  const o1 = classById.get("gulberg-o1");
  const olevel: [subjectId: string, teacherId: string][] = [["ol-maths", "t-hina-raza"], ["ol-physics", "t-usman-tariq"], ["ol-english", "t-sara-malik"]];
  for (const [subjectId, teacherId] of olevel) {
    const subject = SUBJECTS.find((s) => s.id === subjectId);
    if (subject && o1) spaces.push(buildSpace(subject, o1, teacherId));
  }
  return spaces;
}

export const SPACES: SubjectSpace[] = singleton("spaces", seedSpaces);
export const spaceById: Map<string, SubjectSpace> = singleton("spaceById", () => new Map(SPACES.map((s) => [s.id, s])));

const SEED_ASSIGNMENTS: Assignment[] = [
  {
    id: "a-maths-linear-1",
    spaceId: "gulberg-g8b-maths",
    title: "Solving linear equations (set A)",
    topicCode: "8Ae",
    dueDate: daysAgoISO(-2),
    maxMarks: 4,
    question: "Solve 3(x + 4) = 27 and show every step.",
    markScheme: [
      "M1: expands bracket correctly to 3x + 12",
      "M1: subtracts 12 from both sides to obtain 3x = 15",
      "A1: x = 5",
      "B1: shows checking by substitution",
    ],
    submissions: [
      {
        id: "sub-ahmed-1",
        assignmentId: "a-maths-linear-1",
        studentId: "s-ahmed-hassan",
        answer: "3(x+4) = 27\n3x + 12 = 27\n3x = 27 - 12 = 15\nx = 15/3 = 5\nCheck: 3(5+4) = 27 ✓",
        status: "ai-marked",
        awarded: 4,
        points: [
          { label: "M1 expands bracket", earned: true, evidence: "3x + 12 = 27" },
          { label: "M1 isolates 3x", earned: true, evidence: "3x = 27 - 12 = 15" },
          { label: "A1 x = 5", earned: true, evidence: "x = 15/3 = 5" },
          { label: "B1 checks", earned: true, evidence: "Check: 3(5+4) = 27" },
        ],
        feedback: "Every step shown and checked. Next time, write the bracket expansion on its own line before moving terms.",
      },
      {
        id: "sub-hamza-1",
        assignmentId: "a-maths-linear-1",
        studentId: "s-hamza-javed",
        answer: "3(x+4)=27\n3x+4=27\n3x=23\nx=7.6",
        status: "ai-marked",
        awarded: 0,
        points: [
          { label: "M1 expands bracket", earned: false, evidence: "wrote 3x + 4 (only x multiplied by 3)" },
          { label: "M1 isolates 3x", earned: false, evidence: "follow-through not allowed: bracket error" },
          { label: "A1 x = 5", earned: false, evidence: "x = 7.6" },
          { label: "B1 checks", earned: false, evidence: "no check shown" },
        ],
        feedback: "The 3 multiplies both x and 4. Try expanding 3(x + 4) as 3×x + 3×4 first, then continue.",
      },
      { id: "sub-ali-1", assignmentId: "a-maths-linear-1", studentId: "s-ali-raza", answer: "3x + 12 = 27, 3x = 15, x = 5", status: "pending" },
      { id: "sub-umar-1", assignmentId: "a-maths-linear-1", studentId: "s-umar-farooq", answer: "x = 5", status: "pending" },
    ],
  },
  {
    id: "a-maths-seq-1",
    spaceId: "gulberg-g8b-maths",
    title: "nth term of linear sequences",
    topicCode: "8As",
    dueDate: daysAgoISO(-5),
    maxMarks: 3,
    question: "Find the nth term of the sequence 5, 8, 11, 14, ...",
    markScheme: ["M1: identifies common difference 3", "M1: writes 3n", "A1: 3n + 2"],
    submissions: [],
  },
];

export const ASSIGNMENTS: Assignment[] = singleton("assignments", () => [...SEED_ASSIGNMENTS]);

export function addAssignment(input: Omit<Assignment, "id" | "submissions">): Assignment {
  const a: Assignment = { ...input, id: `a-${input.spaceId}-${Date.now().toString(36)}`, submissions: [] };
  ASSIGNMENTS.push(a);
  return a;
}

/** A student's submission; resubmission before marking replaces the answer. */
export function submitAssignment(assignment: Assignment, studentId: string, answer: string): Submission {
  const existing = assignment.submissions.find((s) => s.studentId === studentId);
  if (existing && existing.status === "pending") {
    existing.answer = answer;
    return existing;
  }
  if (existing) return existing;
  const sub: Submission = { id: `sub-${studentId}-${assignment.id}`, assignmentId: assignment.id, studentId, answer, status: "pending" };
  assignment.submissions.push(sub);
  return sub;
}

export function assignmentsForSpace(spaceId: string): Assignment[] {
  return ASSIGNMENTS.filter((a) => a.spaceId === spaceId);
}

export function spacesForClass(classId: string): SubjectSpace[] {
  return SPACES.filter((s) => s.classId === classId);
}
