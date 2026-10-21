import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, MessageSquare, PenTool, Lightbulb, ListChecks, CheckCircle2 } from "lucide-react";
import { SiteFooter } from "@/components/ui/site-footer";
import { LearnTopNav } from "@/components/learn/LearnTopNav";
import { RichText } from "@/components/learn/RichText";
import { DESIGNS, briefHref, designHref, designShortTitle, getBrief, getDesign, nextDesign } from "@/lib/learn/curriculum";
import { WORKFLOW } from "@/lib/learn/curriculum/types";
import { DesignProgress, DesignStepCard } from "@/components/learn/curriculum/DesignStepCard";
import { TrackVisit } from "@/components/learn/curriculum/TrackVisit";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return DESIGNS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = getDesign(slug);
  return d ? { title: `${d.title} — Design walkthrough | WireUp System`, description: d.summary } : {};
}

const LEVEL_STYLE = {
  Beginner: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  Intermediate: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  Advanced: "border-rose-500/30 bg-rose-500/10 text-rose-300",
} as const;

/**
 * Practise communicating, not just reading: every step asks the learner to
 * answer first, then reveals a model answer with coaching on what made it
 * strong and how an interviewer might push back. We don't grade free text —
 * the model answer is for honest self-comparison.
 */
export default async function DesignWalkthroughPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = getDesign(slug);
  if (!d) notFound();
  const concepts = d.concepts.map(getBrief).filter((b) => b !== undefined);
  const next = nextDesign(d.slug);
  const label = (id: string) => WORKFLOW.find((w) => w.id === id)?.label ?? id;

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <TrackVisit kind="design" slug={d.slug} />
      <LearnTopNav crumb={{ label: designShortTitle(d), href: designHref(d.slug) }} />

      <main className="max-w-4xl mx-auto px-4 pt-8 space-y-10">
        <header>
          <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
            <Link href="/learn/roadmap#designs" className="inline-flex items-center gap-1 text-zinc-400 hover:text-white">
              <ArrowLeft size={13} /> All design problems
            </Link>
            <span className={cn("px-2 py-0.5 rounded-full border font-semibold", LEVEL_STYLE[d.level])}>{d.level}</span>
            <span className="flex items-center gap-1 text-zinc-500">
              <Clock size={12} /> ~{d.minutes} min
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{d.title}</h1>
              <p className="mt-3 text-zinc-400 text-lg">{d.summary}</p>
            </div>
            <DesignProgress designSlug={d.slug} />
          </div>
          <p className="mt-4 flex items-start gap-2 text-sm text-zinc-200">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <span className="text-zinc-400">After this walkthrough you can: </span>
              {d.outcome}
            </span>
          </p>

          <div className="mt-5 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Concepts this design uses</p>
            <div className="flex flex-wrap gap-2">
              {concepts.map((c) => (
                <Link key={c.slug} href={briefHref(c.slug)} className="text-xs rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-2.5 py-1.5 text-amber-200 hover:border-amber-500/60">
                  {c.shortTitle}
                </Link>
              ))}
            </div>
          </div>

          <p className="mt-4 flex items-start gap-2 text-sm text-zinc-400">
            <Lightbulb size={16} className="text-amber-400 shrink-0 mt-0.5" />
            How to use this: for each step, answer out loud or in the notes box first — as you would in the interview — then reveal the model answer, read the coaching and compare. Concepts you&apos;re unsure about link above.
          </p>
        </header>

        <nav aria-label="Interview workflow" className="overflow-x-auto -mx-4 px-4">
          <ol className="flex gap-2 min-w-max">
            {d.steps.map((s, i) => (
              <li key={s.id}>
                <a href={`#step-${s.id}`} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-zinc-300 hover:border-indigo-500/50 hover:text-white">
                  <span className="font-mono text-indigo-300">{i + 1}</span> {label(s.id)}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <ol className="space-y-5">
          {d.steps.map((st, i) => (
            <DesignStepCard key={st.id} designSlug={d.slug} step={st} index={i} />
          ))}
        </ol>

        <section aria-labelledby="wrap-up" className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5">
          <h2 id="wrap-up" className="flex items-center gap-2 text-lg font-semibold text-white mb-1">
            <ListChecks size={17} className="text-emerald-400" /> The 60-second wrap-up
          </h2>
          <p className="text-xs text-zinc-500 mb-3">How you might summarise this design at the end of the interview — practise saying it out loud.</p>
          <ul className="space-y-1.5">
            {d.wrapUp.map((w, i) => (
              <li key={i} className="flex gap-2 text-sm text-zinc-200">
                <span className="text-emerald-400" aria-hidden>
                  ✓
                </span>
                <RichText text={w} />
              </li>
            ))}
          </ul>
        </section>

        <section id="follow-ups" aria-labelledby="fu" className="scroll-mt-20">
          <h2 id="fu" className="flex items-center gap-2 text-lg font-semibold text-white mb-3">
            <MessageSquare size={17} className="text-indigo-400" /> Follow-up questions interviewers ask
          </h2>
          <div className="space-y-2">
            {d.followUps.map((q, i) => (
              <details key={i} className="group rounded-xl border border-border bg-card open:border-indigo-500/30">
                <summary className="cursor-pointer list-none flex items-start gap-3 px-4 py-3 text-sm font-medium text-zinc-100 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 [&::-webkit-details-marker]:hidden">
                  <span className="text-indigo-400 font-mono text-xs mt-0.5">Q{i + 1}</span>
                  <span className="flex-1">{q.q}</span>
                  <span className="text-zinc-500 text-xs transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="px-4 pb-4 pl-11 text-sm text-zinc-300">
                  <RichText text={q.short} />
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2" aria-label="Next steps">
          {d.simulatorProblem && (
            <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.05] p-5 flex flex-col">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
                <PenTool size={15} className="text-indigo-300" /> Now build it
              </h2>
              <p className="text-sm text-zinc-400 mb-4">
                Open the simulator and choose <strong className="text-white">{d.simulatorProblem}</strong> from the Problems tab. Drag in the components, run a load simulation and check your score.
              </p>
              <Link href="/simulator" className="mt-auto inline-flex items-center justify-between gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-3 text-sm transition">
                Open the simulator <ArrowRight size={16} />
              </Link>
            </div>
          )}
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-white mb-1">Next design</h2>
            {next ? (
              <>
                <p className="text-sm text-zinc-400 mb-4">
                  {next.level} · ~{next.minutes} min — {next.summary}
                </p>
                <Link href={designHref(next.slug)} className="mt-auto inline-flex items-center justify-between gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-4 py-3 text-sm transition">
                  {next.title} <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-400 mb-4">That&apos;s the last walkthrough. Try a problem you haven&apos;t seen in the simulator&apos;s timed Practice Interview mode.</p>
                <Link href="/simulator" className="mt-auto inline-flex items-center justify-between gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-4 py-3 text-sm transition">
                  Start a timed mock <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
