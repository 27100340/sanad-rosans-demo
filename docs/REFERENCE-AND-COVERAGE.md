# Teaching reference and release coverage

Verified 2026-09-14: `Syedjabran/sjabrankamran-site` HEAD
`9aabe930f5515f12031ac1d772232f04242b8f71` (local checkout matches remote).
Read-only reference; no files or deployed configuration in that project changed.

## Reference patterns retained

Inspected `src/app/portal/(app)/teach/[classId]/page.tsx`: class enrolment, lesson creation,
assignment instructions/due dates/marks, lesson attendance and role-gated access.
Also located study-plan, timetable and exam-lab modules. The inherited Sanad implementation
already ports those operating workflows; its detailed mapping is `general-spec/12-portal-operations.md`.
Sanad keeps its own mock repository rather than importing the reference site's production database.

## Stage adaptation

| Stage | Teaching | Assessment | Home / assistant |
|---|---|---|---|
| Montessori / early years | Guided play, language, numeracy, practical life | Emerging/developing/secure observations | Guardian-led activity; navigation guide |
| Grades 1–3 | Concrete and pictorial models, short guided practice | Work samples, observation, low-stakes checks | Short home task; no independent academic chat |
| Grades 4–6 | Guided reasoning, reading, practical inquiry | Learning portfolio and teacher feedback | Guardian-supported practice |
| Grades 7–8 | Topic instruction, misconceptions, targeted support | Classroom quizzes and structured responses | Teacher-governed tutor and study plans |
| O Levels 1–3 | Syllabus-led subject spaces and revision | Past papers and supervised mocks | Targeted exam practice and error logs |
| Hifz | Separate halaqa and recitation pathway | Tentative transcript comparison, ustadh review | Audio practice; explicitly labelled simulations |

Early years, primary and lower secondary approach checked against official Cambridge guidance:
[Early Years](https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-early-years/),
[Lower Secondary](https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-lower-secondary/).
These stage labels do not claim Rosans has adopted every Cambridge programme. The school must
approve grade mapping, timetable, subjects and scheme of work. O Level 3 is not A Level, even
where its demo class record uses numeric year 12.

## Demonstrable versus remaining

- Working: class-scoped lesson draft/edit/publish; guardian notification queue; student and
  parent learning views; evidence observations; academic navigation tools; inherited older-student
  assignments/attendance/exam workflows.
- Seeded examples: original mathematics/numeracy lesson activities for each stage, one demo
  child per primary grade, existing older-student and Hifz rosters. Other subject lessons can be
  authored using the editable subject and lesson fields.
- Not claimed complete: every subject's term/year curriculum, full primary assessment bank,
  differentiated special-support plans for actual children, all campuses' actual enrolments,
  or a production SIS integration. Those require the school's curriculum and enrolment data.
- Finance is a demo operational ledger (fees, expense approval, payroll and budgets), not a
  statutory accounting/tax system or a connected bank reconciliation service.
- HR is an appraisal and development workflow, not a complete recruitment/leave/payroll compliance suite.
