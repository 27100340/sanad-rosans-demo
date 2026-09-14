/**
 * Parent Brief. Facts are assembled from mock records (attendance, one line
 * per subject, Hifz status, one action for tonight). Gemini writes the
 * narrative in the chosen language; the fallback is a slot-filled template in
 * English and a genuine Urdu-script template.
 */
import { askGemini, parseKeyLines, VALUES_GUARDRAIL } from "./gemini";
import { school } from "@/lib/config/school";
import { classById, studentById, teacherById } from "@/lib/data/mock/people";
import { ASSIGNMENTS, spacesForClass } from "@/lib/data/mock/spaces";
import { TARBIYAH_LOGS } from "@/lib/data/mock/comms";
import { HALAQA_2 } from "@/lib/data/mock/hifz";

export type BriefLanguage = "en" | "ur";

export interface BriefInput {
  studentId: string;
  language: BriefLanguage;
}

export interface BriefOutput {
  studentId: string;
  firstName: string;
  language: BriefLanguage;
  headline: string;
  lines: string[];
  action: string;
  live: boolean;
}

interface BriefFacts {
  firstName: string;
  className: string;
  attendancePct: number;
  hifz: boolean;
  subjectLines: string[];
  hifzLine: string | null;
}

const ACTIONS: Record<string, { en: string; ur: string }> = {
  "s-ahmed-hassan": {
    en: "Ask Ahmed to do three nth-term questions with the tutor tonight; ten minutes is enough.",
    ur: "آج رات احمد سے کہیں کہ ٹیوٹر کے ساتھ ترتیب (nth term) کے تین سوال حل کرے؛ دس منٹ کافی ہیں۔",
  },
  "s-zaid-hassan": {
    en: "Listen to Zaid revise Surah Al-Kafirun ayah 3 to 5 tonight; ayah 4 is the anchor he keeps skipping.",
    ur: "آج رات زید سے سورۃ الکافرون آیت 3 تا 5 سنیں؛ آیت 4 وہ لنگر ہے جو وہ چھوڑ جاتا ہے۔",
  },
};

const URDU_LINES: Record<string, string[]> = {
  "s-ahmed-hassan": [
    "ریاضی: مساوات کا ہوم ورک 4 میں سے 4؛ ہر قدم لکھا اور جواب چیک کیا۔",
    "اسلامیات: نماز کی چٹائیاں بچھانے میں ساتھی کی مدد کی۔",
    "آئندہ: ترتیب (nth term) کا کام جمعرات تک جمع کروانا ہے۔",
  ],
  "s-zaid-hassan": [
    "حفظ: سورۃ الملک جاری؛ 82٪ منزل پختہ؛ اس ہفتے گھر سے 5 تلاوتیں موصول ہوئیں۔",
    "تربیت: آج حلقے کی ظہر کی نماز درست تجوید کے ساتھ پڑھائی۔",
    "توجہ: سورۃ الکافرون آیت 3 تا 5 میں ایک آیت چھوٹ گئی۔",
  ],
};

const URDU_NAMES: Record<string, string> = { Ahmed: "احمد", Zaid: "زید" };

function subjectOf(teacherId: string): string {
  const teacher = teacherById.get(teacherId);
  if (teacher?.role === "ustadh") return "Tarbiyah";
  return teacher?.subjects[0] ?? "Class";
}

export function factsFor(studentId: string): BriefFacts | null {
  const student = studentById.get(studentId);
  if (!student) return null;
  const className = classById.get(student.classId)?.name ?? "";
  const lines: string[] = [];
  for (const a of ASSIGNMENTS.filter((x) => spacesForClass(student.classId).some((s) => s.id === x.spaceId))) {
    const sub = a.submissions.find((s) => s.studentId === studentId);
    const subject = spacesForClass(student.classId).find((s) => s.id === a.spaceId)?.subject ?? "Class";
    if (sub && sub.awarded !== undefined) lines.push(`${subject}: ${a.title} marked ${sub.awarded}/${a.maxMarks}.`);
    else if (!sub && a.submissions.length === 0) lines.push(`Due soon: ${a.title} (${subject}).`);
  }
  for (const log of TARBIYAH_LOGS.filter((l) => l.studentId === studentId).slice(0, 2)) {
    lines.push(`${subjectOf(log.teacherId)}: ${log.note}`);
  }
  const row = HALAQA_2.find((r) => r.studentId === studentId);
  const hifzLine = row
    ? `Hifz: ${row.currentSurah} in progress; ${row.securePct}% of manzil secure; ${row.homeRecitationsThisWeek} home recitations this week; ${row.weakUnits} weak unit to revise.`
    : null;
  return { firstName: student.firstName, className, attendancePct: student.attendancePct, hifz: Boolean(student.hifz), subjectLines: lines, hifzLine };
}

