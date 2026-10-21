"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, PenTool, Zap } from "lucide-react";
import {
  LEARN_PROGRESS_KEY,
  PREP_PROGRESS_KEY,
  PROGRESS_EVENT,
  SIMULATOR_STORAGE_KEY,
  parseLearnProgress,
  parsePrepProgress,
  parseSimulatorProgress,
} from "@/lib/learn/progress";
import { PREP_PLANS } from "@/lib/learn/curriculum/prep";

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

/**
 * Goal-gradient: returning visitors get a one-click way back to what they
 * actually started. Renders nothing for first-time visitors, on the server,
 * or when storage is unavailable — never fake progress.
 */
export function ContinueChip() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, () => "");
  const { learn, sim, prep } = useMemo(() => {
    if (!snapshot) return { learn: null, sim: null, prep: null };
    const [l, s, p] = JSON.parse(snapshot) as [string | null, string | null, string | null];
    const progress = parsePrepProgress(p);
    let prep: { horizon: 1 | 3 | 7; label: string; done: number; total: number } | null = null;
    if (progress.last) {
      const plan = PREP_PLANS[progress.last];
      const essential = plan.days.flatMap((d) => d.tasks).filter((t) => t.essential);
      const doneIds = new Set(progress.done[String(progress.last) as "1" | "3" | "7"] ?? []);
      prep = { horizon: progress.last, label: plan.label, done: essential.filter((t) => doneIds.has(t.id)).length, total: essential.length };
    }
    // At most two chips: an active prep plan takes priority over chapter progress.
    return { learn: prep ? null : parseLearnProgress(l), sim: parseSimulatorProgress(s), prep };
  }, [snapshot]);

  if (!learn && !sim && !prep) return null;

  const chip =
    "group inline-flex items-center gap-2 max-w-full rounded-full border px-3.5 py-1.5 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

  return (
    <div data-continue className="mb-4 flex flex-wrap justify-center gap-2" role="group" aria-label="Continue where you left off">
      {prep && (
        <Link href={`/learn/interview-prep?days=${prep.horizon}`} className={`${chip} border-amber-500/30 bg-amber-500/[0.06] text-zinc-300 hover:border-amber-500/60`}>
          <Zap size={13} className="text-amber-400 shrink-0" />
          <span className="truncate">
            Continue your <strong className="text-white font-semibold">{prep.label} interview plan</strong>
            <span className="text-zinc-500">
              {" "}
              · {prep.done}/{prep.total} essentials done
            </span>
          </span>
          <ArrowRight size={13} className="shrink-0 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
      {learn && (
        <Link href={`/learn/${learn.course}#${learn.chapterId}`} className={`${chip} border-amber-500/30 bg-amber-500/[0.06] text-zinc-300 hover:border-amber-500/60`}>
          <BookOpen size={13} className="text-amber-400 shrink-0" />
          <span className="truncate">
            Continue learning <strong className="text-white font-semibold">{learn.courseTitle}</strong>
            <span className="text-zinc-500">
              {" "}
              · Ch {learn.chapterNumber} of {learn.totalChapters}
            </span>
          </span>
          <ArrowRight size={13} className="shrink-0 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
      {sim && (
        <Link href="/simulator" className={`${chip} border-indigo-500/30 bg-indigo-500/[0.06] text-zinc-300 hover:border-indigo-500/60`}>
          <PenTool size={13} className="text-indigo-300 shrink-0" />
          <span className="truncate">
            Continue practising{" "}
            <strong className="text-white font-semibold">{sim.problemName ?? "your design"}</strong>
            {sim.componentCount > 0 && (
              <span className="text-zinc-500">
                {" "}
                · {sim.componentCount} component{sim.componentCount === 1 ? "" : "s"} on canvas
              </span>
            )}
          </span>
          <ArrowRight size={13} className="shrink-0 text-indigo-300 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}
