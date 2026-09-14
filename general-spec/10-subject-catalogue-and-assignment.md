# 10 — Subject Catalogue and Teacher Assignment

The reference project (`sjabrankamran-site`) is a one-subject system. Minhaj is multi-subject:
the school keeps a **subject catalogue**, the principal **assigns a subject to a class and a
teacher**, and that assignment *is* the teacher's Subject Space. A teacher holds many spaces.

## Model

```
Subject (catalogue, school-wide)       e.g. Mathematics D · Cambridge O Level 4024
  └── assigned to Class + Teacher  ->  SubjectSpace (one per class × subject)
                                        ├── syllabus map seeded from the subject's strands
                                        ├── resources seeded with the official syllabus link
                                        ├── tutor rules (default hint-only, both languages)
                                        └── assignments, tests, insight, planner
```

Rules:
- One subject per class at a time (re-assign to change teacher; the space moves with its
  resources and history).
- A subject lists which sections offer it (Montessori / Junior / Senior). The form only offers
  subjects valid for the chosen class.
- Teachers are campus-scoped; a principal can only assign teachers and classes in their branch.
  The chairman can act in any branch.
- Custom (non-board) subjects are allowed: name, optional code, board label, sections, strands.
- Students see every space assigned to their class automatically; the tutor space selector lists
  them.

## Catalogue seed (Rosans)

Cambridge Lower Secondary: English 0861, Mathematics 0862, Science 0893. School curriculum:
Urdu, Quran and Islamiyat, Arabic, Computing. Cambridge O Level compulsory (from the school's
website): Mathematics D 4024, English Language 1123, Urdu Second Language 3248, Pakistan Studies
2059, Islamiyat 2058. Optional: Physics 5054, Chemistry 5070, Biology 5090, Business Studies 7115,
Commerce 7100, Additional Mathematics 4037, Computer Science 2210, Food and Nutrition 6065.
Each Cambridge entry links to its official syllabus page.

## Screens

| Route | Seat | Content |
|---|---|---|
| `/portal/principal/subjects` | principal, chairman | Assign form (class → subject → teacher), add-subject form, current assignments table with inline teacher change, catalogue table |
| `/portal/teach` | teacher | "My spaces": one card per space (class, subject, students, backlog, resources) |
| `/portal/teach/[spaceId]/*` | teacher who owns it | Space pages with a tab strip: Overview · Assignments · Tests · Insight · Rules · Planner |

Teacher navigation: "My spaces" plus one rail entry per owned space. The persona no longer pins a
single `spaceId`; ownership is `space.teacherId === viewer.personId`.

## API (demo)

- `POST /api/admin/subjects` `{name, code?, board?, sections[], strands[]}`
- `POST /api/admin/spaces` `{subjectId, classId, teacherId}` → creates the space
- `PATCH /api/admin/spaces` `{spaceId, teacherId}` → reassigns

Writes go through `src/lib/data/repo.ts`, the in-memory repository that mutates the same arrays
and maps the mock modules export, so every reader sees the new space at once. Production
replaces `repo.ts` with Supabase tables `subjects` and `subject_spaces`.

## Implementation status (as of 2026-09-14, evening)

Complete in `rosans/`: catalogue and `buildSpace()` (`lib/data/mock/subjects.ts`), in-memory
repository (`lib/data/repo.ts`), `POST/GET /api/admin/subjects`, `POST/PATCH /api/admin/spaces`,
principal page `/portal/principal/subjects`, teacher home `/portal/teach` ("My spaces"), the
space tab strip (`components/teach/space-tabs.tsx` + `teach/[spaceId]/layout.tsx`), ownership by
`space.teacherId === viewer.personId` in the guard and the `mark` / `planner` routes, classes
Grade 9-A and O Level 1, and a second seeded space for Ms. Hina Raza (`gulberg-g7a-ls-maths`).
`SubjectSpace.subjectId` now records the catalogue id; seeded spaces resolve by name through
`subjectIdForSpace()` in `lib/ai/assess.ts`.