function englishTemplate(input: BriefInput, facts: BriefFacts): BriefOutput {
  const lines = [`Attendance: present today; ${facts.attendancePct}% this term.`, ...(facts.hifzLine ? [facts.hifzLine] : []), ...facts.subjectLines];
  return {
    studentId: input.studentId,
    firstName: facts.firstName,
    language: "en",
    headline: facts.hifz ? `${facts.firstName}'s memorisation is steady this week.` : `${facts.firstName} had a good day at school.`,
    lines,
    action: ACTIONS[input.studentId]?.en ?? `Ask ${facts.firstName} to show you one thing learned today.`,
    live: false,
  };
}

function urduTemplate(input: BriefInput, facts: BriefFacts): BriefOutput {
  const lines = [`حاضری: آج حاضر؛ اس ٹرم میں ${facts.attendancePct}٪۔`, ...(URDU_LINES[input.studentId] ?? ["آج کا دن معمول کے مطابق گزرا۔"])];
  const name = URDU_NAMES[facts.firstName] ?? facts.firstName;
  return {
    studentId: input.studentId,
    firstName: facts.firstName,
    language: "ur",
    headline: facts.hifz ? `${name} کی حفظ کی پیش رفت مضبوط ہے۔` : `${name} کا آج کا دن اچھا رہا۔`,
    lines,
    action: ACTIONS[input.studentId]?.ur ?? `آج رات ${name} سے پوچھیں کہ آج کیا سیکھا۔`,
    live: false,
  };
}

export function fallback(input: BriefInput): BriefOutput {
  const facts = factsFor(input.studentId);
  if (!facts) return { studentId: input.studentId, firstName: "", language: input.language, headline: "No record for this child.", lines: [], action: "", live: false };
  return input.language === "ur" ? urduTemplate(input, facts) : englishTemplate(input, facts);
}

export async function run(input: BriefInput): Promise<BriefOutput> {
  const facts = factsFor(input.studentId);
  if (!facts) return fallback(input);
  const base = fallback(input);
  const languageLine = input.language === "ur" ? "Write everything in Urdu, in Urdu script (never Roman Urdu), warm and respectful." : "Write in plain, warm English.";
  const system = [
    `You write tonight's brief for a parent at ${school.schoolName}. Child's first name: ${facts.firstName}, ${facts.className}.`,
    VALUES_GUARDRAIL,
    languageLine,
    "Use only the facts given; never invent marks, events or names. Keep every line under 25 words.",
    "Output ONLY these lines: HEADLINE: <one sentence>, then one LINE: per fact (attendance first), then ACTION: <the one action for tonight, rewritten naturally>.",
  ].join("\n\n");
  const res = await askGemini({
    system,
    parts: [{ text: `FACTS:\n- Attendance: present today, ${facts.attendancePct}% this term\n${facts.subjectLines.map((l) => `- ${l}`).join("\n")}${facts.hifzLine ? `\n- ${facts.hifzLine}` : ""}\nACTION TONIGHT: ${ACTIONS[input.studentId]?.en ?? base.action}` }],
    temperature: 0.4,
    maxOutputTokens: 500,
  });
  if (!res.text) return base;
  const kv = parseKeyLines(res.text);
  const headline = Array.isArray(kv.HEADLINE) ? kv.HEADLINE[0] : kv.HEADLINE;
  const lines = Array.isArray(kv.LINE) ? kv.LINE : kv.LINE ? [kv.LINE] : [];
  const action = Array.isArray(kv.ACTION) ? kv.ACTION[0] : kv.ACTION;
  if (!headline || !lines.length || !action) return base;
  return { ...base, headline, lines, action, live: true };
}
