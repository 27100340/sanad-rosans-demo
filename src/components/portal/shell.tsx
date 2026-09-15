"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle, BookOpen, Building2, CalendarDays, ClipboardList, GraduationCap, Home, Inbox, Layers, LineChart,
  Map, Megaphone, MessageSquareText, Mic, Repeat, ScrollText, Settings, Sparkles, Users, HeartHandshake, BookMarked,
} from "lucide-react";
import type { NavItem } from "@/lib/auth/nav";
import { school } from "@/lib/config/school";
import { cn } from "@/lib/utils";
import { AiPill } from "@/components/ui/primitives";
import { NotificationBell } from "./notification-bell";
import { PersonaSwitcher } from "./persona-switcher";
import { PresenceBeacon } from "./presence-beacon";
import { Tour } from "./tour";
import { ExitViewAs, ViewAsBanner } from "./view-as-banner";
import { SchoolAssistant, assistantEnabledFor } from "./assistant";

const ICONS: Record<NavItem["icon"], React.ComponentType<{ size?: number; className?: string }>> = {
  home: Home, ask: Sparkles, branches: Building2, alert: AlertTriangle, users: Users, inbox: Inbox, calendar: CalendarDays,
  book: BookOpen, tasks: ClipboardList, insight: LineChart, rules: ScrollText, planner: Layers, tutor: MessageSquareText,
  progress: GraduationCap, mic: Mic, map: Map, drill: Repeat, family: HeartHandshake, megaphone: Megaphone, hifz: BookMarked,
};

export function PortalShell({
  nav,
  personaId,
  personaLabel,
  role,
  roleLine,
  aiLive,
  viewingAs = null,
  children,
}: {
  nav: NavItem[];
  personaId: string;
  personaLabel: string;
  role: string;
  roleLine: string;
  aiLive: boolean;
  /** Set only while the super admin is viewing the portal as someone else. */
  viewingAs?: { label: string; role: string } | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (href: string) => (href.split("/").length <= 3 ? pathname === href : pathname === href || pathname.startsWith(href + "/"));
  const inboxHref = nav.find((n) => n.icon === "inbox")?.href ?? "/portal";

  return (
    <div className="app-shell min-h-screen bg-canvas">
      <PresenceBeacon />
      {viewingAs ? <ViewAsBanner label={viewingAs.label} role={viewingAs.role} /> : null}
      {/* Rail */}
      <aside className="theme-dark fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-line bg-canvas md:flex">
        <Link href="/" className="flex items-center gap-3 px-5 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/20 text-accent">
            <BookMarked size={18} />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-medium text-ink">{school.productName}</span>
            <span className="block text-2xs text-ink-3">{school.shortName}</span>
          </span>
        </Link>
        <nav className="mt-2 min-h-0 flex-1 overflow-y-auto space-y-0.5 px-3">
          {nav.map((item) => {
            const Icon = ICONS[item.icon];
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active ? "bg-accent/15 font-medium text-accent-deep" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                )}
              >
                <Icon size={16} className={active ? "text-accent" : "text-ink-3"} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.badge ? <span className="chip-accent num shrink-0">{item.badge}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line px-5 py-4 text-2xs text-ink-3">
          <p className="font-medium text-ink-2">{personaLabel}</p>
          <p>{roleLine}</p>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/85 backdrop-blur md:pl-60">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-2 md:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-accent">
              <BookMarked size={16} />
            </span>
            <span className="font-display text-base font-medium">{school.productName}</span>
          </Link>
          <p className="hidden text-xs text-ink-3 md:block">
            {school.schoolName} · {school.city}
          </p>
          <div className="flex items-center gap-2">
            {viewingAs ? <ExitViewAs /> : null}
            <AiPill live={aiLive} />
            <NotificationBell inboxHref={inboxHref} />
            <Tour role={role} />
            <Link href="/portal/settings" className={cn("btn-outline btn-sm px-2.5", pathname === "/portal/settings" && "text-accent")} aria-label="Settings" title="Profile and settings">
              <Settings size={14} />
            </Link>
            <PersonaSwitcher currentId={personaId} compact />
          </div>
        </div>
      </header>

      <main className="px-4 pb-24 pt-6 sm:px-8 md:pb-10 md:pl-[17rem]">
        <p className="mx-auto mb-4 max-w-content text-xs text-ink-3">Demo workspace · fictional records · changes reset when the server restarts</p>
        <div className="mx-auto max-w-content space-y-8 animate-fade-in">{children}</div>
      </main>

      {/* Phone bottom bar */}
      {nav.length > 0 && assistantEnabledFor(role) && <SchoolAssistant role={role} personaId={personaId}/>}
      {menuOpen && <div className="fixed inset-x-3 bottom-16 z-40 max-h-[70dvh] overflow-y-auto rounded-2xl border border-line bg-surface p-4 shadow-xl md:hidden" role="dialog" aria-label="All sections"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">All sections</h2><button className="btn-outline btn-sm" onClick={() => setMenuOpen(false)}>Close</button></div>{nav.map(item => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="block rounded-xl p-3 text-sm hover:bg-canvas">{item.label}</Link>)}</div>}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface md:hidden">
        {nav.slice(0, 4).map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} className={cn("flex flex-1 flex-col items-center gap-1 py-2 text-2xs", active ? "text-accent" : "text-ink-3")}>
              <span className="relative">
                <Icon size={18} />
                {item.badge ? <span className="absolute -right-1.5 -top-1 h-2 w-2 rounded-full bg-accent" aria-label={`${item.badge} unread`} /> : null}
              </span>
              <span className="truncate px-1">{item.label}</span>
            </Link>
          );
        })}
        {nav.length > 4 && <button className="flex flex-1 flex-col items-center gap-1 py-2 text-2xs text-ink-3" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}><Layers size={18}/><span>More</span></button>}
      </nav>
    </div>
  );
}
