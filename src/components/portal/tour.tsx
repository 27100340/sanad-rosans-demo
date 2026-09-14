"use client";

/**
 * Product tour. Five to seven steps per seat, each naming a real screen in the
 * seat's own navigation. It opens once per role and is not shown again after
 * the teacher, parent or student closes it; the button in the top bar always
 * brings it back.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass, X } from "lucide-react";

export interface TourStep {
  title: string;
  body: string;
  href: string;
}

const STORAGE_PREFIX = "sanad.tour.";

export const TOURS: Record<string, TourStep[]> = {
  chairman: [
    { title: "The cockpit", body: "Every campus on one screen: attendance, marks, fees and the marking backlog, with the exceptions that need a decision today.", href: "/portal/leadership" },
    { title: "Ask the School", body: "Ask a plain question about any campus and get an answer grounded in the live figures, with the rows it used.", href: "/portal/leadership/ask" },
    { title: "Compare branches", body: "Rank the three campuses side by side and open one to see its classes, teachers and risks.", href: "/portal/leadership/branches" },
    { title: "Announce to everyone", body: "Publish to all three campuses or to one. Students, guardians and staff receive it in the portal, with an optional email.", href: "/portal/leadership/announcements" },
    { title: "Your profile", body: "Language, notification preferences and the seat you are currently viewing as.", href: "/portal/settings" },
  ],
  principal: [
    { title: "Your campus", body: "Today's attendance, marks, fee collection and the teachers with work waiting, all for your branch only.", href: "/portal/principal" },
    { title: "At-risk students", body: "The early-warning engine ranks students by attendance, marks and behaviour, and names the teacher who owns each case.", href: "/portal/principal/at-risk" },
    { title: "Students", body: "Search the roll, open one record, and see attendance, marks, tarbiyah notes and the parent's messages in one place.", href: "/portal/principal/students" },
    { title: "Parent inbox", body: "Every message from a parent, triaged into urgent, routine and praise so nothing waits three days.", href: "/portal/principal/inbox" },
    { title: "Daily attendance", body: "Which registers are open, which are closed, and who is absent right now, class by class.", href: "/portal/principal/attendance" },
    { title: "Rankings", body: "The Performance Index for every student, ranked in class, in branch and across the school.", href: "/portal/principal/rankings" },
    { title: "Audit log", body: "Every staff action with its actor and time, so a decision can always be traced back.", href: "/portal/principal/audit" },
  ],
  coordinator: [
    { title: "Your desk", body: "Today's registers, the students most at risk in the branch, and the parent messages marked urgent.", href: "/portal/coordinator" },
    { title: "Daily attendance", body: "Follow the registers class by class and chase the ones still open at the end of the day.", href: "/portal/principal/attendance" },
    { title: "Students", body: "Open any student in the branch for attendance, marks, tarbiyah notes and their guardian's messages.", href: "/portal/principal/students" },
    { title: "Timetable", body: "The whole branch timetable, period by period, with the teacher in each room.", href: "/portal/principal/timetable" },
    { title: "Announcements", body: "Publish a notice to the branch; students, guardians and staff receive it in the portal.", href: "/portal/principal/announcements" },
    { title: "Parent inbox", body: "Read and answer parent messages, triaged so the urgent ones surface first.", href: "/portal/principal/inbox" },
  ],
  teacher: [
    { title: "My spaces", body: "One Subject Space per class you teach: syllabus, resources, assignments, tests and the tutor rules.", href: "/portal/teach" },
    { title: "Attendance", body: "Open a register, mark it in a few taps, or dictate it: “Hamza absent, Umar late”.", href: "/portal/teach/attendance" },
    { title: "Messages", body: "Write to a class or one student, start from a template, and reach the guardians by email when it matters.", href: "/portal/teach/messages" },
    { title: "Proctoring", body: "Every monitored sitting, the events the exam guard recorded, and the unlock decision when a test is frozen.", href: "/portal/teach/proctoring" },
    { title: "Analytics", body: "Topic mastery, which questions were hardest, the attendance trend, and the five students to see first.", href: "/portal/teach/analytics" },
    { title: "Library", body: "The shared reading and reference shelf for your classes.", href: "/portal/teach/library" },
    { title: "Timetable", body: "Your week, period by period, with the room and the class for each lesson.", href: "/portal/teach/timetable" },
  ],
  ustadh: [
    { title: "Halaqa board", body: "Every student in your halaqa with their sabaq, sabqi and manzil state for today.", href: "/portal/hifz/ustadh" },
    { title: "Today's queue", body: "The board orders students by what is due and by how weak each unit has become, so the weakest are heard first.", href: "/portal/hifz/ustadh" },
    { title: "A student's map", body: "The whole Quran as a heat map: what is secure, what is learning, and what has lapsed.", href: "/portal/hifz/ustadh/s-zaid-hassan" },
    { title: "Word-level feedback", body: "Open a recitation attempt to see exactly which words were substituted, omitted or added.", href: "/portal/hifz/ustadh/s-zaid-hassan" },
    { title: "Your profile", body: "Language and notification preferences for your seat.", href: "/portal/settings" },
  ],
  student: [
    { title: "Today", body: "Your lessons, what is due, and the one thing worth doing first.", href: "/portal/learn" },
    { title: "Tutor", body: "A tutor that follows your teacher's rules: it hints and explains, and never hands you the answer.", href: "/portal/learn/tutor" },
    { title: "Tests", body: "Open a test, sit it under the guard your teacher chose, and read the marking against the mark scheme afterwards.", href: "/portal/learn/tests" },
    { title: "Past papers", body: "Real Cambridge papers at the exam's own pace, marked question by question.", href: "/portal/learn/papers" },
    { title: "Progress", body: "Topic by topic, what is secure and what still needs work, with your Performance Index.", href: "/portal/learn/progress" },
    { title: "Tasks", body: "Set work, daily challenges and anything overdue, in the order they are due.", href: "/portal/learn/tasks" },
    { title: "Library", body: "The class shelf: notes, worksheets and the resources your teacher has approved.", href: "/portal/learn/library" },
  ],
  parent: [
    { title: "Tonight's brief", body: "One short summary each evening for each child, in English or Urdu.", href: "/portal/family" },
    { title: "My children", body: "Attendance, marks, behaviour notes and fees for each child on one card.", href: "/portal/family/children" },
    { title: "Messages", body: "Notices from teachers and the school office, and the thread you can reply in.", href: "/portal/family/messages" },
    { title: "Reports", body: "Term reports you can read on a phone, print, or save.", href: "/portal/family/reports" },
    { title: "Your profile", body: "Choose Urdu or English and decide which notices reach you by email.", href: "/portal/settings" },
  ],
};

const FALLBACK: TourStep[] = [{ title: "Welcome", body: "Use the navigation on the left to move around the portal.", href: "/portal" }];

function dismissed(role: string): boolean {
  try {
    return window.localStorage.getItem(`${STORAGE_PREFIX}${role}`) === "done";
  } catch {
    return true;
  }
}

function remember(role: string): void {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${role}`, "done");
  } catch {
    /* private browsing or storage disabled: the tour simply opens again */
  }
}

