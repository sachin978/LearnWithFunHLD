"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Circle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { recordStepSeen, useLearningState, type LearningState } from "@/lib/learn/learning-state";
import { LESSON_STEPS, READING_STEPS, briefStepsDone, counts, lessonCompletion, stageLessons, stageProgress, type LessonStepId, type StageLesson } from "@/lib/learn/completion";
import { ROADMAP } from "@/lib/learn/curriculum/roadmap";

const STEP_TARGET: Record<LessonStepId, string> = {
  understand: "#understand",
  visualize: "#visualize",
  practise: "#practise",
  apply: "#apply",
  explain: "#explain",
  recall: "#test-yourself",
};

/** A small completion ring: `done` of `total`, with the fraction in the middle. */
export function ProgressRing({ done, total, size = 30, className }: { done: number; total: number; size?: number; className?: string }) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const f = total ? done / total : 0;
  const complete = total > 0 && done >= total;
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3} className="stroke-zinc-800" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - f)}
          className={cn("transition-[stroke-dashoffset] duration-500", complete ? "stroke-emerald-400" : "stroke-amber-400")}
        />
      </svg>
      <span className={cn("absolute font-mono font-semibold", size >= 40 ? "text-[11px]" : "text-[9px]", complete ? "text-emerald-300" : "text-zinc-200")}>
        {complete ? <Check size={size >= 40 ? 16 : 12} strokeWidth={3} /> : `${done}/${total}`}
      </span>
    </span>
  );
}

/**
 * Sticky step tracker for a brief: the six learning-loop steps with ticks for
 * the ones done, the step currently on screen, and an n/6 meter. Reading steps
 * are recorded when the learner scrolls to the end of them (a sentinel the
 * page renders after each one); Explain and Recall need their actions.
 */
export function LessonStepNav({ slug }: { slug: string }) {
  const learning = useLearningState();
  const done = briefStepsDone(learning.briefs[slug]);
  const [active, setActive] = useState<LessonStepId>("understand");
  const recorded = useRef(new Set<string>());
  const strip = useRef<HTMLOListElement>(null);

  // On narrow screens the strip scrolls sideways: keep the current step visible (horizontally only).
  useEffect(() => {
    const ol = strip.current;
    const link = ol?.querySelector<HTMLElement>(`a[href="#${active}"]`);
    if (!ol || !link) return;
    const left = link.offsetLeft - ol.offsetLeft;
    if (left < ol.scrollLeft || left + link.offsetWidth > ol.scrollLeft + ol.clientWidth) ol.scrollTo({ left: left - 16, behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    const spy = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id as LessonStepId);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const s of LESSON_STEPS) {
      const el = document.getElementById(s.id);
      if (el) spy.observe(el);
    }
    const ends = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const step = (e.target as HTMLElement).dataset.stepEnd;
        if (e.isIntersecting && step && !recorded.current.has(step)) {
          recorded.current.add(step);
          recordStepSeen(slug, step);
        }
      }
    });
    document.querySelectorAll<HTMLElement>("[data-step-end]").forEach((el) => ends.observe(el));
    return () => {
      spy.disconnect();
      ends.disconnect();
    };
  }, [slug]);

  const n = done.size;
  const total = LESSON_STEPS.length;
  const complete = n >= total;

  return (
    <nav aria-label="Lesson steps" className="sticky top-14 z-30 mt-6 border-y border-border bg-background/90 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 flex items-center gap-3">
        <ol ref={strip} className="relative flex flex-1 gap-1 overflow-x-auto py-2">
          {LESSON_STEPS.map((s, i) => {
            const isDone = done.has(s.id);
            const isActive = active === s.id;
            return (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#${s.id}`}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                    isActive ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900",
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 size={13} className="text-emerald-400" aria-label="done" />
                  ) : (
                    <span className="font-mono text-amber-400/80" aria-hidden>
                      {i + 1}
                    </span>
                  )}
                  {s.label}
                </a>
              </li>
            );
          })}
        </ol>
        <div className="flex shrink-0 items-center gap-2 py-1.5" role="status" aria-label={complete ? "Lesson complete" : `Lesson progress: ${n} of ${total} steps`}>
          <span className={cn("hidden sm:inline text-[11px]", complete ? "text-emerald-300" : "text-zinc-500")}>{complete ? "Lesson complete" : "Progress"}</span>
          <ProgressRing done={n} total={total} />
        </div>
      </div>
      <div aria-hidden className="h-0.5 bg-zinc-900">
        <div className={cn("h-full transition-all duration-500", complete ? "bg-emerald-400" : "bg-amber-400")} style={{ width: `${(n / total) * 100}%` }} />
      </div>
    </nav>
  );
}

