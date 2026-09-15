/**
 * LaTeX to plain Unicode physics text.
 *
 * Ported from the Physics Studio's own `lib/ai/format.ts`, for the same reason
 * it exists there: physics is formula-dense, and the authored 9702 bank is
 * typeset in KaTeX. Sanad renders markdown WITHOUT KaTeX, so `$\mathrm{m\,s^{-2}}$`
 * would reach a student as literal backslashes. This converts to the symbols a
 * student actually writes — m s⁻², 6.67 × 10⁻¹¹, λ, Ω — which survive a chat
 * bubble, a table cell, a print stylesheet and a copy-paste alike.
 *
 * Sanad's own `stripLatex` (lib/ai/plain-maths.ts) is the house helper and runs
 * first on every model response; it handles the common delimiters and a handful
 * of commands. This adds the physics-specific half it does not cover:
 * `\mathrm`, `\,` spacing, the Greek set, superscripts and subscripts.
 */
import type { PhysicsQuestion } from "@/lib/domain/physics";

const SUP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "−": "⁻", "=": "⁼", "(": "⁽", ")": "⁾", n: "ⁿ", i: "ⁱ",
};

const SUB: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", "−": "₋", "=": "₌", "(": "₍", ")": "₎",
};

const GREEK: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε", zeta: "ζ", eta: "η",
  theta: "θ", vartheta: "θ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν", xi: "ξ",
  pi: "π", rho: "ρ", sigma: "σ", tau: "τ", upsilon: "υ", phi: "φ", varphi: "φ", chi: "χ", psi: "ψ", omega: "ω",
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π", Sigma: "Σ", Upsilon: "Υ",
  Phi: "Φ", Psi: "Ψ", Omega: "Ω",
};

const SYMBOLS: Record<string, string> = {
  times: "×", cdot: "·", div: "÷", pm: "±", mp: "∓", approx: "≈", sim: "~", propto: "∝",
  leq: "≤", le: "≤", geq: "≥", ge: "≥", neq: "≠", ne: "≠", equiv: "≡", ll: "≪", gg: "≫",
  rightarrow: "→", to: "→", leftarrow: "←", Rightarrow: "⇒", implies: "⇒", infty: "∞",
  degree: "°", circ: "°", partial: "∂", nabla: "∇", int: "∫", sum: "Σ", prod: "Π",
  hbar: "ℏ", ohm: "Ω", angstrom: "Å", perp: "⊥", parallel: "∥", angle: "∠", therefore: "∴", because: "∵",
};

const PASSES = 5;

function mapChars(text: string, table: Record<string, string>): string | null {
  let out = "";
  for (const ch of text) {
    const mapped = table[ch];
    if (!mapped) return null;
    out += mapped;
  }
  return out;
}

/** `^{-2}` becomes ⁻², `_0` becomes ₀, where every character has a Unicode form. */
function scripts(text: string): string {
  return text
    .replace(/\^\{([^{}]+)\}/g, (_whole, group: string) => mapChars(group, SUP) ?? `^(${group})`)
    .replace(/\^([0-9+\-−=niT])/g, (whole, group: string) => mapChars(group, SUP) ?? whole)
    .replace(/_\{([^{}]+)\}/g, (_whole, group: string) => mapChars(group, SUB) ?? `_${group}`)
    .replace(/_([0-9])/g, (whole, group: string) => SUB[group] ?? whole);
}

/** One simplification pass over the LaTeX commands; run until the text stops changing. */
function pass(text: string): string {
  // Scripts first: turning ^{-1} into ⁻¹ removes the nested braces, so wrappers
  // like \mathrm{N\,kg^{-1}} can match their own {...} on the lines below.
  let out = scripts(text);
  out = out.replace(/\\(arcsin|arccos|arctan|sinh|cosh|tanh|sin|cos|tan|sec|csc|cot|ln|log|exp)\b/g, " $1 ");
  out = out.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_whole, numerator: string, denominator: string) => {
    const top = numerator.trim();
    const bottom = denominator.trim();
    const wrap = (part: string) =>
      /^[\w⁰-⁹₀-₉αβγδεζηθικλμνξπρστυφχψωΓΔΘΛΞΠΣΦΨΩ°.·×]+$/.test(part) && !/[+\-\s]/.test(part) ? part : `(${part})`;
    return `${wrap(top)}/${wrap(bottom)}`;
  });
  // `\tfrac12` is the shorthand for `\tfrac{1}{2}`; the reference's converter
  // only handles the braced form, and the authored bank uses both.
  out = out.replace(/\\[dt]?frac(\d)(\d)/g, "$1/$2");
  out = out.replace(/\\sqrt\{([^{}]*)\}/g, "√($1)");
  out = out.replace(/\\(?:mathrm|text|mathbf|mathit|boldsymbol|mathsf|operatorname)\{([^{}]*)\}/g, "$1");
  out = out.replace(/\\vec\{([^{}]*)\}/g, "$1");
  out = out.replace(/\\(?:bar|hat|tilde|overline)\{([^{}]*)\}/g, "$1");
  out = out.replace(/\\(?:left|right|Big[lr]?|big[lr]?|Bigg[lr]?|bigg[lr]?)/g, "");
  // Greek and symbols BEFORE the unbraced wrappers below. `\mu\mathrm F` must
  // become `μ\mathrm F` first: strip the wrapper first and it reads `\muF`,
  // whose greedy capture is `muF`, which matches nothing and ships as "muF".
  out = out.replace(/\\([A-Za-z]+)/g, (whole, word: string) => GREEK[word] ?? SYMBOLS[word] ?? whole);
  // Unbraced upright text, as in `\mathrm s`. Left unhandled it loses only its
  // backslash and reaches the student as "mathrm s".
  out = out.replace(/\\(?:mathrm|text|mathbf|mathit|boldsymbol|mathsf|operatorname)\s*([A-Za-z0-9]+)/g, "$1");
  out = out.replace(/\\(?:,|;|:|!| )/g, " ");
  out = out.replace(/\\(?:quad|qquad)/g, "  ");
  return out;
}

/** Strips the maths delimiters, translates the commands, tidies the leftovers. */
export function toPlainPhysics(input: string): string {
  if (!input) return input;
  let out = input;

  out = out.replace(/\\\[/g, "\n").replace(/\\\]/g, "\n");
  out = out.replace(/\\\(/g, "").replace(/\\\)/g, "");
  out = out.replace(/\$\$([\s\S]*?)\$\$/g, (_whole, group: string) => `\n${group.trim()}\n`);
  out = out.replace(/\$([^$\n]+)\$/g, "$1");

  for (let i = 0; i < PASSES; i += 1) {
    const next = pass(out);
    if (next === out) break;
    out = next;
  }

  // Anything that survived: drop the backslash rather than show it to a student.
  out = out.replace(/\\([A-Za-z]+)/g, "$1");
  // Unwrap leftover brace groups; twice covers one level of nesting.
  out = out.replace(/\{([^{}]*)\}/g, "$1").replace(/\{([^{}]*)\}/g, "$1");
  out = out.replace(/[ \t]{2,}/g, " ");
  out = out.replace(/\n{3,}/g, "\n\n");
  return out.trim();
}

/** Converts every student-visible string on a question. Applied once, at seed time. */
export function plainQuestion(question: PhysicsQuestion): PhysicsQuestion {
  return {
    ...question,
    stem: toPlainPhysics(question.stem),
    opts: question.opts?.map(toPlainPhysics),
    scheme: question.scheme.map(toPlainPhysics),
  };
}
