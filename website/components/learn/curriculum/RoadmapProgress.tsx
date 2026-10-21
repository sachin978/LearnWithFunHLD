"use client";

import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLearningState } from "@/lib/learn/learning-state";
import { lessonStatus, nextRoadmapLesson } from "@/lib/learn/next-steps";
import type { RoadmapLesson } from "@/lib/learn/curriculum/roadmap";

const TONE = {
  zinc: "border-border text-zinc-400",
  emerald: "border-emerald-500/30 text-emerald-300",
  amber: "border-amber-500/30 text-amber-300",
  rose: "border-rose-500/30 text-rose-300",
  indigo: "border-indigo-500/30 text-indigo-300",
} as const;

/** A small badge describing what the learner has done with a lesson (opened, self-test result, steps attempted). */
export function LessonStatusBadge({ lesson }: { lesson: RoadmapLesson }) {
  const learning = useLearningState();
  const status = lessonStatus(lesson, learning);
  if (!status) return null;
  return <span className={cn("shrink-0 self-center rounded border px-1.5 py-0.5 text-[10px]", TONE[status.tone])}>{status.label}</span>;
}

/** Once the learner has started, points to the first available lesson they haven't opened. */
export function NextLessonBanner() {
  const learning = useLearningState();
  const started = Object.values(learning.briefs).some((b) => b.openedAt) || Object.values(learning.designs).some((d) => d.openedAt);
  if (!started) return null;
  const next = nextRoadmapLesson(learning);
  if (!next?.lesson.href) {
    return (
      <p className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-200">
        You&apos;ve opened every available lesson. Keep it fresh with{" "}
        <Link href="/learn/review" className="underline underline-offset-2">
          spaced review
        </Link>{" "}
        and a timed mock in the simulator.
      </p>
    );
  }
  return (
    <Link
      href={next.lesson.href}
      className="group mt-6 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-3 text-sm text-zinc-200 hover:border-emerald-500/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
    >
      <Compass size={18} className="text-emerald-400 shrink-0" />
      <span className="flex-1">
        <span className="block text-xs text-emerald-300">Your next lesson · Stage {next.stage.number}</span>
        <span className="font-semibold text-white">{next.lesson.title}</span>
      </span>
      <ArrowRight size={16} className="text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}
