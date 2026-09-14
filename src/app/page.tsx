import Link from "next/link";
import { ArrowRight, BookMarked, Building2, GraduationCap, HeartHandshake, Mic, ShieldCheck, Sparkles, Users } from "lucide-react";
import { PERSONAS } from "@/lib/auth/personas";
import { school } from "@/lib/config/school";
import { PersonaEntry } from "@/components/portal/persona-entry";

const SEATS = [
  { icon: Building2, title: "Leadership sees every campus", body: "Three branches on one screen. Attendance, fees, marks, risk. Ask a question in plain language and get the figures behind the answer." },
  { icon: Users, title: "Teachers own their subject", body: "A Subject Space per class with genuine resources, an AI marker that shows its evidence, and a tutor that follows the teacher's rules." },
  { icon: GraduationCap, title: "Students learn, not copy", body: "A Socratic tutor bound to the syllabus, in English or Urdu. It coaches toward the answer and never hands it over." },
  { icon: Mic, title: "Hifz with a patient listener", body: "The child listens to an ayah, recites it back, and sees exactly which word slipped. Sabaq, sabqi and manzil scheduled automatically." },
  { icon: HeartHandshake, title: "Parents get tonight's brief", body: "One card, in their language: what happened today, and the single thing to do at home this evening." },
  { icon: ShieldCheck, title: "Values built in", body: "Every AI seat runs under a values guardrail, a tarbiyah log for character, and school-owned data with full audit." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="container-x flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-white">
            <BookMarked size={20} />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-xl font-medium text-ink">{school.productName}</span>
            <span className="block text-2xs uppercase tracking-widelabel text-ink-3">for {school.schoolName}</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <a href="#seats" className="btn-ghost btn-sm hidden sm:inline-flex">Every seat</a>
          <a href="#hifz" className="btn-ghost btn-sm hidden sm:inline-flex">Hifz Engine</a>
          <Link href="/portal" className="btn-primary btn-sm">
            Open the demo <ArrowRight size={14} />
          </Link>
        </nav>
      </header>

      <section className="geo border-y border-line">
        <div className="container-x grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-4">AI-powered school operating system</p>
            <h1 className="max-w-3xl text-4xl font-medium leading-[1.08] tracking-tight text-ink sm:text-6xl">
              Every seat, <span className="text-accent">one system.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-2">
              {school.productName} runs {school.shortName} end to end: leadership, principals, teachers, students, Hifz and parents, with an AI that
              behaves differently in every seat and always answers to a human.
            </p>
            <p className="mt-3 max-w-xl text-sm text-ink-3">{school.productMeaning}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/portal" className="btn-primary">
                Enter as Chairman <ArrowRight size={16} />
              </Link>
              <a href="#personas" className="btn-outline">Choose a seat</a>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="theme-dark card p-6">
              <p className="eyebrow-gold mb-3">Monday brief · Chairman</p>
              <p className="font-display text-xl leading-snug text-ink">
                “Lake City is your strongest campus this week. Gulberg Grade 8 Maths fell six points, and Paragon lost seven families, four of them over transport. Three decisions are waiting for you.”
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs text-ink-3">
                <Sparkles size={14} className="text-gold" /> Generated from live aggregates, figures cited, every question audited.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="seats" className="container-x py-16 sm:py-20">
        <p className="eyebrow mb-2">One system, every seat</p>
        <h2 className="max-w-2xl text-3xl font-medium tracking-tight text-ink">The AI is different in every chair.</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SEATS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-6">
              <span className="tile-accent mb-4">
                <Icon size={18} />
              </span>
              <h3 className="text-base font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="hifz" className="theme-dark border-y border-line">
        <div className="container-x grid gap-10 py-16 sm:py-20 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <p className="eyebrow-gold mb-2">Hifz Engine</p>
            <h2 className="text-3xl font-medium tracking-tight text-ink">Listen. Recite. See every word.</h2>
            <p className="mt-4 text-ink-2">
              Built on the same open recitation models and Quran text APIs that power the world&apos;s largest Quran apps. The engine checks a child&apos;s
              recitation word by word, spots look-alike verses before they become a habit, and schedules manzil so nothing memorised is ever lost.
              The Ustadh stays the sanad; the system keeps the ledger.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-ink-2">
              <li>• Sabaq, sabqi and manzil queued every morning with spaced repetition</li>
              <li>• Word-level feedback: correct, substituted, omitted, inserted</li>
              <li>• Mutashabihat drills the moment a look-alike slip appears</li>
              <li>• Evening recitations recorded at home, checked before the halaqa starts</li>
            </ul>
          </div>
          <div className="lg:col-span-6">
            <div className="card p-6">
              <p className="mb-3 text-2xs uppercase tracking-widelabel text-ink-3">Surah Al-Kafirun · recite-back</p>
              <p className="quran">
                قُلْ يَٰٓأَيُّهَا ٱلْكَٰفِرُونَ لَآ أَعْبُدُ مَا تَعْبُدُونَ وَلَآ أَنتُمْ عَٰبِدُونَ مَآ أَعْبُدُ <span className="w-miss">وَلَآ أَنَا۠ عَابِدٌ مَّا عَبَدتُّمْ</span> وَلَآ أَنتُمْ عَٰبِدُونَ مَآ أَعْبُدُ لَكُمْ دِينُكُمْ وَلِىَ دِينِ
              </p>
              <p className="mt-4 text-sm text-ink-2">Ayah 4 was skipped: a classic jump between the two identical ayat. Drill queued for tomorrow&apos;s sabqi.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="personas" className="container-x py-16 sm:py-20">
        <p className="eyebrow mb-2">Demo</p>
        <h2 className="text-3xl font-medium tracking-tight text-ink">Choose a seat and look around.</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-2">
          Records are fictional; study resources, syllabus strands and Quran text are genuine. Switch seats any time from the top bar.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONAS.map((p) => (
            <PersonaEntry key={p.id} persona={p} />
          ))}
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="container-x flex flex-col gap-2 py-8 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {school.productName} · built for {school.schoolName}, {school.city}. Established {school.founded}.
          </p>
          <p>
            A {school.vendor.platform} instance by {school.vendor.name}. Demo build.
          </p>
        </div>
      </footer>
    </div>
  );
}
