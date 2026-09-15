/**
 * Grades 4–6. Independent practice: recall, sorting by a rule, and explaining
 * why. Still practice — a bad round means the topic needs revisiting, not that
 * the child is behind.
 */
import type { PlayActivity } from "@/lib/domain/play";

export const UPPER_PRIMARY_ACTIVITIES: PlayActivity[] = [
  {
    id: "up-word-classes",
    band: "upper-primary",
    strand: "literacy",
    kind: "sort",
    title: "Sort the words",
    blurb: "Noun, verb or adjective? Put each word where it belongs.",
    adultNote: "Ask for a sentence using the word. A child who can use it correctly usually knows the class even when the label escapes them.",
    script: "en",
    aiBrief: "Single English words sorted into Noun, Verb and Adjective. Two of each. Use only words whose class is unambiguous in isolation — never words like run or light that work as more than one class.",
    rounds: [
      {
        kind: "sort",
        prompt: "Which kind of word is each one?",
        bins: ["Noun", "Verb", "Adjective"],
        items: [
          { label: "garden", bin: "Noun" },
          { label: "teacher", bin: "Noun" },
          { label: "climb", bin: "Verb" },
          { label: "whisper", bin: "Verb" },
          { label: "golden", bin: "Adjective" },
          { label: "noisy", bin: "Adjective" },
        ],
      },
      {
        kind: "sort",
        prompt: "Which kind of word is each one?",
        bins: ["Noun", "Verb", "Adjective"],
        items: [
          { label: "river", bin: "Noun" },
          { label: "lantern", bin: "Noun" },
          { label: "gather", bin: "Verb" },
          { label: "explain", bin: "Verb" },
          { label: "narrow", bin: "Adjective" },
          { label: "gentle", bin: "Adjective" },
        ],
      },
      {
        kind: "sort",
        prompt: "Which kind of word is each one?",
        bins: ["Noun", "Verb", "Adjective"],
        items: [
          { label: "market", bin: "Noun" },
          { label: "shadow", bin: "Noun" },
          { label: "measure", bin: "Verb" },
          { label: "arrive", bin: "Verb" },
          { label: "ancient", bin: "Adjective" },
          { label: "brave", bin: "Adjective" },
        ],
      },
    ],
  },
  {
    id: "up-number-facts",
    band: "upper-primary",
    strand: "numeracy",
    kind: "count",
    title: "Quick facts",
    blurb: "Multiplication and division you should know by heart.",
    adultNote: "Speed is not the goal; certainty is. A fact recalled slowly today is recalled instantly next month.",
    script: "en",
    aiBrief: "Multiplication and division facts within the twelve times tables, written as plain text like 7 × 8 or 56 ÷ 7. Never set a picture on these questions. Wrong choices should be plausible near-misses, not random numbers.",
    rounds: [
      {
        kind: "count",
        prompt: "Tap the answer.",
        questions: [
          { prompt: "6 × 7", glyph: null, answer: 42, choices: [36, 42, 48] },
          { prompt: "9 × 8", glyph: null, answer: 72, choices: [64, 72, 81] },
          { prompt: "56 ÷ 7", glyph: null, answer: 8, choices: [6, 7, 8] },
          { prompt: "12 × 5", glyph: null, answer: 60, choices: [50, 55, 60] },
        ],
      },
      {
        kind: "count",
        prompt: "Tap the answer.",
        questions: [
          { prompt: "8 × 4", glyph: null, answer: 32, choices: [24, 32, 36] },
          { prompt: "7 × 7", glyph: null, answer: 49, choices: [42, 49, 56] },
          { prompt: "63 ÷ 9", glyph: null, answer: 7, choices: [6, 7, 9] },
          { prompt: "11 × 6", glyph: null, answer: 66, choices: [60, 66, 72] },
        ],
      },
      {
        kind: "count",
        prompt: "Tap the answer.",
        questions: [
          { prompt: "9 × 6", glyph: null, answer: 54, choices: [48, 54, 63] },
          { prompt: "48 ÷ 8", glyph: null, answer: 6, choices: [5, 6, 8] },
          { prompt: "12 × 12", glyph: null, answer: 144, choices: [121, 132, 144] },
          { prompt: "7 × 9", glyph: null, answer: 63, choices: [56, 63, 72] },
        ],
      },
    ],
  },
  {
    id: "up-fraction-sense",
    band: "upper-primary",
    strand: "numeracy",
    kind: "sort",
    title: "Where does it sit?",
    blurb: "Is each fraction under a half, exactly a half, or over it?",
    adultNote: "Comparing to a half beats cross-multiplying at this stage. Ask: is the top number more or less than half the bottom one?",
    script: "en",
    aiBrief: "Simple fractions written as plain text like 3/8, sorted against one half. Two clearly under, two exactly equal to a half, two clearly over. Denominators of twelve or less, apart from hundredths. Never use LaTeX.",
    rounds: [
      {
        kind: "sort",
        prompt: "Compare each fraction with a half.",
        bins: ["Less than a half", "Exactly a half", "More than a half"],
        items: [
          { label: "1/4", bin: "Less than a half" },
          { label: "3/8", bin: "Less than a half" },
          { label: "2/4", bin: "Exactly a half" },
          { label: "5/10", bin: "Exactly a half" },
          { label: "3/4", bin: "More than a half" },
          { label: "5/8", bin: "More than a half" },
        ],
      },
      {
        kind: "sort",
        prompt: "Compare each fraction with a half.",
        bins: ["Less than a half", "Exactly a half", "More than a half"],
        items: [
          { label: "1/5", bin: "Less than a half" },
          { label: "2/6", bin: "Less than a half" },
          { label: "3/6", bin: "Exactly a half" },
          { label: "4/8", bin: "Exactly a half" },
          { label: "7/10", bin: "More than a half" },
          { label: "5/6", bin: "More than a half" },
        ],
      },
      {
        kind: "sort",
        prompt: "Compare each fraction with a half.",
        bins: ["Less than a half", "Exactly a half", "More than a half"],
        items: [
          { label: "2/9", bin: "Less than a half" },
          { label: "1/3", bin: "Less than a half" },
          { label: "6/12", bin: "Exactly a half" },
          { label: "50/100", bin: "Exactly a half" },
          { label: "2/3", bin: "More than a half" },
          { label: "9/10", bin: "More than a half" },
        ],
      },
    ],
  },
  {
    id: "up-growing-patterns",
    band: "upper-primary",
    strand: "shapes",
    kind: "pattern",
    title: "Growing patterns",
    blurb: "Find the rule, then choose the number that comes next.",
    adultNote: "Ask what the rule is before the answer. Doubling, adding a growing amount and square numbers all turn up here.",
    script: "en",
    aiBrief: "Numeric sequences of four or five terms with one clear rule: doubling, halving, adding a growing amount, square numbers or triangular numbers. Whole numbers under 200 only. Wrong choices must be near the answer.",
    rounds: [
      {
        kind: "pattern",
        prompt: "Which number comes next?",
        puzzles: [
          { shown: ["3", "6", "12", "24"], answer: "48", choices: ["30", "36", "48"] },
          { shown: ["1", "4", "9", "16"], answer: "25", choices: ["20", "24", "25"] },
          { shown: ["2", "5", "10", "17"], answer: "26", choices: ["22", "24", "26"] },
        ],
      },
      {
        kind: "pattern",
        prompt: "Which number comes next?",
        puzzles: [
          { shown: ["5", "10", "20", "40"], answer: "80", choices: ["50", "60", "80"] },
          { shown: ["1", "3", "6", "10"], answer: "15", choices: ["13", "14", "15"] },
          { shown: ["81", "27", "9", "3"], answer: "1", choices: ["1", "2", "6"] },
        ],
      },
      {
        kind: "pattern",
        prompt: "Which number comes next?",
        puzzles: [
          { shown: ["2", "6", "18", "54"], answer: "162", choices: ["72", "108", "162"] },
          { shown: ["1", "1", "2", "3", "5"], answer: "8", choices: ["6", "7", "8"] },
          { shown: ["64", "32", "16", "8"], answer: "4", choices: ["2", "4", "6"] },
        ],
      },
    ],
  },
  {
    id: "up-prophets-and-stories",
    band: "upper-primary",
    strand: "islamic",
    kind: "match",
    title: "Prophets we learn about",
    blurb: "Match each prophet to what we remember about them.",
    adultNote: "These are the accounts told in the Qur'an and in primary Islamiyat. Ask your child to retell one in their own words afterwards.",
    script: "en",
    aiBrief: "Prophets named in the Qur'an matched to a single well-known detail from their account, in the plain language of a primary Islamiyat lesson. Narrative only — never a ruling, never a disputed detail, and never anything about the Prophet Muhammad's household presented as a game item.",
    rounds: [
      {
        kind: "match",
        prompt: "What do we remember about each one?",
        pairs: [
          { left: "Nuh", right: "Built the ark" },
          { left: "Ibrahim", right: "Raised the Kaaba with Ismail" },
          { left: "Musa", right: "Led his people out of Egypt" },
          { left: "Yusuf", right: "Understood dreams" },
        ],
      },
      {
        kind: "match",
        prompt: "What do we remember about each one?",
        pairs: [
          { left: "Sulaiman", right: "Understood the speech of birds" },
          { left: "Dawud", right: "Shaped iron with his hands" },
          { left: "Yunus", right: "Called out from inside the fish" },
          { left: "Isa", right: "Spoke while still an infant" },
        ],
      },
      {
        kind: "match",
        prompt: "What do we remember about each one?",
        pairs: [
          { left: "Adam", right: "The first human being" },
          { left: "Salih", right: "Sent to the people of Thamud" },
          { left: "Hud", right: "Sent to the people of Ad" },
          { left: "Ayyub", right: "Remembered for his patience" },
        ],
      },
    ],
  },
  {
    id: "up-urdu-sentence",
    band: "upper-primary",
    strand: "urdu",
    kind: "sequence",
    title: "جملہ بنائیں",
    blurb: "الفاظ کو صحیح ترتیب میں رکھ کر جملہ مکمل کریں۔",
    adultNote: "Urdu puts the verb at the end. Reading the finished sentence aloud is the quickest way to hear whether the order is right.",
    script: "ur",
    aiBrief: "Four or five Urdu words in Urdu script which, in the given order, form one correct everyday sentence. Simple present or past tense, subject-object-verb order, never Roman Urdu, and no word repeated within the sentence.",
    rounds: [
      { kind: "sequence", prompt: "الفاظ کو ترتیب دے کر جملہ بنائیں۔", steps: ["احمد", "روز", "اسکول", "جاتا", "ہے"] },
      { kind: "sequence", prompt: "الفاظ کو ترتیب دے کر جملہ بنائیں۔", steps: ["امی", "نے", "کھانا", "پکایا"] },
      { kind: "sequence", prompt: "الفاظ کو ترتیب دے کر جملہ بنائیں۔", steps: ["بارش", "کے", "بعد", "دھوپ", "نکلی"] },
    ],
  },
];
