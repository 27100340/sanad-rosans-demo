import type { Config } from "tailwindcss";

/**
 * Tokens are CSS variables (RGB triplets) declared in globals.css, so every
 * utility keeps Tailwind's alpha modifier (`bg-accent/10`). `.theme-dark`
 * flips the same variables; components never branch on theme.
 */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: v("canvas"),
        surface: { DEFAULT: v("surface"), 2: v("surface-2"), 3: v("surface-3") },
        ink: { DEFAULT: v("ink"), 2: v("ink-2"), 3: v("ink-3") },
        line: { DEFAULT: v("line"), strong: v("line-strong") },
        accent: { DEFAULT: v("accent"), soft: v("accent-soft"), deep: v("accent-deep") },
        gold: { DEFAULT: v("gold"), soft: v("gold-soft") },
        ok: { DEFAULT: v("ok"), soft: v("ok-soft") },
        warn: { DEFAULT: v("warn"), soft: v("warn-soft") },
        danger: { DEFAULT: v("danger"), soft: v("danger-soft") },
        info: { DEFAULT: v("info"), soft: v("info-soft") },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        quran: ["var(--font-quran)", "Amiri", "Scheherazade New", "serif"],
        urdu: ["var(--font-urdu)", "Noto Nastaliq Urdu", "serif"],
      },
      fontSize: { "2xs": ["0.6875rem", { lineHeight: "1rem" }] },
      maxWidth: { content: "1200px", prose: "68ch" },
      borderRadius: { xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem" },
      boxShadow: {
        card: "var(--shadow-card)",
        pop: "0 20px 50px -20px rgb(18 33 28 / 0.35), 0 0 0 1px rgb(var(--line) / 0.6)",
        ring: "0 0 0 3px rgb(var(--accent) / 0.2)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        pulseSoft: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.55" } },
      },
      animation: {
        "fade-up": "fade-up 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both",
        "fade-in": "fade-in 0.3s ease-out both",
        "pulse-soft": "pulseSoft 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
