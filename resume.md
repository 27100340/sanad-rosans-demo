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

### Main-branch demo redeploy — 2026-09-14

- GitHub pull request #1 was merged, so `main` now contains the extended school-demo
  implementation (commit `9c83a21`); the old feature branch is no longer needed for pickup.
- Fresh host install exposed a Next.js 16.3.5 Turbopack PostCSS module-resolution failure.
  Updated the production build command to `next build --webpack`; the optimized build passed.
- Restarted `sanad-demo.service`; the public HTTPS endpoint returned HTTP 200 after deploy.

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

### Gemini 3.5 Flash verified live — 2026-09-14 (JB machine)

The previous turn’s TLS blocker was specific to the protected egress path. From JB’s local
Windows checkout the same key reached `generativelanguage.googleapis.com` normally, so the
provider wiring is now verified rather than assumed.

- Key configured in `.env.local` only (gitignored via `.env*.local`); nothing committed.
- `models.list` returned 200 and `models/gemini-3.5-flash` exists (`version 3.5-flash-05-2026`,
  1,048,576-token input, `thinking: true`). Both constants in `src/lib/ai/gemini.ts` already
  pointed at it, and every AI seat routes through the single `askGemini` helper, so no other
  model id needed changing.
- Verified live: a text prompt, an inline `audio/wav` clip (correctly described, 1.5s), and
  `POST /api/ai/tutor` end to end returning `"live": true` in 3.2s with the space’s tutor rules
  applied. Audio input on `gemini-3.5-flash` is confirmed working, not inferred.

Three defects found and fixed while verifying:

- **Thinking on by default.** The model spent 322 thinking tokens on an 18-token reply and took
  27-49s, against the helper’s 12s timeout — so every live call aborted into the scripted
  fallback. `thinkingConfig: { thinkingBudget: 0 }` is now sent by default (5-7s warm), with an
  opt-in `thinkingBudget` input for callers that want reasoning and raise their own timeout.
- **12s timeout too tight.** Cold or contended calls still spiked to 31s. Default is now 30s;
  the two audio callers move 20s to 45s. The demo runs as a long-lived service, not serverless.
- **Failures were silent.** A failed call and the scripted fallback are identical in the UI, so
  `askGemini` now logs status and latency server-side. That is what surfaced the quota limit.

Retry: HTTP 503 ("high demand", seen repeatedly) retries once after 700ms inside the timeout
budget. 429 is deliberately not retried — the quota is spent and a second attempt fails the same.

