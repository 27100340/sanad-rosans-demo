# 02 — Architecture

## Stack (inherited from the reference project `sjabrankamran-site`)

- **Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 3.4.**
- **Supabase** (Postgres + Auth + Storage) in production. The demo runs on typed in-memory data
  behind the same repository interfaces, so Supabase drops in without touching UI.
- **Vercel** hosting; cron via `vercel.json` gated on the `x-vercel-cron` header.
- **AI: Google Gemini only**, called by direct REST (`generativelanguage.googleapis.com`), no SDK.
  A `scripts/check-ai-provider-policy.mjs` prebuild guard fails the build if any other provider
  package or endpoint appears under `src/`.

## Engineering principles carried over

1. **Pinned fast models.** Use an explicit fast model id (e.g. `gemini-3.1-flash-lite`). Never
   `*-latest` aliases; they resolve to thinking models that blow serverless timeouts.
2. **Every AI call has an AbortController timeout and a deterministic fallback.** The product must
   never show a spinner that ends in nothing. If AI fails, a rule-based result or a "sent to teacher
   for review" path is produced.
3. **Line-delimited AI output, not JSON, when content may contain LaTeX or Arabic diacritics.**
   Parse with regex; JSON escaping breaks on these.
4. **Three Supabase clients**: browser (anon), server (cookies, `setAll` wrapped in try/catch), admin
   (service role, server-only, never imported by a client component).
5. **Access is enforced three times**: RLS helper functions in Postgres, `middleware.ts` (fail-open
   with a timeout; skip `auth.getUser()` when no `sb-*` cookie exists), and per-page server checks.
6. **Per-user JSON documents in storage** for lightweight state (locks, preferences, caches); never a
   single shared JSON that many writers race on.
7. **Keep every fetch, handler, field name, route and prop when restyling.** Style and structure only.
8. **Density budget** (see `07-design-system.md`): one row of at most 4 stat tiles, at most 2 blocks
   above the fold, no explanatory banners.

## Module boundaries

```
src/
  app/                      routes only; no business logic
    page.tsx                public landing for the school instance
    portal/                 shell; one folder per seat
      leadership/           chairman / director cockpit (all branches)
      principal/            one branch
      teach/[spaceId]/      teacher Subject Space
      learn/                student
      hifz/                 Hifz student + Ustadh views
      family/               parent
      admin/                ops: users, timetable, fees, announcements
    api/                    route handlers; thin, call lib/
  lib/
    config/school.ts        THE white-label file: name, branches, colours, programmes
    domain/                 pure TS types + pure functions (scoring, scheduling, diffs). No IO.
    data/                   repository interfaces + implementations (mock/, supabase/)
    ai/                     gemini.ts (one call helper), one file per AI feature, prompts inline
    quran/                  Quran text/audio client, normalisation, recitation diff
    auth/                   roles, predicates, persona (demo) or session (prod)
  components/
    ui/                     primitives: button, card, stat, badge, field, empty-state, page-header
    portal/                 shell, nav, persona switcher
    <feature>/              feature components
  content/                  typed static content (syllabus maps, resource catalogues)
```

Rules:
- `app/` imports from `lib/` and `components/`; never the reverse.
- `lib/domain/` imports nothing from `lib/data/` or `lib/ai/`.
- `lib/ai/*` never imports React. UI never calls Gemini directly; always through `app/api/*`.
- One repository interface per aggregate (`SchoolRepo`, `PeopleRepo`, `AcademicsRepo`, `HifzRepo`, `CommsRepo`).

## Data model (production; mirrors the reference `edu_` schema, extended)

Core (from reference): profiles, user_roles, students, guardians, student_guardians, teachers,
programmes, courses, topics, terms, classes, enrolments, schedules, lessons, resources, assignments,
submissions, assessments, questions, results, attendance, fee_plans, invoices, payments,
announcements, notifications, conversations, messages, ai_sessions, topic_mastery, certificates, audit_logs.

Added by Minhaj:

| Table | Purpose |
|---|---|
| `schools` / `branches` | First-class tenancy. Every row below carries `branch_id`. |
| `subject_spaces` | A teacher's owned space for one subject in one class (resources, tutor rules, question bank) |
| `space_rules` | The tutor's constraints per space: allowed topics, answer policy, language, tone |
| `tutor_sessions` / `tutor_turns` | Student to AI transcripts, with `misconception_tags[]` |
| `hifz_plans` | Per student: current juz/surah, daily sabaq target, revision cadence |
| `hifz_units` | Memorisation units (ayah ranges) with spaced-repetition state (ease, interval, due_at) |
| `hifz_recitations` | Each recite-back attempt: audio ref, transcript, word diff, score, tajweed notes |
| `tarbiyah_logs` | Character observations (salah, akhlaq, punctuality) by teachers |
| `parent_briefs` | Generated daily/weekly briefs, language, delivery status |
| `risk_flags` | Early-warning outputs with reasons and owner |
| `leadership_questions` | Audit of natural-language analytics questions and the aggregations used |

RLS backbone: `is_admin()`, `is_staff()`, `in_branch(branch_id)`, `teaches_space(space_id)`,
`is_my_ward(student_id)`, `my_student_id()`. Each table: a `_sel` policy for self / ward / teacher-of /
branch-staff, and an `_all` policy for admins. Super-admin bypasses branch scoping.

## AI call shape (single helper)

```ts
askGemini({ model, system, parts, timeoutMs }) -> { text: string | null; latencyMs: number }
```

Every feature builds `system` + `parts`, calls `askGemini`, parses, and on `null` returns its
deterministic fallback. Feature files export both `run()` and `fallback()` so tests exercise both.
Gemini accepts inline audio, which is how recitation audio reaches the model (see `06-hifz-engine.md`).

## Security and privacy

- Student audio (Hifz) and transcripts are personal data: private buckets, signed URLs, retention
  configurable per school, export/delete on request.
- No student PII in prompts beyond first name and grade. Never send CNIC, phone, or address to AI.
- CSP from the reference project, HSTS, `Permissions-Policy: camera=(self), microphone=(self)`.
- Audit-log every admin write and every AI-generated artefact that reaches a parent.
