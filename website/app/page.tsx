import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Compass, PenTool, Timer, Zap } from "lucide-react";
import { SiteFooter } from "@/components/ui/site-footer";
import { HomeNav } from "@/components/home/HomeNav";
import { LearnPreview } from "@/components/home/LearnPreview";
import { CanvasPreview } from "@/components/home/CanvasPreview";
import { ContinueChip } from "@/components/home/ContinueChip";
import { BrandMark } from "@/components/learn/BrandMark";
import { COMPONENTS, CATEGORY_COLORS } from "@/lib/simulator/components-data";
import { ComponentIcon } from "@/lib/simulator/icon-registry";
import { PROBLEMS_BY_DIFFICULTY, PROBLEMS, type Problem } from "@/lib/simulator/problems-data";
import { INTERVIEW_PHASES } from "@/lib/simulator/phases";
import { RABBITMQ_COURSE } from "@/lib/learn/rabbitmq/chapters";
import { BRIEFS, DESIGNS } from "@/lib/learn/curriculum";
import { ROADMAP } from "@/lib/learn/curriculum/roadmap";
import { PREP_HORIZONS, PREP_PLANS } from "@/lib/learn/curriculum/prep";
import { WORKFLOW } from "@/lib/learn/curriculum/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "WireUp System — System design interview prep: learn it, then practise it",
  description:
    "Prepare for system design interviews: a 1, 3 or 7-day rapid prep plan or a 12-stage roadmap, interview-focused concept briefs and design walkthroughs, then practise in an interactive simulator. Free, no sign-up.",
};

// ─── Real numbers only (honest social proof) ─────────────────────────────────
// Every figure below is derived from the product's own data, so it can't drift
// or overstate. No user counts, ratings or testimonials — we don't have them.
const messageQueue = COMPONENTS.find((c) => c.id === "message-queue");

// A spread of difficulties so every visitor sees something at their level.
const pickByDifficulty = (d: Problem["difficulty"], n: number) => PROBLEMS_BY_DIFFICULTY.filter((p) => p.difficulty === d).slice(0, n);
const featuredProblems = [...pickByDifficulty("Easy", 2), ...pickByDifficulty("Medium", 2), ...pickByDifficulty("Hard", 2)];

const DIFFICULTY_STYLE: Record<Problem["difficulty"], string> = {
  Easy: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  Medium: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  Hard: "bg-rose-500/10 text-rose-300 border-rose-500/25",
};

