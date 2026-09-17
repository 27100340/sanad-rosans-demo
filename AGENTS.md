# Working in this repo (for agents)

Sanad is a **demo** of Minhaj, a school operating system, branded for Rosans Islamic School:
Montessori to O Levels plus a Hifz pathway. Fictional people and money, no database, no real
accounts. It exists to be shown to a client, so its credibility rests on the invariants below
more than on any single feature.

Read `resume.md` for what the last session did and what is outstanding. Update it when you
finish something. This file is the part that does not change between sessions.

## Invariants

Break one of these and the demo stops being defensible, whatever else you added.

1. **Never fabricate a result.** If an AI call fails, say so. A failed recitation returns an
   error, never a score; a failed transcription asks the student to type instead. The point of
   the Hifz module is that a wrong "92%" is worse than a blank.
2. **Every AI feature has a deterministic fallback** and must work end to end with no API key.
   The pattern is one file per feature in `src/lib/ai/` exporting `run()`/`compose()` and a pure
   `fallback()`. The top bar shows "AI scripted" when no key is set; keep that honest.
3. **Only the permitted providers appear under `src/`.** `node scripts/check-ai-provider-policy.mjs`
   enforces it and runs in `prebuild`. Do not add a provider without the owner's decision.
4. **Answers never reach the student's client early.** `forStudent()` strips `answer` and
   `markScheme` before a question is sent; past-paper mark schemes are revealed per question only
   after that question is answered. Check this whenever you touch an assessment payload.
5. **Approved absence is not truancy.** `excused`, `leave` and `exempt` leave the denominator
   everywhere: register, attendance percentage, Performance Index, reports, early warning.
   `countedStatuses()` in `src/lib/domain/attendance.ts` is the single source of that rule.
6. **Marks never decide a student-facing leaderboard.** `/portal/learn/leaderboard` ranks the
   effort index (every pillar except Mastery) and uses private codes unless the student opts in.
7. **Every staff mutation is audited**, and anyone who should know is notified. An API route that
   changes something calls `audit(...)` and usually `notify(...)`.
8. **Nothing is really sent or paid.** Email is queued in `MAIL_QUEUE`; a recorded payment writes
   a demo ledger row. Say so in the UI wherever it could be misread.
9. **Demo personas are not a security boundary.** The cookie is the identity. Do not describe the
   demo as having authentication, persistence or tenant isolation.

## Where things live

| Path | What |
|---|---|
| `src/lib/config/school.ts` | The only file that names the client. White-labelling starts here. |
| `src/lib/domain/*.ts` | Pure logic, no IO: assessment, attendance, proctor, kpi, rank, access, finance, hr, teaching, srs, quran diff. Unit-tested. |
| `src/lib/data/mock/*.ts` | Fictional records. Every mutable one is a `singleton()` from `store.ts`. |
| `src/lib/data/*.ts` | Aggregators over the mocks: `kpi.ts`, `student-detail.ts`, `study-plan.ts`, `automations-run.ts`, `students-console.ts`. |
| `src/lib/ai/*.ts` | One file per AI feature, each with a deterministic fallback. `gemini.ts` / `groq.ts` are the only call helpers. |
| `src/lib/auth/*.ts` | Identity and authorization: `personas.ts`, `viewer.ts`, `impersonate.ts`, `nav.ts`, `manage.ts`, `access.ts`, `seat-map.ts`. |
| `src/app/portal/*` | One folder per seat. |
| `src/app/api/*` | Thin route handlers: validate, check the seat, mutate through the store's single write path, audit, notify. |
| `general-spec/` | The product specification. `12-portal-operations.md` maps the reference portal onto the seats. |

## Conventions

- **Pages are async server components.** `const viewer = await getViewer()`, guard, gather data,
  render. Client components only where there is interaction; they fetch `/api/...` and call
  `router.refresh()` after a successful mutation.
- **Route files export only handlers.** Shared helpers go in `src/lib/`, or Next fails the build.
- **Compose from `src/components/ui/primitives.tsx`** (PageHeader, Stat, Card, Chip, EmptyState,
  LinkButton, Progress, Avatar, KeyValue, AiPill) and the classes in `globals.css`
  (`card`, `btn-primary`, `input`, `chip-*`, `tile-*`, `table`). Do not invent a second button.
- **Server formats, client renders.** Resolve names and dates on the server and pass strings;
  client components should not import mock data.
- **Stores own their writes.** Mutate through the store's exported functions so every reader sees
  it. Anything mutable must be wrapped in `singleton()` or the dev server will hand API routes and
  pages different copies.
- **Style:** professional and plain, British English, no emojis. One clear sentence beats three.
  Say what a number means ("of Rs 1.8M expected"), not just the number.
- **Phone first.** Every page must work at 390px.

## Authorization, including the owner seat

`getSession()` in `src/lib/auth/viewer.ts` returns `{ viewer, real, viewingAs }`. **Guards judge
`viewer`.** Only the shell and the owner's own controls care about `real`.

The super admin does not get a special case inside each of the ~120 role checks. Instead it
*becomes* the person it needs to be: `personaForPerson()` in `impersonate.ts` builds a real
`Persona` for any student, teacher, guardian or leader, and while the `view-as` cookie is set
`getViewer()` returns that persona. Every existing guard then passes on its own terms, and what
the owner sees is exactly what that person sees. School-wide screens it opens directly, through
`isSuperAdmin()` in the shared predicates.

When you add a guard, follow that: put the predicate in the shared module
(`seat-guard.tsx`, `teach/guard.tsx`, `manage.ts`, or the feature's own `can*` helper) rather than
inlining a role comparison in a page, and include `superadmin` where the screen is school-wide.
`/portal/admin` lists every screen from `seat-map.ts`; add new screens there so the owner can
still reach everything.

## This machine

The checkout path contains `&`, which breaks npm's Windows `.cmd` shims. Call the binaries
through node:

```sh
node node_modules/next/dist/bin/next dev
node node_modules/typescript/bin/tsc --noEmit
node --test --experimental-strip-types "tests/*.test.ts"
node scripts/check-ai-provider-policy.mjs
node node_modules/next/dist/bin/next build
```

On a path without `&`, the `npm run` scripts work normally. Git lives at `C:\Program Files\Git\cmd`.

## Before you hand back

Run the typecheck, the unit tests, the provider policy check and the build. Then open the pages
you changed in a browser and look at them, at desktop and at 390px: several real defects in this
repo were only visible there. All demo data is in process memory, so restarting resets it, and
editing a seed file needs a dev-server restart to show.

Record what you did in `resume.md`: changed files, commands and their results, what is left, and
any blocker. Do not claim a live service, delivered email or production readiness that does not
exist.
