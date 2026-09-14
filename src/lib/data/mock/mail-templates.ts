/**
 * Ready-made notices a teacher can start from. Placeholders are filled on the
 * client before sending: {{name}} the student's first name (or "Parent" when
 * the whole class is addressed), {{class}} the class name, {{teacher}} the
 * sender. Production keeps these per school in a templates table.
 */

export interface MailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export const MAIL_TEMPLATES: MailTemplate[] = [
  {
    id: "welcome",
    name: "Welcome to the portal",
    subject: "Welcome to the {{class}} portal",
    body: "Dear {{name}},\n\nYour portal account for {{class}} is now open. You will find the timetable, homework, test results and messages from me in one place.\n\nPlease sign in this week and check that the details are correct. Tell me if anything looks wrong.\n\n{{teacher}}",
  },
  {
    id: "class-reminder",
    name: "Class reminder",
    subject: "Reminder for {{class}}",
    body: "Dear {{name}},\n\nA short reminder for {{class}}: please bring the set work to the next lesson, complete and checked.\n\nIf anything was unclear, send me a message before the lesson rather than after it.\n\n{{teacher}}",
  },
  {
    id: "progress-note",
    name: "Progress note",
    subject: "Progress note for {{name}}",
    body: "Dear parent,\n\nI wanted to share how {{name}} is doing in {{class}}. The work is steady and the effort is there; the next step is to show every line of working so the method marks are not lost.\n\nI will keep you updated after the next assessment.\n\n{{teacher}}",
  },
  {
    id: "show-cause",
    name: "Show-cause notice",
    subject: "Show-cause notice for {{name}}",
    body: "Dear parent,\n\nThis is a formal notice regarding {{name}} of {{class}}. The conduct recorded over the last two weeks falls below what the school expects, and it has been discussed with {{name}} already.\n\nPlease reply with your explanation within three school days, or come to the school office to meet me.\n\n{{teacher}}",
  },
  {
    id: "ptm",
    name: "Parent-teacher meeting",
    subject: "Parent-teacher meeting for {{class}}",
    body: "Dear parent,\n\nParent-teacher meetings for {{class}} are being scheduled. I would like to see you to go through {{name}}'s progress this term and agree two targets for the next one.\n\nPlease book a slot in the parent portal, or reply with the times that suit you.\n\n{{teacher}}",
  },
];

export function fillTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => vars[key] ?? match);
}
