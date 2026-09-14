# 06 — Hifz Engine

The module that no competitor has. It supports the three classical daily units of a Hifz madrasa
and adds a listener that checks recitation word by word.

## Pedagogy it encodes

| Unit | Meaning | What the engine does |
|---|---|---|
| **Sabaq** | today's new lesson (new ayat) | Sets the daily target from the plan; plays the model recitation; runs recite-back until the unit passes |
| **Sabqi** | recent lessons (last ~7 days) | Queues yesterday's and the week's units for a quick recite-back before sabaq |
| **Manzil** | long-term revision of everything memorised | Spaced-repetition scheduler chooses which juz/surah portions are due today so nothing is forgotten |

Additional layers:
- **Mutashabihat drills**: after a mistake on an ayah that has a look-alike elsewhere, the engine
  shows both side by side and drills the differing words. This is the single biggest cause of
  hifz errors and is currently taught only from the ustadh's memory.
- **Tajweed notes**: the checker reports pronunciation-level observations where the model is
  confident (elongation, nasalisation, letter substitution) and labels them "suggested" for the
  ustadh to confirm.
- **Home recitation log**: parents record the evening recitation on their phone; the ustadh sees
  the checked result the next morning instead of hearing it cold in class.
- **Sanad view**: the student's memorisation map (30 juz × surahs) as a heat grid: green
  (secure), amber (due), red (weak), grey (not started). The ustadh sees the whole halaqa's grids.

## Recite-back pipeline

```
1. Play the reference ayah audio (per-ayah MP3, chosen reciter).
2. Student records (MediaRecorder, webm/opus, 16 kHz mono is enough).
3. Server transcribes:
     a. Production: Quran-tuned ASR (open-source Whisper fine-tunes by Tarteel AI on Hugging Face,
        e.g. tarteel-ai/whisper-base-ar-quran, or a larger Quran LoRA) on a small GPU box; OR
     b. Gemini with inline audio, instructed to transcribe Quranic Arabic verbatim without diacritics.
     c. Demo fallback: browser Web Speech API (lang ar-SA) live transcript.
4. Normalise both sides: strip tashkeel (diacritics), tatweel, hamza variants, alef variants,
   ta-marbuta/ha, final ya/alef-maqsura; keep word boundaries.
5. Align with a word-level diff (Levenshtein on token sequences; `lib/quran/diff.ts`).
6. Score: correct / substituted / omitted / inserted words; pass threshold configurable (default
   100% for sabaq, 95% for manzil).
7. Persist attempt; update the unit's spaced-repetition state; if a substituted word matches a
   known mutashabih pair, queue a drill.
8. Render: canonical text with each word coloured; audio scrubber; "listen to your slip".
```

## Data sources (verified September 2026, free, complete, licensed for use)

| Need | Source | Notes |
|---|---|---|
| Canonical text (Uthmani, Imlaei, Indo-Pak script) | **Quran Foundation Content API v4** (`api-docs.quran.foundation`, the Quran.com API) | Chapters, verses, word-by-word, multiple scripts and fonts, translations, tafsir. Requires a free client id. |
| Verified plain text offline | **Tanzil.net** Uthmani and simple text files | Downloadable, widely used as ground truth; bundle a copy for offline normalisation |
| Per-ayah audio | Quran Foundation "ayah recitations" endpoints; **EveryAyah.com** and **QuranicAudio** mirrors | Many reciters (Husary, Minshawi, Abdul Basit, Sudais); per-ayah MP3 URLs |
| Word-level timestamps for karaoke-style highlighting | Quran Foundation audio API `segments=true` returns `[word_index, start_ms, end_ms]` | Also Tarteel's **QUL (Quranic Universal Library)** exports and the open `quran-align` / `lafzize` projects |
| Quran-specific ASR | **tarteel-ai/whisper-base-ar-quran**, **tarteel-ai/whisper-tiny-ar-quran** (Hugging Face), community large-v3 Quran fine-tunes | Trained on Tarteel's EveryAyah dataset; runs on CPU (tiny/base) or a small GPU |
| Alternative simple API | alquran.cloud, quranapi.pages.dev | No key needed; good for prototypes |
| Mutashabihat index | Derivable from the text: index n-grams across all ayat and store pairs with shared 4+ word runs; community lists exist for cross-checking | Build once, ship as a static JSON |

## Feasibility: honest assessment

**Yes, it is genuinely possible at scale.** Tarteel AI runs this exact experience commercially for
millions of users, and the open-source fine-tunes above exist because Quranic recitation is a
constrained vocabulary (~77k words, 6,236 ayat) with abundant clean audio, which makes ASR far more
accurate than general Arabic.

Limits to state plainly to the school:
1. **Word-level accuracy is reliable; tajweed-level judgement is partial.** Omitted, substituted,
   and inserted words are caught well. Fine pronunciation (makhraj) is best left as "suggested" for
   the ustadh. The engine assists the ustadh; it does not replace the sanad.
2. **Children's voices and noisy rooms** lower accuracy. Mitigate with a headset mic, short units
   (3–7 ayat), and a "recite again" loop rather than a hard fail.
3. **Latency**: server ASR on a small GPU returns a 30-second clip in 2–4 s; Gemini audio is similar.
   Browser speech recognition is instant but least accurate; use it only for the demo fallback.
4. **Privacy**: audio of minors is sensitive. Store in private buckets, allow parents to opt out of
   retention beyond 30 days, never send audio to any provider outside the policy.

## Demo scope

- Bundled subset: Surah Al-Fatihah, Al-Mulk (ayat 1–15), and the last ten surahs, with Uthmani text
  and per-ayah audio URLs from the public per-ayah mirrors.
- Recite-back with: Gemini audio transcription when `GEMINI_API_KEY` is set; browser speech
  recognition otherwise; a scripted "simulated attempt" button so the pitch never depends on a mic.
- Spaced-repetition scheduler, word diff, mutashabihat drill, heat grid, and ustadh board are real
  code operating on mock student state.
