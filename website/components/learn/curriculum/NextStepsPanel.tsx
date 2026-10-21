"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Layers, ListChecks, PenTool, Repeat, Timer, Zap } from "lucide-react";
import { useLearningState } from "@/lib/learn/learning-state";
import { LEARN_PROGRESS_KEY, PREP_PROGRESS_KEY, PROGRESS_EVENT, parseLearnProgress, parsePrepProgress } from "@/lib/learn/progress";
import { computeNextSteps, type NextStep } from "@/lib/learn/next-steps";

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
  design: PenTool,
  quiz: ListChecks,
  course: Layers,
  mock: Timer,
};

/**
 * "Pick up where you left off": up to three next actions computed from what
 * the learner has actually done. Renders nothing for first-time visitors.
 */
export function NextStepsPanel() {
  const learning = useLearningState();
  const raw = useSyncExternalStore(subscribe, snapshot, () => "");
  const steps = useMemo(() => {
    if (!raw) return [];
    const [prepRaw, courseRaw] = JSON.parse(raw) as [string | null, string | null];
    return computeNextSteps(learning, parsePrepProgress(prepRaw), parseLearnProgress(courseRaw)).slice(0, 3);
  }, [learning, raw]);

  if (steps.length === 0) return null;

  return (
    <section aria-labelledby="next-steps" className="rounded-3xl border border-indigo-500/25 bg-indigo-500/[0.04] p-5 sm:p-6">
      <h2 id="next-steps" className="text-lg font-semibold text-white">
        Pick up where you left off
      </h2>
      <p className="text-xs text-zinc-500 mt-0.5 mb-4">Based on what you&apos;ve done in this browser.</p>
      <ul className="grid gap-3 md:grid-cols-3">
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
    </section>
  );
}
