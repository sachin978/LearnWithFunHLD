"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { CheckCircle2, MessageSquareText, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { RichText } from "@/components/learn/RichText";
import { readNote, recordExplain, writeNote } from "@/lib/learn/learning-state";
import { trackLearning } from "@/lib/learn/analytics";

const noop = () => () => {};

/**
 * The "Explain" step of the learning loop: the learner writes (or says out
 * loud) their own interview answer first, then compares it with a model
 * answer and ticks the key points they covered. Self-assessed by design —
 * we don't pretend to grade free text automatically.
 */
export function ExplainCard({ slug, prompt, keyPoints, modelAnswer }: { slug: string; prompt: string; keyPoints: string[]; modelAnswer: string }) {
  const noteKey = `explain:${slug}`;
  const saved = useSyncExternalStore(noop, () => readNote(noteKey), () => "");
  const [draft, setDraft] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hit, setHit] = useState<Set<number>>(new Set());
  const latestHit = useRef<Set<number>>(new Set());
  const text = draft ?? saved;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const toggle = (i: number) => {
    const next = new Set(latestHit.current);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    latestHit.current = next;
    setHit(next);
    recordExplain(slug, next.size, keyPoints.length);
  };

  const missing = keyPoints.filter((_, i) => !hit.has(i));

  return (
    <section aria-labelledby={`explain-${slug}`} className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-4 sm:p-5 space-y-4">
      <div>
        <h3 id={`explain-${slug}`} className="flex items-center gap-2 text-sm font-semibold text-amber-300">
          <MessageSquareText size={15} /> Explain it yourself
        </h3>
        <p className="mt-2 text-zinc-100 font-medium">
          <RichText text={prompt} />
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Write it as you&apos;d say it in the interview — or say it out loud first. Aim for 4–6 sentences. Your draft stays in this browser.
        </p>
      </div>

      <div>
        <label htmlFor={`explain-text-${slug}`} className="sr-only">
          Your explanation
        </label>
        <textarea
          id={`explain-text-${slug}`}
          value={text}
          onChange={(e) => {
            setDraft(e.target.value);
            writeNote(noteKey, e.target.value);
          }}
          rows={5}
          placeholder="Start with the problem, then the mechanism, then the trade-off you'd mention…"
          className="w-full rounded-xl border border-border bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60 focus-visible:ring-2 focus-visible:ring-amber-500/30"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-zinc-500">{words} words</span>
          {!revealed && (
            <button
              type="button"
              onClick={() => {
                setRevealed(true);
                trackLearning("explain_compared", { brief: slug, wroteAnswer: words >= 15 });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold px-3 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <Mic size={13} /> Compare with a model answer
            </button>
          )}
        </div>
        {!revealed && words < 15 && <p className="mt-1 text-[11px] text-zinc-500">Tip: committing to your own answer first makes the comparison far more useful.</p>}
      </div>

      {revealed && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-zinc-950/70 p-4">
            <p className="text-[11px] uppercase tracking-wider text-emerald-300/80 font-semibold mb-1.5">A model interview answer</p>
            <p className="text-sm text-zinc-200 leading-relaxed">
              <RichText text={modelAnswer} />
            </p>
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-zinc-100 mb-2">Which of these did your answer cover?</legend>
            <ul className="space-y-1.5">
              {keyPoints.map((point, i) => (
                <li key={i}>
                  <label className="flex items-start gap-2.5 text-sm text-zinc-300 cursor-pointer">
                    <input type="checkbox" checked={hit.has(i)} onChange={() => toggle(i)} className="mt-1 h-4 w-4 shrink-0 accent-amber-500" />
                    <span className={cn(hit.has(i) && "text-zinc-100")}>
                      <RichText text={point} />
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
          <p className="text-xs text-zinc-400" aria-live="polite">
            {hit.size === keyPoints.length ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 size={13} /> You covered every key point. Try saying it again in under a minute.
              </span>
            ) : hit.size === 0 ? (
              "Tick the points you covered to see what to add next time."
            ) : (
              <>
                Covered {hit.size} of {keyPoints.length}. Next time, also mention: {missing.map((m) => m.replace(/[`*]/g, "")).join("; ")}.
              </>
            )}
          </p>
        </div>
      )}
    </section>
  );
}
