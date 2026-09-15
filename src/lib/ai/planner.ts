/**
 * Lesson Planner. Drafts a 40-minute lesson from one syllabus point plus the
 * space's approved resources. Output is Markdown; the fallback is a
 * deterministic template filled with the topic and resource titles.
 */
import { VALUES_GUARDRAIL } from "./gemini";
import { askGroq } from "./groq";
import type { Resource, SubjectSpace, SyllabusTopic } from "@/lib/domain/types";
import { school } from "@/lib/config/school";
import { spaceById } from "@/lib/data/mock/spaces";
import { classById } from "@/lib/data/mock/people";

export interface PlannerInput {
  spaceId: string;
  topicCode: string;
  subtopic: string;
}

export interface PlannerOutput {
  markdown: string;
  live: boolean;
}

interface PlanContext {
  space: SubjectSpace;
  topic: SyllabusTopic;
  subtopic: string;
  className: string;
  resources: Resource[];
}

function contextFor(input: PlannerInput): PlanContext | null {
  const space = spaceById.get(input.spaceId);
  const topic = space?.syllabus.find((t) => t.code === input.topicCode);
  if (!space || !topic) return null;
  const subtopic = topic.subtopics.includes(input.subtopic) ? input.subtopic : topic.subtopics[0];
  const className = classById.get(space.classId)?.name ?? "the class";
  const approved = space.resources.filter((r) => r.status === "approved");
  const tagged = approved.filter((r) => r.topicCodes?.includes(topic.code));
  const resources = tagged.length ? tagged.concat(approved.filter((r) => !tagged.includes(r))).slice(0, 4) : approved.slice(0, 4);
  return { space, topic, subtopic, className, resources };
}

function template(ctx: PlanContext): string {
  const { space, topic, subtopic, className, resources } = ctx;
  const misconception = space.misconceptions[0];
  const links = resources.map((r) => `- ${r.title} (${r.source})`).join("\n");
  return [
    `# ${subtopic}`,
    `${space.subject} · ${className} · ${topic.code} ${topic.title} · 40 minutes`,
    "",
    "## Objectives",
    `- Every student can explain the rule behind ${subtopic.toLowerCase()} in their own words.`,
    `- Most students can apply it to three unseen questions without prompting.`,
    `- Some students can spot and correct a deliberate error.`,
    "",
    "## Hook (5 min)",
    misconception
      ? `Show the wrong line \`${misconception.example}\` on the board. Ask pairs to decide whether it is right and to say why in one sentence. Do not resolve it yet.`
      : `Put one worked line on the board with a single deliberate slip. Pairs find the slip in one minute.`,
    "",
    "## Teach and model (10 min)",
    `- Model one full example of ${subtopic.toLowerCase()} on its own, one step per line, thinking aloud.`,
    `- Return to the hook and let a student correct it using the modelled steps.`,
    `- Refer to ${resources[0]?.title ?? "the class notes"} for the definition used.`,
    "",
    "## Activity (15 min)",
    `- Three tiers of practice, three questions each; students start at the tier they choose.`,
    `- Tutor is unlocked for ${topic.code} in this space, so students may check a step with it, not an answer.`,
    `- Circulate: collect two common errors for the plenary.`,
    "",
    "## Check for understanding (7 min)",
    `- Mini whiteboards: one question per tier shown for 60 seconds each.`,
    `- Exit ticket: "Explain ${subtopic.toLowerCase()} to a Grade 7 student in two sentences."`,
    "",
    "## Homework",
    `- Four questions from ${resources[1]?.title ?? resources[0]?.title ?? "the revision pack"}, with a written check for each.`,
    `- Due next lesson; submit in the space so it can be marked against the mark scheme.`,
    "",
    "## Resources used",
    links,
  ].join("\n");
}

export function fallback(input: PlannerInput): PlannerOutput {
  const ctx = contextFor(input);
  if (!ctx) return { markdown: "# Lesson plan\n\nChoose a syllabus topic and subtopic to draft a plan.", live: false };
  return { markdown: template(ctx), live: false };
}

export async function run(input: PlannerInput): Promise<PlannerOutput> {
  const ctx = contextFor(input);
  if (!ctx) return fallback(input);
  const { space, topic, subtopic, className, resources } = ctx;
  const system = [
    `You are the lesson planner for ${school.schoolName}. You draft a 40-minute ${space.subject} lesson for ${className}.`,
    VALUES_GUARDRAIL,
    "Ground the plan only in the resources listed; cite them by title. Never invent resources or links.",
    "Output Markdown with exactly these H2 sections in order: Objectives, Hook (5 min), Teach and model (10 min), Activity (15 min), Check for understanding (7 min), Homework, Resources used. Start with an H1 of the subtopic. Use bullet points; keep it under 350 words.",
  ].join("\n\n");
  const parts = [
    { text: `TOPIC: ${topic.code} ${topic.title}\nSUBTOPIC: ${subtopic}\nKNOWN MISCONCEPTIONS:\n${space.misconceptions.map((m) => `- ${m.tag}: ${m.example}`).join("\n") || "- none recorded"}\nRESOURCES:\n${resources.map((r) => `- ${r.title} (${r.source}, ${r.kind})`).join("\n")}` },
  ];
  const res = await askGroq({ system, parts, temperature: 0.5, maxOutputTokens: 900 });
  if (!res.text) return fallback(input);
  return { markdown: res.text, live: true };
}
