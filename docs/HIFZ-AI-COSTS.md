# Hifz AI — implementation and client pricing

Prepared 2026-09-14. USD estimates, not a measured production bill or binding quote.

## What actually uses AI

The recorded clip goes to Gemini for Arabic transcription and tentative teacher-review notes.
Local code compares the transcript against canonical Quran text and proposes spaced-revision
feedback. Quran playback is prerecorded audio, not generated speech. AI is an assistant to the
ustadh, not an authoritative tajweed examiner; transcription can miss or invent words.

The current configuration pins `gemini-3.5-flash` for text and recorded audio,
as requested by JB. This retains record → submit → written feedback; no Live API.
Accuracy still requires a teacher-labelled recording pilot. Protected credential setup
and a live compatibility test remain pending; the public preview keeps AI disabled.

Without a configured key, audio assessment is unavailable unless a browser transcript exists.
Only explicitly requested simulated examples produce simulated scores; failed audio no longer
silently becomes a simulated result. Simulations do not propose SRS review updates.

## Provider rates and assumptions

[Google's pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash):
input $1.50 / million tokens (text/audio), output $9.00 / million
(including thinking). [Audio tokenisation](https://ai.google.dev/gemini-api/docs/audio):
32 tokens/second = 1,920 tokens/minute. Rates can change; recheck before contracting.

Model: 22 school days/month; one check/day; 500 prompt tokens/check; 800 output tokens/check;
25% usage reserve for retries. Shorter multi-clip checks increase request overhead. Thinking
and actual output can differ; log provider usage metadata in a production implementation.

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
costs. Set a client price only after measuring the pilot, thinking tokens and support effort.

Quote one-time implementation, training, hosting and the wider school platform separately.
Convert to PKR at the agreed quotation-date exchange rate rather than hard-coding a rate.
Run a two-week pilot to measure actual minutes, retries, per-model token usage and teacher
agreement. Reprice if a stronger model is needed for acceptable Arabic recognition.