// Headline options considered (5-second test: what is it, who for, what next):
//  1. "Understand system design. Then practise it."               — clear, but doesn't say "interviews".
//  2. "Don't just learn system design. Learn to crack the interview." — names the outcome visitors want. ← chosen
//  3. "From zero to system design interview-ready."               — crisp, but less about understanding.
// No guarantees or success-rate claims: we don't have data to back them.

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <HomeNav />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────────
            Cognitive load: one headline, one sentence, two choices. Nothing
            else moves except the Learn preview. */}
        <section aria-labelledby="hero-heading" className="relative overflow-hidden px-4 pt-7 sm:pt-10 pb-12">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(245,158,11,0.09),transparent_50%),radial-gradient(ellipse_at_80%_0%,rgba(99,102,241,0.14),transparent_50%)]" />
          <div className="relative max-w-6xl mx-auto group/hero">
            <div className="text-center max-w-3xl mx-auto">
              {/* Returning visitors see their Continue chips in this slot instead (CSS :has, so no hydration flash). */}
              <ContinueChip />
              <p className="inline-flex flex-wrap justify-center items-center gap-x-2 gap-y-1 text-xs text-zinc-400 mb-4 group-has-[[data-continue]]/hero:hidden">
                <span>For software engineers &amp; interview prep</span>
                <span aria-hidden className="text-zinc-700">
                  •
                </span>
                <span className="text-emerald-300/90">Free · No sign-up</span>
              </p>
              <h1 id="hero-heading" className="text-[2.1rem] leading-[1.08] sm:text-5xl lg:text-[3.3rem] font-bold tracking-tight text-white">
                Don&apos;t just learn system design.
                <br />
                <span className="bg-gradient-to-r from-amber-300 via-orange-200 to-indigo-300 bg-clip-text text-transparent">Learn to crack the interview.</span>
              </h1>
              <p className="mt-4 text-[15px] sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                From confusing diagrams to confidently explaining scalable systems. Revise fast or learn in depth — then practise real designs.
              </p>
            </div>


            {/* Hick's law: exactly two primary paths. Self-identification: each
                card opens with the visitor's goal, not a product name. */}
            <div className="mt-6 sm:mt-7 grid gap-4 sm:gap-5 md:grid-cols-2">
              <PathCard
                accent="amber"
                intent="I want to learn the concepts"
                title="Learn"
                description="Revise fast for an upcoming interview, or build fundamentals step by step."
                preview={<LearnPreview />}
                cta="My interview is near"
                href="/learn/interview-prep"
                secondary={{ label: "Learn in depth", href: "/learn/roadmap" }}
                meta={`${BRIEFS.length} interview briefs · ${DESIGNS.length} design walkthroughs`}
                icon={<BookOpen size={18} />}
              />
              <PathCard
                accent="indigo"
                intent="I want to practise designing"
                title="Practice"
                description="Design real interview problems, then load-test and score them."
                preview={<CanvasPreview />}
                cta="Open the simulator"
                href="/simulator"
                meta={`${PROBLEMS.length} interview problems · ${COMPONENTS.length} components`}
                icon={<PenTool size={18} />}
              />
            </div>

            <p className="mt-6 text-center text-sm text-zinc-500">
              New to system design?{" "}
              <Link href="/learn/concepts/http-request-flow" className="text-amber-300 hover:text-amber-200 underline underline-offset-4 decoration-amber-500/40 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
                Start with what happens when you open a website — 10 min
              </Link>
            </p>
          </div>
        </section>

        {/* ── Interview value ──────────────────────────────────────────────
            Show, don't tell: each outcome has a tiny real-product visual and
            one concrete link, instead of a paragraph of claims. */}
        <Section
          id="interview"
          eyebrow="Built for interviews"
          eyebrowTone="amber"
          title="Know the concepts. Explain the trade-offs. Design with confidence."
          intro="System design interviews aren't about memorising one perfect diagram. They test how you break down ambiguous problems, choose components, reason about trade-offs and evolve a design as requirements change."
        >
          <ol className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Understand the building blocks", text: "Learn why databases, caches, queues and load balancers exist — and when not to use them.", visual: <MiniConcept />, href: "/learn/roadmap", cta: "See the roadmap" },
              { title: "Learn the interview approach", text: "Practise requirements, estimation, architecture and trade-off discussions.", visual: <MiniWorkflow />, href: "/learn/concepts/interview-framework", cta: "The 7-step framework" },
              { title: "Apply what you learn", text: "Design complete systems step by step, then build them in the simulator.", visual: <MiniCanvas />, href: "/learn/designs/url-shortener", cta: "Try a design" },
            ].map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-border bg-card p-5 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-mono", i < 2 ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-indigo-500/30 bg-indigo-500/10 text-indigo-300")}>{i + 1}</span>
                  <h3 className="text-white font-semibold">{s.title}</h3>
                </div>
                <div className="h-20 mb-4 rounded-xl border border-border/70 bg-background/60 flex items-center justify-center px-3 overflow-hidden">{s.visual}</div>
                <p className="text-sm text-zinc-400 mb-3">{s.text}</p>
                <Link href={s.href} className="mt-auto inline-flex items-center gap-1 text-sm text-zinc-300 hover:text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                  {s.cta} <ArrowRight size={14} />
                </Link>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link href="/learn/interview-prep" className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-2.5 text-sm text-zinc-200 hover:border-amber-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
              <Zap size={15} className="text-amber-400" /> Short on time? <strong className="text-white">Rapid Interview Prep</strong> <ArrowRight size={14} />
            </Link>
            <Link href="/learn/roadmap" className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] px-4 py-2.5 text-sm text-zinc-200 hover:border-emerald-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
              <Compass size={15} className="text-emerald-400" /> Want the full picture? <strong className="text-white">Explore the learning roadmap</strong> <ArrowRight size={14} />
            </Link>
          </div>
        </Section>

        {/* ── Learn showcase: the two journeys ───────────────────────────── */}
        <Section id="learn" eyebrow="Learn" eyebrowTone="amber" title="Two ways to prepare — pick the one that fits your timeline">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-amber-500/30 bg-card p-6 flex flex-col">
              <p className="text-xs font-medium text-amber-300 flex items-center gap-1.5">
                <Zap size={13} /> Interview coming up?
              </p>
              <h3 className="text-xl font-bold text-white mt-1">Rapid Interview Prep</h3>
              <p className="text-sm text-zinc-400 mt-2 mb-5">A prioritised plan — the framework, essential building blocks, representative designs and a timed mock — sized to the time you have.</p>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {PREP_HORIZONS.map((h) => (
                  <Link key={h} href={`/learn/interview-prep?days=${h}`} className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2.5 text-center hover:border-amber-500/70 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
                    <span className="block text-lg font-bold text-white">{PREP_PLANS[h].label}</span>
                    <span className="block text-[11px] text-amber-300/80">{PREP_PLANS[h].tagline}</span>
                  </Link>
                ))}
              </div>
              <p className="mt-auto text-xs text-zinc-500">Every topic links to an in-depth lesson when you want more.</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/25 bg-card p-6 flex flex-col">
              <p className="text-xs font-medium text-emerald-300 flex items-center gap-1.5">
                <Compass size={13} /> Build fundamentals that last
              </p>
              <h3 className="text-xl font-bold text-white mt-1">Learn In Depth</h3>
              <p className="text-sm text-zinc-400 mt-2 mb-4">{ROADMAP.length} stages in order, from how the web works to end-to-end designs.</p>
              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
                {ROADMAP.map((st) => (
                  <li key={st.id} className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="font-mono text-emerald-400/70 w-5">{String(st.number).padStart(2, "0")}</span>
                    <span className="truncate">{st.title}</span>
                  </li>
                ))}
              </ol>
              <Link href="/learn/rabbitmq" className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.05] px-3 py-2 text-xs text-zinc-300 hover:border-amber-500/60">
                <BrandMark brand="rabbitmq" size={14} />
                <span>
                  Stage 6 includes the interactive <strong className="text-white">RabbitMQ</strong> course ({RABBITMQ_COURSE.chapters.length} animated chapters)
                </span>
              </Link>
              <Link href="/learn/roadmap" className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300 hover:text-emerald-200">
                Explore the roadmap <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </Section>

        {/* ── Practice showcase ──────────────────────────────────────────── */}
        <Section id="practice" eyebrow="Practice" title="Put the concepts into practice">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProblems.map((p) => (
              <Link
                key={p.id}
                href="/simulator"
                className="group rounded-2xl border border-border bg-card p-4 hover:border-indigo-500/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-white font-semibold text-sm">{p.name}</h3>
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", DIFFICULTY_STYLE[p.difficulty])}>{p.difficulty}</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{p.description}</p>
                <p className="mt-3 text-[11px] text-zinc-600">{p.category}</p>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Open the simulator and pick any of these — plus {PROBLEMS.length - featuredProblems.length} more — from the Problems tab.
          </p>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {messageQueue && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="text-white font-semibold mb-1">Learn it, then use it</h3>
                <p className="text-sm text-zinc-400 mb-4">The message queue you study in the RabbitMQ course is one of the {COMPONENTS.length} components you can drop onto the canvas.</p>
                <div className="flex items-center gap-3">
                  <div className={cn("rounded-xl border-2 px-3 py-2.5 min-w-[150px]", CATEGORY_COLORS.Messaging.border, CATEGORY_COLORS.Messaging.bg)}>
                    <div className="flex items-center gap-2">
                      <ComponentIcon iconKey={messageQueue.icon} size={15} className={CATEGORY_COLORS.Messaging.text} />
                      <span className="text-white text-xs font-semibold">{messageQueue.name}</span>
                    </div>
                    <span className={cn("mt-1 inline-block text-[10px] font-medium px-1.5 py-0.5 rounded", CATEGORY_COLORS.Messaging.badge)}>{messageQueue.category}</span>
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    <Link href="/learn/rabbitmq" className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
                      <BookOpen size={14} /> Learn how it works
                    </Link>
                    <Link href="/simulator" className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-indigo-200 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
                      <PenTool size={14} /> Use it in a design
                    </Link>
                  </div>
                </div>
              </div>
            )}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                <Timer size={15} className="text-indigo-300" /> Timed mock interviews
              </h3>
              <p className="text-sm text-zinc-400 mb-4">Practice Interview mode walks you through the {INTERVIEW_PHASES.length} phases interviewers expect.</p>
              <ol className="flex flex-wrap gap-2">
                {INTERVIEW_PHASES.map((phase, i) => (
                  <li key={phase} className="flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/[0.06] px-2.5 py-1.5 text-xs text-zinc-300">
                    <span className="font-mono text-indigo-300">{i + 1}</span>
                    {phase}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Section>

        {/* ── Product facts ──────────────────────────────────────────────── */}
        <section aria-label="Product facts" className="px-4 py-10 border-t border-border">
          <dl className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: PROBLEMS.length, label: "real interview problems" },
              { value: BRIEFS.length, label: "interview concept briefs" },
              { value: DESIGNS.length, label: "step-by-step design walkthroughs" },
              { value: COMPONENTS.length, label: "simulator components" },
            ].map((f) => (
              <div key={f.label}>
                <dt className="sr-only">{f.label}</dt>
                <dd>
                  <span className="block text-3xl font-bold text-white">{f.value}</span>
                  <span className="text-xs text-zinc-500">{f.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Closing CTA (peak–end: finish on the same two clear choices) ── */}
        <section aria-labelledby="closing-heading" className="px-4 py-16 border-t border-border">
          <div className="max-w-3xl mx-auto text-center">
            <h2 id="closing-heading" className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Ready to understand how real systems work?
            </h2>
            <p className="mt-3 text-zinc-400">Start with the concepts or jump straight into hands-on practice.</p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/learn"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-6 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <BookOpen size={16} /> Explore lessons
              </Link>
              <Link
                href="/simulator"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
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

// ─── Building blocks ─────────────────────────────────────────────────────────

const ACCENT = {
  amber: {
    card: "border-amber-500/25 hover:border-amber-500/60 focus-within:border-amber-500/60",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    intent: "text-amber-300",
    cta: "bg-amber-500 group-hover:bg-amber-400 text-zinc-950",
    ring: "focus-visible:ring-amber-300",
    glow: "bg-amber-500/10",
  },
  indigo: {
    card: "border-indigo-500/25 hover:border-indigo-500/60 focus-within:border-indigo-500/60",
    chip: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
    intent: "text-indigo-300",
    cta: "bg-indigo-600 group-hover:bg-indigo-500 text-white",
    ring: "focus-visible:ring-indigo-400",
    glow: "bg-indigo-500/15",
  },
} as const;

/**
 * Fitts's law + Von Restorff: a large card whose whole surface is the target
 * (stretched link on the CTA, so the accessible name stays short and clear),
 * with one distinct accent per path so the two never blur together.
 */
function PathCard({
  accent,
  intent,
  title,
  description,
  preview,
  cta,
  href,
  meta,
  icon,
  secondary,
}: {
  accent: keyof typeof ACCENT;
  intent: string;
  title: string;
  description: string;
  preview: React.ReactNode;
  cta: string;
  href: string;
  meta: string;
  icon: React.ReactNode;
  /** A second destination. When present the card is no longer one big link (two targets). */
  secondary?: { label: string; href: string };
}) {
  const a = ACCENT[accent];
  return (
    <article className={cn("group relative flex flex-col overflow-hidden rounded-3xl border bg-card p-5 transition-colors", a.card)}>
      <div aria-hidden className={cn("pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full blur-3xl", a.glow)} />
      <div className="relative flex items-center gap-3 mb-4 sm:mb-3">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl border", a.chip)}>{icon}</span>
        <div>
          <p className={cn("text-xs font-medium", a.intent)}>{intent}</p>
          <h2 className="text-2xl font-bold text-white leading-tight">{title}</h2>
        </div>
      </div>
      {/* Mobile: intent + title + action only, so both paths fit the first screen; the preview and detail appear from sm up. */}
      <p className="relative hidden sm:block text-sm text-zinc-400 mb-3">{description}</p>
      <div className="relative hidden sm:block mb-4">{preview}</div>
      <div className="mt-auto flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
        <div className={cn(secondary ? "grid grid-cols-2 gap-2 sm:flex sm:gap-3" : "contents")}>
          <Link
            href={href}
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2",
              secondary ? "px-3 sm:px-5" : "px-5 after:absolute after:inset-0 after:rounded-3xl after:content-['']",
              a.cta,
              a.ring,
            )}
          >
            {cta} <ArrowRight size={16} className={cn(secondary ? "hidden sm:inline" : "group-hover:translate-x-1", "transition-transform")} />
          </Link>
          {secondary && (
            <Link
              href={secondary.href}
              className={cn("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3 sm:px-5 py-3 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2", a.chip, a.ring)}
            >
              {secondary.label} <ArrowRight size={16} className="hidden sm:inline" />
            </Link>
          )}
        </div>
        <span className={cn("text-xs text-zinc-500", secondary && "sm:hidden")}>{meta}</span>
      </div>
    </article>
  );
}

function Section({
  id,
  eyebrow,
  eyebrowTone = "indigo",
  title,
  intro,
  children,
}: {
  id: string;
  eyebrow: string;
  eyebrowTone?: "indigo" | "amber";
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="px-4 py-16 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <p className={cn("text-xs font-semibold uppercase tracking-wider mb-2", eyebrowTone === "amber" ? "text-amber-400" : "text-indigo-400")}>{eyebrow}</p>
        <h2 id={`${id}-heading`} className={cn("text-2xl md:text-3xl font-bold text-white tracking-tight max-w-2xl", intro ? "mb-3" : "mb-8")}>
          {title}
        </h2>
        {intro && <p className="text-zinc-400 max-w-3xl mb-8">{intro}</p>}
        {children}
      </div>
    </section>
  );
}

// Tiny static diagrams for "How it works" — they illustrate, they don't loop.
function MiniConcept() {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-2.5 py-1.5 text-amber-200 font-semibold">Queue</span>
      <span className="text-zinc-500">= stores messages until a consumer acks</span>
    </div>
  );
}

function MiniWorkflow() {
  return (
    <ol className="flex flex-wrap justify-center gap-1" aria-label="The 7-step interview workflow">
      {WORKFLOW.map((w, i) => (
        <li key={w.id} className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-1.5 py-0.5 text-[9.5px] text-amber-100" title={w.label}>
          <span className="font-mono text-amber-400 mr-0.5">{i + 1}</span>
          {w.label.split(" ")[0]}
        </li>
      ))}
    </ol>
  );
}

function MiniCanvas() {
  const node = "rounded-md border-2 px-2 py-1 text-[10px] font-semibold text-white";
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn(node, CATEGORY_COLORS.Networking.border, CATEGORY_COLORS.Networking.bg)}>LB</span>
      <span className="h-px w-4 bg-indigo-500" />
      <span className={cn(node, CATEGORY_COLORS.Compute.border, CATEGORY_COLORS.Compute.bg)}>App</span>
      <span className="h-px w-4 bg-indigo-500" />
      <span className={cn(node, CATEGORY_COLORS.Storage.border, CATEGORY_COLORS.Storage.bg)}>DB</span>
      <span className="ml-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-300">✓ scored</span>
    </div>
  );
}