export function Tour({ role }: { role: string }) {
  const router = useRouter();
  const steps = TOURS[role] ?? FALLBACK;
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!dismissed(role)) setOpen(true);
  }, [role]);

  const close = () => {
    setOpen(false);
    setIndex(0);
    remember(role);
  };

  const step = steps[index];
  const last = index === steps.length - 1;

  return (
    <>
      <button type="button" className="btn-outline btn-sm px-2.5" onClick={() => setOpen(true)} aria-label="Product tour" title="Take the tour">
        <Compass size={14} />
      </button>

      {open ? createPortal((
        <div className="fixed inset-0 z-40 grid place-items-center bg-ink/40 p-4 animate-fade-in" role="dialog" aria-modal="true" aria-label="Product tour">
          <button type="button" aria-label="Close the tour" className="absolute inset-0 cursor-default" onClick={close} />
          <div className="card relative z-10 w-full max-w-md space-y-4 p-5 shadow-pop">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow">Step {index + 1} of {steps.length}</p>
                <h2 className="mt-1 text-lg font-semibold text-ink">{step.title}</h2>
              </div>
              <button type="button" className="btn-ghost btn-sm px-2" onClick={close} aria-label="Close">
                <X size={14} />
              </button>
            </div>

            <p className="text-sm text-ink-2">{step.body}</p>

            <div className="flex gap-1" aria-hidden="true">
              {steps.map((s, i) => (
                <span key={s.title + i} className={i <= index ? "h-1 flex-1 rounded-full bg-accent" : "h-1 flex-1 rounded-full bg-surface-3"} />
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <button type="button" className="btn-ghost btn-sm" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
                Back
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={() => {
                    close();
                    router.push(step.href);
                  }}
                >
                  Take me there <ArrowRight size={13} />
                </button>
                {last ? (
                  <button type="button" className="btn-primary btn-sm" onClick={close}>
                    Done
                  </button>
                ) : (
                  <button type="button" className="btn-primary btn-sm" onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}>
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ), document.body) : null}
    </>
  );
}
