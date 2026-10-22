"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, PenTool, Repeat, Zap } from "lucide-react";
import { useLearningState } from "@/lib/learn/learning-state";
import { LEARN_PROGRESS_KEY, PREP_PROGRESS_KEY, PROGRESS_EVENT, SIMULATOR_STORAGE_KEY, parseLearnProgress, parsePrepProgress, parseSimulatorProgress } from "@/lib/learn/progress";
import { PREP_PLANS } from "@/lib/learn/curriculum/prep";
import { courseProgress, nextIncompleteLesson } from "@/lib/learn/completion";
import { deckStatus } from "@/lib/learn/review";
import { ProgressRing } from "@/components/learn/curriculum/LessonProgress";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(PROGRESS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(PROGRESS_EVENT, onChange);
  };
}

function readSnapshot(): string {
  try {
    return JSON.stringify([localStorage.getItem(LEARN_PROGRESS_KEY), localStorage.getItem(SIMULATOR_STORAGE_KEY), localStorage.getItem(PREP_PROGRESS_KEY)]);
  } catch {
    return "";
  }
}

const row =
  "group flex items-center gap-3 rounded-xl border border-border bg-background/50 px-3 py-2.5 hover:border-zinc-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

/**
 * Returning learners see their real progress first (goal-gradient), with a
 * one-click way back into each thing they started. Renders nothing for
 * first-time visitors, on the server, or without storage.
 */
export function HomeResume() {
  const learning = useLearningState();
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, () => "");
  const { prep, sim, course } = useMemo(() => {
    if (!snapshot) return { prep: null, sim: null, course: null };
    const [l, s, p] = JSON.parse(snapshot) as [string | null, string | null, string | null];
    const progress = parsePrepProgress(p);
    let prep: { horizon: 1 | 3 | 7; label: string; done: number; total: number } | null = null;
    if (progress.last) {
      const plan = PREP_PLANS[progress.last];
      const essential = plan.days.flatMap((d) => d.tasks).filter((t) => t.essential);
      const doneIds = new Set(progress.done[String(progress.last) as "1" | "3" | "7"] ?? []);
      prep = { horizon: progress.last, label: plan.label, done: essential.filter((t) => doneIds.has(t.id)).length, total: essential.length };
    }
    return { prep, sim: parseSimulatorProgress(s), course: parseLearnProgress(l) };
  }, [snapshot]);

  const cp = courseProgress(learning);
  const next = nextIncompleteLesson(learning);
  const due = deckStatus(learning.review).due.length;
  if (!cp.started && !prep && !sim && !course && due === 0) return null;

  return (
    <section aria-labelledby="welcome-back" className="mb-4 rounded-3xl border border-emerald-500/25 bg-emerald-500/[0.04] p-4 sm:p-5">
      <h2 id="welcome-back" className="text-lg font-semibold text-white">
        Welcome back
      </h2>
      <p className="text-xs text-zinc-500 mt-0.5 mb-3">Pick up right where you stopped.</p>
      <ul className="grid gap-2">
        {cp.started && next?.lesson.href && (
          <li>
            <Link href={next.lesson.href} className={row}>
              <ProgressRing done={cp.done} total={cp.total} size={38} />
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] text-zinc-500">
                  Learn In Depth · {cp.done} of {cp.total} lessons complete
                </span>
                <span className="block text-sm font-semibold text-white truncate">
                  {next.completion.started ? "Continue" : "Next"}: {next.lesson.title}
                </span>
              </span>
              <ArrowRight size={15} className="shrink-0 text-emerald-300 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </li>
        )}
        {prep && (
          <li>
            <Link href={`/learn/interview-prep?days=${prep.horizon}`} className={row}>
              <ProgressRing done={prep.done} total={prep.total} size={38} />
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] text-zinc-500">
                  <Zap size={11} className="inline -mt-0.5 mr-1 text-amber-400" />
                  Interview prep · {prep.done} of {prep.total} must-do tasks done
                </span>
                <span className="block text-sm font-semibold text-white truncate">Continue your {prep.label} plan</span>
              </span>
              <ArrowRight size={15} className="shrink-0 text-amber-300 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </li>
        )}
        {course && course.chapterNumber < course.totalChapters && (
          <li>
            <Link href={`/learn/${course.course}#${course.chapterId}`} className={row}>
              <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-amber-500/30 font-mono text-[10px] text-amber-200">
                {course.chapterNumber}/{course.totalChapters}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] text-zinc-500">Deep-dive course</span>
                <span className="block text-sm font-semibold text-white truncate">Continue {course.courseTitle}</span>
              </span>
              <ArrowRight size={15} className="shrink-0 text-amber-300 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </li>
        )}
        {sim && (
          <li>
            <Link href="/simulator" className={row}>
              <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10">
                <PenTool size={15} className="text-indigo-300" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] text-zinc-500">
                  Simulator{sim.componentCount > 0 ? ` · ${sim.componentCount} component${sim.componentCount === 1 ? "" : "s"} on the canvas` : ""}
                </span>
                <span className="block text-sm font-semibold text-white truncate">Continue {sim.problemName ?? "your design"}</span>
              </span>
              <ArrowRight size={15} className="shrink-0 text-indigo-300 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </li>
        )}
        {due > 0 && (
          <li>
            <Link href="/learn/review" className={row}>
              <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10">
                <Repeat size={15} className="text-indigo-300" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] text-zinc-500">Spaced review</span>
                <span className="block text-sm font-semibold text-white">
                  {due} card{due === 1 ? "" : "s"} due today
                </span>
              </span>
              <ArrowRight size={15} className="shrink-0 text-indigo-300 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </li>
        )}
      </ul>
    </section>
  );
}
