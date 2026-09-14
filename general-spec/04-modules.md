# 04 — Modules by Seat

Each module lists: purpose, screens, key data, AI hooks (detailed in `05-ai-features.md`).
"Demo" marks what the pitch demo must show; everything else is roadmap.

## 1. Leadership Cockpit (chairman / director) — Demo

Purpose: one screen that proves the owner can *see through and control* the whole school.

Screens:
- **Overview**: stat row (students, attendance today, fee collection this month, at-risk count),
  branch comparison cards, live activity feed, AI Monday Brief.
- **Ask the School**: natural-language question box over school data ("compare Grade 8 Maths across
  branches", "which teachers have the most overdue marking"). Returns an answer, the figures used,
  and a chart. Every question is audited.
- **Branch drill-down**: click any branch to enter the Principal view of that branch (read-only or
  full control according to role).
- **Controls**: school-wide announcement, lock/suspend by scope, approve policy changes
  (e.g. tutor language policy), export data.

## 2. Principal (one branch) — Demo

- **Branch overview**: attendance heatmap by class, teacher load table, today's timetable exceptions.
- **At-risk students**: ranked list with reasons (attendance trend, mark drop, tutor confusion
  signals, hifz revision backlog) and an owner; one-click "message parent" or "assign mentor".
- **Teachers**: each teacher's spaces, marking backlog, resource approvals pending.
- **Parent issues**: inbox triaged by AI into urgent / routine / praise.
- **Controls**: timetable edits, substitutions, lock a class, publish branch announcement.

## 3. Teacher Subject Space — Demo

The teacher's own room for one subject in one class. Everything the tutor knows comes from here.

- **Resources**: syllabus map (official codes and topics), genuine links (exam board syllabus,
  past-paper index, open textbooks, Khan Academy), teacher uploads. Each resource has a status
  (draft / approved by principal) and a "tutor may cite" flag.
- **Tutor Rules**: allowed topics, answer policy (hint-only / worked-example / full), language
  (English / Urdu / both), tone, forbidden shortcuts ("never give the final numeric answer").
- **Assignments**: create manually or with AI from the syllabus map; AI marking with mark-scheme
  evidence lines; teacher overrides every mark.
- **Class insight**: misconception heatmap from tutor transcripts and marking; who to re-teach what.
- **Lesson planner**: AI drafts a lesson from a syllabus point plus the teacher's resources.
- **Tarbiyah log**: quick character observations (punctual, helpful, disruptive, salah) that roll
  into the parent brief and the student's profile.

## 4. Student — Demo

- **Today**: tasks due, timetable, hifz due (if in Hifz), a nudge from the tutor.
- **Tutor**: per-space chat that obeys the space's rules. Socratic by default; Urdu on request;
  can quiz; can explain a marked answer; never leaks mark schemes.
- **Progress**: mastery by topic, trend, "next best action".
- **Leaderboard / streaks**: opt-in, class-scoped, effort-based (not marks-based) to avoid shaming.

## 5. Hifz (student + ustadh) — Demo

See `06-hifz-engine.md`. Screens: Today's sabaq / sabqi / manzil, Listen and Recite, Mistake map
(per juz heat grid), Mutashabihat drills, Ustadh halaqa board, Parent home-recitation log.

## 6. Parent — Demo

- **Tonight's brief** (phone-first card): attendance, one line per subject, hifz status, one action
  ("ask Ahmed to revise Surah Al-Mulk ayah 12–15"), in Urdu or English.
- Marks, attendance calendar, fee status, message the class teacher, book a meeting.

## 7. Operations / Admin — Roadmap (light version in demo)

Users and roles, timetable builder, attendance registers, fee plans and ledgers, announcements,
certificates, data export, audit log.

## Cross-cutting

- **Notifications**: in-app plus push; WhatsApp delivery is a roadmap integration via a provider.
- **Bilingual UI**: all UI strings via a dictionary (`en`, `ur`); RTL-aware components for Urdu/Arabic.
- **Phone-first**: every portal page must be usable at 390px wide.
