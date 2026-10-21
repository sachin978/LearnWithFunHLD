"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { RichText } from "@/components/learn/RichText";
import { updateLearningState, useLearningState, type ReviewRating } from "@/lib/learn/learning-state";
import { REVIEW_DECK, deckStatus, missedTopics, scheduleNext, type ReviewCard } from "@/lib/learn/review";
import { trackLearning } from "@/lib/learn/analytics";

const NEW_PER_SESSION = 8;

const RATINGS: { id: ReviewRating; key: string; label: string; meaning: string; cls: string }[] = [
  { id: "missed", key: "1", label: "Missed it", meaning: "couldn't produce the key idea", cls: "border-rose-500/40 hover:bg-rose-500/10 text-rose-200" },
  { id: "shaky", key: "2", label: "Shaky", meaning: "got part of it, or slowly", cls: "border-amber-500/40 hover:bg-amber-500/10 text-amber-200" },
  { id: "good", key: "3", label: "Got it", meaning: "clear, confident answer", cls: "border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-200" },
];

function when(ts: number | undefined): string {
  if (!ts) return "—";
  const days = Math.round((ts - Date.now()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

/**
 * A self-rated spaced review session. Learners answer from memory, reveal the
 * model answer, and rate themselves — the rating schedules the card's return.
 * Sessions start on a button press, after local progress has loaded.
 */
export function ReviewSession() {
  const learning = useLearningState();
  const topics = useMemo(() => [...new Set(REVIEW_DECK.map((c) => c.topic))], []);
  const [topic, setTopic] = useState<string>("all");
  const [queue, setQueue] = useState<ReviewCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [tally, setTally] = useState<Record<ReviewRating, number>>({ missed: 0, shaky: 0, good: 0 });

  const status = deckStatus(learning.review);
  const inTopic = (c: ReviewCard) => topic === "all" || c.topic === topic;
  const dueHere = status.due.filter(inTopic);
  const freshHere = status.fresh.filter(inTopic);
  const sessionSize = dueHere.length + Math.min(NEW_PER_SESSION, freshHere.length);

  const start = () => {
    setQueue([...dueHere, ...freshHere.slice(0, NEW_PER_SESSION)]);
    setIndex(0);
    setRevealed(false);
    setTally({ missed: 0, shaky: 0, good: 0 });
  };

  const card = queue?.[index];
  const finished = queue !== null && index >= queue.length;

  const rate = (rating: ReviewRating) => {
    if (!card) return;
    updateLearningState((s) => ({ ...s, review: { ...s.review, [card.id]: scheduleNext(s.review[card.id], rating) } }));
    setTally((t) => ({ ...t, [rating]: t[rating] + 1 }));
    trackLearning("review_rated", { rating, topic: card.topic });
    setRevealed(false);
    setIndex((i) => i + 1);
  };

  // Keyboard: Space reveals, 1/2/3 rate. Ignored while typing in a field.
  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed) {
        const r = RATINGS.find((x) => x.key === e.key);
        if (r) {
          e.preventDefault();
          rate(r.id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ── Session finished ──
  if (finished && queue) {
    const weak = missedTopics(learning.review).slice(0, 5);
    const after = deckStatus(learning.review);
    return (
      <section aria-labelledby="review-done" className="rounded-3xl border border-emerald-500/30 bg-emerald-500/[0.05] p-6 space-y-4">
        <h2 id="review-done" className="flex items-center gap-2 text-xl font-semibold text-white">
          <Sparkles size={18} className="text-emerald-400" /> Session complete
        </h2>
        <p className="text-sm text-zinc-300">
          You reviewed {queue.length} card{queue.length === 1 ? "" : "s"}: {tally.good} got it, {tally.shaky} shaky, {tally.missed} missed. Cards come back sooner when you miss them and later when you know them.
        </p>
        {weak.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-white mb-1.5">Worth re-reading before your next session</p>
            <ul className="space-y-1">
              {weak.map((w) => (
                <li key={w.topic}>
                  <Link href={w.href} className="inline-flex items-center gap-1.5 text-sm text-amber-300 hover:text-amber-200">
                    {w.topic} <span className="text-zinc-500">({w.count} missed)</span> <ArrowRight size={13} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-xs text-zinc-500">
          Next card due: {when(after.nextDue)} · {after.fresh.length} new cards left in the deck.
        </p>
        <button
          type="button"
          onClick={() => setQueue(null)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-zinc-200 hover:text-white hover:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <RotateCcw size={14} /> Back to the deck
        </button>
      </section>
    );
  }

  // ── In a session ──
  if (card && queue) {
    const prev = learning.review[card.id];
    return (
      <section aria-labelledby="review-card" className="rounded-3xl border border-indigo-500/30 bg-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-indigo-300">{card.topic}</span>
          <span className="font-mono text-zinc-500">
            {index + 1} / {queue.length} {prev ? `· last: ${prev.last}` : "· new"}
          </span>
        </div>
        <h2 id="review-card" className="text-lg sm:text-xl font-semibold text-white leading-snug">
          <RichText text={card.question} />
        </h2>
        {!revealed ? (
          <div className="space-y-2">
            <p className="text-sm text-zinc-400">Say your answer out loud (or in your head) as you would in the interview — then check.</p>
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <Eye size={15} /> Reveal answer <span className="ml-1 text-[10px] text-indigo-200/70">Space</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-zinc-950/70 p-4 space-y-2 text-sm text-zinc-200">
              <p>
                <RichText text={card.answer} />
              </p>
              {card.detail?.map((d, i) => (
                <p key={i} className="text-zinc-400">
                  <RichText text={d} />
                </p>
              ))}
              <Link href={card.href} className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200">
                Re-learn this in context <ArrowRight size={11} />
              </Link>
            </div>
            <div>
              <p className="text-sm text-zinc-300 mb-2">How did your answer compare?</p>
              <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="Rate your answer">
                {RATINGS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => rate(r.id)}
                    className={cn("rounded-xl border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500", r.cls)}
                  >
                    <span className="block text-sm font-semibold">
                      {r.label} <span className="text-[10px] font-mono opacity-60">{r.key}</span>
                    </span>
                    <span className="block text-[11px] text-zinc-400">
                      {r.meaning} · back {when(scheduleNext(prev, r.id).due)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  // ── Deck overview ──
  return (
    <section aria-labelledby="deck" className="rounded-3xl border border-border bg-card p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 id="deck" className="text-lg font-semibold text-white">
            Your deck
          </h2>
          <p className="text-sm text-zinc-400 mt-1">{REVIEW_DECK.length} interview questions from every brief and design walkthrough.</p>
        </div>
        <div>
          <label htmlFor="review-topic" className="block text-xs text-zinc-500 mb-1">
            Topic
          </label>
          <select
            id="review-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="rounded-lg border border-border bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500/60"
          >
            <option value="all">All topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        {[
          { k: "Due now", v: dueHere.length, cls: "text-amber-300" },
          { k: "New", v: freshHere.length, cls: "text-indigo-300" },
          { k: "Scheduled later", v: status.scheduled.filter(inTopic).length, cls: "text-emerald-300" },
        ].map((m) => (
          <div key={m.k} className="rounded-xl border border-border bg-background/60 p-3">
            <dt className="text-[11px] text-zinc-500">{m.k}</dt>
            <dd className={cn("text-2xl font-bold font-mono", m.cls)}>{m.v}</dd>
          </div>
        ))}
      </dl>

      {sessionSize > 0 ? (
        <button
          type="button"
          onClick={start}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Start a session ({sessionSize} card{sessionSize === 1 ? "" : "s"}) <ArrowRight size={16} />
        </button>
      ) : (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-200">
          All caught up{topic !== "all" ? " for this topic" : ""}. Next card due {when(status.nextDue)}.
        </p>
      )}
      <p className="text-xs text-zinc-500">
        Sessions show due cards first, then up to {NEW_PER_SESSION} new ones. Ratings are yours — nothing is graded automatically — and they&apos;re saved in this browser only.
      </p>
    </section>
  );
}
