/**
 * Approved providers, as agreed with JB on 2026-09-14:
 *   Google Gemini — recitation audio (Live API) and handwriting vision.
 *   Groq          — every text seat.
 * Anything else is a policy violation. The `openai` package stays prohibited:
 * Groq is reached with plain fetch over its OpenAI-compatible REST path, so no
 * OpenAI SDK, account or endpoint is involved.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const packages = {
  ...(packageJson.dependencies || {}),
  ...(packageJson.devDependencies || {}),
};

const prohibitedPackages = Object.keys(packages).filter((name) =>
  /anthropic|openai|moonshot|kimi/i.test(name),
);

const prohibitedSourcePatterns = [
  /api\.anthropic\.com/i,
  /api\.openai\.com/i,
  /api\.moonshot\.(?:ai|cn)/i,
  /api\.kimi\.com/i,
  /process\.env\.(?:ANTHROPIC|OPENAI|MOONSHOT|KIMI)[A-Z0-9_]*/i,
  /(?:localhost|127\.0\.0\.1):18789/i,
];

function filesUnder(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(full) : [full];
  });
}

const violations = [];
for (const file of filesUnder(path.join(root, "src"))) {
  const source = fs.readFileSync(file, "utf8");
  for (const pattern of prohibitedSourcePatterns) {
    if (pattern.test(source)) violations.push(`${path.relative(root, file)} matches ${pattern}`);
  }
}

if (prohibitedPackages.length || violations.length) {
  console.error("AI provider policy violation: website/portal AI must use Google Gemini (audio and vision) or Groq (text) only.");
  for (const name of prohibitedPackages) console.error(`Prohibited package: ${name}`);
  for (const violation of violations) console.error(violation);
  process.exit(1);
}

console.log("AI provider policy OK: Gemini + Groq only; no Anthropic, OpenAI, Moonshot/Kimi, or OpenClaw connection.");
