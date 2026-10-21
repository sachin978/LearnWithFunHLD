import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Eye, MessageSquare, PenTool, Lightbulb } from "lucide-react";
import { SiteFooter } from "@/components/ui/site-footer";
import { LearnTopNav } from "@/components/learn/LearnTopNav";
import { RichText } from "@/components/learn/RichText";
import { DESIGNS, briefHref, designHref, designShortTitle, getBrief, getDesign, nextDesign } from "@/lib/learn/curriculum";
import { WORKFLOW } from "@/lib/learn/curriculum/types";
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
 * answer first, then reveals a model answer (native <details>, no JS). We
 * don't grade free-text answers — the model answer is for self-comparison.
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
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{d.title}</h1>
          <p className="mt-3 text-zinc-400 text-lg">{d.summary}</p>

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
            How to use this: for each step, answer out loud or on paper first — as you would in the interview — then reveal the model answer and compare.
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
          {d.steps.map((s, i) => (
            <li key={s.id} id={`step-${s.id}`} className="scroll-mt-20 rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-3 text-white font-semibold mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-mono">{i + 1}</span>
                {label(s.id)}
              </h2>
              <p className="rounded-xl border border-amber-500/25 bg-amber-500/[0.05] px-3 py-2.5 text-sm text-zinc-200 mb-3">
                <span className="font-semibold text-amber-300">Your turn: </span>
                <RichText text={s.prompt} />
              </p>
              <details className="group">
                <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:border-indigo-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 [&::-webkit-details-marker]:hidden">
                  <Eye size={13} /> <span className="group-open:hidden">Reveal a model answer</span>
                  <span className="hidden group-open:inline">Hide model answer</span>
                </summary>
                <ul className="mt-3 space-y-2">
                  {s.answer.map((a, ai) => (
                    <li key={ai} className="relative pl-4 text-sm text-zinc-300 leading-relaxed before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-indigo-400/70">
                      <RichText text={a} />
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ol>

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
