"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Layers, ListChecks, PenTool, Repeat, Timer, Zap } from "lucide-react";
import { useLearningState } from "@/lib/learn/learning-state";
import { LEARN_PROGRESS_KEY, PREP_PROGRESS_KEY, PROGRESS_EVENT, parseLearnProgress, parsePrepProgress } from "@/lib/learn/progress";
import { computeNextSteps, type NextStep } from "@/lib/learn/next-steps";
import { courseProgress, designCompletion } from "@/lib/learn/completion";
import { DESIGNS } from "@/lib/learn/curriculum";
import { PREP_PLANS } from "@/lib/learn/curriculum/prep";
import { deckStatus } from "@/lib/learn/review";
import { cn } from "@/lib/utils";
import { ProgressRing } from "./LessonProgress";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(PROGRESS_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(PROGRESS_EVENT, cb);
  };
}

function snapshot(): string {
  try {
    return JSON.stringify([localStorage.getItem(PREP_PROGRESS_KEY), localStorage.getItem(LEARN_PROGRESS_KEY)]);
  } catch {
    return "";
  }
}

const ICON: Record<NextStep["kind"], typeof BookOpen> = {
  prep: Zap,
  revisit: Brain,
  review: Repeat,
  lesson: BookOpen,
  design: PenTool,
  quiz: ListChecks,
  course: Layers,
  mock: Timer,
};

interface Meter {
  label: string;
  value: string;
  sub: string;
  href: string;
  done?: number;
  total?: number;
}

function MeterTile({ m }: { m: Meter }) {
  return (
    <li>
      <Link href={m.href} className="flex h-full items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 hover:border-zinc-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
        {m.total !== undefined && m.done !== undefined ? (
          <ProgressRing done={m.done} total={m.total} size={42} />
        ) : (
          <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10 font-mono text-sm text-indigo-200">{m.value}</span>
        )}
        <span className="min-w-0">
          <span className="block text-xs text-zinc-500">{m.label}</span>
          <span className="block text-sm font-semibold text-white leading-snug">{m.total !== undefined ? m.value : m.sub}</span>
          {m.total !== undefined && <span className="block text-[11px] text-zinc-400 truncate">{m.sub}</span>}
        </span>
      </Link>
    </li>
  );
}

/**
 * "Your progress": one completion meter per path, then up to three next
 * actions — all computed from what the learner has actually done. Renders
 * nothing for first-time visitors.
 */
export function NextStepsPanel() {
  const learning = useLearningState();
  const raw = useSyncExternalStore(subscribe, snapshot, () => "");
  const { steps, prep, learn } = useMemo(() => {
    const [prepRaw, courseRaw] = raw ? (JSON.parse(raw) as [string | null, string | null]) : [null, null];
    const prep = parsePrepProgress(prepRaw);
    const learn = parseLearnProgress(courseRaw);
    return { steps: computeNextSteps(learning, prep, learn).slice(0, 3), prep, learn };
  }, [learning, raw]);

  const cp = courseProgress(learning);
  const designsDone = DESIGNS.filter((d) => designCompletion(learning.designs[d.slug]).complete).length;
  const designsStarted = DESIGNS.some((d) => designCompletion(learning.designs[d.slug]).started);
  const deck = deckStatus(learning.review);
  const inRotation = Object.keys(learning.review).length;
  const plan = prep.last ? PREP_PLANS[prep.last] : null;
  const essentials = plan ? plan.days.flatMap((d) => d.tasks).filter((t) => t.essential) : [];
  const doneIds = new Set(prep.last ? (prep.done[String(prep.last) as "1" | "3" | "7"] ?? []) : []);
  const essentialsDone = essentials.filter((t) => doneIds.has(t.id)).length;

  const active = cp.started || designsStarted || Boolean(learn) || Boolean(plan) || inRotation > 0 || steps.length > 0;
  if (!active) return null;

  const meters: Meter[] = [
    {
      label: "Learn In Depth",
      value: `${cp.done}/${cp.total} lessons`,
      sub: cp.current ? `Stage ${cp.current.stage.number}: ${cp.current.stage.title}` : "Every stage complete",
      href: cp.current ? `/learn/roadmap#${cp.current.stage.id}` : "/learn/roadmap",
      done: cp.done,
      total: cp.total,
    },
    plan
      ? { label: "Interview prep", value: `${essentialsDone}/${essentials.length} essentials`, sub: `${plan.label} plan`, href: `/learn/interview-prep?days=${plan.horizon}`, done: essentialsDone, total: essentials.length }
      : { label: "Interview prep", value: "—", sub: "Pick a 1, 3 or 7-day plan", href: "/learn/interview-prep" },
    { label: "Design problems", value: `${designsDone}/${DESIGNS.length} designs`, sub: "Complete when every step is attempted", href: "/learn#topics", done: designsDone, total: DESIGNS.length },
    { label: "Spaced review", value: String(deck.due.length), sub: deck.due.length ? `${deck.due.length} card${deck.due.length === 1 ? "" : "s"} due now` : inRotation ? `${inRotation} cards in rotation` : "Not started yet", href: "/learn/review" },
  ];

  return (
    <section aria-labelledby="your-progress" className="rounded-3xl border border-indigo-500/25 bg-indigo-500/[0.04] p-5 sm:p-6 space-y-5">
      <div>
        <h2 id="your-progress" className="text-lg font-semibold text-white">
          Your progress
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">Based on what you&apos;ve done in this browser.</p>
      </div>
      <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {meters.map((m) => (
          <MeterTile key={m.label} m={m} />
        ))}
      </ul>
      {steps.length > 0 && (
        <div aria-labelledby="next-steps" role="region">
          <h3 id="next-steps" className="text-sm font-semibold text-white mb-3">
            Pick up where you left off
          </h3>
          <ul className={cn("grid gap-3", steps.length > 1 && "md:grid-cols-3")}>
            {steps.map((s) => {
              const Icon = ICON[s.kind];
              return (
                <li key={s.id}>
                  <Link
                    href={s.href}
                    className="group flex h-full flex-col rounded-2xl border border-border bg-card p-4 hover:border-indigo-500/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Icon size={15} className="text-indigo-300 shrink-0" />
                      {s.title}
                    </span>
                    <span className="mt-1.5 flex-1 text-xs text-zinc-400 leading-relaxed">{s.detail}</span>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-300">
                      {s.cta} <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
