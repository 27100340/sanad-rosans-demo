# Sanad — active partner / agent handover

Updated: 2026-09-14. Read this file first, then `general-spec/HANDOVER-2026-09-14-BASELINE.md` for the inherited baseline.

## Current work

Continue Rosans demo from `835ec49`, preserving the existing teaching and Hifz modules.
Requested by JB: comprehensive finance; HR performance and appraisal; teaching from
Montessori through O Levels (not A Levels); role-aware navigation/tool assistants;
a working preview link; a defensible Hifz AI cost estimate.

## Verified baseline

- Next.js / React / Tailwind. Demo personas, fictional records, process-memory stores.
- Gemini-only policy; scripted fallback without a key. No production authentication/database.
- Previous `RESUME.md` is preserved in `general-spec/HANDOVER-2026-09-14-BASELINE.md`.
  Only lowercase `resume.md` lives at the root: avoids case-insensitive Windows collisions.
- Reference teaching code inspected locally at `/home/admin/.openclaw/workspace/sjabrankamran-site`
  (`9aabe93`): lesson registers, assignments, exam allocations, marking, study plans.
  Reference repository is read-only for this task; do not change or deploy it.
- Sanad clone: `projects/sanad/repo` in the Pablo workspace.

## Implementation checklist

- [x] Finance: expenses, approval, payroll, fee collection, budgets, exports and reporting.
- [x] HR: evidence rubric, appraisal review, teacher response and development goals.
- [x] Teaching: early years, primary, lower secondary and O Level learning pathways.
- [x] Assistant: shared UI, authorized navigation and explicit tool execution.
- [x] Hifz: distinguish unavailable audio analysis from simulated practice; document AI costs.
- [x] Typecheck, tests, build, desktop/mobile workflow verification.
- [x] Push reviewable branch and publish verified demo URL.

## Handover rules

Update this file after each meaningful milestone with changed files, commands/results,
remaining work and blockers. Do not claim live services, persistent storage, delivered email,
or production readiness where only simulated/demo behavior exists. Never store credentials.
Do not use the previous developer's git identity; use the current configured identity.

## Resume commands

`npm ci`; `npm run typecheck`; `npm test`; `npm run build`; `npm run dev`.

## Remaining production scope (separate from this demo)

Authenticated accounts and branch-scoped database policies, transactional durable records,
backups, actual payment/bank integrations, live mail delivery, contracted school curricula,
and teacher-validated recitation accuracy. Demo personas are not a security boundary.

## Milestone log

### Implementation pass

- `src/lib/domain/{finance,hr,teaching}.ts`: business rules, weighted appraisal rubric,
  stage-specific teaching and original sample lesson templates.
- `src/lib/data/{finance,hr,teaching}.ts`: branch/seat-scoped demo data and workflows.
- `/portal/finance`, `/portal/hr`, `/portal/teaching`, `/portal/learning`: new workspaces.
- `/api/finance`, `/api/hr`, `/api/teaching`, `/api/assistant`: validated actions and audit hooks.
- Shared assistant can navigate, run authorized summaries and create a lesson draft after
  explicit confirmation. No arbitrary URL/code execution or automatic financial approvals.
- New finance, Montessori teacher, primary teacher, Grade 3 learner and Montessori guardian seats.
- Mobile More menu and scrollable desktop sidebar restore access to all sections.
- Hifz audio failure now returns an error, never a fabricated score; explicit simulated practice
  remains available. Simulation does not propose a memorisation review update.
- Replaced unverified `gemini-3.1-flash` model ID with documented audio-capable
  `gemini-3.1-flash-lite`; quality and live credentials remain unverified. API key uses a header.
- `npm ci` exposed dependency advisories; compatible `npm audit fix` now reports 0 vulnerabilities.
- First typecheck caught a nullable learner filter; fixed. Full checks next.
- First full verification: typecheck, 35 unit tests and production build passed.
- Browser pass caught mobile header overflow and a tour mounted inside a filtered header.
  Fixed compact persona control, scrollable persona menu and body-mounted tour overlay.
  Workflow suite also covers lower-stage paper restrictions and truthful Hifz failures.
- Public preview explicitly disables provider calls with `SANAD_AI_ENABLED=false`;
  configured credentials alone are no longer described as verified live responses.
- HTTPS returned 200, and the existing operations site still returned 200 after the isolated
  Caddy addition. Final browser rerun pending after compact mobile persona spacing adjustment.
- README is now valid UTF-8 text (removed the inherited mixed UTF-16/null-byte tail).

### Deployment discovery

- GitHub access verified as `Syedjabran`, repository permission WRITE. No existing deployments.
- Native Vercel is not authenticated. No stored deployment credentials. Do not invoke its
  interactive login in agent logs; use a supported hosting alternative or protected setup.
