"use client";

import { useState } from "react";
import { Brain, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecallPrompt } from "@/lib/learn/curriculum/types";
import { RichText } from "@/components/learn/RichText";

const VERDICT = {
  best: { label: "Strongest answer", cls: "border-emerald-500/50 bg-emerald-500/10", tag: "text-emerald-300" },
  valid: { label: "Also valid", cls: "border-sky-500/40 bg-sky-500/[0.07]", tag: "text-sky-300" },
  weak: { label: "Weak answer", cls: "border-rose-500/40 bg-rose-500/[0.07]", tag: "text-rose-300" },
} as const;

/**
 * Active recall: the learner commits to an answer first, then sees the
 * reasoning for every option — including when more than one is reasonable.
 * Feedback is fixed per option (authored), not an automatic grader.
 */
export function RecallCard({ recall, title = "Test yourself" }: { recall: RecallPrompt; title?: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  const revealed = picked !== null;

  return (
    <section aria-label={title} className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.04] p-4 sm:p-5">
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
      {!revealed && <p className="text-xs text-zinc-500 mb-3">Decide before you click — committing to an answer is what makes it stick.</p>}
      <div className="grid gap-2 mt-3">
        {recall.options.map((o, i) => {
          const v = VERDICT[o.verdict];
          return (
            <button
              key={i}
              type="button"
              disabled={revealed}
              onClick={() => setPicked(i)}
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
