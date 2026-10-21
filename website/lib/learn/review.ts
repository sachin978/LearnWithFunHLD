import { BRIEFS, DESIGNS, briefHref, designHref, designShortTitle } from "./curriculum";
import type { ReviewCardState, ReviewRating } from "./learning-state";

/**
 * Spaced review deck built from the interview questions in every brief and
 * the follow-up questions in every design walkthrough. Learners say their
 * answer out loud, reveal the model answer, and rate themselves honestly;
 * the rating schedules when the card comes back. No automatic grading.
 */

export interface ReviewCard {
  id: string;
  topic: string;
  /** Where to re-learn it. */
  href: string;
  question: string;
  answer: string;
  detail?: string[];
}

export const REVIEW_DECK: ReviewCard[] = [
  ...BRIEFS.flatMap((b) =>
    b.questions.map((q, i) => ({
      id: `brief:${b.slug}:${i}`,
      topic: b.shortTitle,
      href: `${briefHref(b.slug)}#questions`,
      question: q.q,
      answer: q.short,
      detail: q.detailed,
    })),
  ),
  ...DESIGNS.flatMap((d) =>
    d.followUps.map((q, i) => ({
      id: `design:${d.slug}:${i}`,
      topic: designShortTitle(d),
      href: `${designHref(d.slug)}#follow-ups`,
      question: q.q,
      answer: q.short,
      detail: q.detailed,
    })),
  ),
];

const DAY = 24 * 60 * 60 * 1000;

/** Simple, transparent schedule: missed → tomorrow, shaky → 2 days, good → growing gaps. */
export function scheduleNext(prev: ReviewCardState | undefined, rating: ReviewRating, now = Date.now()): ReviewCardState {
  let interval: number;
  if (rating === "missed") interval = 1;
  else if (rating === "shaky") interval = 2;
  else interval = prev && prev.last === "good" ? Math.min(60, Math.round(prev.interval * 2.5)) : 4;
  return { due: now + interval * DAY, interval, last: rating, reps: (prev?.reps ?? 0) + 1, lastAt: now };
}

export interface DeckStatus {
  due: ReviewCard[];
  fresh: ReviewCard[];
  scheduled: ReviewCard[];
  nextDue?: number;
}

export function deckStatus(states: Record<string, ReviewCardState>, now = Date.now()): DeckStatus {
  const due: ReviewCard[] = [];
  const fresh: ReviewCard[] = [];
  const scheduled: ReviewCard[] = [];
  let nextDue: number | undefined;
  for (const card of REVIEW_DECK) {
    const s = states[card.id];
    if (!s) fresh.push(card);
    else if (s.due <= now) due.push(card);
    else {
      scheduled.push(card);
      nextDue = nextDue === undefined ? s.due : Math.min(nextDue, s.due);
    }
  }
  // Most overdue first.
  due.sort((a, b) => states[a.id].due - states[b.id].due);
  return { due, fresh, scheduled, nextDue };
}

/** Cards whose latest self-rating was "missed" — the learner's weak spots. */
export function missedTopics(states: Record<string, ReviewCardState>): { topic: string; href: string; count: number }[] {
  const byTopic = new Map<string, { topic: string; href: string; count: number }>();
  for (const card of REVIEW_DECK) {
    if (states[card.id]?.last !== "missed") continue;
    const entry = byTopic.get(card.topic) ?? { topic: card.topic, href: card.href, count: 0 };
    entry.count++;
    byTopic.set(card.topic, entry);
  }
  return [...byTopic.values()].sort((a, b) => b.count - a.count);
}