- Working branch: `feat/sanad-complete-school-demo`. No changes to partner's `main` yet.

### Deployment preparation and verification pass 2

- Production build succeeds on Next.js 16.3.5; provider policy passes.
- Dedicated single-process service `sanad-demo.service`, bound only to `127.0.0.1:3214`.
  Definition: `deploy/sanad-demo.service`. Live AI disabled for this public preview.
- HTTPS preview host selected: `sanad.169-58-80-16.sslip.io` (DNS resolves to the existing host).
  This is a demo hostname, not the school's final custom domain.
- Existing Caddy sites preserved. Added only an import of `/etc/caddy/sanad-demo.caddy`;
  original backup `/etc/caddy/Caddyfile.before-sanad-20260914`. Caddy validation passed.
- `docs/HIFZ-AI-COSTS.md` contains rate sources, usage equation, learner-count scenarios
  and a proposed capped Hifz add-on price; `docs/REFERENCE-AND-COVERAGE.md` separates
  implemented workflows, seeded content and school-dependent production requirements.
- Git author configured from the verified connected GitHub account (`Syedjabran`), not
  the prior developer's identity.

### Final verification and partner pickup

- Implementation commit: `3ef172c`, pushed and verified on remote branch
  `feat/sanad-complete-school-demo`. Partner main remains unchanged.
- Preview: https://sanad.169-58-80-16.sslip.io — HTTPS 200; Chromium loaded
  “Sanad · Rosans Islamic School” with no page errors on 2026-09-14.
- Fresh verification: `npm run typecheck` passed; `npm test` passed 35/35;
  `node scripts/check-ai-provider-policy.mjs` passed.
- All 6 Playwright workflows passed (desktop and 390px mobile). Covers finance approval
  separation/repeat-payment rejection/export, HR acknowledgement, lesson publication and
  learner observations, assistant confirmation/role restrictions, and truthful Hifz failure.
- Browser workflow mutations ran against an isolated production-build process on port 3215,
  not the public demo service. Build had passed in the preceding implementation milestone;
  this final pass changed documentation only, so no rebuild was necessary.
- Google pricing and audio-tokenisation references rechecked; documented cost assumptions
  still match. Actual transcription quality and usage costs remain unmeasured.

Partner pickup:

```sh
git fetch origin
git switch --track origin/feat/sanad-complete-school-demo
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

If the branch already exists locally, switch to it and use `git pull --ff-only`.
For browser checks, start a separate fresh `next start` instance on port 3215, then run
`SANAD_TEST_URL=http://127.0.0.1:3215 npm run test:browser`. Tests mutate demo records;
restart that isolated instance before rerunning. Do not test writes against a shared preview.

Next work, in order:
1. Partner review of this branch and school sign-off on module coverage/curricula.
2. Durable database, authentication and branch-scoped access enforcement before real records.
3. Transactional finance/audit trails and agreed payment/payroll integrations.
4. Teacher-labelled Hifz recording pilot and measured provider usage with protected credentials.
5. Production hosting/domain, backups, monitoring and school-approved data handling.

This milestone completes the extended reviewable demo, not a production school deployment.

### Gemini 3.5 Flash configuration — 2026-09-14

- JB requested Gemini 3.5 Flash for existing text AI and recorded Hifz audio.
- Updated both model constants in `src/lib/ai/gemini.ts`; retained existing REST
  record-and-submit flow, app-controlled tools and financial permissions.
- Updated `docs/HIFZ-AI-COSTS.md`: previous Flash-Lite pricing is superseded.
- No credential copied from chat, committed, or logged. Protected store was empty.
- Live deployment activation and real text/audio checks remain blocked on protected
  credential entry. Public preview remains AI-disabled until securely configured.
- Verification: typecheck, 35/35 unit tests and provider-policy check passed.
- Protected `GEMINI_API_KEY` entry is now stored (value hidden), with egress allowed
  to `generativelanguage.googleapis.com`. No live API request has been verified.
- Next turn: inspect gateway proxy/protected deployment support and connect the stored
  credential without copying plaintext; credential injection requires a fresh turn
  because this turn's command snapshot predates credential entry. Build/deploy and
  test text plus recorded audio only after protected wiring is verified.

### Protected provider verification — 2026-09-14

- Fresh-turn gateway execution confirmed protected key injection and proxy environment
  availability without printing their values.
- Gemini 3.5 Flash text probe through Node fetch failed with `CERT_HAS_EXPIRED`;
  Python urllib also failed at transport. No Gemini response or key validity verified.
- Do not disable TLS verification or copy secrets into the repo/systemd environment.
- Blocker: inspect and repair the expired certificate in the protected egress TLS path,
  then retry text/audio probes and verify durable protected deployment wiring.
- Existing public preview remains unchanged with AI disabled.
