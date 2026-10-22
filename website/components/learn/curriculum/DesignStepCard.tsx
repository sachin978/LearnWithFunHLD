"use client";

import { useState, useSyncExternalStore } from "react";
import { Eye, Lightbulb, Swords, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressRing } from "./LessonProgress";
import { RichText } from "@/components/learn/RichText";
import type { DesignStep } from "@/lib/learn/curriculum/types";
import { WORKFLOW } from "@/lib/learn/curriculum/types";
import { readNote, recordDesignReveal, useLearningState, writeNote } from "@/lib/learn/learning-state";
import { trackLearning } from "@/lib/learn/analytics";

const noop = () => () => {};

/**
 * One workflow step: answer first (optionally jotting notes, saved locally),
 * then reveal the model answer and coaching. Revealing records the step as
 * "attempted" — never as "mastered".
 */
export function DesignStepCard({ designSlug, step, index }: { designSlug: string; step: DesignStep; index: number }) {
  const label = WORKFLOW.find((w) => w.id === step.id)?.label ?? step.id;
  const noteKey = `design:${designSlug}:${step.id}`;
  const saved = useSyncExternalStore(noop, () => readNote(noteKey), () => "");
  const [draft, setDraft] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const learning = useLearningState();
  const attemptedBefore = learning.designs[designSlug]?.revealed.includes(step.id) ?? false;
  const notes = draft ?? saved;

  const reveal = () => {
    setRevealed(true);
    recordDesignReveal(designSlug, step.id);
    trackLearning("design_step_revealed", { design: designSlug, step: step.id, attempted: notes.trim().length > 0 });
  };

  return (
    <li id={`step-${step.id}`} className="scroll-mt-32 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="flex items-center gap-3 text-white font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-mono">{index + 1}</span>
          {label}
        </h2>
        {attemptedBefore && !revealed && (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300/80">
            <CheckCircle2 size={12} /> Attempted before
          </span>
        )}
      </div>

      <p className="rounded-xl border border-amber-500/25 bg-amber-500/[0.05] px-3 py-2.5 text-sm text-zinc-200 mb-3">
        <span className="font-semibold text-amber-300">Your turn: </span>
        <RichText text={step.prompt} />
      </p>

      <label htmlFor={`notes-${designSlug}-${step.id}`} className="sr-only">
        Your answer for {label}
      </label>
      <textarea
        id={`notes-${designSlug}-${step.id}`}
        value={notes}
        onChange={(e) => {
          setDraft(e.target.value);
          writeNote(noteKey, e.target.value);
        }}
        rows={3}
        placeholder="Jot your answer — or say it out loud — before revealing. Saved in this browser."
        className="w-full rounded-xl border border-border bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 focus-visible:ring-2 focus-visible:ring-indigo-500/30"
      />

      {!revealed ? (
        <button
          type="button"
          onClick={reveal}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:border-indigo-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <Eye size={13} /> Reveal a model answer
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <ul className="space-y-2">
            {step.answer.map((a, ai) => (
              <li key={ai} className="relative pl-4 text-sm text-zinc-300 leading-relaxed before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-indigo-400/70">
                <RichText text={a} />
              </li>
            ))}
          </ul>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3 space-y-2 text-sm">
            <p className="text-zinc-200">
              <Lightbulb size={13} className="inline mr-1.5 -mt-0.5 text-emerald-400" />
              <span className="font-semibold text-emerald-300">Why this is strong: </span>
              <RichText text={step.coach.strong} />
            </p>
            {step.coach.challenge && (
              <p className="text-zinc-300">
                <Swords size={13} className="inline mr-1.5 -mt-0.5 text-amber-400" />
                <span className="font-semibold text-amber-300">If the interviewer pushes back: </span>
                <RichText text={step.coach.challenge} />
              </p>
            )}
          </div>
          {notes.trim() && <p className="text-xs text-zinc-500">Compare with your notes above: what did you cover, and what would you add next time?</p>}
          <button
            type="button"
            onClick={() => setRevealed(false)}
            className="text-xs text-zinc-500 hover:text-zinc-300 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Hide model answer
          </button>
        </div>
      )}
    </li>
  );
}

