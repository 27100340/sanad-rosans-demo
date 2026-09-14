# 05 — AI Features

Provider: Google Gemini only (policy-enforced). Every feature: pinned fast model, timeout,
deterministic fallback, audit row. Prompts live inline in `src/lib/ai/<feature>.ts`.

| # | Feature | Seat | Value created | Fallback when AI is unavailable |
|---|---|---|---|---|
| 1 | **Ask the School** | leadership, principal | Plain-language questions over live aggregates. The model receives a compact JSON of pre-computed aggregates (never raw PII) and writes the answer with the figures it used. | Rule-based matcher over a catalogue of common questions |
| 2 | **Monday Brief** | leadership | Weekly narrative: what moved, what to watch, three decisions to make | Template filled from aggregates |
| 3 | **Early-Warning Engine** | principal, teacher | Scores each student on attendance trend, mark delta, tutor-confusion signals, hifz backlog; explains the reason in one sentence | Pure rule scoring (`lib/domain/risk.ts`); the AI only writes the sentence |
| 4 | **Space Tutor** | student | Socratic tutor bound by the teacher's Tutor Rules and grounded in approved resources; English/Urdu; tags each turn with a misconception label the teacher later sees | Canned Socratic prompts per topic; "sent to teacher" when unsure |
| 5 | **Mark-Scheme Marker** | teacher | Marks a typed or photographed answer against a Cambridge-style mark scheme; outputs `AWARDED / POINT earned|missed / FEEDBACK` lines; teacher overrides | Keyword rubric scorer |
| 6 | **Assignment & Quiz Designer** | teacher | Generates questions from syllabus codes and the space's resources; line-delimited output | Curated question bank per subject |
| 7 | **Lesson Planner** | teacher | Drafts a 40-minute lesson with objectives, hook, activity, check-for-understanding, homework | Template |
| 8 | **Class Misconception Heatmap** | teacher | Clusters tutor transcripts and marking feedback into the top 5 misconceptions | Tag frequency count |
| 9 | **Parent Brief** | parent | Daily/weekly brief in Urdu or English with one concrete action for tonight | Template with slot-filled facts |
| 10 | **Parent Inbox Triage** | principal | Classifies incoming parent messages as urgent / routine / praise and drafts a reply | Keyword classifier |
| 11 | **Recitation Checker** | hifz | Word-level comparison of a child's recitation against the canonical text; see `06-hifz-engine.md` | Browser speech recognition transcript, then the same diff |
| 12 | **Mutashabihat Coach** | hifz | Finds the verses similar to the one just mistaken and drills the difference | Static similar-verse index |
| 13 | **Tarbiyah Narrative** | teacher, parent | Turns quick character observations into a respectful, values-aware note | Template |
| 14 | **Values Guardrail** | all | System-level instruction: age-appropriate, respectful of Islamic values, no haram content, no medical/legal advice, escalate wellbeing concerns to a human | Same instruction is static; always on |

## Prompt conventions

- `system` opens with the seat, the school name, the language policy, and the Values Guardrail.
- Data is passed as compact labelled blocks, never as prose, and never with PII beyond first name.
- Outputs that a parser reads use `KEY: value` lines. Free-form outputs are Markdown.
- Every prompt states the refusal behaviour explicitly and what to say when the request is outside
  scope, so that refusals are graceful and consistent.
- Urdu output must be in Urdu script (Nastaliq-compatible), not Roman Urdu, unless the user wrote in
  Roman Urdu.

## What makes this different from a chatbot

The tutor **cannot know more than the teacher allowed**, the marker **shows its evidence**, the
brief **ends with one action**, and leadership's questions **cite the figures**. Every AI output has
a human owner who can override it, and every override is logged and used to improve prompts.
