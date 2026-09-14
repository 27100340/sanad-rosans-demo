"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { Preferences } from "@/lib/data/mock/preferences";

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm text-ink">{label}</span>
        {hint ? <span className="block text-xs text-ink-3">{hint}</span> : null}
      </span>
      <input type="checkbox" className="mt-1 h-4 w-4" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

/** Language, channels, leaderboard visibility and digest day; saved through the preferences API. */
export function SettingsForm({ initial, isStudent }: { initial: Preferences; isStudent: boolean }) {
  const router = useRouter();
  const [p, setP] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/preferences", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(p) });
      setNote(res.ok ? "Saved." : "Could not save.");
      if (res.ok) router.refresh();
    } catch {
      setNote("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="card divide-y divide-line p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy) void save();
      }}
    >
      <div className="pb-3">
        <label className="label" htmlFor="pref-lang">Language for briefs and emails</label>
        <select id="pref-lang" className="input max-w-xs" value={p.language} onChange={(e) => setP({ ...p, language: e.target.value as Preferences["language"] })}>
          <option value="en">English</option>
          <option value="ur">Urdu (اردو)</option>
        </select>
      </div>
      <Toggle label="Email" hint="Reports, notices and reminders to your email address." checked={p.notifyEmail} onChange={(v) => setP({ ...p, notifyEmail: v })} />
      <Toggle label="Push notifications" hint="On the phone when the portal is installed as an app." checked={p.notifyPush} onChange={(v) => setP({ ...p, notifyPush: v })} />
      <Toggle label="WhatsApp" hint="Arrives with the notifications integration; kept here so your choice is ready." checked={p.notifyWhatsapp} onChange={(v) => setP({ ...p, notifyWhatsapp: v })} />
      {isStudent ? <Toggle label="Show my name on leaderboards" hint="Off by default: classmates see a private code instead." checked={p.showNameOnBoards} onChange={(v) => setP({ ...p, showNameOnBoards: v })} /> : null}
      <div className="pt-3">
        <label className="label" htmlFor="pref-digest">Weekly digest</label>
        <select id="pref-digest" className="input max-w-xs" value={p.digestDay} onChange={(e) => setP({ ...p, digestDay: e.target.value as Preferences["digestDay"] })}>
          <option value="fri">Friday afternoon</option>
          <option value="sat">Saturday morning</option>
          <option value="off">Off</option>
        </select>
      </div>
      <div className="flex items-center justify-between gap-3 pt-4">
        <span className="text-xs text-ink-3">{note}</span>
        <button type="submit" className="btn-primary" disabled={busy}>
          <Save size={14} /> {busy ? "Saving" : "Save"}
        </button>
      </div>
    </form>
  );
}
