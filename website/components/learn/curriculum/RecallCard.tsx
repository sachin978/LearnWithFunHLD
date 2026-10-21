"use client";

import { useState } from "react";
import { Brain, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecallPrompt } from "@/lib/learn/curriculum/types";
import { RichText } from "@/components/learn/RichText";
import { recordRecall, useLearningState } from "@/lib/learn/learning-state";
import { trackLearning } from "@/lib/learn/analytics";

const VERDICT = {
  best: { label: "Strongest answer", cls: "border-emerald-500/50 bg-emerald-500/10", tag: "text-emerald-300" },
  valid: { label: "Also valid", cls: "border-sky-500/40 bg-sky-500/[0.07]", tag: "text-sky-300" },
  weak: { label: "Weak answer", cls: "border-rose-500/40 bg-rose-500/[0.07]", tag: "text-rose-300" },
} as const;

const PREVIOUS = {
  best: { text: "Last time you picked the strongest answer.", cls: "text-emerald-300" },
  valid: { text: "Last time you picked a reasonable but not the strongest answer.", cls: "text-sky-300" },
  weak: { text: "Last time your answer missed the key idea — worth another go.", cls: "text-rose-300" },
} as const;

/**
 * Active recall: the learner commits to an answer first, then sees the
 * reasoning for every option — including when more than one is reasonable.
 * Feedback is authored per option, not an automatic grader. When `slug` is
 * given, the chosen verdict is saved locally (for review suggestions).
 */
export function RecallCard({ recall, slug, title = "Test yourself" }: { recall: RecallPrompt; slug?: string; title?: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  const learning = useLearningState();
  const previous = slug ? learning.briefs[slug]?.recall : undefined;
  const revealed = picked !== null;

  const pick = (i: number) => {
    setPicked(i);
    if (slug) {
      recordRecall(slug, recall.options[i].verdict);
      trackLearning("self_test_answered", { brief: slug, verdict: recall.options[i].verdict });
    }
  };

  return (
    <section id="test-yourself" aria-label={title} className="scroll-mt-28 rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.04] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-indigo-300">
          <Brain size={15} /> {title}
        </h3>
        {revealed && (
          <button
            type="button"
            onClick={() => setPicked(null)}
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white rounded px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <RotateCcw size={12} /> Try again
          </button>
        )}
      </div>
      <p className="text-zinc-100 font-medium mb-1">
        <RichText text={recall.prompt} />
      </p>
      {!revealed && previous && <p className={cn("text-xs mb-1", PREVIOUS[previous].cls)}>{PREVIOUS[previous].text}</p>}
      {!revealed && <p className="text-xs text-zinc-500 mb-3">Decide before you click — committing to an answer is what makes it stick.</p>}
      <div className="grid gap-2 mt-3">
        {recall.options.map((o, i) => {
          const v = VERDICT[o.verdict];
          return (
            <button
              key={i}
              type="button"
              disabled={revealed}
              onClick={() => pick(i)}
              aria-pressed={picked === i}
              className={cn(
                "text-left rounded-lg border px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                !revealed && "border-border bg-zinc-900/60 text-zinc-300 hover:border-indigo-500/50 hover:text-white",
                revealed && v.cls,
                revealed && picked === i && "ring-1 ring-white/40",
              )}
            >
              <span className="text-zinc-100">
                <RichText text={o.text} />
              </span>
              {revealed && (
                <span className="block mt-1.5 text-xs">
                  <span className={cn("font-semibold mr-1.5", v.tag)}>
                    {picked === i && "Your pick · "}
                    {v.label}.
                  </span>
                  <span className="text-zinc-300">
                    <RichText text={o.why} />
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
