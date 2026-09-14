# 12 — Portal Operations (the reference portal, generalised)

The reference project (`Syedjabran/sjabrankamran-site`, a single-teacher Physics portal) carries a
full operating layer around its exam lab: personal tasks and study plans, a class library with
contribution points, a six-pillar performance index and leaderboards, notifications and email,
attendance by voice, a users console with a per-student 360 view, access locks, fees, scheduled
jobs, presence, settings and a product tour. Minhaj carries all of it, adapted from "one teacher
runs everything" to the seats in `03-roles-and-access.md`: what the reference's *admin* did lands in
the **teacher** seat for their own classes; what is genuinely school-level lands with the
**principal** (and the chairman across campuses); students and parents get their own surfaces.

## Mapping

| Reference (single teacher) | Minhaj seat | Route |
|---|---|---|
| Users & activity, user detail (charts, activity, tasks, progress email) | Teacher (own classes) · Principal (branch) | `/portal/teach/students[/id]`, `/portal/principal/students[/id]` |
| Access locks | Principal, chairman | `/portal/principal/access` |
| Rankings & analytics (staff) | Principal · Teacher | `/portal/principal/rankings`, `/portal/teach/analytics` |
| My Ranking (Physics Performance Index) | Student | `/portal/learn/ranking` |
| Leaderboard (anonymous codes, opt-in names) | Student | `/portal/learn/leaderboard` |
| My Learning · personal tasks & challenges | Student | `/portal/learn/tasks`, `/portal/learn/assignments/[id]` |
| Study plan (weekly sequence + daily challenge) | Student · automation | `/portal/learn/study-plan`, `/portal/principal/automations` |
| Resource Library / forum + contribution points | Student · Teacher | `/portal/learn/library`, `/portal/teach/library` |
| Physics Resources | Student | `/portal/learn/resources` |
| Notifications + bell | Every seat | `/portal/learn/inbox`, `/portal/teach/messages`, `/portal/family/messages`, bell in the top bar |
| Email composer, templates, queue | Teacher (messages + templates) · Principal (audit shows the queue) | `/portal/teach/messages`, `/portal/principal/audit` |
| Announcements (audience: all / students / school / class) | Chairman · Principal · Coordinator | `/portal/leadership/announcements`, `/portal/principal/announcements` |
| Attendance + voice attendance + daily attendance view | Teacher · Principal · Coordinator | `/portal/teach/attendance[/lesson]`, `/portal/principal/attendance` |
| Proctoring & locks console | Teacher | `/portal/teach/proctoring` |
| Physics Studio (draft a question, review, accept) | Teacher | `/portal/teach/[spaceId]/studio` |
| Timetable + calendar feed | Teacher · Student | `/portal/teach/timetable`, `/portal/learn/timetable`, `/api/calendar` |
| Fees & finance | Principal · Parent (own invoice) | `/portal/principal/fees`, `/portal/family/children` |
| Saturday parent reports, daily study plans, KPI rebuild (cron) | Principal (run on demand) | `/portal/principal/automations` |
| Progress email (AI, fallback) | Teacher · Principal · automation | student 360 view |
| Presence beacon / online now | Teacher home · Principal overview | — |
| Settings / onboarding profile | Every seat | `/portal/settings` |
| Product tour | Every seat | Tour button in the top bar |
| Coordinator desk | Coordinator persona | `/portal/coordinator` |
| Weekly parent reports (printable) | Parent | `/portal/family/reports` |
| Google Classroom / Drive, PWA push relay, real email transport | Roadmap integrations | queued in `MAIL_QUEUE`; no external calls in the demo |

## Objects added

| Object | Where | Notes |
|---|---|---|
| `Notification`, `AuditEntry`, `QueuedMail` | `lib/data/mock/notify.ts` | Per-person cap 100; every staff mutation audits; mail is queued, never sent, in the demo |
| `Task` (+ `topic`, `generatedKey`) | `lib/domain/tasks.ts`, `lib/data/mock/tasks.ts` | Teacher-set and study-plan tasks; status assigned → in_progress → done |
| Performance Index | `lib/domain/kpi.ts`, `lib/data/kpi.ts` | Mastery 30 · Practice 20 · Assignments 15 · Daily 10 · Attendance 10 · Contribution 15; ranks in class, branch, school; "how to climb" advice |
| Class ranking composite | `lib/domain/rank.ts` | Marks 50 · attendance 30 · effort 20 (Hifz uses manzil secure); principal view |
| Contribution | `lib/data/mock/contribution.ts` | thread 5 · topic 8 · resource 10 · answer 6 · helpful 12; monthly and all-time boards |
| Forum thread / post | `lib/data/mock/forum.ts` | Class-scoped; tags resource / help / topic / discussion; helpful marks; one reaction per person |
| Access restriction | `lib/domain/access.ts`, `lib/data/mock/access.ts` | Scope person / class / branch / role; locked or suspended; most specific wins; staff bypass |
| Invoice, payment | `lib/data/mock/fees.ts` | One term invoice per student from the section plan; reminders and receipts |
| Automation job, run | `lib/data/mock/automations.ts`, `lib/data/automations-run.ts` | Five jobs; on-demand in the demo, cron in production |
| Presence | `lib/data/mock/presence.ts` | 90-second window; beacon from every seat |
| Preferences | `lib/data/mock/preferences.ts` | Language, channels, leaderboard name, digest day |
| Tarbiyah log (runtime) | `lib/data/mock/tarbiyah.ts` | Praise reaches the guardian tonight; a concern reaches the class teacher and principal |
| Study plan | `lib/data/study-plan.ts` | Idempotent per week (`auto-plan:<monday>`) and day (`auto-daily:<date>`) |
| Progress report | `lib/ai/progress-report.ts` | Gemini email with English and Urdu template fallbacks |

## Rules carried from the reference

- **Marks never decide the student leaderboard.** The effort board excludes Mastery; the full index
  is private to the student and staff. Everyone competes under a private code until they opt in.
- **Volume is log-scaled and capped** in every pillar so grinding cannot beat genuine mastery;
  pillars with nothing to assess score a neutral 50, Contribution starts at 0.
- **Approved leave never reads as truancy**: excused / leave / exempt drop out of the denominator
  everywhere (register, index, reports, early warning).
- **A lock keeps the account**: the person signs in and sees the message, nothing else; release
  restores everything; every lock and release is audited and the people notified.
- **Automations are idempotent** and bounded so a run finishes in one request; bulk parent reports
  use the template, never the AI.
- **The AI never invents facts**: progress emails, briefs and the studio draft from data the
  teacher can see; the teacher edits before anything is sent.

## Implementation status (as of 2026-09-14, night)

Complete in the demo, mocked: everything in the mapping table except the roadmap integrations
row. Demo verification: `tsc --noEmit`, unit tests (`tests/*.test.ts`, including `rank.test.ts`),
`check:ai-policy`, and `next build`. Remaining polish is listed in `../RESUME.md`.
