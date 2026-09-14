export type Stage = "early-years" | "primary" | "lower-secondary" | "o-level";
export const STAGES: Record<
  Stage,
  {
    label: string;
    approach: string;
    assessment: string;
    home: string;
    minutes: number;
    subjects: string[];
  }
> = {
  "early-years": {
    label: "Montessori & Early Years",
    approach:
      "Adult-guided play, stories, movement and concrete objects. One short activity at a time.",
    assessment:
      "Observation: emerging, developing or secure. No timed exams or competitive rankings.",
    home: "A five-minute shared story or practical activity with a parent; no independent AI chat.",
    minutes: 15,
    subjects: [
      "Communication & language",
      "Early numeracy",
      "Practical life",
      "Sensory exploration",
      "Physical development",
      "Islamic manners",
    ],
  },
  primary: {
    label: "Primary · Grades 1–6",
    approach:
      "Concrete → pictorial → abstract. Reading fluency, number sense, discovery and short guided practice.",
    assessment:
      "Low-stakes checks, reading records, portfolios and supportive feedback; no O Level papers.",
    home: "Short reading and practical tasks with guardian support. Build confidence before speed.",
    minutes: 30,
    subjects: [
      "English",
      "Mathematics",
      "Science",
      "Urdu",
      "Islamiyat",
      "Social studies",
      "Computing",
      "Art & PE",
    ],
  },
  "lower-secondary": {
    label: "Lower Secondary · Grades 7–8",
    approach:
      "Explain, model, practise and investigate. Identify misconceptions and plan targeted support.",
    assessment:
      "Topic quizzes, practical work and structured responses aligned to taught objectives.",
    home: "A manageable revision plan using teacher-approved resources and guided tutor hints.",
    minutes: 40,
    subjects: [
      "English",
      "Mathematics",
      "Science",
      "Urdu",
      "Islamiyat",
      "History & geography",
      "Computing",
    ],
  },
  "o-level": {
    label: "O Levels · Years 1–3",
    approach:
      "Syllabus outcomes, command words, worked examples, practical skills and exam technique.",
    assessment:
      "Topic tests, past papers, mark-scheme feedback and supervised mocks. No A Level content.",
    home: "Spaced revision and targeted practice from released papers in enrolled subjects.",
    minutes: 45,
    subjects: [
      "Mathematics D 4024",
      "English Language 1123",
      "Physics 5054",
      "Chemistry 5070",
      "Biology 5090",
      "Urdu",
      "Islamiyat",
      "Pakistan Studies",
      "Computer Science",
    ],
  },
};
export function stageFor(c: {
  name: string;
  year: number;
  section: string;
}): Stage {
  if (c.section === "Hifz")
    throw new Error("Hifz uses its own teaching pathway.");
  if (c.section === "Montessori" || c.year === 0) return "early-years";
  if (/o level/i.test(c.name) || c.year >= 9) return "o-level";
  return c.year <= 6 ? "primary" : "lower-secondary";
}
export interface LessonPlan {
  id: string;
  classId: string;
  teacherId: string;
  stage: Stage;
  subject: string;
  title: string;
  objective: string;
  activity: string;
  assessment: string;
  home: string;
  date: string;
  status: "draft" | "published";
}
export interface LearningObservation {
  id: string;
  classId: string;
  studentId: string;
  teacherId: string;
  note: string;
  attainment: "emerging" | "developing" | "secure";
  at: string;
}
export function lessonTemplate(stage: Stage, year: number) {
  if (stage === "early-years")
    return {
      title: "Sort, count and tell",
      objective:
        "Sort everyday objects by one visible feature and describe the grouping.",
      activity:
        "Model sorting large safe classroom objects by colour; children choose another way to group them. Adult asks: what is the same? Offer pointing and home-language responses.",
      assessment:
        "Observe matching and explanation: emerging with adult help, developing with a prompt, secure independently. Record a specific observation.",
      home: "With a parent, find three pairs of household objects. Avoid small choking hazards.",
    };
  if (stage === "primary" && year <= 3)
    return {
      title: "Make and explain number bonds",
      objective: `Represent a total ${year === 1 ? "within 10" : "within 20"} in two different ways.`,
      activity:
        "Use counters, draw the groups, then write the addition sentence. Partners explain their representation. Provide a ten-frame for support and a missing-part problem for extension.",
      assessment:
        "Ask each child to draw two groups with the same total. Note who counts all, counts on or recalls a fact.",
      home: "Spend five minutes making a number with household objects and explain it to a guardian.",
    };
  if (stage === "primary")
    return {
      title: "Fractions we can see",
      objective:
        "Compare simple fractions using equal-sized wholes and justify the comparison.",
      activity:
        "Fold equal paper strips into halves, quarters and eighths. Compare using diagrams before symbols; challenge confident learners to explain equivalence.",
      assessment:
        "Exit check: explain why one half is the same as two quarters using a drawing, not only a rule.",
      home: "Sketch a fair-sharing example and explain why all parts must be equal.",
    };
  if (stage === "lower-secondary")
    return {
      title: "Keep equations balanced",
      objective:
        "Solve a one-step or two-step equation and verify by substitution.",
      activity:
        "Model a balance diagram, connect it to notation, then compare a correct and incorrect solution. Use one-step scaffolds and two-step extension tasks.",
      assessment:
        "Exit check: solve 3x + 5 = 20 and show the same operation on both sides. Teacher checks reasoning before assigning intervention.",
      home: "Correct one sign-error example and practise three teacher-selected questions.",
    };
  return {
    title: "Algebra: reasoning for full marks",
    objective:
      "Solve simultaneous linear equations and communicate a complete method.",
    activity:
      "Model elimination, compare substitution, then practise an original exam-style problem. Discuss method marks, arithmetic checks and clear notation.",
    assessment:
      "Use a short teacher-marked response: method, accuracy and verification. Release answers after submission; schedule a supervised mock only after teaching.",
    home: "Use assigned Mathematics D resources to practise weak steps; keep an error log.",
  };
}
