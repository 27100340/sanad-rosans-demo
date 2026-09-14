/**
 * School-wide subject catalogue. The principal assigns a subject to a class and
 * a teacher, which creates a Subject Space (see lib/data/repo.ts). Subject names
 * and codes are the genuine Cambridge programmes Rosans lists on its website;
 * strands are the published syllabus headings, abbreviated.
 */
import type { SchoolClass, SectionName, SubjectSpace } from "@/lib/domain/types";

export interface Subject {
  id: string;
  name: string;
  code?: string;
  board: string;
  sections: SectionName[];
  strands: string[];
  syllabusUrl?: string;
  custom?: boolean;
}

const CIE = "https://www.cambridgeinternational.org/programmes-and-qualifications/";

export const SUBJECTS: Subject[] = [
  // Junior / Senior (Cambridge Lower Secondary)
  { id: "ls-english", name: "English", code: "0861", board: "Cambridge Lower Secondary", sections: ["Junior", "Senior"], strands: ["Reading", "Writing", "Speaking and listening"], syllabusUrl: `${CIE}cambridge-lower-secondary/curriculum/english/` },
  { id: "ls-maths", name: "Mathematics", code: "0862", board: "Cambridge Lower Secondary", sections: ["Junior", "Senior"], strands: ["Number", "Algebra", "Geometry and measure", "Statistics and probability", "Thinking and working mathematically"], syllabusUrl: `${CIE}cambridge-lower-secondary/curriculum/mathematics/` },
  { id: "ls-science", name: "Science", code: "0893", board: "Cambridge Lower Secondary", sections: ["Junior", "Senior"], strands: ["Biology", "Chemistry", "Physics", "Earth and space", "Thinking and working scientifically"], syllabusUrl: `${CIE}cambridge-lower-secondary/curriculum/science/` },
  { id: "ls-urdu", name: "Urdu", board: "School curriculum", sections: ["Junior", "Senior"], strands: ["Reading comprehension", "Grammar", "Composition", "Literature"] },
  { id: "ls-islamiyat", name: "Quran and Islamiyat", board: "School curriculum", sections: ["Montessori", "Junior", "Senior"], strands: ["Nazra and tajweed", "Selected surahs", "Seerah", "Aqaid and ibadat", "Akhlaq"] },
  { id: "ls-arabic", name: "Arabic", board: "School curriculum", sections: ["Junior", "Senior"], strands: ["Vocabulary", "Grammar", "Reading", "Conversation"] },
  { id: "ls-computing", name: "Computing", board: "School curriculum", sections: ["Junior", "Senior"], strands: ["Digital literacy", "Computational thinking", "Programming basics", "Online safety"] },
  // O Level compulsory (from the Rosans website)
  { id: "ol-maths", name: "Mathematics D", code: "4024", board: "Cambridge O Level", sections: ["Senior"], strands: ["Number", "Algebra and graphs", "Coordinate geometry", "Geometry", "Mensuration", "Trigonometry", "Transformations and vectors", "Probability", "Statistics"], syllabusUrl: `${CIE}cambridge-o-level-mathematics-d-4024/` },
  { id: "ol-english", name: "English Language", code: "1123", board: "Cambridge O Level", sections: ["Senior"], strands: ["Reading comprehension", "Summary", "Directed writing", "Composition"], syllabusUrl: `${CIE}cambridge-o-level-english-language-1123/` },
  { id: "ol-urdu", name: "Urdu (Second Language)", code: "3248", board: "Cambridge O Level", sections: ["Senior"], strands: ["Reading", "Writing", "Translation"], syllabusUrl: `${CIE}cambridge-o-level-urdu-second-language-3248/` },
  { id: "ol-pakstudies", name: "Pakistan Studies", code: "2059", board: "Cambridge O Level", sections: ["Senior"], strands: ["History and culture of Pakistan", "Environment of Pakistan"], syllabusUrl: `${CIE}cambridge-o-level-pakistan-studies-2059/` },
  { id: "ol-islamiyat", name: "Islamiyat", code: "2058", board: "Cambridge O Level", sections: ["Senior"], strands: ["Quran passages", "Hadith", "Life of the Prophet", "Early caliphs", "Articles of faith and pillars"], syllabusUrl: `${CIE}cambridge-o-level-islamiyat-2058/` },
  // O Level optional
  { id: "ol-physics", name: "Physics", code: "5054", board: "Cambridge O Level", sections: ["Senior"], strands: ["Motion, forces and energy", "Thermal physics", "Waves", "Electricity and magnetism", "Nuclear physics"], syllabusUrl: `${CIE}cambridge-o-level-physics-5054/` },
  { id: "ol-chemistry", name: "Chemistry", code: "5070", board: "Cambridge O Level", sections: ["Senior"], strands: ["States of matter", "Atoms and bonding", "Stoichiometry", "Acids, bases and salts", "Organic chemistry"], syllabusUrl: `${CIE}cambridge-o-level-chemistry-5070/` },
  { id: "ol-biology", name: "Biology", code: "5090", board: "Cambridge O Level", sections: ["Senior"], strands: ["Cells and organisation", "Nutrition and transport", "Respiration and excretion", "Reproduction and inheritance", "Ecology"], syllabusUrl: `${CIE}cambridge-o-level-biology-5090/` },
  { id: "ol-business", name: "Business Studies", code: "7115", board: "Cambridge O Level", sections: ["Senior"], strands: ["Business activity", "People in business", "Marketing", "Operations", "Finance"], syllabusUrl: `${CIE}cambridge-o-level-business-studies-7115/` },
  { id: "ol-commerce", name: "Commerce", code: "7100", board: "Cambridge O Level", sections: ["Senior"], strands: ["Production and trade", "Retail and wholesale", "Documents and finance", "Communication and transport"], syllabusUrl: `${CIE}cambridge-o-level-commerce-7100/` },
  { id: "ol-addmaths", name: "Additional Mathematics", code: "4037", board: "Cambridge O Level", sections: ["Senior"], strands: ["Functions", "Quadratics", "Logarithms", "Trigonometry", "Calculus", "Vectors"], syllabusUrl: `${CIE}cambridge-o-level-additional-mathematics-4037/` },
  { id: "ol-cs", name: "Computer Science", code: "2210", board: "Cambridge O Level", sections: ["Senior"], strands: ["Data representation", "Networks", "Hardware and software", "Algorithms and programming", "Databases"], syllabusUrl: `${CIE}cambridge-o-level-computer-science-2210/` },
  { id: "ol-food", name: "Food and Nutrition", code: "6065", board: "Cambridge O Level", sections: ["Senior"], strands: ["Nutrients", "Diet and health", "Food preparation", "Kitchen safety"], syllabusUrl: `${CIE}cambridge-o-level-food-and-nutrition-6065/` },
];

