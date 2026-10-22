import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Check, Layers, MessagesSquare, PenTool, Quote, Target } from "lucide-react";
import { SiteFooter } from "@/components/ui/site-footer";
import { HomeNav } from "@/components/home/HomeNav";
import { CanvasPreview } from "@/components/home/CanvasPreview";
import { HomeResume } from "@/components/home/HomeResume";
import { StartPicker, type StartPickerData } from "@/components/home/StartPicker";
import { LessonShowcase } from "@/components/home/LessonShowcase";
import { StageTrack } from "@/components/home/StageTrack";
import { PROBLEMS_BY_DIFFICULTY, PROBLEMS, type Problem } from "@/lib/simulator/problems-data";
import { INTERVIEW_PHASES } from "@/lib/simulator/phases";
import { BRIEFS, DESIGNS, briefHref, designHref, designShortTitle, getBrief } from "@/lib/learn/curriculum";
import { ROADMAP } from "@/lib/learn/curriculum/roadmap";
import { PREP_HORIZONS, PREP_PLANS } from "@/lib/learn/curriculum/prep";
import { courseProgress, nextIncompleteLesson } from "@/lib/learn/completion";
import type { LearningState } from "@/lib/learn/learning-state";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "WireUp System — System design interview prep: learn it, then practise it",
  description:
    "Prepare for system design interviews: a 1, 3 or 7-day rapid prep plan or a 12-stage roadmap, interactive concept lessons and design walkthroughs, then practise in a design simulator. Free, no sign-up.",
};

// ─── Real data only ──────────────────────────────────────────────────────────
// Every number on this page is derived from the product's own content, so it
// can't drift or overstate. No user counts, ratings or testimonials.

const NO_PROGRESS: LearningState = { briefs: {}, designs: {}, quizzes: {}, review: {}, courseChapters: {} };
const course = courseProgress(NO_PROGRESS);
const firstLesson = nextIncompleteLesson(NO_PROGRESS)?.lesson;
const byDifficulty = (d: Problem["difficulty"]) => PROBLEMS.filter((p) => p.difficulty === d).length;
const briefMinutes = BRIEFS.map((b) => b.minutes);
const firstDesign = DESIGNS[0];

const PICKER: StartPickerData = {
  plans: PREP_HORIZONS.map((h) => {
    const p = PREP_PLANS[h];
    const essentials = p.days.flatMap((d) => d.tasks).filter((t) => t.essential);
    return {
      horizon: h,
      label: p.label,
      tagline: p.tagline,
      essentials: essentials.length,
      essentialMinutes: essentials.reduce((s, t) => s + t.minutes, 0),
      days: p.days.map((d) => ({ title: d.title, focus: d.focus })),
    };
  }),
  roadmap: {
    stages: ROADMAP.length,
    lessons: course.total,
    minMinutes: Math.min(...briefMinutes),
    maxMinutes: Math.max(...briefMinutes),
    firstStages: ROADMAP.slice(0, 4).map((s) => s.title),
    firstLesson: firstLesson?.href ? { title: firstLesson.title, href: firstLesson.href } : null,
  },
  practice: {
    problems: PROBLEMS.length,
    easy: byDifficulty("Easy"),
    medium: byDifficulty("Medium"),
    hard: byDifficulty("Hard"),
    phases: INTERVIEW_PHASES.length,
    walkthrough: { title: designShortTitle(firstDesign), href: designHref(firstDesign.slug) },
  },
};

const SHOWCASE_BRIEF = getBrief("caching");

// Problems candidates describe, each answered by a specific feature.
const STRUGGLES = [
  {
    quote: "I freeze when they say “Design Instagram.”",
    fix: "Learn a simple 7-step method for any design question: what to ask, what to estimate, what to draw — and in what order.",
    cta: "Learn the 7 steps",
    href: "/learn/concepts/interview-framework",
  },
  {
    quote: "I can draw the boxes, but I can't explain why.",
    fix: "See weak and strong answers side by side, and how to respond when the interviewer pushes back.",
    cta: "Compare answers",
    href: "/learn/concepts/interview-framework#weak-vs-strong",
  },
  {
    quote: "I never know how many servers or how much storage to plan for.",
    fix: "A worksheet that turns “how many users?” into requests per second and storage, one step at a time.",
    cta: "Try the worksheet",
    href: "/learn/concepts/estimation#practise",
  },
  {
    quote: "I've never designed a full system from start to finish.",
    fix: "Follow a guided walkthrough: answer each step yourself, then check it against a model answer.",
    cta: `Walk through: ${designShortTitle(firstDesign)}`,
    href: designHref(firstDesign.slug),
  },
  {
    quote: "I forget what I studied by the next week.",
    fix: "Short review sessions ask you the questions again — sooner if you got them wrong.",
    cta: "Start a review session",
    href: "/learn/review",
  },
];

const pickByDifficulty = (d: Problem["difficulty"], n: number) => PROBLEMS_BY_DIFFICULTY.filter((p) => p.difficulty === d).slice(0, n);
const featuredProblems = [...pickByDifficulty("Easy", 2), ...pickByDifficulty("Medium", 2), ...pickByDifficulty("Hard", 2)];

