"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/learn/types";
import { RichText } from "./RichText";

/**
 * Multiple-choice check with immediate feedback. The score is computed from
 * the learner's actual answers; nothing is pre-filled.
 */
export function KnowledgeCheck({ questions, title = "Knowledge check", showScore = false }: { questions: QuizQuestion[]; title?: string; showScore?: boolean }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  if (!questions.length) return null;

  const answered = questions.filter((q) => answers[q.id] !== undefined).length;
  const correct = questions.filter((q) => answers[q.id] === q.answer).length;
  const done = answered === questions.length;

  return (
    <section aria-label={title} className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.04] p-4 sm:p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-indigo-300">{title}</h4>
        <span className="text-xs text-zinc-400" aria-live="polite">
          {showScore || done ? `${correct}/${questions.length} correct` : `${answered}/${questions.length} answered`}
        </span>
      </div>

      {questions.map((q, qi) => {
        const chosen = answers[q.id];
        const isAnswered = chosen !== undefined;
        return (
          <fieldset key={q.id} className="space-y-2">
            <legend className="text-sm text-zinc-100 font-medium mb-2">
              <span className="text-zinc-500 mr-1.5">{qi + 1}.</span>
              <RichText text={q.question} />
            </legend>
            <div className="grid gap-2">
              {q.options.map((opt, oi) => {
                const isCorrect = oi === q.answer;
                const isChosen = chosen === oi;
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    aria-pressed={isChosen}
                    className={cn(
                      "flex items-start gap-2 text-left text-sm rounded-lg border px-3 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                      !isAnswered && "border-border bg-zinc-900/60 text-zinc-300 hover:border-indigo-500/50 hover:text-white",
                      isAnswered && isCorrect && "border-emerald-500/50 bg-emerald-500/10 text-emerald-100",
                      isAnswered && isChosen && !isCorrect && "border-rose-500/50 bg-rose-500/10 text-rose-100",
                      isAnswered && !isChosen && !isCorrect && "border-border text-zinc-500",
                    )}
                  >
                    {isAnswered && isCorrect ? (
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" aria-label="Correct answer" />
                    ) : isAnswered && isChosen ? (
                      <XCircle size={16} className="mt-0.5 shrink-0 text-rose-400" aria-label="Your answer, incorrect" />
                    ) : (
                      <span className="mt-0.5 w-4 h-4 shrink-0 rounded-full border border-zinc-600" aria-hidden />
                    )}
                    <span>
                      <RichText text={opt} />
                    </span>
                  </button>
                );
              })}
            </div>
            {isAnswered && (
              <p role="status" className={cn("text-xs leading-relaxed pl-1", chosen === q.answer ? "text-emerald-300" : "text-rose-300")}>
                <strong>{chosen === q.answer ? "Correct. " : "Not quite. "}</strong>
                <span className="text-zinc-300">
                  <RichText text={q.explanation} />
                </span>
              </p>
            )}
          </fieldset>
        );
      })}

      {done && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-zinc-200">
            You scored <strong className="text-white">{correct}</strong> out of {questions.length} ({Math.round((correct / questions.length) * 100)}%).
            {correct === questions.length ? " Excellent." : correct / questions.length >= 0.7 ? " Solid — review the ones you missed." : " Revisit the related chapters and try again."}
          </p>
          <button
            type="button"
            onClick={() => setAnswers({})}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-white border border-indigo-500/40 rounded-lg px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <RotateCcw size={13} /> Try again
          </button>
        </div>
      )}
    </section>
  );
}
