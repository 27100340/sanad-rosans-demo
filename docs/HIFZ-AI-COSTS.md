# Hifz AI — implementation and client pricing

Prepared 2026-09-14. USD estimates, not a measured production bill or binding quote.

## What actually uses AI

The recorded clip goes to Gemini for Arabic transcription and tentative teacher-review notes.
Local code compares the transcript against canonical Quran text and proposes spaced-revision
feedback. Quran playback is prerecorded audio, not generated speech. AI is an assistant to the
ustadh, not an authoritative tajweed examiner; transcription can miss or invent words.

Text seats moved to Groq (`openai/gpt-oss-120b`) on 2026-09-14 and are outside this estimate,
which covers Hifz only. **Recorded recitation goes to
`gemini-3.5-transcribe-live` over the Live API** (`src/lib/ai/gemini-live.ts`), because the
REST helper cannot reach the transcribe models: they expose only `bidiGenerateContent`.
The recorder decodes the clip to 16kHz mono PCM before upload; a decode failure falls back
to the old REST audio path on `gemini-3.5-flash`. The record → submit → written feedback
shape is unchanged — nothing streams live to the student.

The transcribe model returns words only, so AI tajweed notes are empty on this path.
Word-level feedback is unaffected: it comes from local alignment against the canonical
text, not from the model. Accuracy still requires a teacher-labelled recording pilot.

Live compatibility was verified on 2026-09-14 against a configured key: `gemini-3.5-flash`
answered both a text prompt and an inline `audio/wav` clip, and the portal returned a live
tutor reply end to end. What remains unverified is Arabic recitation *accuracy*, which needs
the teacher-labelled pilot below. The public preview still keeps AI disabled.

Without a configured key, audio assessment is unavailable unless a browser transcript exists.
Only explicitly requested simulated examples produce simulated scores; failed audio no longer
silently becomes a simulated result. Simulations do not propose SRS review updates.

## Provider rates and assumptions

[Google's pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash):
`gemini-3.5-flash` input $1.50 / million tokens (text/audio), output $9.00 / million.
[Audio tokenisation](https://ai.google.dev/gemini-api/docs/audio): 32 tokens/second =
1,920 tokens/minute.

`gemini-3.5-transcribe-live` on the paid tier is quoted at $3.50/M audio input and $21.00/M
text output, a blended **~$0.009 per minute** of recitation — near enough identical to the
$0.010/minute the old Flash path cost. The saving is the free tier, not the rate card.
Rates can change; recheck before contracting.

### Free-tier quota blocks pilot use

Measured 2026-09-14: the free tier allows **20 `generateContent` requests per day, per model**
(`GenerateRequestsPerDayPerProjectPerModel-FreeTier`), after which every call returns HTTP 429
and the portal serves its scripted fallback. Quota is counted per model, so other models still
answer once one is exhausted. The text seats therefore need billing enabled on the key’s
project for any real demo; the estimates below assume paid tier.

**Recitation is the exception.** Live API models are not on that per-day counter: unlimited
requests, capped instead at 20K tokens/minute (about 10 minutes of audio per wall-clock
minute, so a whole halaqa submitting at once can still hit it). Verified 2026-09-14 by running
a full recitation check end to end while `gemini-3.5-flash` was still returning 429 — it
scored 8/8 words and consumed no `generateContent` quota at all.

### Cost model

Model: 22 school days/month; one check/day; 500 prompt tokens/check; 800 output tokens/check;
25% usage reserve for retries. Shorter multi-clip checks increase request overhead. Log
provider usage metadata in a production implementation rather than trusting these figures.

The output figure no longer carries thinking tokens: `gemini-3.5-flash` reasons by default, but
the client now sends `thinkingBudget: 0` (see `src/lib/ai/gemini.ts`), which removed a measured
322 thinking tokens from a single 18-token reply and cut latency from 27-49s to 5-7s. Any caller
that opts back into thinking must be re-costed at the output rate.

`monthly USD = 1.25 × [(minutes × 1,920 × 1.50 + checks × 500 × 1.50 + checks × 800 × 9.00) / 1,000,000]`

| Usage | Per student/month | 100 students/month | 500 students/month |
|---|---:|---:|---:|
| 5 minutes/day; 110 minutes/month | $0.61 | $61.46 | $307.31 |
| 10 minutes/day; 220 minutes/month | $1.01 | $101.06 | $505.31 |

This is incremental AI cost only, not hosting, storage, support, taxes, payment fees,
teacher review time, the school-wide assistant, or development. No free-tier subsidy is assumed.
Paid-tier data terms differ from free-tier terms; select appropriate terms before real student audio.

## Suggested client pitch (commercial proposal, not provider pricing)

Pitch **AI-assisted Hifz practice with ustadh oversight**, not automated certification.
The previous Flash-Lite proposal of $1–$2 per learner/month must not be reused
without recalculating margin. With 3.5 Flash, estimated provider usage is $0.61–$1.01
per learner/month under the assumptions above, before wider assistant usage or service
costs. Set a client price only after measuring the pilot and support effort.

Quote one-time implementation, training, hosting and the wider school platform separately.
Convert to PKR at the agreed quotation-date exchange rate rather than hard-coding a rate.
Run a two-week pilot to measure actual minutes, retries, per-model token usage and teacher
agreement. Reprice if a stronger model is needed for acceptable Arabic recognition.
