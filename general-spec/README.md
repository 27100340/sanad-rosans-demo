# Minhaj — AI-Powered School Operating System (Base Specification)

**Minhaj** (منهج, "the way / the curriculum") is EduSoft's white-label base for an AI-powered
Learning Management System for private schools in Pakistan and the wider Muslim world.
Each client gets a branded instance (the first is **Sanad** for Rosans Islamic School).

Paused work and the exact resume steps live in `../RESUME.md` (the repo root).

This folder is the *source of truth for the product idea*. New client instances add on top of it;
they must not fork or contradict it without updating these files.

## Files

| File | What it defines |
|---|---|
| `01-vision-and-positioning.md` | Why this exists, who it is for, competitor gap analysis (socrat.ai and others), pitch narrative |
| `02-architecture.md` | Stack, inherited engineering principles, module boundaries, data model, AI policy, security |
| `03-roles-and-access.md` | Every role, what each can see and control, hierarchy of school → branch → class → student |
| `04-modules.md` | Functional modules per role (leadership cockpit, principal, teacher subject spaces, student, parent, ops) |
| `05-ai-features.md` | Every AI capability, its prompt strategy, guardrails, fallback, and why it creates value |
| `06-hifz-engine.md` | The Quran memorisation module: pedagogy, recitation-checking pipeline, verified data sources, feasibility |
| `07-design-system.md` | Visual language, tokens, density rules, component inventory |
| `08-demo-strategy.md` | How a pitch demo is built: personas, mocked vs genuine data, what must always work |
| `09-white-label-guide.md` | Exactly what to change to ship Minhaj for another school under another name |
| `10-subject-catalogue-and-assignment.md` | Multi-subject model: catalogue, principal assigns subject to class + teacher, teachers hold many spaces (in progress) |
| `11-assessments-and-exam-lab.md` | Question banks, quizzes, timed tests, past-paper practice, AI marking with review, tutor mini-quizzes (done) |
| `12-portal-operations.md` | The reference portal's operating layer generalised across seats: tasks, study plans, library and contribution, performance index and leaderboards, notifications and email, access locks, fees, automations, presence, settings (done, mocked) |

## One-paragraph summary

Minhaj is not a chatbot bolted next to a classroom. It is the school's operating system with AI
woven into every seat: leadership sees every branch live and can *ask the school questions in plain
language*; principals run their branch; every teacher owns a **Subject Space** where an AI teaching
assistant is grounded in *their* materials and boundaries; students get a tutor that teaches the way
their teacher wants, in English or Urdu; parents get a daily brief they actually read; and for Islamic
schools, a **Hifz Engine** that listens to a child recite, checks it word by word, schedules
revision with spaced repetition, and shows the Ustadh exactly where each student is slipping.

## Naming

- Base platform: **Minhaj**.
- Client instances take a name that belongs to the school's own vocabulary
  (Rosans → **Sanad**, the chain of transmission; see `09-white-label-guide.md` for the checklist).
