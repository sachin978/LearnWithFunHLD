import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Layers, PenTool, Repeat, Zap } from "lucide-react";
import { SiteFooter } from "@/components/ui/site-footer";
import { LearnTopNav } from "@/components/learn/LearnTopNav";
import { BrandMark } from "@/components/learn/BrandMark";
import { PREP_HORIZONS, PREP_PLANS } from "@/lib/learn/curriculum/prep";
import { ROADMAP } from "@/lib/learn/curriculum/roadmap";
import { BRIEFS, DESIGNS } from "@/lib/learn/curriculum";
import { RABBITMQ_COURSE } from "@/lib/learn/rabbitmq/chapters";
import { REVIEW_DECK } from "@/lib/learn/review";
import { NextStepsPanel } from "@/components/learn/curriculum/NextStepsPanel";

export const metadata: Metadata = {
  title: "Learn system design for interviews — WireUp System",
  description:
    "Two ways to get interview-ready: a 1, 3 or 7-day Rapid Interview Prep plan, or a 12-stage roadmap that builds fundamentals step by step. Free, no sign-up.",
};

// Make the learner feel understood: recognisable situations, each with one
// concrete next step — not pressure tactics.
const SITUATIONS = [
  { text: "Your system design interview is in 3 days.", cta: "Get a 3-day plan", href: "/learn/interview-prep?days=3" },
  { text: "You know the components but struggle to connect them.", cta: "Walk through a full design", href: "/learn/designs/url-shortener" },
  { text: "You can draw the diagram, but explaining trade-offs is hard.", cta: "See how strong answers defend a decision", href: "/learn/concepts/interview-framework#weak-vs-strong" },
  { text: "You're new to system design and need a starting point.", cta: "Start Stage 1", href: "/learn/concepts/http-request-flow" },
];

