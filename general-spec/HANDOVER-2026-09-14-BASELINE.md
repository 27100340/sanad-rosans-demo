# Historical handover — Sanad / Minhaj (state as of 2026-09-14, night)

Preserved baseline. For current work read `../resume.md`. This file was moved to avoid
`RESUME.md` / `resume.md` filename collisions on the partner's Windows checkout.

Read this first when the user says "resume". Everything below is committed on `main` of
`https://github.com/27100340/sanad-rosans-demo.git`; this file and `general-spec/` now live inside
the repo so a fresh clone has the full context.

## Layout

- `general-spec/` — the base product spec (12 files). `10`, `11` and `12` carry "Implementation
  status" sections that match the code. `12-portal-operations.md` maps every feature of the
  reference portal (`Syedjabran/sjabrankamran-site`) onto the Minhaj seats.
- Repo root — the Rosans demo (**Sanad**), Next.js 16 / React 19 / Tailwind, no database.
  `npm install`, then see the Windows note below. Commits are authored as
  `27100340 <27100340@lums.edu.pk>` (repo-local git config) to match the existing history.
- On the original machine the clone sits at `C:\Users\USER\Documents\Jabran & Co\rosans-demo\rosans`
  (the folder `Jabran & Co` contains `&`, which breaks npm's Windows `.cmd` shims; call the
  binaries through node). Git is at `C:\Program Files\Git\cmd` (installed with winget; add it to
  PATH in new shells). A `.claude/launch.json` one level up starts the dev server for the Claude
  browser pane.

```bash
node node_modules/next/dist/bin/next dev
node node_modules/typescript/bin/tsc --noEmit
node --test --experimental-strip-types "tests/*.test.ts"
node scripts/check-ai-provider-policy.mjs
node node_modules/next/dist/bin/next build
```

## What the demo covers (all mocked in memory)

Everything in spec `01`–`11` plus the whole operating layer of the reference portal, seat by seat:

- **Student**: Today, tutor, tests, past papers, tasks and challenges, assignment submission with
  instant AI marking, study plan, library, resources, inbox, Performance Index ("My ranking"),
  effort leaderboard (private codes), timetable with .ics, settings.
- **Teacher**: My spaces (tabs: Overview, Assignments, Tests, Studio, Past papers, Class,
  Performance, Insight, Rules, Planner), Students console with a 360 view (visual report,
  activity timeline, individual tasks, tarbiyah log, AI progress email), attendance with a voice
  register, messages with templates and show-cause notices, timetable, library, proctoring
  console (two seeded sittings), analytics.
- **Principal**: Branch overview with online-now, at-risk, students console, teachers, parent
  inbox, timetable, subjects, assessments, attendance, rankings, announcements, fees,
  automations, audit log, access locks.
- **Chairman**: cockpit, Ask the School, branches, announcements (delivered in-app, optionally emailed).
- **Coordinator** (persona Mr. Adeel Hussain): desk plus the branch's read-only pages.
- **Parent**: tonight's brief, children with fees, messages and notices, printable term reports.
- **Hifz** seats unchanged from before this session.
- **Every seat**: notification bell, unread badges, presence beacon, product tour, settings, web manifest.

Every AI feature (marker, tutor, designer, studio, progress email, brief, triage, planner, Ask the
School, recitation) has a deterministic fallback; without `GEMINI_API_KEY` the top bar says
"AI scripted". Provider policy: Gemini only (`scripts/check-ai-provider-policy.mjs`).

## Verification at the end of this session

`tsc --noEmit` clean; 30 unit tests pass (`assessment`, `attendance-proctor`, `quran-diff`,
`srs`, `rank`); `check:ai-policy` passes; `next build` succeeds (every portal route dynamic).
Browser smoke test on `/portal/learn/ranking`, `/portal/teach/students/s-ahmed-hassan`,
`/portal/teach/proctoring`, `/portal/principal/fees`: real data, no runtime errors.

## Commits this session (oldest first)

1. Operations layer: inbox, tasks, messages, timetable, performance, audit; fix runner wiring
2. Student core and staff student console, ported from the reference portal
3. Study plans, fees, automations, announcements, parent reports, principal rankings
4. Class library, resources, settings, presence and the notification bell
5. Proctoring console, analytics, studio, voice register, tour, coordinator, mail templates
6. Docs: RESUME and general-spec moved into the repo

## Next

- Visual pass in a browser at 390px and desktop for the new pages (students 360, library,
  leaderboard, fees, automations, access, studio, proctoring). The exam runner top bar
  (`sticky top-14`) and the space tab strip were flagged earlier and are still unchecked.
- Roadmap only: Google Classroom / Drive import and a real email relay (the outbound queue is
  visible on `/portal/principal/audit`).
- Optional: map dagger alef (U+0670) in `src/lib/quran/normalize.ts`; `.theme-dark` rail
  contrast on a real phone.

## Working agreements (from the user)

- Token-efficient: foundations done directly; mechanical batches to one Opus subagent with strict
  file ownership; one typecheck/build at the end. No Workflow/"ultracode" swarms.
- Professional, clean, modern design; no emojis; density budget from `general-spec/07`.
- Gemini only. Every AI feature has a deterministic fallback.
- Genuine study resources and Quran data; fictional people and numbers.
- Everything mocked in memory for the demo (`globalThis` singletons in `src/lib/data/store.ts`);
  restart the dev server after editing seed data.