/** Creates a fresh Subject Space from a catalogue subject. Deterministic; no IO. */
export function buildSpace(subject: Subject, cls: SchoolClass, teacherId: string): SubjectSpace {
  const prefix = subject.code ?? subject.id.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  const syllabus = subject.strands.map((title, i) => ({ code: `${prefix}.${i + 1}`, title, subtopics: [] as string[] }));
  const resources = subject.syllabusUrl
    ? [{ id: "r-syllabus", title: `${subject.board} ${subject.name} syllabus`, kind: "syllabus" as const, url: subject.syllabusUrl, source: "Cambridge International", status: "approved" as const, tutorMayCite: true }]
    : [];
  return {
    id: `${cls.id}-${subject.id}`,
    branchId: cls.branchId,
    classId: cls.id,
    teacherId,
    subject: subject.name,
    subjectId: subject.id,
    subjectCode: subject.code ? `${subject.board} (${subject.code})` : subject.board,
    syllabus,
    resources,
    tutorRules: {
      allowedTopics: syllabus.slice(0, 2).map((t) => t.code),
      answerPolicy: "hint-only",
      language: "both",
      tone: "Warm, patient, one question at a time.",
      forbidden: ["Never give the final answer to a homework question"],
    },
    misconceptions: [],
    masteryByTopic: [],
  };
}
