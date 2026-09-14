/**
 * Per-person portal preferences: language, notification channels, whether
 * the real name shows on leaderboards. Defaults apply until someone saves.
 * Production: a preferences column on the profile.
 */
import { singleton } from "../store";
import { guardianById } from "./people";

export interface Preferences {
  language: "en" | "ur";
  notifyEmail: boolean;
  notifyPush: boolean;
  notifyWhatsapp: boolean;
  showNameOnBoards: boolean;
  digestDay: "fri" | "sat" | "off";
}

const DEFAULTS: Preferences = { language: "en", notifyEmail: true, notifyPush: true, notifyWhatsapp: false, showNameOnBoards: false, digestDay: "sat" };

export const PREFERENCES: Map<string, Preferences> = singleton("preferences", () => new Map<string, Preferences>([
  ["s-zainab-omer", { ...DEFAULTS, showNameOnBoards: true }],
  ["s-fatima-zubair", { ...DEFAULTS, showNameOnBoards: true }],
  ["s-hafsa-tariq", { ...DEFAULTS, showNameOnBoards: true }],
]));

export function preferencesFor(personId: string): Preferences {
  const saved = PREFERENCES.get(personId);
  if (saved) return saved;
  const guardian = guardianById.get(personId);
  return guardian ? { ...DEFAULTS, language: guardian.preferredLanguage } : DEFAULTS;
}

export function savePreferences(personId: string, patch: Partial<Preferences>): Preferences {
  const next: Preferences = { ...preferencesFor(personId), ...patch };
  PREFERENCES.set(personId, next);
  return next;
}
