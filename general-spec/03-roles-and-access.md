# 03 — Roles and Access

## Hierarchy

```
School (tenant)
└── Branch (campus)                 e.g. Gulberg, Lake City, Paragon City
    └── Section                     Montessori / Junior / Senior / Hifz
        └── Class (year + section)  e.g. Grade 8-B, Hifz Halaqa 2
            └── Subject Space       one teacher × one subject × one class
                └── Students (enrolments)
```

## Roles

| Role | Scope | Sees | Controls |
|---|---|---|---|
| `super_admin` (EduSoft) | all tenants | everything | provisioning, feature flags |
| `chairman` / `director` | whole school | leadership cockpit, every branch, finance summary, AI briefs, ask-the-school | school-wide locks, announcements to all, policy approvals |
| `principal` | one branch | branch cockpit, all classes, all teachers, at-risk list, parent issues | timetable, teacher assignment, resource approval, lock/suspend, branch announcements |
| `coordinator` | one branch, one section | classes in their section | attendance overrides, assignment calendar, substitutions |
| `teacher` | their Subject Spaces | their students, transcripts, marks, resources | tutor rules for the space, assignments, marking, tarbiyah logs |
| `ustadh` (Hifz teacher) | their halaqa | each student's hifz map, recitation attempts, due revision | daily sabaq targets, pass/fail a recitation, parent notes |
| `student` | self | their spaces, tutor, tasks, progress, hifz | their own practice |
| `parent` | wards | daily brief, attendance, marks, hifz progress, fee status | acknowledge briefs, message the class teacher, book meetings |
| `registrar` / `finance` | branch | attendance registers / fee ledgers | mark attendance / record payments |

## Access rules

- A user may hold several roles (a principal may also teach a space).
- Branch scoping is default-deny: branch staff without a branch pin see nothing.
- Locks: `locked` (read-only) or `suspended` (no access), scoped to user > class > branch > school,
  time-windowed, super_admin bypasses. Ported from the reference `access-control` module and its
  DB-free unit tests.
- "View as role" for leadership is UI-shell only; RLS is never relaxed.
- Parents never see other students. Teachers never see fee ledgers. Finance never sees transcripts.

## Demo mode

Authentication is replaced by a **persona switcher** (cookie `persona=<id>`). Each persona maps to a
role, branch, and where relevant a space or student id. Access predicates are the same functions used
in production; only the identity source changes. See `08-demo-strategy.md`.
