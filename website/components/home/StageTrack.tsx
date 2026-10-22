"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLearningState } from "@/lib/learn/learning-state";
import { courseProgress } from "@/lib/learn/completion";
import { ProgressRing } from "@/components/learn/curriculum/LessonProgress";

/**
 * The 12-stage path at a glance. First-time visitors see the order; returning
 * learners see their real completion on each stage.
 */
export function StageTrack() {
  const learning = useLearningState();
  const cp = courseProgress(learning);

  return (
    <div>
      {cp.started && (
        <p className="mb-4 text-sm text-emerald-300">
          You&apos;ve completed {cp.done} of {cp.total} lessons{cp.current ? ` — you're in Stage ${cp.current.stage.number}.` : "."}
        </p>
      )}
      <ol className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {cp.stages.map((s) => {
          const isCurrent = cp.started && cp.current?.stage.number === s.stage.number;
          return (
            <li key={s.stage.id}>
              <Link
                href={`/learn/roadmap#${s.stage.id}`}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
                  isCurrent && "bg-amber-500/[0.06]",
                )}
              >
                {s.complete ? (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/50 bg-emerald-500/15 text-emerald-300">
                    <Check size={15} strokeWidth={3} aria-label="complete" />
                  </span>
                ) : s.started ? (
                  <ProgressRing done={s.done} total={s.total} size={32} />
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border font-mono text-xs text-zinc-400 group-hover:border-emerald-500/50">
                    {s.stage.number}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-zinc-100 truncate group-hover:text-white">{s.stage.title}</span>
                  <span className="block text-[11px] text-zinc-500 truncate">
                    {isCurrent ? <span className="text-amber-300">You are here · </span> : null}
                    {s.total} lesson{s.total === 1 ? "" : "s"}
                    {s.planned ? ` · ${s.planned} coming soon` : ""}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
