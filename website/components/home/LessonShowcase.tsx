"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Brain, Eye, MessageSquare, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScenePlayer } from "@/components/learn/scene/ScenePlayer";
import { RecallCard } from "@/components/learn/curriculum/RecallCard";
import { RichText } from "@/components/learn/RichText";
import { cacheAsideScene } from "@/lib/learn/curriculum/scenes";
import { LESSON_STEPS, type LessonStepId } from "@/lib/learn/completion";
import type { AnswerContrast, RecallPrompt } from "@/lib/learn/curriculum/types";

type Tab = "watch" | "test" | "defend";

const TABS: { id: Tab; label: string; icon: typeof Eye; step: LessonStepId }[] = [
  { id: "watch", label: "Watch it", icon: Eye, step: "visualize" },
  { id: "test", label: "Quiz yourself", icon: Brain, step: "recall" },
  { id: "defend", label: "Weak vs strong answer", icon: MessageSquare, step: "explain" },
];

const STEP_LINE: Record<LessonStepId, string> = {
  understand: "What problem it solves, in plain words",
  visualize: "An animation you can play step by step",
  practise: "A worked example with real numbers",
  apply: "When to use it — and when not to",
  explain: "Answer in your own words, then compare",
  recall: "A quick quiz that explains every option",
};

/**
 * Show, don't tell: three real pieces of a lesson the visitor can use right
 * here — the animation, a self-test, and a weak-vs-strong answer — next to the
 * six-step loop every lesson follows. Self-test answers here aren't recorded.
 */
export function LessonShowcase({ recall, contrast, lesson }: { recall: RecallPrompt; contrast: AnswerContrast; lesson: { title: string; href: string; minutes: number } }) {
  const [tab, setTab] = useState<Tab>("watch");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = TABS.find((t) => t.id === tab)!;

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + TABS.length) % TABS.length;
    setTab(TABS[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-start">
      <ol className="relative border-l border-border ml-3 space-y-4" aria-label="The six steps of every lesson">
        {LESSON_STEPS.map((s, i) => {
          const lit = s.id === active.step;
          return (
            <li key={s.id} className="pl-6 relative">
              <span
                className={cn(
                  "absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-mono bg-background transition",
                  lit ? "border-amber-400 text-amber-200 bg-amber-500/15" : "border-border text-zinc-500",
                )}
              >
                {i + 1}
              </span>
              <p className={cn("text-sm font-semibold transition", lit ? "text-white" : "text-zinc-300")}>{s.label}</p>
              <p className="text-xs text-zinc-500">{STEP_LINE[s.id]}</p>
            </li>
          );
        })}
      </ol>

      <div className="rounded-3xl border border-border bg-card p-4 sm:p-5">
        <div role="tablist" aria-label="Try part of a real lesson" className="flex flex-wrap gap-1.5 mb-4">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`showcase-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`showcase-panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                tab === t.id ? "border-amber-500/50 bg-amber-500/10 text-amber-200" : "border-border text-zinc-400 hover:text-white",
              )}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {TABS.map((t) => (
          <div key={t.id} role="tabpanel" id={`showcase-panel-${t.id}`} aria-labelledby={`showcase-tab-${t.id}`} hidden={tab !== t.id}>
            {t.id === "watch" && tab === "watch" && <ScenePlayer scene={cacheAsideScene} />}
            {t.id === "test" && <RecallCard recall={recall} title="Quiz question from the caching lesson" />}
            {t.id === "defend" && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">Interviewers listen for your reasons, not buzzwords. Every lesson shows the difference:</p>
                <div className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.04] p-4">
                  <p className="text-sm text-zinc-200">
                    <ThumbsDown size={13} className="inline mr-1.5 -mt-0.5 text-rose-400" />
                    <span className="font-semibold text-rose-300">Weak: </span>
                    <RichText text={contrast.weak} />
                  </p>
                  <p className="mt-1.5 text-xs text-zinc-400 pl-5">
                    <RichText text={contrast.why} />
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] p-4">
                  <p className="text-sm text-zinc-200">
                    <ThumbsUp size={13} className="inline mr-1.5 -mt-0.5 text-emerald-400" />
                    <span className="font-semibold text-emerald-300">Stronger: </span>
                    <RichText text={contrast.strong} />
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        <Link href={lesson.href} className="mt-4 inline-flex items-center gap-1.5 text-sm text-amber-300 hover:text-amber-200">
          Open the full lesson ({lesson.minutes} min) <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
