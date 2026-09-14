# 11 — Assessments and Exam Lab

Gap identified on 2026-09-14: the Space Tutor is text-only. The reference project
(`sjabrankamran-site`, `src/lib/exam-lab/*`, `src/components/exam-lab/*`) has a full assessment
loop that Minhaj must carry over and generalise across subjects: question banks, generated
quizzes, timed tests, past-paper practice, allocation to students, attempts with AI marking and
teacher review, proctoring, and analytics. This file specifies that loop for Minhaj.

## Principles carried from the reference exam lab

- **Questions are authored or selected, never invented in the exam.** Generation picks from a
  bank (authored questions, past-paper images with mark schemes); AI only paraphrases or
  assembles, and there is always a deterministic fallback bank.
- **Marking shows evidence.** The marker emits `AWARDED / POINT earned|missed - label - evidence /
  FEEDBACK` lines (see reference `maxwell.ts`); the teacher overrides any mark; overrides are
  logged and used to improve prompts.
- **The correct answer never reaches the student's client** until the attempt is submitted.
- **Attempts are append-only records** (`el_attempts` in the reference); a review view joins
  attempt, question, and marking.
- **Proctoring is optional and on-device** (reference uses MediaPipe FaceLandmarker in the
  browser; snapshots signed server-side). Minhaj keeps it as an opt-in per test, off by default.

## Objects

| Object | Fields (essentials) |
|---|---|
| `Question` | id, spaceId or subjectId, topicCode, type (mcq / short / structured / numeric / essay / recitation), stem, options?, answer (server-only), markScheme[], marks, difficulty, source (authored / past-paper ref / AI-assembled), imageRef? |
| `Test` | id, spaceId, title, mode (quiz / timed / mock exam / past-paper practice), questionIds[], durationMin?, opensAt, closesAt, attemptsAllowed, proctored, shareToken? |
| `Allocation` | testId, studentIds[], allocatedBy, status per student (not started / in progress / submitted) |
| `Attempt` | id, testId, studentId, startedAt, submittedAt, answers[], marking (per question: awarded, points, feedback, status ai-marked / teacher-approved), total, proctorSessionId? |
| `TopicMastery` | studentId, topicCode, score (rolling), lastAssessedAt |

## Flows

1. **Teacher builds a test** in the space: pick mode → pick topics → "Assemble" (AI selects from the
   bank per topic and difficulty; fallback bank) → preview with answers hidden toggle → set window,
   duration, attempts, proctoring → allocate to the class or selected students.
2. **Student sits the test**: `/portal/learn/tests` lists allocations; a runner with timer,
   question navigator, autosave every answer, exam guard (tab-switch and paste warnings, as in the
   reference `use-exam-guard.ts`), optional camera proctor; submit.
3. **Marking**: MCQ and numeric auto-marked; short/structured/essay go to the AI marker with the
   mark scheme; result status `ai-marked`; the teacher reviews in `/portal/teach/[spaceId]/tests/[testId]/review`
   with per-question evidence lines and one-click approve or edit; approving publishes to the
   student and updates `TopicMastery`.
4. **Tutor uses the results**: after a test, the Space Tutor opens with "You lost marks on
   8Ae (moving terms). Want to retry two similar questions?" and can run a **mini-quiz inside
   the chat** (2–5 questions, instant marking, hint-only policy still applies afterwards).
5. **Past-paper practice** (O Level spaces): the bank stores question and mark-scheme image
   references by paper and question number; the student works one question at a time; the marker
   reads the typed or photographed answer against the scheme (reference `handwriting.ts` OCR path).
6. **Analytics**: per test (distribution, hardest question, discrimination), per topic (class
   mastery heatmap feeding Class Insight), per student (trend feeding the early-warning engine).

## Hifz assessments

The recitation checker is the Hifz test type: a `recitation` question is an ayah range; the
attempt stores audio ref, transcript, diff and score; the ustadh's Confirm / Re-hear is the review
step. Weekly manzil tests allocate a juz portion; results roll into the heat grid.

## Screens to add

| Route | Seat |
|---|---|
| `/portal/teach/[spaceId]/tests` | teacher: list, build, allocate |
| `/portal/teach/[spaceId]/tests/[testId]` and `/review` | teacher: preview, results, review queue |
| `/portal/learn/tests` and `/portal/learn/tests/[attemptId]` | student: list, runner, result with feedback |
| Tutor chat: "Quiz me on this" action | student |
| `/portal/principal/assessments` | principal: upcoming tests across the branch, marking backlog by teacher |

## Demo scope for the next session

- Bank: 12 authored Mathematics questions across 8Ae / 8As (mcq, numeric, structured) and 6 Science;
  one O Level past-paper style structured question with a text mark scheme (no images needed).
- One quiz and one timed test pre-allocated to Grade 8-B; Ahmed has one submitted attempt awaiting
  teacher review; runner works end to end for a new attempt; AI marker with the existing
  `lib/ai/marker.ts`; deterministic fallback.
- "Quiz me" in the tutor with 3 questions.
- No proctoring in the demo beyond the exam guard warnings.

## Implementation status (as of 2026-09-14, evening)

Built in `rosans/`:
- `lib/domain/assessment.ts` — types and pure scoring (`autoMark` for mcq/numeric, `parseNumeric`,
  `rollMastery`, `facility`, `secondsLeft`, `forStudent` which strips answers and mark schemes).
- `lib/data/mock/questions.ts` — 12 Mathematics (8Ae/8As), 6 Science (8B/8C/8P), 1 O Level 4024 item.
- `lib/data/mock/tests.ts` — tests, allocations, attempts, topic mastery, and the store functions
  (`startAttempt`, `saveAnswer`, `recordGuardEvent`, `submitAttempt`, `reviewQuestion`, `publishAttempt`).
  Grade 8-B: one quiz, one timed test; Ahmed's timed attempt awaits review; three classmates published.
- `lib/ai/assess.ts` — `markAttempt` (auto + Mark-Scheme Marker with fallback), `assembleQuestions`
  (deterministic pick from the bank per topic and mode), `quizFor` (weakest unlocked topic).
- API: `GET/POST /api/assess/tests`, `POST/PATCH /api/assess/attempts`, `PATCH /api/assess/review`,
  `POST/PATCH /api/assess/quiz`.
- Screens: teacher `tests`, `tests/[testId]`, `tests/[testId]/review`; student `learn/tests`,
  `learn/tests/[attemptId]` (runner with exam guard, or result); tutor "Quiz me"; principal `assessments`.

Added since: the on-device camera proctor with lock / unlock (`lib/domain/proctor.ts`,
`components/assess/proctor-*.tsx`, teacher console at `/portal/teach/proctoring`), past-paper
practice from genuine Cambridge crops with OCR marking (`lib/data/pastpapers`,
`components/papers/*`), the AI test designer (`lib/ai/designer.ts`) and the question studio
(`lib/ai/studio.ts`). Still outside the demo: Hifz recitation as a test type (the recitation
checker remains its own flow).
