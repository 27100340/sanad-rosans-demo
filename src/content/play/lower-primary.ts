/**
 * Grades 1–3. The child plays alone; an adult is nearby rather than leading.
 * Concrete before abstract, and confidence before speed.
 */
import type { PlayActivity } from "@/lib/domain/play";

export const LOWER_PRIMARY_ACTIVITIES: PlayActivity[] = [
  {
    id: "lp-sound-blends",
    band: "lower-primary",
    strand: "literacy",
    kind: "match",
    title: "Blend it",
    blurb: "Two letters, one sound. Find the word that uses it.",
    adultNote: "If a word is wrong, ask your child to say it slowly and listen to the beginning. Hearing the blend matters more than spelling it.",
    script: "en",
    aiBrief: "Two-letter English blends and digraphs (sh, ch, th, wh, br, cl, st, fr, ng, ck) matched to a familiar word that contains that blend. Keep words to one or two syllables and to vocabulary a Grade 2 reader meets in class.",
    rounds: [
      {
        kind: "match",
        prompt: "Which word uses this sound?",
        pairs: [
          { left: "sh", right: "shell" },
          { left: "ch", right: "chair" },
          { left: "th", right: "thumb" },
          { left: "wh", right: "wheel" },
        ],
      },
      {
        kind: "match",
        prompt: "Which word uses this sound?",
        pairs: [
          { left: "br", right: "bridge" },
          { left: "cl", right: "cloud" },
          { left: "st", right: "star" },
          { left: "fr", right: "frog" },
        ],
      },
      {
        kind: "match",
        prompt: "Which word uses this sound?",
        pairs: [
          { left: "ng", right: "ring" },
          { left: "ck", right: "duck" },
          { left: "gr", right: "grass" },
          { left: "sn", right: "snail" },
        ],
      },
    ],
  },
  {
    id: "lp-make-ten",
    band: "lower-primary",
    strand: "numeracy",
    kind: "match",
    title: "Make the total",
    blurb: "Find the partner each number needs to reach the total.",
    adultNote: "Knowing pairs to ten by heart makes every later sum easier. Counting on fingers is fine; recall comes with repetition.",
    script: "en",
    aiBrief: "Number bond pairs to a stated total of 10 or 20. State the total in the prompt. Never repeat a number on either side of the round, and never use a pair where both halves are equal.",
    rounds: [
      {
        kind: "match",
        prompt: "Match each number to its partner that makes 10.",
        pairs: [
          { left: "7", right: "3" },
          { left: "6", right: "4" },
          { left: "8", right: "2" },
          { left: "9", right: "1" },
        ],
      },
      {
        kind: "match",
        prompt: "Match each number to its partner that makes 20.",
        pairs: [
          { left: "15", right: "5" },
          { left: "12", right: "8" },
          { left: "17", right: "3" },
          { left: "14", right: "6" },
        ],
      },
      {
        kind: "match",
        prompt: "Match each number to its partner that makes 20.",
        pairs: [
          { left: "11", right: "9" },
          { left: "13", right: "7" },
          { left: "16", right: "4" },
          { left: "18", right: "2" },
        ],
      },
    ],
  },
  {
    id: "lp-count-in-steps",
    band: "lower-primary",
    strand: "numeracy",
    kind: "sequence",
    title: "Count in steps",
    blurb: "Tap the numbers in the right order.",
    adultNote: "Counting in twos, fives and tens is the road into multiplication. Say the sequence aloud as they tap.",
    script: "en",
    aiBrief: "A run of five numbers counting on or back in twos, fives or tens, within 100. State the step size in the prompt. Give the steps already in the correct order.",
    rounds: [
      { kind: "sequence", prompt: "Count on in twos.", steps: ["2", "4", "6", "8", "10"] },
      { kind: "sequence", prompt: "Count on in fives.", steps: ["15", "20", "25", "30", "35"] },
      { kind: "sequence", prompt: "Count back in tens.", steps: ["50", "40", "30", "20", "10"] },
    ],
  },
  {
    id: "lp-shape-detective",
    band: "lower-primary",
    strand: "shapes",
    kind: "sort",
    title: "Shape detective",
    blurb: "Sort each thing by the shape it really is.",
    adultNote: "Ask your child to trace the edges in the air. Counting sides with a finger beats memorising shape names.",
    script: "en",
    aiBrief: "Everyday objects sorted by shape into three sides, four sides or round. Use objects a child in Lahore sees at home or school, and only ones whose shape is unambiguous.",
    rounds: [
      {
        kind: "sort",
        prompt: "How many sides does each one have?",
        bins: ["3 sides", "4 sides", "Round"],
        items: [
          { label: "Triangle", bin: "3 sides" },
          { label: "Samosa", bin: "3 sides" },
          { label: "Square", bin: "4 sides" },
          { label: "Door", bin: "4 sides" },
          { label: "Circle", bin: "Round" },
          { label: "Bangle", bin: "Round" },
        ],
      },
      {
        kind: "sort",
        prompt: "How many sides does each one have?",
        bins: ["3 sides", "4 sides", "Round"],
        items: [
          { label: "Slice of cake", bin: "3 sides" },
          { label: "Bunting flag", bin: "3 sides" },
          { label: "Book cover", bin: "4 sides" },
          { label: "Chessboard", bin: "4 sides" },
          { label: "Roti", bin: "Round" },
          { label: "Coin", bin: "Round" },
        ],
      },
      {
        kind: "sort",
        prompt: "How many sides does each one have?",
        bins: ["3 sides", "4 sides", "Round"],
        items: [
          { label: "Set square", bin: "3 sides" },
          { label: "Sail", bin: "3 sides" },
          { label: "Window", bin: "4 sides" },
          { label: "Prayer rug", bin: "4 sides" },
          { label: "Clock face", bin: "Round" },
          { label: "Button", bin: "Round" },
        ],
      },
    ],
  },
  {
    id: "lp-short-surahs",
    band: "lower-primary",
    strand: "islamic",
    kind: "match",
    title: "Short surahs",
    blurb: "Match each surah to what it reminds us.",
    adultNote: "Recognising a surah by its theme helps a child hold on to what they recite. Recitation itself belongs in the Hifz pathway with an ustadh.",
    script: "en",
    aiBrief: "Short surahs from the last part of the Qur'an matched to a one-line theme in simple English, as taught in primary Islamiyat. Themes only — never a ruling, never a translation presented as the verse itself, and never a claim about reward or punishment.",
    rounds: [
      {
        kind: "match",
        prompt: "What does each surah remind us?",
        pairs: [
          { left: "Al-Fatihah", right: "We ask Allah to guide us" },
          { left: "Al-Ikhlas", right: "Allah is One" },
          { left: "Al-Falaq", right: "We ask Allah to keep us safe" },
          { left: "Al-Asr", right: "Time is precious" },
        ],
      },
      {
        kind: "match",
        prompt: "What does each surah remind us?",
        pairs: [
          { left: "An-Nas", right: "We turn to Allah for protection" },
          { left: "Al-Kawthar", right: "Allah gives us so much" },
          { left: "Al-Ma'un", right: "Look after people in need" },
          { left: "Al-Fil", right: "Allah protected the Kaaba" },
        ],
      },
      {
        kind: "match",
        prompt: "What does each surah remind us?",
        pairs: [
          { left: "Quraysh", right: "Thank Allah for food and safety" },
          { left: "An-Nasr", right: "Help comes from Allah" },
          { left: "Al-Kafirun", right: "We hold to our own faith kindly" },
          { left: "Al-Humazah", right: "Do not mock other people" },
        ],
      },
    ],
  },
  {
    id: "lp-urdu-words",
    band: "lower-primary",
    strand: "urdu",
    kind: "match",
    title: "اردو الفاظ",
    blurb: "ہر اردو لفظ کو اس کے انگریزی مطلب سے ملائیں۔",
    adultNote: "Read each Urdu word aloud before matching. Children who speak Urdu at home often know the word but not its written shape.",
    script: "ur",
    aiBrief: "Common Urdu nouns in Urdu script matched to their single-word English meaning. Everyday vocabulary only, never Roman Urdu, and never a word with more than one usual English meaning.",
    rounds: [
      {
        kind: "match",
        prompt: "ہر لفظ کا مطلب ڈھونڈیں۔",
        pairs: [
          { left: "کتاب", right: "book" },
          { left: "پانی", right: "water" },
          { left: "دوست", right: "friend" },
          { left: "سورج", right: "sun" },
        ],
      },
      {
        kind: "match",
        prompt: "ہر لفظ کا مطلب ڈھونڈیں۔",
        pairs: [
          { left: "چاند", right: "moon" },
          { left: "درخت", right: "tree" },
          { left: "گھر", right: "house" },
          { left: "پھول", right: "flower" },
        ],
      },
      {
        kind: "match",
        prompt: "ہر لفظ کا مطلب ڈھونڈیں۔",
        pairs: [
          { left: "مچھلی", right: "fish" },
          { left: "پرندہ", right: "bird" },
          { left: "بارش", right: "rain" },
          { left: "سیب", right: "apple" },
        ],
      },
    ],
  },
];
