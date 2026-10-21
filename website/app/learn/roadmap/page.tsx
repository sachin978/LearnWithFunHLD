import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, Layers, PenTool, Target, Compass, CheckCircle2 } from "lucide-react";
import { SiteFooter } from "@/components/ui/site-footer";
import { LearnTopNav } from "@/components/learn/LearnTopNav";
import { LessonStatusBadge, NextLessonBanner } from "@/components/learn/curriculum/RoadmapProgress";
import { ROADMAP, LESSON_KIND_LABEL, stageTitle, type LessonKind } from "@/lib/learn/curriculum/roadmap";
import { getDesign } from "@/lib/learn/curriculum";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Learn In Depth — the system design roadmap | WireUp System",
  description:
    "A 12-stage, beginner-friendly system design roadmap: web fundamentals, databases, caching, scaling, messaging, reliability, observability, security, interview methodology and end-to-end designs.",
};

const KIND_STYLE: Record<LessonKind, { cls: string; icon: typeof BookOpen }> = {
  course: { cls: "border-amber-500/40 bg-amber-500/10 text-amber-300", icon: Layers },
  brief: { cls: "border-indigo-500/35 bg-indigo-500/10 text-indigo-300", icon: BookOpen },
  design: { cls: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300", icon: PenTool },
  simulator: { cls: "border-sky-500/35 bg-sky-500/10 text-sky-300", icon: Target },
  planned: { cls: "border-border text-zinc-500", icon: Clock3 },
};

const LEVEL_STYLE = {
  Beginner: "text-emerald-300",
  Intermediate: "text-amber-300",
  Advanced: "text-rose-300",
} as const;

const all = ROADMAP.flatMap((s) => s.lessons);
const available = all.filter((l) => l.kind !== "planned").length;
const usedKinds = (Object.keys(LESSON_KIND_LABEL) as LessonKind[]).filter((k) => all.some((l) => l.kind === k));

export default function RoadmapPage() {
  const firstLesson = ROADMAP[0].lessons.find((l) => l.href);

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <LearnTopNav crumb={{ label: "Learn In Depth", href: "/learn/roadmap" }} />

      <header className="relative px-4 pt-10 pb-8 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.09),transparent_55%)]" />
        <div className="relative max-w-6xl mx-auto">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3">
            <Compass size={13} /> Learn In Depth
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">Build fundamentals that last.</h1>
          <p className="mt-4 text-zinc-400 text-lg max-w-2xl">
            Understand the building blocks behind scalable systems, learn when to use each one, and develop the reasoning to handle unfamiliar interview questions.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {firstLesson?.href && (
              <Link href={firstLesson.href} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold px-5 py-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
                Start Stage 1 <ArrowRight size={16} />
              </Link>
            )}
            <Link href="/learn/interview-prep" className="text-sm text-zinc-400 hover:text-white">
              Short on time? Rapid Interview Prep →
            </Link>
          </div>
          <NextLessonBanner />
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500" aria-label="Legend">
            {usedKinds.map((k) => {
              const S = KIND_STYLE[k];
              return (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-md border", S.cls)}>
                    <S.icon size={11} />
                  </span>
                  {LESSON_KIND_LABEL[k]}
                </span>
              );
            })}
            <span className="text-zinc-600">
              · {available} of {all.length} topics covered today · related topics share one brief, named on each card · badges show what you&apos;ve done in this browser
            </span>
          </div>
        </div>
      </header>

      <div className="px-4">
        <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
          <nav aria-label="Stages" className="hidden lg:block sticky top-20 self-start">
            <ol className="space-y-0.5 text-sm">
              {ROADMAP.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900">
                    <span className="font-mono text-[11px] text-zinc-600 w-5">{String(s.number).padStart(2, "0")}</span>
                    <span className="truncate">{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <main>
            <ol className="relative border-l border-border ml-3 space-y-10">
              {ROADMAP.map((s) => {
                const ready = s.lessons.filter((l) => l.kind !== "planned").length;
                return (
                  <li key={s.id} id={s.id} className="scroll-mt-20 pl-7 relative">
                    <span
                      className={cn(
                        "absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-mono bg-background",
                        ready ? "border-emerald-500/50 text-emerald-300" : "border-border text-zinc-500",
                      )}
                    >
                      {s.number}
                    </span>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="text-lg font-semibold text-white">{s.title}</h2>
                      <span className="text-xs text-zinc-500">
                        {ready}/{s.lessons.length} topics covered
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400">{s.goal}</p>

                    <div className="mt-3 grid gap-3 md:grid-cols-[1.3fr_1fr] text-sm">
                      <p className="text-zinc-300 leading-relaxed">
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 mr-1.5">Why it matters</span>
                        {s.whyItMatters}
                      </p>
                      <div className="text-xs text-zinc-400 space-y-1.5">
                        <p>
                          <span className="font-semibold text-zinc-300">Builds on: </span>
                          {s.prerequisites.length ? (
                            s.prerequisites.map((n, i) => {
                              const target = ROADMAP.find((x) => x.number === n);
                              return (
                                <span key={n}>
                                  {i > 0 && ", "}
                                  <a href={`#${target?.id}`} className="text-indigo-300 hover:text-indigo-200">
                                    {n}. {stageTitle(n)}
                                  </a>
                                </span>
                              );
                            })
                          ) : (
                            "nothing — start here anytime"
                          )}
                        </p>
                        <div>
                          <p className="font-semibold text-zinc-300">Afterwards you can:</p>
                          <ul className="mt-0.5 space-y-0.5">
                            {s.outcomes.map((o) => (
                              <li key={o} className="flex gap-1.5">
                                <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-400" />
                                {o}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {s.id === "messaging" && (
                      <Link href="/learn/rabbitmq" className="mt-3 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2.5 text-sm text-zinc-300 hover:border-amber-500/60">
                        <Layers size={16} className="text-amber-400 shrink-0" />
                        <span className="flex-1">
                          <strong className="text-white">Interactive course: RabbitMQ, visually</strong> — 12 animated chapters covering this whole stage.
                        </span>
                        <ArrowRight size={15} className="text-amber-400" />
                      </Link>
                    )}

                    <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                      {s.lessons.map((l, i) => {
                        const S = KIND_STYLE[l.kind];
                        const designLevel = l.kind === "design" && l.href ? getDesign(l.href.split("/").pop() ?? "")?.level : undefined;
                        const body = (
                          <>
                            <span className={cn("inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border", S.cls)} title={LESSON_KIND_LABEL[l.kind]}>
                              <S.icon size={12} />
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className={cn("block text-sm leading-snug", l.kind === "planned" ? "text-zinc-500" : "text-zinc-200")}>{l.title}</span>
                              <span className="block text-[11px] text-zinc-600">
                                {designLevel && <span className={cn("mr-1.5", LEVEL_STYLE[designLevel])}>{designLevel}</span>}
                                {!designLevel && l.level === "advanced" && <span className="mr-1.5 text-violet-300">Advanced</span>}
                                {LESSON_KIND_LABEL[l.kind]}
                                {l.source && <span className="text-zinc-500"> · {l.source}</span>}
                              </span>
                            </span>
                            {l.href && <LessonStatusBadge lesson={l} />}
                          </>
                        );
                        return (
                          <li key={i}>
                            {l.href ? (
                              <Link href={l.href} className="flex items-start gap-2.5 rounded-lg border border-border/70 bg-card px-2.5 py-2 hover:border-zinc-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                                {body}
                              </Link>
                            ) : (
                              <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-border/70 px-2.5 py-2" aria-label={`${l.title} (planned, not available yet)`}>
                                {body}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ol>
          </main>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