const roadmapTopics = ROADMAP.flatMap((s) => s.lessons);
const plannedTopics = roadmapTopics.filter((l) => l.kind === "planned").length;

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <LearnTopNav />

      {/* The two paths are the page's primary content, so they live inside <main>. */}
      <main>
        <header className="relative px-4 pt-12 pb-10 overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(245,158,11,0.10),transparent_50%),radial-gradient(ellipse_at_85%_0%,rgba(16,185,129,0.08),transparent_50%)]" />
          <div className="relative max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-[2.1rem] leading-[1.1] sm:text-5xl font-bold tracking-tight text-white">
                Don&apos;t just learn system design.
                <br />
                <span className="bg-gradient-to-r from-amber-300 via-orange-200 to-emerald-300 bg-clip-text text-transparent">Learn to crack the interview.</span>
              </h1>
              <p className="mt-4 text-zinc-400 text-base sm:text-lg">
                Master the concepts, practise real design problems, and learn to defend your decisions under interview pressure — with a focused revision plan or a step-by-step roadmap.
              </p>
            </div>

            {/* Reduce choice overload: two needs first; the full curriculum comes later. */}
            <div className="mt-9 grid gap-5 md:grid-cols-2">
              <article className="relative flex flex-col rounded-3xl border border-amber-500/30 bg-card p-6">
                <p className="text-xs font-medium text-amber-300 flex items-center gap-1.5">
                  <Zap size={13} /> My interview is near
                </p>
                <h2 className="text-2xl font-bold text-white mt-1">Rapid Interview Prep</h2>
                <p className="text-sm text-zinc-400 mt-2 mb-5">The framework, the essential building blocks and a few representative designs — prioritised for the time you have.</p>
                <p className="text-xs text-zinc-500 mb-2" id="horizon-label">
                  How long do you have?
                </p>
                <div className="grid grid-cols-3 gap-2 mb-5" role="group" aria-labelledby="horizon-label">
                  {PREP_HORIZONS.map((h) => (
                    <Link
                      key={h}
                      href={`/learn/interview-prep?days=${h}`}
                      className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2.5 text-center hover:border-amber-500/70 hover:bg-amber-500/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    >
                      <span className="block text-lg font-bold text-white">{PREP_PLANS[h].label}</span>
                      <span className="block text-[11px] text-amber-300/80">{PREP_PLANS[h].tagline}</span>
                    </Link>
                  ))}
                </div>
                <Link href="/learn/interview-prep" className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-amber-300 hover:text-amber-200">
                  See how the plans differ <ArrowRight size={15} />
                </Link>
              </article>

              <article className="relative flex flex-col rounded-3xl border border-emerald-500/25 bg-card p-6">
                <p className="text-xs font-medium text-emerald-300 flex items-center gap-1.5">
                  <Compass size={13} /> I want to master system design
                </p>
                <h2 className="text-2xl font-bold text-white mt-1">Learn In Depth</h2>
                <p className="text-sm text-zinc-400 mt-2 mb-5">A 12-stage path from how the web works to complete system designs — each concept tied to how you&apos;d explain it in an interview.</p>
                <ol className="grid grid-cols-2 gap-x-4 gap-y-1 mb-5 text-xs text-zinc-400">
                  {ROADMAP.slice(0, 6).map((s) => (
                    <li key={s.id} className="truncate">
                      <span className="font-mono text-emerald-400/70 mr-1.5">{String(s.number).padStart(2, "0")}</span>
                      {s.title}
                    </li>
                  ))}
                  <li className="col-span-2 text-zinc-600">+ 6 more stages, ending in end-to-end designs</li>
                </ol>
                <Link
                  href="/learn/roadmap"
                  className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold px-5 py-3 text-sm transition after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  Explore the roadmap <ArrowRight size={16} />
                </Link>
              </article>
            </div>

            <p className="mt-5 text-center text-sm text-zinc-500">
              Already know the concepts?{" "}
              <Link href="/simulator" className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200">
                <PenTool size={13} /> Practise a full design in the simulator
              </Link>
            </p>
          </div>
        </header>

        <div className="px-4">
          <div className="max-w-6xl mx-auto space-y-14">
          <NextStepsPanel />
          <section aria-labelledby="situations-heading">
            <h2 id="situations-heading" className="text-xl font-bold text-white mb-4">
              Sound familiar?
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {SITUATIONS.map((s) => (
                <li key={s.text}>
                  <Link href={s.href} className="group flex h-full items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3.5 hover:border-zinc-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                    <span>
                      <span className="block text-sm text-zinc-200">{s.text}</span>
                      <span className="block text-xs text-amber-300 mt-0.5">{s.cta}</span>
                    </span>
                    <ArrowRight size={16} className="text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="inside-heading" className="grid gap-5 lg:grid-cols-[1fr_1.1fr] items-start">
            <div>
              <h2 id="inside-heading" className="text-xl font-bold text-white mb-2">
                What&apos;s inside today
              </h2>
              <p className="text-sm text-zinc-400 mb-4">Both paths link to the same lessons, so you can jump from a quick revision to the full explanation without losing your place.</p>
              <dl className="grid grid-cols-3 gap-3">
                {[
                  { v: BRIEFS.length, l: "interview briefs" },
                  { v: DESIGNS.length, l: "design walkthroughs" },
                  { v: RABBITMQ_COURSE.chapters.length, l: "RabbitMQ course chapters" },
                ].map((f) => (
                  <div key={f.l} className="rounded-xl border border-border bg-card p-3">
                    <dt className="sr-only">{f.l}</dt>
                    <dd>
                      <span className="block text-2xl font-bold text-white">{f.v}</span>
                      <span className="text-[11px] text-zinc-500">{f.l}</span>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-zinc-600">
                The roadmap arranges this material into {roadmapTopics.length} topics across {ROADMAP.length} stages; {plannedTopics} topics are still planned and labelled as such.
              </p>
              <Link
                href="/learn/review"
                className="mt-4 flex items-center gap-3 rounded-xl border border-indigo-500/25 bg-indigo-500/[0.05] px-3 py-2.5 text-sm text-zinc-300 hover:border-indigo-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Repeat size={16} className="text-indigo-300 shrink-0" />
                <span className="flex-1">
                  <strong className="text-white">Spaced review</strong> — {REVIEW_DECK.length} interview questions that come back sooner when you miss them and later when you know them.
                </span>
                <ArrowRight size={14} className="text-indigo-300" />
              </Link>
            </div>

            <Link href="/learn/rabbitmq" className="group rounded-2xl border border-amber-500/25 bg-card p-5 hover:border-amber-500/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
                  <BrandMark brand="rabbitmq" size={20} />
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1">
                    <Layers size={11} /> Stage 6 · Interactive course
                  </p>
                  <h3 className="text-white font-semibold">{RABBITMQ_COURSE.title}</h3>
                </div>
              </div>
              <p className="text-sm text-zinc-400 mb-3">
                {RABBITMQ_COURSE.chapters.length} animated chapters on message queues — exchanges, acks, retries, durability and Kafka trade-offs. The deep dive for the messaging stage of the roadmap.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-300">
                Open the course <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
