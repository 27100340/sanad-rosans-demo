# Hifz AI — implementation and client pricing

Prepared 2026-09-14. USD estimates, not a measured production bill or binding quote.

## What actually uses AI

The recorded clip goes to Gemini for Arabic transcription and tentative teacher-review notes.
Local code compares the transcript against canonical Quran text and proposes spaced-revision
feedback. Quran playback is prerecorded audio, not generated speech. AI is an assistant to the
ustadh, not an authoritative tajweed examiner; transcription can miss or invent words.

The inherited audio model ID `gemini-3.1-flash` was not listed in the pricing documentation
inspected. This release pins the documented, audio-capable `gemini-3.1-flash-lite` for both
text and audio. Accuracy still requires a teacher-labelled recording pilot before a client
promise. No live credential or real-audio accuracy claim is made for this preview.

Without a configured key, audio assessment is unavailable unless a browser transcript exists.
Only explicitly requested simulated examples produce simulated scores; failed audio no longer
silently becomes a simulated result. Simulations do not propose SRS review updates.

## Provider rates and assumptions

[Google's pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-flash-lite):
audio input $0.50 / million tokens, text input $0.25 / million, output $1.50 / million
(including thinking). [Audio tokenisation](https://ai.google.dev/gemini-api/docs/audio):
32 tokens/second = 1,920 tokens/minute. Rates can change; recheck before contracting.

Model: 22 school days/month; one check/day; 500 prompt tokens/check; 800 output tokens/check;
25% usage reserve for retries. Shorter multi-clip checks increase request overhead. Thinking
and actual output can differ; log provider usage metadata in a production implementation.

`monthly USD = 1.25 × [(minutes × 1,920 × 0.50 + checks × 500 × 0.25 + checks × 800 × 1.50) / 1,000,000]`

| Usage | Per student/month | 100 students/month | 500 students/month |
|---|---:|---:|---:|
| 5 minutes/day; 110 minutes/month | $0.17 | $16.84 | $84.22 |
| 10 minutes/day; 220 minutes/month | $0.30 | $30.04 | $150.22 |

This is incremental AI cost only, not hosting, storage, support, taxes, payment fees,
teacher review time, the school-wide assistant, or development. No free-tier subsidy is assumed.
Paid-tier data terms differ from free-tier terms; select appropriate terms before real student audio.

## Suggested client pitch (commercial proposal, not provider pricing)

Pitch **AI-assisted Hifz practice with ustadh oversight**, not automated certification.
An illustrative Hifz add-on is **$1–$2 per active learner/month**, with a **$50/month school
minimum**, a stated allowance of **110–220 recorded minutes per learner/month**, and a
separately agreed overage rate. At 100 active learners, that is $100–$200/month revenue
against roughly $17–$30 of estimated transcription usage; the remainder funds service costs
and margin. Confirm support effort before promising that margin.

Quote one-time implementation, training, hosting and the wider school platform separately.
Convert to PKR at the agreed quotation-date exchange rate rather than hard-coding a rate.
Run a two-week pilot to measure actual minutes, retries, per-model token usage and teacher
agreement. Reprice if a stronger model is needed for acceptable Arabic recognition.
