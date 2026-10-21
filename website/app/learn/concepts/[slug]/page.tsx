import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, Layers, ListChecks, MessageSquare, PenTool, Scale, Target, ThumbsDown, ThumbsUp, Wrench, XCircle } from "lucide-react";
import { SiteFooter } from "@/components/ui/site-footer";
import { LearnTopNav } from "@/components/learn/LearnTopNav";
import { RichText } from "@/components/learn/RichText";
import { RecallCard } from "@/components/learn/curriculum/RecallCard";
import { BriefScene } from "@/components/learn/curriculum/BriefScene";
import { BRIEFS, briefHref, designHref, designShortTitle, designsUsing, getBrief, nextBrief } from "@/lib/learn/curriculum";
import { ROADMAP } from "@/lib/learn/curriculum/roadmap";

export function generateStaticParams() {
  return BRIEFS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const b = getBrief(slug);
  return b ? { title: `${b.title} — Interview brief | WireUp System`, description: b.summary.replace(/[`*]/g, "") } : {};
}

function H({ icon: Icon, children }: { icon: React.ComponentType<{ size?: number; className?: string }>; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-3">
      <Icon size={17} className="text-indigo-400" />
      {children}
    </h2>
  );
}

const DEEPER_ICON = { course: Layers, brief: BookOpen, design: PenTool, simulator: Target } as const;

export default async function ConceptBriefPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = getBrief(slug);
  if (!b) notFound();
  const stage = ROADMAP.find((s) => s.number === b.stage);
  const prereqs = b.prerequisites.map(getBrief).filter((p) => p !== undefined);
  const apply = designsUsing(b.slug);
  const next = nextBrief(b.slug);

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <LearnTopNav crumb={{ label: b.shortTitle, href: briefHref(b.slug) }} />

      <main className="max-w-4xl mx-auto px-4 pt-8 space-y-10">
        <header>
          <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
            <Link href="/learn/roadmap" className="inline-flex items-center gap-1 text-zinc-400 hover:text-white">
              <ArrowLeft size={13} /> Roadmap
            </Link>
            {stage && (
              <Link href={`/learn/roadmap#${stage.id}`} className="px-2 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:border-indigo-500/60">
                Stage {stage.number} · {stage.title}
              </Link>
            )}
            <span className="flex items-center gap-1 text-zinc-500">
              <Clock size={12} /> {b.minutes} min
            </span>
            <span className="text-zinc-600">Interview brief</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{b.title}</h1>
          <p className="mt-3 text-zinc-400 text-lg">
            <RichText text={b.summary} />
          </p>
          {prereqs.length > 0 && (
            <p className="mt-4 text-sm text-zinc-400 rounded-xl border border-border bg-card/60 px-3 py-2">
              New to this? It helps to know{" "}
              {prereqs.map((p, i) => (
                <span key={p.slug}>
                  {i > 0 && ", "}
                  <Link href={briefHref(p.slug)} className="text-amber-300 hover:text-amber-200 underline underline-offset-2 decoration-amber-500/40">
                    {p.shortTitle}
                  </Link>
                </span>
              ))}{" "}
              first — but you can read on.
            </p>
          )}
        </header>

        <section className="grid gap-4 md:grid-cols-3" aria-label="The idea">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-rose-300/80 font-semibold mb-2">The problem</div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              <RichText text={b.problem} />
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-emerald-300/80 font-semibold mb-2">In plain English</div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              <RichText text={b.simple} />
            </p>
          </div>
          {b.analogy && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="text-[11px] uppercase tracking-wider text-sky-300/80 font-semibold mb-2">Analogy</div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                <RichText text={b.analogy} />
              </p>
            </div>
          )}
        </section>

        <section aria-labelledby="how">
          <H icon={Wrench}>
            <span id="how">How it works</span>
          </H>
          {b.sceneId && (
            <div className="mb-5">
              <BriefScene sceneId={b.sceneId} />
            </div>
          )}
          <ul className="space-y-2.5">
            {b.howItWorks.map((t, i) => (
              <li key={i} className="relative pl-4 text-sm text-zinc-300 leading-relaxed before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-indigo-400/70">
                <RichText text={t} />
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-4 md:grid-cols-2" aria-label="When to use it">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-emerald-300 mb-2">
              <CheckCircle2 size={15} /> When to use it
            </h2>
            <ul className="space-y-1.5 text-sm text-zinc-300">
              {b.whenToUse.map((t, i) => (
                <li key={i}>
                  <RichText text={t} />
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-rose-300 mb-2">
              <XCircle size={15} /> When not to
            </h2>
            <ul className="space-y-1.5 text-sm text-zinc-300">
              {b.whenNotToUse.map((t, i) => (
                <li key={i}>
                  <RichText text={t} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="tradeoffs">
          <H icon={Scale}>
            <span id="tradeoffs">Interview trade-offs</span>
          </H>
          <div className="grid gap-3 sm:grid-cols-2 mb-3">
            <ul className="rounded-xl border border-border bg-card p-4 space-y-1.5 text-sm text-zinc-300">
              <li className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">Advantages</li>
              {b.tradeoffs.pros.map((t, i) => (
                <li key={i}>+ <RichText text={t} /></li>
              ))}
            </ul>
            <ul className="rounded-xl border border-border bg-card p-4 space-y-1.5 text-sm text-zinc-300">
              <li className="text-xs font-semibold text-rose-300 uppercase tracking-wider mb-1">Costs</li>
              {b.tradeoffs.cons.map((t, i) => (
                <li key={i}>− <RichText text={t} /></li>
              ))}
            </ul>
          </div>
          <p className="rounded-xl border border-indigo-500/25 bg-indigo-500/[0.05] px-4 py-3 text-sm text-zinc-200">
            <span className="font-semibold text-indigo-300">How to decide: </span>
            <RichText text={b.tradeoffs.decide} />
          </p>
        </section>

        <section aria-labelledby="weak-strong">
          <H icon={MessageSquare}>
            <span id="weak-strong">Weak vs strong interview answers</span>
          </H>
          <div className="space-y-3">
            {b.mistakes.map((m, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-2">
                <p className="rounded-xl border border-rose-500/25 bg-rose-500/[0.04] p-3 text-sm text-zinc-300">
                  <ThumbsDown size={13} className="inline mr-1.5 text-rose-400 -mt-0.5" />
                  <RichText text={m.weak} />
                </p>
                <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-3 text-sm text-zinc-200">
                  <ThumbsUp size={13} className="inline mr-1.5 text-emerald-400 -mt-0.5" />
                  <RichText text={m.strong} />
                </p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="questions">
          <H icon={MessageSquare}>
            <span id="questions">Common interview questions</span>
          </H>
          <div className="space-y-2">
            {b.questions.map((q, i) => (
              <details key={i} className="group rounded-xl border border-border bg-card open:border-indigo-500/30">
                <summary className="cursor-pointer list-none flex items-start gap-3 px-4 py-3 text-sm font-medium text-zinc-100 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 [&::-webkit-details-marker]:hidden">
                  <span className="text-indigo-400 font-mono text-xs mt-0.5">Q{i + 1}</span>
                  <span className="flex-1">
                    <RichText text={q.q} />
                  </span>
                  <span className="text-zinc-500 text-xs transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <div className="px-4 pb-4 pl-11 space-y-2 text-sm text-zinc-300">
                  <p>
                    <RichText text={q.short} />
                  </p>
                  {q.detailed?.map((d, di) => (
                    <p key={di} className="text-zinc-400">
                      <RichText text={d} />
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="recap" className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5">
          <H icon={ListChecks}>
            <span id="recap">Quick recap</span>
          </H>
          <ul className="space-y-1.5">
            {b.recap.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm text-zinc-200">
                <span className="text-emerald-400" aria-hidden>
                  ✓
                </span>
                <RichText text={t} />
              </li>
            ))}
          </ul>
        </section>

        <RecallCard recall={b.recall} />

        <section aria-labelledby="next" className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 id="next" className="text-sm font-semibold text-white mb-3">
              Go deeper
            </h2>
            <ul className="space-y-2">
              {b.deeper.map((d) => {
                const Icon = DEEPER_ICON[d.kind];
                return (
                  <li key={d.href}>
                    <Link href={d.href} className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white">
                      <Icon size={14} className={d.kind === "course" ? "text-amber-400" : "text-indigo-300"} />
                      {d.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {apply.length > 0 && (
              <>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mt-4 mb-2">Apply it in a design</h3>
                <div className="flex flex-wrap gap-2">
                  {apply.map((d) => (
                    <Link key={d.slug} href={designHref(d.slug)} className="text-xs rounded-lg border border-indigo-500/25 bg-indigo-500/[0.06] px-2.5 py-1.5 text-indigo-200 hover:border-indigo-500/60">
                      {designShortTitle(d)}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-white mb-1">Next step</h2>
            {next ? (
              <>
                <p className="text-sm text-zinc-400 mb-4">Continue the roadmap with the next building block.</p>
                <Link href={briefHref(next.slug)} className="mt-auto inline-flex items-center justify-between gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-4 py-3 text-sm transition">
                  {next.title} <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-400 mb-4">You&apos;ve covered the core briefs. Put them together in a full design.</p>
                <Link href="/learn/designs/url-shortener" className="mt-auto inline-flex items-center justify-between gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-4 py-3 text-sm transition">
                  Design a URL shortener <ArrowRight size={16} />
                </Link>
              </>
            )}
            <Link href="/learn/interview-prep" className="mt-3 text-xs text-zinc-400 hover:text-white">
              Short on time? Back to your interview prep plan →
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