/** Renders after each reading step; the step tracker records it when it scrolls into view. */
export function StepEnd({ step }: { step: LessonStepId }) {
  if (!READING_STEPS.includes(step)) return null;
  return <span data-step-end={step} aria-hidden className="block h-px" />;
}

/** The next available lesson after `key` in course order — skipping completed ones when progress is known. */
function lessonAfter(key: string, stageNumber: number, learning: LearningState): { stageNumber: number; lesson: StageLesson } | null {
  const order = ROADMAP.flatMap((s) => stageLessons(s).filter(counts).map((lesson) => ({ stageNumber: s.number, lesson })));
  const at = order.findIndex((o) => o.lesson.key === key && o.stageNumber === stageNumber);
  const seen = new Set<string>([key]);
  const candidates = [...order.slice(at + 1), ...order.slice(0, Math.max(0, at))];
  for (const o of candidates) {
    if (seen.has(o.lesson.key)) continue;
    seen.add(o.lesson.key);
    if (!lessonCompletion(o.lesson, learning).complete) return o;
  }
  return null;
}

/**
 * End-of-lesson panel. Until the lesson is complete it lists the steps still
 * to do; afterwards it shows stage progress and the next lesson in course order.
 */
export function LessonNextStep({ slug, lessonKey, stageNumber }: { slug: string; lessonKey: string; stageNumber: number }) {
  const learning = useLearningState();
  const done = briefStepsDone(learning.briefs[slug]);
  const remaining = LESSON_STEPS.filter((s) => !done.has(s.id));
  const complete = remaining.length === 0;
  const stage = ROADMAP.find((s) => s.number === stageNumber);
  const sp = stage ? stageProgress(stage, learning) : null;
  const next = lessonAfter(lessonKey, stageNumber, learning);
  const nextStage = next ? ROADMAP.find((s) => s.number === next.stageNumber) : undefined;

  return (
    <section aria-labelledby="lesson-next" className={cn("rounded-2xl border p-5 space-y-4", complete ? "border-emerald-500/30 bg-emerald-500/[0.05]" : "border-amber-500/25 bg-amber-500/[0.04]")}>
      <div className="flex items-start gap-3">
        <ProgressRing done={done.size} total={LESSON_STEPS.length} size={44} />
        <div>
          <h3 id="lesson-next" className="text-base font-semibold text-white">
            {complete ? "Lesson complete" : "Finish this lesson"}
          </h3>
          <p className="text-sm text-zinc-400">
            {complete ? "You did every step of the learning loop. It's saved in this browser." : `${done.size} of ${LESSON_STEPS.length} steps done. Still to do:`}
          </p>
        </div>
      </div>

      {!complete && (
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {remaining.map((s) => (
            <li key={s.id}>
              <a href={STEP_TARGET[s.id]} className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:border-zinc-600">
                <Circle size={13} className="text-amber-400 shrink-0" />
                <span>
                  <span className="text-zinc-500">{s.label}: </span>
                  {s.todo}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {sp && stage && (
        <div>
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>
              Stage {stage.number} · {stage.title}
            </span>
            <span className="font-mono">
              {sp.done}/{sp.total} lessons
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden" role="progressbar" aria-label={`Stage ${stage.number} progress`} aria-valuemin={0} aria-valuemax={sp.total} aria-valuenow={sp.done}>
            <div className={cn("h-full transition-all duration-500", sp.complete ? "bg-emerald-400" : "bg-indigo-400")} style={{ width: `${sp.total ? (sp.done / sp.total) * 100 : 0}%` }} />
          </div>
          {sp.complete && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-300">
              <Trophy size={13} /> Every lesson in Stage {stage.number} is complete.
            </p>
          )}
        </div>
      )}

      {next?.lesson.href ? (
        <Link
          href={next.lesson.href}
          className={cn(
            "flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2",
            complete ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 focus-visible:ring-emerald-300" : "border border-border text-zinc-200 hover:border-zinc-500 focus-visible:ring-indigo-500",
          )}
        >
          <span>
            <span className={cn("block text-[11px] font-normal", complete ? "text-zinc-900/70" : "text-zinc-500")}>
              {complete ? "Up next" : "Or continue the course"} · Stage {next.stageNumber}
              {nextStage && nextStage.number !== stageNumber ? ` · ${nextStage.title}` : ""}
            </span>
            {next.lesson.title}
          </span>
          <ArrowRight size={16} />
        </Link>
      ) : (
        <Link href="/simulator" className="flex items-center justify-between gap-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-3 text-sm font-semibold">
          Every available lesson is complete — try a timed mock in the simulator <ArrowRight size={16} />
        </Link>
      )}
      <Link href="/learn/interview-prep" className="block text-xs text-zinc-400 hover:text-white">
        Short on time? Back to your interview prep plan →
      </Link>
    </section>
  );
}