/** "x of 7 steps attempted" — from recorded reveals only. */
export function DesignProgress({ designSlug }: { designSlug: string }) {
  const learning = useLearningState();
  const n = learning.designs[designSlug]?.revealed.length ?? 0;
  const total = WORKFLOW.length;
  return (
    <div className="min-w-[200px]" aria-live="polite">
      <div className="flex justify-between text-xs text-zinc-400 mb-1">
        <span>Steps attempted</span>
        <span className="font-mono text-indigo-300">
          {n}/{total}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden" role="progressbar" aria-label="Steps attempted" aria-valuemin={0} aria-valuemax={total} aria-valuenow={n}>
        <div className="h-full bg-indigo-400 transition-all" style={{ width: `${(n / total) * 100}%` }} />
      </div>
    </div>
  );
}

/** Sticky workflow tracker: ticks for attempted steps and an n/7 ring. */
export function DesignStepNav({ designSlug, steps }: { designSlug: string; steps: { id: string; label: string }[] }) {
  const learning = useLearningState();
  const revealed = new Set(learning.designs[designSlug]?.revealed ?? []);
  const n = steps.filter((s) => revealed.has(s.id)).length;
  const complete = n >= steps.length;
  return (
    <nav aria-label="Interview workflow" className="sticky top-14 z-30 -mx-4 px-4 border-y border-border bg-background/90 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <ol className="flex flex-1 gap-1.5 overflow-x-auto py-2">
          {steps.map((s, i) => (
            <li key={s.id} className="shrink-0">
              <a href={`#step-${s.id}`} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-zinc-300 hover:border-indigo-500/50 hover:text-white">
                {revealed.has(s.id) ? (
                  <CheckCircle2 size={13} className="text-emerald-400" aria-label="attempted" />
                ) : (
                  <span className="font-mono text-indigo-300" aria-hidden>
                    {i + 1}
                  </span>
                )}
                {s.label}
              </a>
            </li>
          ))}
        </ol>
        <span className="shrink-0 py-1.5" role="status" aria-label={complete ? "Walkthrough complete" : `${n} of ${steps.length} steps attempted`}>
          <ProgressRing done={n} total={steps.length} />
        </span>
      </div>
    </nav>
  );
}

/** After the last step: what's left, or confirmation that every step was attempted. */
export function DesignCompletion({ designSlug, steps }: { designSlug: string; steps: { id: string; label: string }[] }) {
  const learning = useLearningState();
  const revealed = new Set(learning.designs[designSlug]?.revealed ?? []);
  const remaining = steps.filter((s) => !revealed.has(s.id));
  const n = steps.length - remaining.length;
  const complete = remaining.length === 0;
  return (
    <section aria-labelledby="design-done" className={cn("rounded-2xl border p-5 space-y-3", complete ? "border-emerald-500/30 bg-emerald-500/[0.05]" : "border-amber-500/25 bg-amber-500/[0.04]")}>
      <div className="flex items-start gap-3">
        <ProgressRing done={n} total={steps.length} size={44} />
        <div>
          <h2 id="design-done" className="text-base font-semibold text-white">
            {complete ? "Walkthrough complete" : "Finish the walkthrough"}
          </h2>
          <p className="text-sm text-zinc-400">
            {complete
              ? "You attempted every step. Now say the 60-second wrap-up below out loud, then build it in the simulator."
              : `${n} of ${steps.length} steps attempted. Answer these before revealing the model answer:`}
          </p>
        </div>
      </div>
      {!complete && (
        <ul className="flex flex-wrap gap-2">
          {remaining.map((s) => (
            <li key={s.id}>
              <a href={`#step-${s.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/50 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-zinc-600">
                <Circle size={12} className="text-amber-400" /> {s.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
