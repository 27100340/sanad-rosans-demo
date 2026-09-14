/**
 * Question bank. Authored questions in the style of Cambridge Lower Secondary
 * Stage 8 (Mathematics 8Ae / 8As, Science 8B / 8C / 8P) and one O Level
 * Mathematics D structured item with a text mark scheme. `answer` and
 * `markScheme` are server-only; use `forStudent()` before sending to a client.
 */
import type { Question } from "@/lib/domain/assessment";
import { singleton } from "../store";

const SEED_QUESTIONS: Question[] = [
  // ---- Mathematics · 8Ae expressions, formulae and equations ----
  { id: "q-m-01", subjectId: "ls-maths", topicCode: "8Ae", type: "mcq", stem: "Expand 3(x + 4).", options: ["3x + 4", "3x + 12", "x + 12", "3x + 7"], answer: "1", markScheme: ["B1: 3x + 12"], marks: 1, difficulty: "core", source: "authored" },
  { id: "q-m-02", subjectId: "ls-maths", topicCode: "8Ae", type: "numeric", stem: "Solve 3(x + 4) = 27. Give the value of x.", answer: "5", markScheme: ["A1: x = 5"], marks: 1, difficulty: "core", source: "authored" },
  { id: "q-m-03", subjectId: "ls-maths", topicCode: "8Ae", type: "structured", stem: "Solve 5x - 7 = 2x + 11. Show every step.", answer: "5x - 2x = 11 + 7; 3x = 18; x = 6", markScheme: ["M1: collects x terms on one side, 3x = 18", "A1: x = 6", "B1: checks by substitution"], marks: 3, difficulty: "core", source: "authored" },
  { id: "q-m-04", subjectId: "ls-maths", topicCode: "8Ae", type: "mcq", stem: "Which expression is equivalent to 2(a - 3) + 4a?", options: ["6a - 3", "6a - 6", "2a - 6", "8a - 6"], answer: "1", markScheme: ["B1: 6a - 6"], marks: 1, difficulty: "core", source: "authored" },
  { id: "q-m-05", subjectId: "ls-maths", topicCode: "8Ae", type: "numeric", stem: "Factorise fully 12x + 18. State the highest common factor you took out.", answer: "6", markScheme: ["A1: 6"], marks: 1, difficulty: "core", source: "authored" },
  { id: "q-m-06", subjectId: "ls-maths", topicCode: "8Ae", type: "structured", stem: "Make x the subject of y = 4x - 9.", answer: "y + 9 = 4x; x = (y + 9) / 4", markScheme: ["M1: adds 9 to both sides, y + 9 = 4x", "A1: x = (y + 9)/4"], marks: 2, difficulty: "extended", source: "authored" },
  // ---- Mathematics · 8As sequences, functions and graphs ----
  { id: "q-m-07", subjectId: "ls-maths", topicCode: "8As", type: "mcq", stem: "The nth term of the sequence 5, 8, 11, 14, ... is", options: ["n + 3", "3n + 2", "3n - 2", "5n"], answer: "1", markScheme: ["B1: 3n + 2"], marks: 1, difficulty: "core", source: "authored" },
  { id: "q-m-08", subjectId: "ls-maths", topicCode: "8As", type: "numeric", stem: "Find the 20th term of the sequence with nth term 4n - 1.", answer: "79", markScheme: ["A1: 79"], marks: 1, difficulty: "core", source: "authored" },
  { id: "q-m-09", subjectId: "ls-maths", topicCode: "8As", type: "mcq", stem: "The line y = 2x + 3 has", options: ["gradient 3, intercept 2", "gradient 2, intercept 3", "gradient 5, intercept 0", "gradient 2, intercept -3"], answer: "1", markScheme: ["B1: gradient 2, intercept 3"], marks: 1, difficulty: "core", source: "authored" },
  { id: "q-m-10", subjectId: "ls-maths", topicCode: "8As", type: "structured", stem: "A sequence has nth term 7 - 2n. Write the first three terms and state whether the sequence is increasing or decreasing, giving a reason.", answer: "5, 3, 1; decreasing because the coefficient of n is negative", markScheme: ["B1: 5, 3, 1", "B1: decreasing", "B1: reason refers to the negative coefficient or subtracting 2 each time"], marks: 3, difficulty: "core", source: "authored" },
  { id: "q-m-11", subjectId: "ls-maths", topicCode: "8As", type: "numeric", stem: "The point (4, k) lies on the line y = 3x - 5. Find k.", answer: "7", markScheme: ["A1: k = 7"], marks: 1, difficulty: "core", source: "authored" },
  { id: "q-m-12", subjectId: "ls-maths", topicCode: "8As", type: "structured", stem: "Find the nth term of the sequence 2, 9, 16, 23, ... and use it to decide whether 100 is a term of the sequence.", answer: "7n - 5; 7n - 5 = 100 gives n = 15, so 100 is the 15th term", markScheme: ["M1: common difference 7 so 7n", "A1: 7n - 5", "M1: sets 7n - 5 = 100 or tests n = 15", "A1: yes, n = 15"], marks: 4, difficulty: "extended", source: "authored" },
  // ---- Science · Stage 8 ----
  { id: "q-s-01", subjectId: "ls-science", topicCode: "8B", type: "mcq", stem: "Which part of a plant cell is not found in an animal cell?", options: ["Nucleus", "Cell membrane", "Cell wall", "Cytoplasm"], answer: "2", markScheme: ["B1: cell wall"], marks: 1, difficulty: "core", source: "authored" },
  { id: "q-s-02", subjectId: "ls-science", topicCode: "8B", type: "short", stem: "State the word equation for photosynthesis.", answer: "carbon dioxide + water -> glucose + oxygen", markScheme: ["B1: carbon dioxide and water as reactants", "B1: glucose and oxygen as products"], marks: 2, difficulty: "core", source: "authored" },
  { id: "q-s-03", subjectId: "ls-science", topicCode: "8C", type: "mcq", stem: "Which change is a chemical change?", options: ["Ice melting", "Iron rusting", "Salt dissolving", "Water boiling"], answer: "1", markScheme: ["B1: iron rusting"], marks: 1, difficulty: "core", source: "authored" },
  { id: "q-s-04", subjectId: "ls-science", topicCode: "8C", type: "short", stem: "Explain why a gas can be compressed but a liquid cannot, using particle ideas.", answer: "Gas particles are far apart with empty space between them; liquid particles are touching so there is no space to close up.", markScheme: ["B1: gas particles far apart or large spaces between", "B1: liquid particles close together or touching"], marks: 2, difficulty: "core", source: "authored" },
  { id: "q-s-05", subjectId: "ls-science", topicCode: "8P", type: "numeric", stem: "A car travels 150 m in 12 s. Calculate its average speed in m/s.", answer: "12.5", markScheme: ["A1: 12.5 m/s"], marks: 1, difficulty: "core", source: "authored" },
  { id: "q-s-06", subjectId: "ls-science", topicCode: "8P", type: "structured", stem: "A 2 kg block is pushed with a force of 10 N. Friction is 4 N. Calculate the resultant force and state the direction the block accelerates.", answer: "10 - 4 = 6 N; in the direction of the push", markScheme: ["M1: subtracts friction, 10 - 4", "A1: 6 N", "B1: direction of the applied force"], marks: 3, difficulty: "extended", source: "authored" },
  // ---- O Level Mathematics D · past-paper style ----
  { id: "q-ol-01", subjectId: "ol-maths", topicCode: "4024.2", type: "structured", paperRef: "4024/12 style · Algebra", stem: "Solve the simultaneous equations 2x + y = 11 and x - y = 1. Show your working.", answer: "Adding: 3x = 12, x = 4; y = 3", markScheme: ["M1: eliminates one variable, 3x = 12", "A1: x = 4", "A1: y = 3"], marks: 3, difficulty: "extended", source: "past-paper" },
];

export const QUESTIONS: Question[] = singleton("questions", () => [...SEED_QUESTIONS]);
export const questionById: Map<string, Question> = singleton("questionById", () => new Map(QUESTIONS.map((q) => [q.id, q])));

/** Teacher-authored question; joins the bank for this subject and stays out of other subjects' pools. */
export function addQuestion(input: Omit<Question, "id" | "source"> & { authorId: string }): Question {
  const id = `q-${input.subjectId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  const { authorId, ...rest } = input;
  const q: Question = { ...rest, id, source: "authored", paperRef: rest.paperRef ?? `Authored by ${authorId}` };
  QUESTIONS.push(q);
  questionById.set(id, q);
  return q;
}

export function questionsForSubject(subjectId: string, topicCodes?: string[]): Question[] {
  return QUESTIONS.filter((q) => q.subjectId === subjectId && (!topicCodes?.length || topicCodes.includes(q.topicCode)));
}
