/**
 * Strip LaTeX from model output. The portal renders markdown without KaTeX, so
 * `\(x \times x = x^2\)` reaches a Grade 8 student as literal backslashes. The
 * tutor prompt asks for plain text and the model still reaches for LaTeX on any
 * algebra question, so this enforces it deterministically rather than by hope.
 */

/** `\times` and friends, as the symbol a student would write. */
const COMMANDS: [RegExp, string][] = [
  [/\\times/g, "×"],
  [/\\cdot/g, "·"],
  [/\\div/g, "÷"],
  [/\\pm/g, "±"],
  [/\\leq\b/g, "≤"],
  [/\\geq\b/g, "≥"],
  [/\\neq\b/g, "≠"],
  [/\\sqrt\s*\{([^{}]*)\}/g, "√($1)"],
  [/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)"],
  [/\\left|\\right/g, ""],
];

/** Only unwrap `$…$` when the contents are actually LaTeX, so "$5 and $10" survives. */
const LOOKS_LIKE_LATEX = /[\\^_]/;

export function stripLatex(text: string): string {
  let out = text;

  out = out.replace(/\\\((.*?)\\\)/gs, "$1");
  out = out.replace(/\\\[(.*?)\\\]/gs, "$1");
  out = out.replace(/\$\$(.*?)\$\$/gs, "$1");
  out = out.replace(/\$([^$\n]+)\$/g, (whole, inner: string) => (LOOKS_LIKE_LATEX.test(inner) ? inner : whole));

  for (const [pattern, replacement] of COMMANDS) out = out.replace(pattern, replacement);

  // `x^{2}` reads better as `x^2`; braces around a single term carry no meaning here.
  out = out.replace(/\^\{([^{}]*)\}/g, "^$1");
  out = out.replace(/_\{([^{}]*)\}/g, "_$1");

  // Collapse the double spaces the substitutions leave behind, per line.
  return out
    .split("\n")
    .map((line) => line.replace(/[ \t]{2,}/g, " ").trimEnd())
    .join("\n");
}
