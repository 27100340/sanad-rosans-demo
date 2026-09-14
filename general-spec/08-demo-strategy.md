# 08 — Demo Strategy

A pitch demo must be **fast, unbreakable, and believable**. It is not the product; it is proof.

## Rules

1. **Zero setup**: `npm install && npm run dev` runs everything. No database, no accounts.
2. **Persona switcher instead of login**: a top-bar control (and `/demo` page) that switches
   between named personas. Each persona lands on the right seat with a one-line role description.
3. **Mock data is typed and realistic**: Pakistani names, real branch names, real subject list from
   the school's website, plausible numbers with trends. Lives in `src/lib/data/mock/*.ts`.
4. **Genuine study resources**: syllabus codes, exam-board syllabus links, past-paper index links,
   open textbooks, Quran text and audio are real and clickable. Never fabricate a resource URL.
5. **AI has two modes**: live Gemini when `GEMINI_API_KEY` exists; otherwise scripted responses that
   are indistinguishable in the UI and keyed to the demo script. A small "AI: live / scripted" pill
   in the top bar keeps us honest with the client.
6. **Every screen in the pitch narrative has a scripted happy path** that never depends on network,
   microphone, or camera. Live paths exist on top.
7. **Deep links**: every demo screen has a stable URL so the presenter can jump in any order.

## Personas (Rosans instance)

| Persona | Role | Lands on |
|---|---|---|
| Chairman | chairman | `/portal/leadership` |
| Principal, Gulberg | principal (branch: gulberg) | `/portal/principal` |
| Ms. Hina Raza, Maths | teacher | `/portal/teach/gulberg-g8b-maths` |
| Qari Abdul Rehman | ustadh | `/portal/hifz/ustadh` |
| Ahmed Hassan, Grade 8-B | student | `/portal/learn` |
| Muhammad Zaid, Hifz | student (hifz) | `/portal/hifz` |
| Mrs. Nadia Hassan (parent of Ahmed) | parent | `/portal/family` |

## What is real code vs mock in the demo

Real: routing, role predicates, access scoping, spaced-repetition scheduler, word diff and scoring,
risk scoring, Ask-the-School aggregation layer, all UI, Gemini integration (when keyed).
Mock: identity, all records, notification delivery, audio storage (kept in memory for the session).

## Presenter checklist

- Run with a key at least once before the pitch and cache a screenshot of each AI output.
- Open every deep link in tabs beforehand.
- Keep the "simulated attempt" button in Hifz visible only in demo mode.
