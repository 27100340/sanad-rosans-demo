/**
 * Montessori & Early Years activities. Four items a round, everyday objects,
 * one idea at a time — an adult reads the prompt aloud and the child taps.
 *
 * Three rounds per activity: the model varies items when a key is configured,
 * and this pool is what a child actually plays when it is not.
 */
import type { PlayActivity } from "@/lib/domain/play";

export const EARLY_ACTIVITIES: PlayActivity[] = [
  {
    id: "early-first-sounds",
    band: "early",
    strand: "literacy",
    kind: "match",
    title: "First sounds",
    blurb: "Say the letter sound, then find the word that starts with it.",
    adultNote: "Say the sound (mmm), not the letter name (em). Pointing and repeating the sound is the whole point; reading the word is not expected yet.",
    script: "en",
    aiBrief: "Single lowercase consonant letters matched to a very common English object word of one syllable that begins with that sound. Avoid letters whose sound is unclear to a four-year-old (c, g, x, y). Never repeat a starting letter within a round.",
    rounds: [
      {
        kind: "match",
        prompt: "Which word starts with this sound?",
        pairs: [
          { left: "m", right: "moon" },
          { left: "s", right: "sun" },
          { left: "b", right: "ball" },
          { left: "t", right: "tree" },
        ],
      },
      {
        kind: "match",
        prompt: "Which word starts with this sound?",
        pairs: [
          { left: "f", right: "fish" },
          { left: "d", right: "door" },
          { left: "p", right: "pen" },
          { left: "l", right: "leaf" },
        ],
      },
      {
        kind: "match",
        prompt: "Which word starts with this sound?",
        pairs: [
          { left: "h", right: "hat" },
          { left: "n", right: "nest" },
          { left: "r", right: "rain" },
          { left: "k", right: "kite" },
        ],
      },
    ],
  },
  {
    id: "early-how-many",
    band: "early",
    strand: "numeracy",
    kind: "count",
    title: "How many?",
    blurb: "Count the pictures out loud, then tap the number.",
    adultNote: "Let your child touch each picture as they count. Touching one object per number said is the skill here, not speed.",
    script: "en",
    aiBrief: "Counting quantities of one to five. Every question must set a picture and an answer between one and five, with three close number choices.",
    rounds: [
      {
        kind: "count",
        prompt: "Count them, then tap the number.",
        questions: [
          { prompt: "How many stars?", glyph: "star", answer: 3, choices: [2, 3, 4] },
          { prompt: "How many leaves?", glyph: "leaf", answer: 2, choices: [1, 2, 3] },
          { prompt: "How many apples?", glyph: "apple", answer: 5, choices: [4, 5, 6] },
          { prompt: "How many fish?", glyph: "fish", answer: 4, choices: [3, 4, 5] },
        ],
      },
      {
        kind: "count",
        prompt: "Count them, then tap the number.",
        questions: [
          { prompt: "How many birds?", glyph: "bird", answer: 1, choices: [1, 2, 3] },
          { prompt: "How many hearts?", glyph: "heart", answer: 4, choices: [3, 4, 5] },
          { prompt: "How many clouds?", glyph: "cloud", answer: 3, choices: [2, 3, 4] },
          { prompt: "How many suns?", glyph: "sun", answer: 2, choices: [1, 2, 3] },
        ],
      },
      {
        kind: "count",
        prompt: "Count them, then tap the number.",
        questions: [
          { prompt: "How many flowers?", glyph: "flower", answer: 5, choices: [4, 5, 6] },
          { prompt: "How many moons?", glyph: "moon", answer: 2, choices: [2, 3, 4] },
          { prompt: "How many drops?", glyph: "drop", answer: 3, choices: [3, 4, 5] },
          { prompt: "How many apples?", glyph: "apple", answer: 4, choices: [2, 3, 4] },
        ],
      },
    ],
  },
  {
    id: "early-big-and-small",
    band: "early",
    strand: "shapes",
    kind: "sort",
    title: "Big and small",
    blurb: "Pick a thing, then put it in the big basket or the small basket.",
    adultNote: "Ask why after each choice. A child who says an ant is small because it fits on a finger is doing exactly the right thinking.",
    script: "en",
    aiBrief: "Everyday objects a young child in Lahore would recognise, sorted into Big and Small. Use only objects whose size is obvious and never in between.",
    rounds: [
      {
        kind: "sort",
        prompt: "Where does each one go?",
        bins: ["Big", "Small"],
        items: [
          { label: "Elephant", bin: "Big" },
          { label: "Ant", bin: "Small" },
          { label: "Bus", bin: "Big" },
          { label: "Button", bin: "Small" },
          { label: "Door", bin: "Big" },
          { label: "Key", bin: "Small" },
        ],
      },
      {
        kind: "sort",
        prompt: "Where does each one go?",
        bins: ["Big", "Small"],
        items: [
          { label: "Tree", bin: "Big" },
          { label: "Seed", bin: "Small" },
          { label: "Camel", bin: "Big" },
          { label: "Ladybird", bin: "Small" },
          { label: "House", bin: "Big" },
          { label: "Spoon", bin: "Small" },
        ],
      },
      {
        kind: "sort",
        prompt: "Where does each one go?",
        bins: ["Big", "Small"],
        items: [
          { label: "Mountain", bin: "Big" },
          { label: "Pebble", bin: "Small" },
          { label: "Boat", bin: "Big" },
          { label: "Coin", bin: "Small" },
          { label: "Lion", bin: "Big" },
          { label: "Mouse", bin: "Small" },
        ],
      },
    ],
  },
  {
    id: "early-what-comes-next",
    band: "early",
    strand: "shapes",
    kind: "pattern",
    title: "What comes next?",
    blurb: "Look at the line of pictures. Which one finishes it?",
    adultNote: "Say the pattern aloud together — star, leaf, star, leaf — before choosing. Hearing the rhythm is how young children find the rule.",
    script: "en",
    aiBrief: "Simple repeating picture patterns using only the allowed picture names. Keep to two-item (ABAB) or three-item (AABAAB) repeats; never a growing or numeric pattern.",
    rounds: [
      {
        kind: "pattern",
        prompt: "Which picture comes next?",
        puzzles: [
          { shown: ["star", "leaf", "star", "leaf"], answer: "star", choices: ["star", "leaf", "apple"] },
          { shown: ["sun", "sun", "moon", "sun", "sun"], answer: "moon", choices: ["moon", "sun", "cloud"] },
          { shown: ["circle", "square", "circle", "square"], answer: "circle", choices: ["circle", "square", "triangle"] },
        ],
      },
      {
        kind: "pattern",
        prompt: "Which picture comes next?",
        puzzles: [
          { shown: ["fish", "bird", "fish", "bird"], answer: "fish", choices: ["fish", "bird", "heart"] },
          { shown: ["apple", "apple", "leaf", "apple", "apple"], answer: "leaf", choices: ["leaf", "apple", "flower"] },
          { shown: ["triangle", "circle", "triangle", "circle"], answer: "triangle", choices: ["triangle", "circle", "square"] },
        ],
      },
      {
        kind: "pattern",
        prompt: "Which picture comes next?",
        puzzles: [
          { shown: ["flower", "drop", "flower", "drop"], answer: "flower", choices: ["flower", "drop", "leaf"] },
          { shown: ["heart", "heart", "star", "heart", "heart"], answer: "star", choices: ["star", "heart", "moon"] },
          { shown: ["cloud", "sun", "cloud", "sun"], answer: "cloud", choices: ["cloud", "sun", "drop"] },
        ],
      },
    ],
  },
  {
    id: "early-kind-words",
    band: "early",
    strand: "islamic",
    kind: "match",
    title: "Kind words",
    blurb: "When do we say each one? Match the moment to the words.",
    adultNote: "Say each phrase together before matching. Children this age learn adab by copying an adult they love, not by being tested.",
    script: "en",
    aiBrief: "Everyday moments in a child's day matched to the short phrase a Muslim family says at that moment. Manners and remembrance only — never a ruling, never anything about what is permitted or forbidden.",
    rounds: [
      {
        kind: "match",
        prompt: "What do we say?",
        pairs: [
          { left: "Before we eat", right: "Bismillah" },
          { left: "After we eat", right: "Alhamdulillah" },
          { left: "When we meet a friend", right: "Assalamu alaikum" },
          { left: "When someone helps us", right: "JazakAllah khair" },
        ],
      },
      {
        kind: "match",
        prompt: "What do we say?",
        pairs: [
          { left: "When we wake up", right: "Alhamdulillah" },
          { left: "Before we begin something", right: "Bismillah" },
          { left: "When a friend goes home", right: "Allah hafiz" },
          { left: "When we plan for tomorrow", right: "In sha Allah" },
        ],
      },
      {
        kind: "match",
        prompt: "What do we say?",
        pairs: [
          { left: "When we sneeze", right: "Alhamdulillah" },
          { left: "When we see something lovely", right: "MashaAllah" },
          { left: "When we come into the house", right: "Assalamu alaikum" },
          { left: "When we hear good news", right: "SubhanAllah" },
        ],
      },
    ],
  },
  {
    id: "early-urdu-sounds",
    band: "early",
    strand: "urdu",
    kind: "match",
    title: "اردو آوازیں",
    blurb: "حرف کی آواز بولیں اور اس سے شروع ہونے والا لفظ ڈھونڈیں۔",
    adultNote: "Read the letter aloud in Urdu and let your child repeat it. Matching the shape to a familiar word is the step before reading.",
    script: "ur",
    aiBrief: "Single Urdu letters matched to a very common Urdu noun beginning with that letter, written in Urdu script only — never Roman Urdu. One syllable or two at most.",
    rounds: [
      {
        kind: "match",
        prompt: "کون سا لفظ اس حرف سے شروع ہوتا ہے؟",
        pairs: [
          { left: "ا", right: "انار" },
          { left: "ب", right: "بکری" },
          { left: "پ", right: "پتنگ" },
          { left: "ت", right: "تتلی" },
        ],
      },
      {
        kind: "match",
        prompt: "کون سا لفظ اس حرف سے شروع ہوتا ہے؟",
        pairs: [
          { left: "ج", right: "جہاز" },
          { left: "د", right: "درخت" },
          { left: "ر", right: "روٹی" },
          { left: "س", right: "سیب" },
        ],
      },
      {
        kind: "match",
        prompt: "کون سا لفظ اس حرف سے شروع ہوتا ہے؟",
        pairs: [
          { left: "ک", right: "کتاب" },
          { left: "گ", right: "گھر" },
          { left: "م", right: "مچھلی" },
          { left: "ن", right: "ناک" },
        ],
      },
    ],
  },
];
