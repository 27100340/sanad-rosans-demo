import { LockKeyhole } from "lucide-react";
import { school } from "@/lib/config/school";
import type { AccessRestriction } from "@/lib/domain/access";

/** What a restricted person sees instead of the portal; the persona switcher in the top bar still works. */
export function AccessBlocked({ restriction }: { restriction: AccessRestriction }) {
  return (
    <div className="mx-auto max-w-md py-10">
      <div className="card p-8 text-center">
        <span className="tile-danger mx-auto h-14 w-14 rounded-2xl">
          <LockKeyhole size={26} />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-ink">{restriction.mode === "suspended" ? "Access suspended" : "Access paused"}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-2">{restriction.message}</p>
        {restriction.endsAt ? <p className="mt-3 text-xs text-ink-3">Until {new Date(restriction.endsAt).toLocaleString("en-GB")}.</p> : null}
        <p className="mt-5 text-xs text-ink-3">
          {school.schoolName} · {school.contact.phone} · {school.contact.email}
        </p>
      </div>
    </div>
  );
}