**Open blocker for anyone demoing this.** The key is on the free tier, which allows only
**20 requests per day per model** (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`,
`quotaValue: 20`). Verification exhausted today’s allowance for `gemini-3.5-flash`; further
calls return 429 and the portal correctly falls back to scripted output until it resets.
Enabling billing on the key’s Google Cloud project is the fix. Quota is per model, so other
models (e.g. `gemini-3.6-flash`) still answer — but switching model is JB’s call, not a
silent substitution, and `gemini-3.6-flash` rejects `thinkingBudget` and would need its own
thinking parameter. `gemini-2.5-flash` is retired for new users (404).

Verification after the changes: `npm run typecheck`, `npm test` 35/35, `npm run build`
(98 static pages, exit 0) and `node scripts/check-ai-provider-policy.mjs` all passed.
Not rerun: the Playwright browser suite and the public preview deployment, which stays
AI-disabled and unchanged.

### Hifz recitation moved to the Live API — 2026-09-14 (JB machine)

JB asked whether the Live API models could be used. They can, and for recitation they are the
better option, so recorded Hifz audio now goes to `gemini-3.5-transcribe-live` instead of
`gemini-3.5-flash`. This reverses the earlier "no Live API" decision **for recitation only** —
every text seat still uses `gemini-3.5-flash` over REST, untouched.

Why: Live API models are not on the 20-requests-per-day free-tier counter. They allow unlimited
requests, capped at 20K tokens/minute. Recitation audio is the heaviest AI call in the product
(1,920 tokens per minute), so this removes quota pressure exactly where it was worst.

- `src/lib/ai/gemini-live.ts` (new): opens a WebSocket session, streams the clip in 0.1s frames,
  collects the transcript, closes. The transcribe model does not reliably send `turnComplete`,
  so completion is idle-based (2.5s quiet) with a 45s hard timeout. Returns null on any failure.
- `src/lib/ai/recitation.ts`: `audio/pcm;rate=16000` routes to the Live API; any other mime type
  still takes the REST path, so an older client sending webm keeps working.
- `src/components/hifz/use-recorder.ts`: the recorded clip is decoded to 16kHz mono PCM via
  `OfflineAudioContext` before upload — the Live API accepts nothing else. Decode failure falls
  back to sending the original webm.

Verified end to end against a running dev server, with `gemini-3.5-flash` still quota-exhausted:

- Real Arabic audio (TTS-generated Al-Fatiha 1-2, resampled to 16kHz) through
  `POST /api/hifz/check` as `student-zaid`: transcript returned, local alignment scored **8/8
  words, 100, passed**, `source: "gemini"`, `live: true`, 5.4s. Zero `generateContent` quota used.
- Non-speech audio (1s tone): **HTTP 422, no score fabricated** — the truthfulness guarantee from
  the earlier milestone still holds on the new path.
- `npm run typecheck`, `npm test` 35/35, `npm run build` (98 pages, exit 0), provider policy: pass.

Known limits, not yet addressed:

- The transcribe model returns words only, so AI tajweed notes are empty on the Live path. Local
  word-level alignment is unchanged, which is where the real feedback comes from.
- PCM is bulkier than webm, so the route’s existing 4,000,000-character cap on `audioBase64` now
  bounds a clip at roughly 93 seconds rather than several minutes.
- Accuracy was measured on clean synthetic speech. Children reciting in a classroom is a harder
  problem and remains unproven, as before.
- Free tier means Google uses the content to improve their products. That is an argument for paid
  tier before real student recitation audio, independent of cost.
- The Playwright browser suite was not rerun; the recorder change is client-side and needs a real
  microphone pass in a browser.

### Two providers: Gemini for audio and vision, Groq for text — 2026-09-14 (JB machine)

**This replaces the Gemini-only rule.** JB supplied a Groq key and decided: keep Gemini for the
Hifz speech work, move everything else to Groq. `scripts/check-ai-provider-policy.mjs` has been
updated to match — it now states the two approved providers rather than silently passing a key
it was never written to consider. Anthropic, OpenAI, Moonshot/Kimi remain prohibited, and the
`openai` package stays blocked: Groq is called with plain fetch over its OpenAI-compatible REST
path, so no OpenAI SDK, account or endpoint is involved.

Why: Groq’s free tier allows roughly 1,000 requests per window against Gemini’s 20 per day, so
the text seats work without billing. The split follows capability, not preference — Groq serves
no multimodal model on this key, so audio and images could not move even if we wanted them to.

| Surface | Provider | Model |
|---|---|---|
| Recitation audio | Gemini Live API | `gemini-3.5-transcribe-live` |
| Handwriting vision | Gemini REST | `gemini-3.5-flash` |
| Recitation REST fallback | Gemini REST | `gemini-3.5-flash` |
| Every text seat (12 call sites) | Groq | `openai/gpt-oss-120b` |

- `src/lib/ai/groq.ts` (new): mirrors the shape of `askGemini` so the swap was one identifier per
  call site. Same timeout, retry-once-on-429/503 and server-side failure logging (`[groq] ...`).
- 12 modules moved from `askGemini` to `askGroq`; `handwriting.ts` and `recitation.ts` keep Gemini.
- `groqIsLive()` added. The AI pills on the ask, at-risk, inbox and family pages now report Groq,
  since those seats are Groq-driven; the portal-wide pill is true if either provider can answer.
  `SANAD_AI_ENABLED=false` still disables both, so the public preview is unchanged.

Two defects found while testing, both the same shape as the Gemini thinking bug:

- **gpt-oss reasons against `max_tokens`.** On a parent brief it spent 471 of 500 completion
  tokens reasoning and returned a truncated headline, so every brief silently fell back to
  script. Fixed with `reasoning_effort: "low"` (the API floor; there is no "none") plus a
  separate 500-token headroom, so `maxOutputTokens` still means visible output.
- **`brief.ts` prompt was ambiguous.** "then one LINE: per fact" read as prose; gpt-oss wrote the
  facts without the `LINE:` label, `parseKeyLines` found none and the brief fell back. Rewritten
  as one label per line, matching `marker.ts` and `designer.ts`, which parse reliably as written.
- `parseKeyLines` now trims trailing whitespace: gpt-oss ends lines with the two trailing spaces
  that mean a markdown line break, and they were surviving into parent-facing copy.

Verified live end to end: tutor, ask-school, triage and parent briefs in both English and Urdu
all return `live: true` through Groq; the Hifz check still scores 8/8 through Gemini Live in the
same run. `npm run typecheck`, `npm test` 35/35, `npm run build`, provider policy: all pass.

Open points for JB:

- **Urdu quality is a step down from Gemini.** Groq’s brief is accurate and correctly scripted,
  but flatter: a generic "ایک مختصر رپورٹ" headline where Gemini wrote "احمد کا آج کا دن اچھا رہا",
  and it drifted on vocabulary (ٹیچر for tutor). Worth a read-through by an Urdu speaker before
  parent-facing copy goes to Rosans.
- Islamic-appropriateness was validated against Gemini. `VALUES_GUARDRAIL` is now enforced by a
  different model family and has not been re-tested for religious content.
- School data now reaches a second vendor. Groq’s data terms have not been reviewed here.
- `VALUES_GUARDRAIL` and `parseKeyLines` still live in `gemini.ts` though both providers use them.
  Provider-neutral, but the file name now understates their scope.

### Browser pass on the Groq tutor — 2026-09-14 (JB machine)

JB reported that calls did not look like they were reaching the AI. They are: driven through
Chrome as Ahmed Hassan, the tutor held a four-turn conversation that tracked each answer,
`POST /api/ai/tutor` returned 200, and the top bar showed "AI configured". No scripted fallback
could follow a dialogue like that.

What almost certainly caused the impression: **the tutor was emitting raw LaTeX.** gpt-oss wraps
algebra in `\\( ... \\)`, the portal renders markdown without KaTeX, and a Grade 8 student saw
literal backslashes mid-sentence. It reads like broken template output rather than a live tutor.

- `src/lib/ai/plain-maths.ts` (new): `stripLatex` unwraps `\\( \\)`, `\\[ \\]` and `$ $`, and converts the
  common commands to symbols (times to ×, frac to a/b, sqrt to √). It only unwraps `$ $` when the
  contents actually look like LaTeX, so "$5 and $10" survives untouched.
- Applied in `tutor.ts` `parseReply`. The prompt also now asks for plain maths, but the prompt
  alone did not hold across turns — a rendering constraint should not depend on model compliance.
- Verified in Chrome after the change: the same question came back as "x × x", no backslashes.

Not yet done: `studio.ts`, `planner.ts` and `marker.ts` also produce maths for teachers and were
not checked for LaTeX. `stripLatex` is exported and ready if they need it.

### Physics vertical, agent assistant, proctoring repair — 2026-09-14 (JB machine)

Four workstreams, three parallel implementers with strict file ownership, one verification pass.

**1. Provider split changed again.** Text seats run on Groq (`openai/gpt-oss-120b`); Gemini keeps
audio (Live API transcribe) and vision (handwriting). `scripts/check-ai-provider-policy.mjs` was
updated to name both approved providers rather than silently passing a key it never considered.

**2. Assistant is now a real tool-calling agent** (`src/lib/ai/assistant-agent.ts`). The regex
router is gone. 10 seat-gated tools: finance/appraisal/teaching summaries, at-risk students,
attendance, parent-inbox triage, today’s timetable, marking backlog, navigate, create-lesson-draft.
Staff only — students and parents get 403 and keep the study tutor. The model’s write tool has no
classId parameter and cannot write; it returns a proposal and only a confirmed user action writes.
Verified: injection refused, finance seat refused student data, cross-seat leakage none.

**3. Proctoring: the camera had never worked, and it lied about it.**
Root cause was `next.config.mjs`, not the component: `Permissions-Policy: camera=()` is an EMPTY
allowlist, disabling the camera for every origin including self, so getUserMedia was rejected with
no prompt on every device. Fixed to `camera=(self)`. Separately, CSP `script-src`/`connect-src`
lacked the MediaPipe origins, so the face/object analysis could never load; added those plus
`wasm-unsafe-eval` (production drops `unsafe-eval`, so without it proctoring would have worked in
dev and died in the demo build).
Two fabrications removed from `proctor-camera.tsx`: a bare 8-second timer granted
"Approved · basic monitoring" without ever consulting the stream (and the merge-style status
setter then overwrote the "Camera blocked" message), and the scan loop set `faces = 1` with no
model loaded, so the badge read "In view" with nothing measuring. Approval now requires a real
frame (`if (!videoRef.current?.videoWidth) return;`).
Verified live in Chrome: stream true, 640x480, autoplay true, and "face tracking and device
detection are both running" — the full analysis path working for the first time.

**4. Physics vertical (~7,300 lines), ported from sjabrankamran-site.**
Cambridge International AS & A Level Physics 9702, not the O Level 5054 first attempted: 46
authored questions plus 966 real past-paper questions across 88 papers, 1,012 total, all 23
strands, LOT/HOT levels, Cambridge command words and mark schemes. Ported with a re-runnable
generator so the authored text survives byte for byte.
Routes: `/portal/physics` (student Studio), `/assignments` + `/[allocationId]`, `/progress`,
`/library` + `/[slug]` (everyone), `/exam-lab`, `/review`, `/overview` (teachers).
The AI-assisted vs teacher-verified labelling is the integrity core and is enforced server-side:
only the review route can attach a verified label, and the reviewer name comes from the session.

**LaTeX was the main risk and it is handled.** The reference renders KaTeX; Sanad does not, so
every stem would have shown raw backslashes. The agent found three bugs in the reference’s own
converter while porting (unbraced `mathrm s`, `tfrac12`, and `mumathrm F` collapsing to "muF").
Verified on screen: 0 LaTeX sequences on the library, on a generated paper, and in question stems;
symbols render as Ω, β⁻, m s⁻¹, 2200 μF.

Nav (lead-owned): students get Physics Studio + Physics library; teachers get Physics + Physics
review. Students deliberately get no Exam Lab and no assistant.

Verification: `npm run typecheck` clean, `npm test` 35/35, `npm run build` 111 pages exit 0,
provider policy pass. Browser-verified: Physics Studio, Exam Lab paper build and marking, verified
library, assistant tool calls across seats, and the proctor camera.

Known gaps, deliberate:
- Physics types were NOT folded into `assessment.ts`. Those carry subjectId/topicCode/core-extended
  and have nowhere for a Cambridge paper type, LOT/HOT level, command word or past-paper ref.
- Google Workspace (Classroom/Drive import/provisioning) from the reference is not ported; it needs
  real OAuth credentials and a mock would violate the no-simulated-as-real rule.
- Login/onboarding/self-register are not ported; Sanad has no auth by design.
- Playwright browser suite not rerun after these changes.

### Hifz recitation scored a correct sabaq wrong — 2026-09-14 (JB machine)

JB reported that a demo sabaq on Surah Al-Mulk "wasn’t properly recording and the result was
wrong". Reproduced with 27s of real Al-Mulk 1-2 recitation audio: score 75, passed false, on a
recitation that was correct. Three separate defects, all introduced by the Live API switch earlier
today, plus one that predated it.

**1. Streamed chunks were concatenated without a separator.** The Live transcribe model emits
whole phrases that are spaced internally but carry no space at the seam. `collected += piece`
glued "…كل شيء" to "قدير". Dumping the raw chunks proved the model was correct and the client
was wrong.

**2. `normalize.ts` deleted Persian letter forms.** ASR returns Quranic text with farsi yeh
(U+06CC) and keheh (U+06A9). Both sit outside the ء-ي range the punctuation rule preserves, so
they were replaced by a space: "قدیر" became two tokens "قد ر", and "کل" silently lost its kaf and
became "ل". This predated today and would corrupt alignment from any transcription source.
Fixed by folding U+06CC, U+06A9, U+06BE and U+06D2 before the punctuation strip.

**3. Live API chunk seams are not word boundaries.** With 1 and 2 fixed the score reached 90-100
but varied run to run, because the seam sometimes falls mid-word and no join rule can recover it.
Word-level alignment needs determinism, so recitation now uses REST `gemini-3.5-transcribe`, which
returned a byte-identical, correctly spaced transcript on three consecutive runs of the same clip.
`src/lib/ai/gemini-live.ts` is deleted rather than left as dead code.
That model rejects BOTH a developer instruction and `thinkingConfig` with a bare HTTP 400, so
`askGemini` now omits `systemInstruction` when no system prompt is given and omits `thinkingConfig`
for transcribe models.

**4. Ambient noise produced a scored 0%, not a failure.** Recording ~10s of room noise made the
model emit two junk words; the app scored that 0% with 44 substitutions AND wrote it to the
student’s memorisation record through `reviewUnit`. That is a fabricated assessment. The check
route now refuses any transcript under 25% of the expected word count, naming the numbers, and
records nothing. A student who genuinely stops part-way still clears the threshold and is scored
with real omissions.

Verified: correct Al-Mulk recitation 100/100 20 words; browser-speech path 100/100; a 2-of-20
transcript refused with HTTP 422 and no score; the WAV wrapper is byte-identical to the file the
transcribe model accepted. The browser recorder itself was never broken — instrumenting the upload
showed ~10.3s captured and sent as 16kHz PCM for the right unit.

**Open:** `gemini-3.5-transcribe` is 20 requests/day on the free tier and today’s diagnosis
exhausted it, so the end-to-end audio path could not be re-verified through the app after the
final fix; the code path is proven byte-for-byte against the model. The quota resets daily and
billing removes it. This is now the strongest argument for enabling billing: unlike the text seats,
Hifz has no adequate free alternative, because the unmetered Live model is the one that scores
wrong.

### Hifz verified working end to end — 2026-09-14 (JB machine)

JB loaded $5 of prepay credit, which unblocked the last verification. It immediately exposed a
fifth defect that quota had been masking.

**The transcribe models return a different response part shape.** `gemini-3.5-transcribe` answers
with `parts: [{ audioTranscription: { text } }]`, not `parts: [{ text }]`. `askGemini` read only
`p.text`, so a perfectly good transcript arrived as an empty string and every recitation fell back
to "could not be transcribed" — with no error logged, because the HTTP call had succeeded.
`askGemini` now reads either shape through a `partText` helper.

Worth recording how this hid for so long: the curl probe used to "prove" the model worked grepped
for `"text": "` and matched the NESTED audioTranscription.text, so the direct call and the app
looked like they were sending the same request and getting different answers. The raw response body
settled it. Grep on a JSON shape you have not actually inspected is not verification.

**Verified after the fix:** the 27s Al-Mulk 1-2 clip scores 100/100, passed, 20 of 20 words
correct, `source: gemini`, `live: true`, on three consecutive runs. The simulated path still
reports 95 for a one-miss variant and is labelled `source: simulated`.

Full gate green: typecheck, 35/35 unit tests, provider policy, production build (111 pages).

**Billing note, correcting an earlier entry.** Google AI Studio DOES sell prepay credits
(ai.studio/projects, https://ai.google.dev/gemini-api/docs/billing#prepay). An earlier session note
said Gemini was postpaid-only and there was nothing to top up; that was wrong. The two keys JB
holds sit on different plans: one project on the free tier (20 generateContent requests per day per
model) and one on prepay. $5 of credit is ample for demos — recitation costs about $0.009 per
minute of audio and the text seats cost nothing, since they run on Groq.

### Long-clip segmenting and connected-speech tolerance — 2026-09-15 (JB machine)

Testing JB’s ACTUAL demo unit (Al-Mulk 67:11-15, five ayat, 58s) rather than the shorter passage
used earlier exposed two more problems.

**6. The transcribe model returns empty content for long clips.** Measured: 20s, 30s and 40s all
transcribe correctly; 50s and 58s return `content: {}` with the audio tokens billed. A five-ayah
sabaq sits just past that cliff, which is almost certainly what JB originally hit. `recitation.ts`
now splits anything over 30s and transcribes each segment. The cut is placed on the quietest 120ms
window in the preceding four seconds, so it lands in the pause between ayat instead of through a
word; it falls back to the nominal cut when no pause is there. Segments are joined with a space.

**7. Quranic orthography marked correct recitation wrong.** `اجهروا` is said "jharu" after أَو
(hamzat al-wasl) and the pronoun ha in `واليه` is routinely elided, so a flawless recitation scored
95 and, because sabaq demands 100, FAILED. `equivalentWord` in `quran/diff.ts` now treats a dropped
leading wasl-alif or a dropped final ha as correct, in the alignment cost and the backtrace.
Deliberately narrow: losing the whole article (الملك vs ملك) is still an error, and any change to
the root letters is still a substitution.

Verified: the 58s sabaq scores **100, passed, 44/44** on consecutive runs, while the seeded
one-miss and one-sub variants both score 98 and do NOT pass. So the tolerance forgives
connected speech without forgiving memorisation errors.

**On `gemini-3.5-transcribe-live`, correcting an earlier entry.** The previous note claimed the
Live model’s chunk seams fall mid-word. That was an inference from score variance and it is wrong:
dumping raw chunks shows the seams land on word boundaries. The real defect is that Live DROPS
words and is not reproducible — three runs of the same 58s clip returned 41, 41 and 42 words
against a canonical 44, with differing chunk counts. REST transcribe remains the right choice for a
score written to a student record, now on measurement rather than inference.

Gate: typecheck, 35/35 unit tests, provider policy, production build (111 pages).

Still unverified: a real human voice through a real microphone. Every audio test so far has used
clean synthesised recitation. Room noise and mic quality remain the open variable.

### Real recitation scored 39-61%: segmenting was losing audio — 2026-09-15 (JB machine)

JB tested with a real recitation rather than the synthesised clips used so far and got 39%. That
was a genuine defect, and the synthetic tests had hidden it because they were short enough never to
be segmented.

Reproduced with the app’s own bundled Al-Husary audio for the unit (five ayat, 89.8s), decoded and
resampled in the browser exactly as the recorder does, posted to the real endpoint: **score 61, 15
words omitted**. The transcript showed ayah 13 entirely absent and most of ayah 14 gone — the whole
middle of the recitation.

**8. A failed segment was skipped silently.** `if (res.text) pieces.push(res.text)` dropped ~30s of
audio and still returned a confident score. A comment in that very line claimed one failed segment
"must not discard the rest of the sabaq" — the opposite of what it did to the child. Now: any
segment that yields nothing after a retry fails the whole attempt, and nothing is recorded.

**9. Fixed-size windows left an unreadable runt.** 89.8s produced four 20s segments plus a 9.8s
offcut, and the model returns nothing for that fragment — so with fix 8 in place every long
recitation failed instead. `segmentPcm` now splits into EQUAL parts (ceil(total/max), each cut at
the quietest window nearby), so a 90s sabaq becomes five ~18s segments with no runt.

**10. Silent tails are skipped, not failed.** A recording ends with room tone; sending that to the
model returns nothing, which fix 8 would read as a lost segment. Segments under a mean level of 120
are skipped without spending a request. Husary measures ~2100-3600 on the same scale.

Verified on REAL recitation, through the browser decode path to the live endpoint:
**score 100, passed, 44/44 correct, 0 omitted**, full transcript with all five ayat present.

Also measured: the model transcribes a single real 14s Husary ayah perfectly, so transcription
quality on genuine tajweed was never the problem — the pipeline was.

Operational note: a check now costs up to one request per ~18s segment (five for a long sabaq).
Back-to-back testing hits a per-minute rate limit and returns 429; that is transient and not credit
depletion — the key recovers within a minute.

Gate: typecheck, 35/35, provider policy, production build.

### Silence threshold was calibrated to studio audio — 2026-09-15 (JB machine)

JB reported that live speaking omits words, where a played-back recording did not.

First hypothesis was wrong and worth recording: the recorder starts Chrome speech recognition
alongside MediaRecorder, two independent microphone consumers, which looked like an obvious cause
of dropouts. Measured in the browser — 6s captures with and without speech recognition running —
both produced continuous audio, zero gaps over 200ms, 3.3% vs 3.7% near-silent samples. The
concurrent recogniser does not damage the recording.

**11. The real cause: the silence skip used an absolute level tuned on studio audio.** Husary
measures 2100-3600 mean int16. A REAL microphone in a quiet room measures **170** (peak 4875,
measured in-browser). The threshold was 120 — so a child reciting softly, or any segment holding a
long pause plus a few quiet words, fell under it, was skipped WITHOUT a request, and its words
disappeared with no failure raised. Exactly the reported symptom, and invisible in every test so
far because all of them used loud recorded audio.

Silence is now judged relative to the clip: `min(40, clipLevel * 0.12)`. Checked across cases —
studio speech transcribed, studio silent tail skipped, quiet-mic speech transcribed, quiet
pause-heavy segment transcribed (previously skipped), true silence skipped.

Re-verified after the change: the real 89.8s Husary sabaq still scores 100, passed, 44/44, 0 omitted.

Lesson for anyone tuning audio thresholds here: seeded and synthesised clips are far louder than a
child on a laptop. Calibrate against a real microphone capture, not against the reference audio.

### Browser speech was grading recitations — 2026-09-15 (JB machine)

JB sent a screenshot: Al-Kafirun recited correctly, scored **11%**, 3 correct / 12 substituted /
12 omitted, and the unit marked **weak, next due tomorrow**. The badge on that result read
"Browser speech", not "Gemini audio". That one label explained everything.

**12. A failed recording was silently graded by Chrome.** `recite-panel.tsx` sent
`mode: "browser"` whenever the recorder produced no audio, and `resolveTranscript` accepted a
browser transcript for ANY non-simulated mode. So when MediaRecorder returned an empty blob, the
Web Speech API transcript — Chrome's ar-SA recogniser, which mishears fluent Quranic recitation
badly — was scored as if it were the assessment, and written to the child's memorisation record.
No log line was produced because the Gemini path was never entered.

Three changes:
- The panel no longer downgrades a failed recording. No audio now says so plainly and assesses
  nothing.
- `resolveTranscript` accepts a browser transcript only for an explicit `mode: "browser"`, never as
  a silent consolation prize for a failed audio attempt.
- `reviewUnit` now runs only for `source === "gemini"`. Simulated attempts never moved the record;
  browser speech must not either.

Verified: audio mode with no audio returns 422 and assesses nothing; explicit browser mode still
scores (100 on a correct transcript) but leaves the unit untouched; a real transcription still
scores and still updates the record.

This was the fourth defect in a row that only real use could surface, and the pattern is the same
each time: a fallback that looked like resilience was actually inventing an assessment. The rule
worth keeping: in this product, failing visibly is always better than scoring something we did not
really measure.

### Whisper wired as the transcription fallback — 2026-09-15 (JB machine)

`gemini-3.5-transcribe` is capped at **100 requests per day per model** on the current plan (the
$5 raised it from 20). A day of debugging exhausted it, with a 4-hour reset, and one sabaq costs
several requests because long audio is segmented. That is too fragile for a live demo.

`src/lib/ai/whisper.ts` (new) calls Groq `whisper-large-v3`, which takes the WHOLE clip in one
request — no segmenting, so it also sidesteps the entire class of segment bugs found today.

Chain is Gemini → Whisper → honest failure. Gemini stays primary on measurement, not preference:
on the real 90s Husary recitation Gemini scored 44/44 and Whisper 42/44 (`واجر` heard as `واجو`,
`رزقه` as `رزقها`), and those two words are the difference between passing a sabaq and failing.
Whisper is reached only when Gemini yields nothing — a cap, an outage, or a segment that will not
read.

The result carries `source: "whisper"` and the UI labels it "Whisper audio" beside the existing
"Gemini audio", so the two are never read as equivalent. Both count as real transcriptions and may
move the SRS record; browser speech and simulated attempts still may not.

Also: segment size back to 40s (proven to transcribe, and a third fewer requests than 20s), and
`whisper-large-v3` rather than turbo, which degraded badly on Quranic Arabic in testing.

Verified with Gemini genuinely capped: two 429s, retry, fallback, **score 100, passed, 44/44,
source whisper, unit updated**. Gate: typecheck, 35/35, build, provider policy.

## PAUSED HERE — 2026-09-15

JB asked for four features. Two are finished, two were stopped part-way. The tree is GREEN at the
pause: typecheck clean, 35/35 unit tests, provider policy, production build.

### Finished and verified

**Hifz human marking.** Recording now goes to the qari, not the AI. Record -> "Send to ustadh" ->
his queue, unscored ("No score exists until he has heard it"). Five weighted rubric criteria as
data in `HIFZ_RUBRIC`: dabt 40, tajwid 25, talaqah 15, waqf wa ibtida 10, adab 10, with
mumtaz/jayyid jiddan/jayyid/maqbul/da'if bands, per-criterion descriptors and a luqma count. Score
is recomputed server-side from the bands; the client never sends one, and a human mark is what
moves the SRS record. The AI check is demoted to a collapsed "Experimental AI" card that states it
is unvalidated on children reciting in a classroom. Verified: parent posting a submission 403,
student marking 403, principal gets an explanation rather than the queue.
Nav added: "My recitations" (Hifz student), "Marking desk" (ustadh).

**Pen and touch answers for A-Level Physics.** `src/components/assess/ink-pad.tsx`, built on the
reference `answer-pad.tsx` but beyond it: stylus pressure mapped to stroke width, coalesced pointer
events so letter curves survive, palm rejection once a pen has been seen, undo stack, eraser, ruled
paper, devicePixelRatio scaling. A structured question now offers Type / Write by hand
(`WrittenAnswer` in `physics/question-card.tsx`). Handwriting goes to the EXISTING Gemini vision
reader via the new `POST /api/handwriting`, and the transcription lands in the same editable box so
the student can correct a misread word — the image itself is never marked. Verified in-browser:
simulated stylus stroke produced 1,113 inked pixels; an unreadable scribble returned "could not be
read", not an invented transcript. Uses `gemini-3.5-flash`, which is NOT the capped model.

### Stopped part-way — TREAT AS UNFINISHED

Both agents were interrupted at JB's request. Their code compiles and the routes return 200, but
NOTHING in either was reviewed or functionally verified, and neither has nav entries. Do not assume
any of it works.

**Attendance** (`/portal/teach/attendance`, `/portal/principal/attendance`, `/api/attendance`,
`src/components/attendance/`, `src/lib/ai/attendance-agent.ts`, `src/lib/data/attendance-register.ts`):
intended to add a real class register with present/absent/late/leave/excused plus **bunk**, and a
text agent a teacher can type to ("everyone present except Umar and Hamza") which PROPOSES a change
set for confirmation and must ask rather than guess on an ambiguous name. Unverified.

**Young-learner games** (`/portal/play`, `/api/play`, `src/components/play/`, `src/content/play/`,
`src/lib/{domain,data}/play.ts`, `src/lib/ai/play-coach.ts`): playable AI-backed exercises for
Montessori and primary — early literacy, number sense, shapes, age-appropriate Islamic studies,
Urdu — each needing a seeded deterministic fallback. Unverified.

### Open question for JB

The simulate-attempt controls (perfect / one-miss / one-sub) still work but now sit one click deep,
behind the experimental AI disclosure. They are useful for pitching without a microphone. JB has
not said whether to surface them again.

## Four features complete — 2026-09-15

Supersedes the PAUSED note above: the two interrupted workstreams were resumed and finished.
Gate: typecheck clean, 35/35 unit tests, provider policy, production build 118 pages.

**1. Hifz human marking.** Recording goes to the qari, not the AI. Five weighted rubric criteria
(dabt 40, tajwid 25, talaqah 15, waqf 10, adab 10) with mumtaz/jayyid jiddan/jayyid/maqbul/da'if
bands, per-criterion descriptors and a luqma count. Score computed server-side from the bands; a
human mark is what moves the SRS record. AI demoted to a collapsed "Experimental" card.
Lead-verified end to end: submit 201 pending -> ustadh queue -> mark -> score 93, SRS updated to
lastScore 93 / reviews 1 / due 2026-09-15; second mark 409; audio ACL ustadh+owner 200, other
student and parent 403.

**2. Attendance.** `bunk` added beside absent — same attendance cost, separate category everywhere
(own code, gold not red, top of the principal action list, different guardian wording, optional
reason). Register opens all-present then corrects exceptions, coded strip doubles as keyboard
shortcuts. The text agent uses Groq for INTENT only; identity resolution is deterministic and
local, and any name token the teacher never typed is discarded before matching.
Lead-verified: "everyone present except Ali, and Hamza bunked" against the real roster asks
`"ali" matches Ali Raza, Mahnoor Ali` and holds BOTH out of the blanket; an unknown name plans 0
changes and holds the whole blanket; register untouched until confirm; agent route 403 for student,
parent, ustadh and another teacher; a closed register refuses agent marking.

**3. Pen and touch answers (A-Level Physics).** `src/components/assess/ink-pad.tsx` — stylus
pressure mapped to stroke width, coalesced pointer events so letter curves survive, palm rejection
once a pen has been seen, undo, eraser, ruled paper, devicePixelRatio scaling. Structured questions
offer Type / Write by hand. Handwriting goes to the existing Gemini vision reader via the new
`POST /api/handwriting` and the transcription lands in the EDITABLE answer box, so a misread word
can be corrected; the image itself is never marked. Uses gemini-3.5-flash, not the capped model.
Lead-verified in browser: simulated stylus stroke produced 1,113 inked pixels; an unreadable
scribble returned "could not be read" rather than an invented transcript.

**4. Young-learner play.** 18 activities, six per band (Montessori/early, lower primary, upper
primary), five interaction types and no radio buttons. Covers phonics, number sense, sorting,
patterns, age-appropriate Islamic studies and Urdu. Every activity has three seeded rounds; Groq
generates a fresh round per turn.

Worth keeping: model output passes TWO gates. Shape validation, then a semantic check of the
relation itself where it is machine-checkable (letter->word, bonds summing, constant step, times
tables, fractions vs a half) — because the model paired خ with کھجور, a word that does not start
with that letter. In testing 3 of 4 Urdu phonics generations were factually wrong and were caught.
The model is reliable at English phonics, sorting and sequences. Anything failing either gate falls
back to seeded content, and the UI says "Fresh items" vs "Practice set", "AI encouragement" vs
"Scripted encouragement".
Lead-verified: senior student and staff refused (403 on the API; empty state / SeatDenied on the
page), the primary learner sees real activities.

Nav added by the lead: "My recitations" (Hifz student), "Marking desk" (ustadh), "Play & practise"
(early/primary student and parent). Attendance already had entries.

Still open for JB: the simulate-attempt controls (perfect / one-miss / one-sub) now sit one click
deep behind the experimental AI disclosure. Useful for pitching without a microphone — JB has not
said whether to surface them again.
