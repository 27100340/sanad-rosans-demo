"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { slug: "", label: "Overview" },
  { slug: "assignments", label: "Assignments" },
  { slug: "tests", label: "Tests" },
  { slug: "papers", label: "Past papers" },
  { slug: "class", label: "Class" },
  { slug: "performance", label: "Performance" },
  { slug: "insight", label: "Insight" },
  { slug: "rules", label: "Rules" },
  { slug: "planner", label: "Planner" },
] as const;

/** Tab strip shown above every page of a Subject Space. */
export function SpaceTabs({ spaceId }: { spaceId: string }) {
  const pathname = usePathname();
  const base = `/portal/teach/${spaceId}`;
  return (
    <nav aria-label="Space sections" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-line">
        {TABS.map((t) => {
          const href = t.slug ? `${base}/${t.slug}` : base;
          const active = t.slug ? pathname === href || pathname.startsWith(href + "/") : pathname === base || pathname.startsWith(`${base}/resources`);
          return (
            <li key={t.slug}>
              <Link
                href={href}
                className={cn(
                  "-mb-px block border-b-2 px-3 py-2.5 text-sm transition-colors",
                  active ? "border-accent font-medium text-accent-deep" : "border-transparent text-ink-2 hover:text-ink",
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
