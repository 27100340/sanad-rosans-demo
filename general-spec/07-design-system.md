# 07 — Design System

Direction: **professional, clean, modern**. A calm operations console, not an ed-tech toy.
Think of a well-run school office: quiet surfaces, one accent, generous whitespace, numbers that
line up. Islamic identity comes through geometry and restraint, never through clip-art.

## Tokens (CSS variables as RGB triplets, surfaced through Tailwind with alpha support)

| Token | Role | Rosans default |
|---|---|---|
| `--canvas` | page background | `#F6F7F4` (warm off-white) |
| `--surface` | cards | `#FFFFFF` |
| `--ink` | primary text | `#12211C` (deep green-black) |
| `--muted` | secondary text | `#5E6B66` |
| `--line` | borders | `#E3E7E3` |
| `--accent` | brand (buttons, active nav) | `#0F5C46` (Rosans green) |
| `--accent-soft` | tinted backgrounds | `#E4F1EB` |
| `--gold` | highlights, hifz milestones | `#B8892B` |
| `--danger` / `--warn` / `--ok` | semantic | `#B42318` / `#B54708` / `#027A48` |

Dark sections wrap in `.theme-dark`, which flips the same variables. Components never branch on theme.
A client instance changes only `--accent`, `--accent-soft`, `--gold`, and the logo.

## Type

- Display: **Fraunces** or **Newsreader** (serif, optical sizing) for page titles and the brief.
- Body/UI: **Inter** or **Geist**.
- Numbers: tabular figures (`font-variant-numeric: tabular-nums`) everywhere a column of numbers appears.
- Arabic: **Amiri Quran** or **Scheherazade New** for Quran text at 28–36px with 2.0 line-height;
  never bold. Urdu: **Noto Nastaliq Urdu**, right-to-left.

## Density budget (from the reference project, kept as hard rules)

- One row of at most 4 stat tiles at the top of a dashboard.
- At most 2 content blocks above the fold.
- Lists on dashboards show at most 6 rows with a "view all".
- No explanatory banners or onboarding paragraphs inside the portal. Tooltips on icon-only controls.
- Spacing scale: sections `space-y-10`, cards `p-6`, grids `gap-6`, phone `p-4 gap-4`.

## Components (`src/components/ui`)

`Button` (primary / soft / ghost / danger), `Card`, `Stat` (label, value, delta, tone), `Badge`,
`Field` (label + input + help), `PageHeader` (eyebrow, title, actions), `EmptyState`, `Tooltip`,
`Table`, `Tabs`, `Chip`, `Progress`, `HeatCell`. Feature components compose these only.

## Layout

- Portal shell: left rail (icons + labels, collapses to bottom bar on phone), top bar with branch
  selector and persona switcher, content max-width 1200px.
- Every portal page starts with `PageHeader`.
- Phone-first: test at 390px. Tables collapse to stacked cards below 640px.

## Motion

Subtle only: 150ms fades, 200ms slide for panels, a single "reveal" on dashboards. No confetti.
The one allowed celebration: completing a juz shows a gold rule and a line of calligraphy.

## Marketing landing (per instance)

Hero with the product name and a one-line promise, a three-column "one system, every seat" strip,
a Hifz feature section, a leadership section with a cockpit screenshot, and a "Book a demo" CTA.
