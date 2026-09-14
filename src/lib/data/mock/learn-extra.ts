/**
 * Extra mock for the student, parent and teacher-insight views: Ahmed's
 * per-topic mastery, the re-teach map for Grade 8-B, internal resource notes
 * and the parent–teacher thread. Everything is fictional.
 */
import { daysAgoISO } from "@/lib/utils";

export interface TopicMastery {
  code: string;
  title: string;
  mastery: number; // 0..100
  trend: number; // pp vs last fortnight
}

export const AHMED_MASTERY: TopicMastery[] = [
  { code: "8Ni", title: "Integers, powers, roots", mastery: 86, trend: 3 },
  { code: "8Nf", title: "Fractions, %, ratio", mastery: 78, trend: 2 },
  { code: "8Ae", title: "Expressions and equations", mastery: 64, trend: 6 },
  { code: "8As", title: "Sequences and graphs", mastery: 55, trend: -2 },
];

export const AHMED_TREND = { weeks: ["W1", "W2", "W3", "W4", "W5", "W6"], marks: [64, 66, 65, 69, 70, 71] };
export const AHMED_STREAK_DAYS = 6;

export const AHMED_NUDGE = "You slipped on moving terms across the equals sign twice this week; 5-minute drill?";

export const AHMED_NEXT_ACTION = {
  title: "Five-minute drill: moving terms across the equals sign",
  body: "Two of your last three tutor sessions ended on a sign slip. Three short equations with the tutor will settle it before Thursday's sequences task.",
  href: "/portal/learn/tutor",
};

/** Weakest topic per student for the "who to re-teach what" list (students below the 65 band). */
export const RETEACH_MAP: Record<string, { topicCode: string; note: string }> = {
  "s-hamza-javed": { topicCode: "8Ae", note: "Expands brackets partially; multiplies only the first term." },
  "s-umar-farooq": { topicCode: "8Ae", note: "Writes final answers without working; cannot be credited for method." },
  "s-bilal-sattar": { topicCode: "8As", note: "Uses position plus difference for the nth term." },
  "s-ali-raza": { topicCode: "8As", note: "Reads the intercept as the gradient in y = mx + c." },
  "s-taha-yousaf": { topicCode: "8Nf", note: "Percentage change taken of the new value, not the original." },
};

export interface ResourceNotes {
  summary: string;
  sections: { heading: string; points: string[] }[];
}

export const RESOURCE_NOTES: Record<string, ResourceNotes> = {
  r6: {
    summary: "Class notes from Week 6 on solving linear equations, written up after the lesson for absent students and for the tutor to cite.",
    sections: [
      { heading: "Expanding a bracket", points: ["The number outside multiplies every term inside: 3(x + 4) = 3x + 12.", "Write the expanded line on its own before moving any terms."] },
      { heading: "Keeping the balance", points: ["Whatever you do to one side, do to the other.", "Subtracting 12 from both sides of 3x + 12 = 27 gives 3x = 15.", "Divide both sides, not just one: 3x = 15 gives x = 5."] },
      { heading: "Checking", points: ["Substitute the answer back into the original equation.", "3(5 + 4) = 27 confirms x = 5."] },
    ],
  },
  r7: {
    summary: "Term 1 revision pack covering Number and Algebra strands. Awaiting principal approval before the tutor may cite it.",
    sections: [
      { heading: "Contents", points: ["Twelve questions on integers, powers and roots.", "Ten questions on fractions, percentages and ratio.", "Fourteen questions on expressions and linear equations."] },
      { heading: "How to use", points: ["One section per evening; mark with the answers at the back.", "Bring any question you could not finish to the Thursday clinic."] },
    ],
  },
};

export interface ThreadMessage {
  id: string;
  from: "teacher" | "parent";
  date: string;
  text: string;
}

export const FAMILY_THREAD: ThreadMessage[] = [
  { id: "fm-1", from: "teacher", date: daysAgoISO(3), text: "Assalamu alaikum Mrs. Hassan. Ahmed's equations homework was excellent this week; he showed every step and checked his answer. I have asked him to try the sequences task early." },
  { id: "fm-2", from: "parent", date: daysAgoISO(2), text: "Wa alaikum assalam. JazakAllah khair, that is good to hear. He has been using the tutor in the evenings. Is there anything we should practise at home for sequences?" },
  { id: "fm-3", from: "teacher", date: daysAgoISO(1), text: "Ten minutes on the nth-term rule is enough: he should write the common difference first, then the times table, then adjust. The tutor will guide him without giving answers." },
];
