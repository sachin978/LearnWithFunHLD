import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, Layers, ListChecks, MessageSquare, PenTool, Scale, Target, ThumbsDown, ThumbsUp, XCircle } from "lucide-react";
import { SiteFooter } from "@/components/ui/site-footer";
import { LearnTopNav } from "@/components/learn/LearnTopNav";
import { RichText } from "@/components/learn/RichText";
import { RecallCard } from "@/components/learn/curriculum/RecallCard";
import { BriefScene } from "@/components/learn/curriculum/BriefScene";
import { BriefLab } from "@/components/learn/curriculum/BriefLab";
import { ExplainCard } from "@/components/learn/curriculum/ExplainCard";
import { TrackVisit } from "@/components/learn/curriculum/TrackVisit";
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

// The learning loop every brief follows (see lib/learn/curriculum/types.ts).
const PHASES = [
  { id: "understand", label: "Understand" },
  { id: "visualize", label: "Visualize" },
  { id: "practise", label: "Practise" },
  { id: "apply", label: "Apply" },
  { id: "explain", label: "Explain" },
  { id: "recall", label: "Recall" },
] as const;

function Phase({ n, id, title, children }: { n: number; id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-32 space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3 border-b border-border pb-2">
        <span className="text-xs font-mono text-amber-400">
          {n} · {PHASES[n - 1].label}
        </span>
        <h2 id={`${id}-h`} className="text-xl font-semibold text-white">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function SubHeading({ icon: Icon, children }: { icon: React.ComponentType<{ size?: number; className?: string }>; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-base font-semibold text-white mb-3">
      <Icon size={16} className="text-indigo-400" />
      {children}
    </h3>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="relative pl-4 text-sm text-zinc-300 leading-relaxed before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-indigo-400/70">{children}</li>
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
      <TrackVisit kind="brief" slug={b.slug} />
      <LearnTopNav crumb={{ label: b.shortTitle, href: briefHref(b.slug) }} />

      <header className="max-w-4xl mx-auto px-4 pt-8">
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
            <Clock size={12} /> ~{b.minutes} min
          </span>
          <span className="text-zinc-600">Interview brief</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{b.title}</h1>
        <p className="mt-3 text-zinc-400 text-lg">
          <RichText text={b.summary} />
        </p>
        <p className="mt-4 flex items-start gap-2 text-sm text-zinc-200">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <span className="text-zinc-400">After this brief you can: </span>
            {b.outcome}
          </span>
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {prereqs.length > 0 && (
            <p className="text-zinc-400">
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
          <a href="#apply" className="text-indigo-300 hover:text-indigo-200">
            Know the basics? Skip to trade-offs →
          </a>
        </div>
      </header>

      <nav aria-label="Learning steps" className="sticky top-14 z-30 mt-6 border-y border-border bg-background/90 backdrop-blur-md">
        <ol className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto py-2">
          {PHASES.map((p, i) => (
            <li key={p.id} className="shrink-0">
              <a href={`#${p.id}`} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                <span className="font-mono text-amber-400/80">{i + 1}</span>
                {p.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <main className="max-w-4xl mx-auto px-4 pt-10 space-y-14">
        <Phase n={1} id="understand" title="The problem and the intuition">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="text-[11px] uppercase tracking-wider text-rose-300/80 font-semibold mb-2">The real-world problem</div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                <RichText text={b.problem} />
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="text-[11px] uppercase tracking-wider text-emerald-300/80 font-semibold mb-2">The intuition</div>
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
          </div>
        </Phase>

        <Phase n={2} id="visualize" title="How it works">
          {b.sceneId && <BriefScene sceneId={b.sceneId} />}
          <ul className="space-y-2.5">
            {b.howItWorks.map((t, i) => (
              <Bullet key={i}>
                <RichText text={t} />
              </Bullet>
            ))}
          </ul>
        </Phase>

        <Phase n={3} id="practise" title="A worked example">
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.03] p-5">
            <h3 className="text-base font-semibold text-white">{b.example.title}</h3>
            <p className="mt-1 text-sm text-zinc-400">
              <span className="text-zinc-500">Assumptions: </span>
              <RichText text={b.example.setup} />
            </p>
            <ol className="mt-4 space-y-2.5">
              {b.example.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-300 leading-relaxed">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 text-[11px] font-mono">{i + 1}</span>
                  <span>
                    <RichText text={s} />
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-4 rounded-xl border border-border bg-background/60 px-3 py-2 text-sm text-zinc-200">
              <span className="font-semibold text-amber-300">Takeaway: </span>
              <RichText text={b.example.takeaway} />
            </p>
          </div>
          {b.lab && <BriefLab lab={b.lab} />}
        </Phase>

        <Phase n={4} id="apply" title="When to use it, trade-offs and failure modes">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-300 mb-2">
                <CheckCircle2 size={15} /> When to use it
              </h3>
              <ul className="space-y-1.5 text-sm text-zinc-300">
                {b.whenToUse.map((t, i) => (
                  <li key={i}>
                    <RichText text={t} />
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-300 mb-2">
                <XCircle size={15} /> When not to
              </h3>
              <ul className="space-y-1.5 text-sm text-zinc-300">
                {b.whenNotToUse.map((t, i) => (
                  <li key={i}>
                    <RichText text={t} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <SubHeading icon={Scale}>Trade-offs</SubHeading>
            <div className="grid gap-3 sm:grid-cols-2 mb-3">
              <ul className="rounded-xl border border-border bg-card p-4 space-y-1.5 text-sm text-zinc-300">
                <li className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">Advantages</li>
                {b.tradeoffs.pros.map((t, i) => (
                  <li key={i}>
                    + <RichText text={t} />
                  </li>
                ))}
              </ul>
              <ul className="rounded-xl border border-border bg-card p-4 space-y-1.5 text-sm text-zinc-300">
                <li className="text-xs font-semibold text-rose-300 uppercase tracking-wider mb-1">Costs</li>
                {b.tradeoffs.cons.map((t, i) => (
                  <li key={i}>
                    − <RichText text={t} />
                  </li>
                ))}
              </ul>
            </div>
            <p className="rounded-xl border border-indigo-500/25 bg-indigo-500/[0.05] px-4 py-3 text-sm text-zinc-200">
              <span className="font-semibold text-indigo-300">How to decide: </span>
              <RichText text={b.tradeoffs.decide} />
            </p>
          </div>

          <div>
            <SubHeading icon={AlertTriangle}>Under load and partial failure</SubHeading>
            <ul className="space-y-2.5">
              {b.failureModes.map((t, i) => (
                <Bullet key={i}>
                  <RichText text={t} />
                </Bullet>
              ))}
            </ul>
          </div>

          {apply.length > 0 && (
            <div>
              <SubHeading icon={PenTool}>Where this shows up in designs</SubHeading>
              <div className="flex flex-wrap gap-2">
                {apply.map((d) => (
                  <Link key={d.slug} href={designHref(d.slug)} className="text-xs rounded-lg border border-indigo-500/25 bg-indigo-500/[0.06] px-2.5 py-1.5 text-indigo-200 hover:border-indigo-500/60">
                    {designShortTitle(d)} <span className="text-zinc-500">· {d.level}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Phase>

        <Phase n={5} id="explain" title="Explain it like an interview answer">
          <ExplainCard slug={b.slug} prompt={b.explain.prompt} keyPoints={b.explain.keyPoints} modelAnswer={b.interviewAnswer} />

          <div id="weak-vs-strong" className="scroll-mt-32">
            <SubHeading icon={MessageSquare}>Weak vs strong answers</SubHeading>
            <div className="space-y-4">
              {b.mistakes.map((m, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-2">
                  <p className="text-sm text-zinc-300">
                    <ThumbsDown size={13} className="inline mr-1.5 text-rose-400 -mt-0.5" />
                    <span className="font-semibold text-rose-300">Weak: </span>
                    <RichText text={m.weak} />
                  </p>
                  <p className="text-xs text-zinc-400 pl-5">
                    <span className="font-semibold text-zinc-300">Why it falls short: </span>
                    <RichText text={m.why} />
                  </p>
                  <p className="text-sm text-zinc-200">
                    <ThumbsUp size={13} className="inline mr-1.5 text-emerald-400 -mt-0.5" />
                    <span className="font-semibold text-emerald-300">Stronger: </span>
                    <RichText text={m.strong} />
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div id="questions" className="scroll-mt-32">
            <SubHeading icon={MessageSquare}>Follow-up questions interviewers ask</SubHeading>
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
            <p className="mt-2 text-xs text-zinc-500">
              These questions also appear in your{" "}
              <Link href="/learn/review" className="text-indigo-300 hover:text-indigo-200">
                spaced review deck
              </Link>
              .
            </p>
          </div>
        </Phase>

        <Phase n={6} id="recall" title="Check yourself and revise">
          <RecallCard recall={b.recall} slug={b.slug} />

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5">
            <SubHeading icon={ListChecks}>Quick revision</SubHeading>
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Go deeper</h3>
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
            </div>
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-5 flex flex-col">
              <h3 className="text-sm font-semibold text-white mb-1">Next step</h3>
              {next ? (
                <>
                  <p className="text-sm text-zinc-400 mb-4">Continue the roadmap with the next building block.</p>
                  <Link href={briefHref(next.slug)} className="mt-auto inline-flex items-center justify-between gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-4 py-3 text-sm transition">
                    {next.title} <ArrowRight size={16} />
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm text-zinc-400 mb-4">You&apos;ve reached the end of the core briefs. Put them together in a full design.</p>
                  <Link href="/learn/designs/url-shortener" className="mt-auto inline-flex items-center justify-between gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-4 py-3 text-sm transition">
                    Design a URL shortener <ArrowRight size={16} />
                  </Link>
                </>
              )}
              <Link href="/learn/interview-prep" className="mt-3 text-xs text-zinc-400 hover:text-white">
                Short on time? Back to your interview prep plan →
              </Link>
            </div>
          </div>
        </Phase>
      </main>

      <SiteFooter />
    </div>
  );
}