const DIFFICULTY_STYLE: Record<Problem["difficulty"], string> = {
  Easy: "text-emerald-300",
  Medium: "text-amber-300",
  Hard: "text-rose-300",
};

const LEVEL_STYLE = { Beginner: "text-emerald-300", Intermediate: "text-amber-300", Advanced: "text-rose-300" } as const;

export default function HomePage() {
  if (!SHOWCASE_BRIEF) notFound();
  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <HomeNav />

      <main>
        {/* ── Hero: one promise on the left, one question on the right ──────
            Goal-first onboarding: instead of a menu of products, the visitor
            answers "where are you?" and gets one concrete next step. */}
        <section aria-labelledby="hero-heading" className="relative overflow-hidden px-4 pt-8 sm:pt-12 pb-14">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(245,158,11,0.10),transparent_55%),radial-gradient(ellipse_at_90%_10%,rgba(99,102,241,0.12),transparent_55%)]" />
          <div className="relative max-w-6xl mx-auto grid grid-cols-1 gap-10 lg:grid-cols-[1fr_minmax(0,460px)] items-start">
            <div className="lg:pt-6">
              <p className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400 mb-5">
                <span>System design interview prep</span>
                <span aria-hidden className="text-zinc-700">
                  •
                </span>
                <span className="text-emerald-300/90">Free · No sign-up</span>
              </p>
              <h1 id="hero-heading" className="text-[2.2rem] leading-[1.06] sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight text-white">
                Don&apos;t just learn system design.{" "}
                <span className="bg-gradient-to-r from-amber-300 via-orange-200 to-indigo-300 bg-clip-text text-transparent">Learn to crack the interview.</span>
              </h1>
              <p className="mt-5 text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed">
                In a system design interview, you plan how an app like Instagram or Uber works for millions of users — and explain your choices out loud. We help you learn the pieces, practise real questions, and say it clearly.
              </p>
              <ul className="mt-7 space-y-3 max-w-xl">
                {[
                  { icon: BookOpen, title: "Short, interactive lessons", text: `${Math.min(...briefMinutes)}–${Math.max(...briefMinutes)} minutes each, with animations and quick quizzes.` },
                  { icon: MessagesSquare, title: "Practise explaining", text: "Answer in your own words, then compare with a strong interview answer." },
                  { icon: PenTool, title: "Build real designs", text: "Put a system together in our simulator and see where it breaks under traffic." },
                ].map((v) => (
                  <li key={v.title} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-amber-300">
                      <v.icon size={15} />
                    </span>
                    <span className="text-sm">
                      <span className="font-semibold text-white">{v.title}. </span>
                      <span className="text-zinc-400">{v.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-7 text-sm text-zinc-500">
                Already know what you need?{" "}
                <Link href="/learn#topics" className="text-zinc-300 hover:text-white underline underline-offset-4 decoration-zinc-700">
                  Browse all {BRIEFS.length + DESIGNS.length} lessons
                </Link>{" "}
                or{" "}
                <Link href="/simulator" className="text-zinc-300 hover:text-white underline underline-offset-4 decoration-zinc-700">
                  open the simulator
                </Link>
                .
              </p>
            </div>

            <div>
              <HomeResume />
              <StartPicker data={PICKER} />
            </div>
          </div>
        </section>

        {/* ── How a lesson works: real pieces the visitor can use here ────── */}
        <Section
          id="how"
          eyebrow="How lessons work"
          title="Learn it, see it, then say it out loud"
          intro="Every lesson follows the same 6 steps, so you always know what's next. Try three of them below — this is a real lesson, not a demo."
        >
          <LessonShowcase
            recall={SHOWCASE_BRIEF.recall}
            contrast={SHOWCASE_BRIEF.mistakes[0]}
            lesson={{ title: SHOWCASE_BRIEF.title, href: briefHref(SHOWCASE_BRIEF.slug), minutes: SHOWCASE_BRIEF.minutes }}
          />
        </Section>

        {/* ── Struggles → what helps (one list, not a card grid) ──────────── */}
        <Section id="struggles" eyebrow="Common interview struggles" title="Sound familiar?">
          <ul className="divide-y divide-border rounded-3xl border border-border bg-card/60">
            {STRUGGLES.map((s) => (
              <li key={s.quote} className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_auto] md:items-center md:gap-8">
                <p className="flex gap-2.5 text-base font-medium text-white">
                  <Quote size={16} className="mt-1 shrink-0 text-amber-400/70" aria-hidden />
                  {s.quote}
                </p>
                <p className="text-sm text-zinc-400">{s.fix}</p>
                <Link href={s.href} className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-amber-300 hover:text-amber-200 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
                  {s.cta} <ArrowRight size={14} />
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        {/* ── The path ───────────────────────────────────────────────────── */}
        <Section
          id="path"
          eyebrow="Learn in depth"
          eyebrowTone="emerald"
          title="Or learn everything, one step at a time"
          intro={`No interview yet? Follow ${ROADMAP.length} stages, from how a website works to designing a video streaming service. Go in order or jump to any stage — your progress shows on each one.`}
        >
          <StageTrack />
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
            <Link
              href="/learn/roadmap"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold px-4 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              See all {ROADMAP.length} stages <ArrowRight size={15} />
            </Link>
            <Link href="/learn/rabbitmq" className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white">
              <Layers size={14} className="text-amber-400" /> Optional deep dive: message queues with RabbitMQ
            </Link>
          </div>
        </Section>

        {/* ── Practice ───────────────────────────────────────────────────── */}
        <Section
          id="practice"
          eyebrow="Practise"
          title="Then build it yourself"
          intro="Reading about systems isn't the same as designing one. In the simulator you build a system, send traffic through it and see what breaks — like an interview, without the pressure."
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start">
            <div className="rounded-3xl border border-indigo-500/20 bg-card p-4 sm:p-5">
              <CanvasPreview />
              <ol className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { title: "Pick a question", text: `${PROBLEMS.length} real interview questions, from easy to hard.` },
                  { title: "Drag in components", text: "Servers, databases, caches, queues and more." },
                  { title: "Test it with traffic", text: `See what slows down first and get a score — or try a timed mock interview (${INTERVIEW_PHASES.length} phases).` },
                ].map((s, i) => (
                  <li key={s.title} className="text-sm">
                    <span className="font-mono text-indigo-300 mr-1.5">{i + 1}</span>
                    <span className="font-semibold text-white">{s.title}</span>
                    <span className="block text-xs text-zinc-400 mt-1">{s.text}</span>
                  </li>
                ))}
              </ol>
              <Link
                href="/simulator"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <Target size={15} /> Open the simulator
              </Link>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Questions you can try</h3>
                <ul className="divide-y divide-border rounded-2xl border border-border bg-card/60">
                  {featuredProblems.map((p) => (
                    <li key={p.id}>
                      <Link href="/simulator" className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-zinc-900/60 transition">
                        <span className="min-w-0">
                          <span className="block text-sm text-zinc-100 truncate">{p.name}</span>
                          <span className="block text-[11px] text-zinc-500">{p.category}</span>
                        </span>
                        <span className={cn("text-[11px] font-semibold", DIFFICULTY_STYLE[p.difficulty])}>{p.difficulty}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Want help first?</h3>
                <p className="text-xs text-zinc-400 mt-0.5 mb-2">Guided walkthroughs take you through each step, with a model answer and tips.</p>
                <ul className="flex flex-wrap gap-1.5">
                  {DESIGNS.map((d) => (
                    <li key={d.slug}>
                      <Link href={designHref(d.slug)} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-zinc-200 hover:border-zinc-500 hover:text-white transition">
                        {designShortTitle(d)} <span className={cn("text-[10px]", LEVEL_STYLE[d.level])}>{d.level}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Honest trust strip ─────────────────────────────────────────── */}
        <section aria-label="What to expect" className="px-4 py-8 border-t border-border">
          <ul className="max-w-6xl mx-auto flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-zinc-400">
            {[
              "Free — no account needed",
              "Progress saves automatically in this browser",
              `${BRIEFS.length} lessons · ${DESIGNS.length} guided walkthroughs · ${PROBLEMS.length} practice questions`,
            ].map((t) => (
              <li key={t} className="inline-flex items-center gap-2">
                <Check size={14} className="text-emerald-400" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Closing: return to the one question that matters ───────────── */}
        <section aria-labelledby="closing-heading" className="px-4 py-16 border-t border-border">
          <div className="max-w-3xl mx-auto text-center">
            <h2 id="closing-heading" className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Not sure where to begin? Start here.
            </h2>
            <p className="mt-3 text-zinc-400">Answer one question and we&apos;ll show you exactly what to do first.</p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <a
                href="#start"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-6 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                Show me where to start <ArrowRight size={16} />
              </a>
              <Link
                href="/simulator"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 hover:border-indigo-400 text-white font-semibold px-6 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <PenTool size={16} /> Open the simulator
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Section({
  id,
  eyebrow,
  eyebrowTone = "amber",
  title,
  intro,
  children,
}: {
  id: string;
  eyebrow: string;
  eyebrowTone?: "amber" | "emerald" | "indigo";
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-16 px-4 py-16 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <p className={cn("text-xs font-semibold uppercase tracking-wider mb-2", { amber: "text-amber-400", emerald: "text-emerald-400", indigo: "text-indigo-400" }[eyebrowTone])}>{eyebrow}</p>
        <h2 id={`${id}-heading`} className={cn("text-2xl md:text-3xl font-bold text-white tracking-tight max-w-3xl", intro ? "mb-3" : "mb-8")}>
          {title}
        </h2>
        {intro && <p className="text-zinc-400 max-w-3xl mb-8">{intro}</p>}
        {children}
      </div>
    </section>
  );
}
