"use client";

import { useSyncExternalStore } from "react";
import { PROGRESS_EVENT } from "./progress";

/**
 * What the learner has actually done, stored only in this browser.
 *
 * Every field records an observable action (opened a brief, answered a
 * self-test, revealed a design step, finished a quiz, rated a review card).
 * Nothing here means "mastered" — the UI must label states by the action
 * they record, e.g. "Self-test: missed", "4 of 7 steps attempted".
 */

export const LEARNING_STATE_KEY = "wireup-learning-v1";
export const NOTES_KEY = "wireup-notes-v1";

export type RecallVerdict = "best" | "valid" | "weak";
export type ReviewRating = "missed" | "shaky" | "good";

export interface BriefProgress {
  openedAt?: number;
  /** Reading steps (understand, visualize, practise, apply) scrolled through to the end. */
  seen?: string[];
  recall?: RecallVerdict;
  recallAt?: number;
  /** When the learner compared their own explanation with the model answer. */
  explainedAt?: number;
  /** Key points the learner ticked as covered in their own explanation. */
  keyPointsHit?: number;
  keyPointsTotal?: number;
}

export interface DesignProgress {
  openedAt?: number;
  /** Workflow step ids whose model answer was revealed after attempting. */
  revealed: string[];
  updatedAt?: number;
}

export interface QuizResult {
  score: number;
  total: number;
  missed: string[];
  at: number;
}

export interface ReviewCardState {
  due: number;
  /** Days until next review after the last rating. */
  interval: number;
  last: ReviewRating;
  reps: number;
  lastAt: number;
}

export interface LearningState {
  briefs: Record<string, BriefProgress>;
  designs: Record<string, DesignProgress>;
  quizzes: Record<string, QuizResult>;
  review: Record<string, ReviewCardState>;
  /** RabbitMQ (and future courses) chapters the learner scrolled to. */
  courseChapters: Record<string, string[]>;
}

const EMPTY: LearningState = { briefs: {}, designs: {}, quizzes: {}, review: {}, courseChapters: {} };

let cache: { raw: string | null; value: LearningState } = { raw: null, value: EMPTY };

function read(): LearningState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEARNING_STATE_KEY);
  } catch {
    return cache.value;
  }
  if (raw === cache.raw) return cache.value;
  let value = EMPTY;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<LearningState>;
      value = {
        briefs: parsed.briefs ?? {},
        designs: parsed.designs ?? {},
        quizzes: parsed.quizzes ?? {},
        review: parsed.review ?? {},
        courseChapters: parsed.courseChapters ?? {},
      };
    } catch {
      value = EMPTY;
    }
  }
  cache = { raw, value };
  return value;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(PROGRESS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(PROGRESS_EVENT, onChange);
  };
}

/** Hydration-safe: renders the empty state on the server and during hydration. */
export function useLearningState(): LearningState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Applies an update and notifies every subscriber. Silently no-ops without storage. */
export function updateLearningState(fn: (s: LearningState) => LearningState): void {
  try {
    const next = fn(read());
    localStorage.setItem(LEARNING_STATE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  } catch {
    // Storage unavailable (private mode / blocked): progress simply isn't remembered.
  }
}

export function getLearningStateSnapshot(): LearningState {
  return read();
}

// ─── Convenience writers ─────────────────────────────────────────────────────

export function markBriefOpened(slug: string) {
  updateLearningState((s) => (s.briefs[slug]?.openedAt ? s : { ...s, briefs: { ...s.briefs, [slug]: { ...s.briefs[slug], openedAt: Date.now() } } }));
}

export function recordRecall(slug: string, verdict: RecallVerdict) {
  updateLearningState((s) => ({ ...s, briefs: { ...s.briefs, [slug]: { ...s.briefs[slug], recall: verdict, recallAt: Date.now() } } }));
}

export function recordStepSeen(slug: string, step: string) {
  updateLearningState((s) => {
    const current = s.briefs[slug] ?? {};
    if (current.seen?.includes(step)) return s;
    return { ...s, briefs: { ...s.briefs, [slug]: { ...current, seen: [...(current.seen ?? []), step] } } };
  });
}

export function recordExplainCompared(slug: string) {
  updateLearningState((s) => (s.briefs[slug]?.explainedAt ? s : { ...s, briefs: { ...s.briefs, [slug]: { ...s.briefs[slug], explainedAt: Date.now() } } }));
}

export function recordExplain(slug: string, keyPointsHit: number, keyPointsTotal: number) {
  updateLearningState((s) => ({
    ...s,
    briefs: { ...s.briefs, [slug]: { ...s.briefs[slug], explainedAt: s.briefs[slug]?.explainedAt ?? Date.now(), keyPointsHit, keyPointsTotal } },
  }));
}

export function markDesignOpened(slug: string) {
  updateLearningState((s) =>
    s.designs[slug]?.openedAt ? s : { ...s, designs: { ...s.designs, [slug]: { ...s.designs[slug], revealed: s.designs[slug]?.revealed ?? [], openedAt: Date.now() } } },
  );
}

export function recordDesignReveal(slug: string, stepId: string) {
  updateLearningState((s) => {
    const current = s.designs[slug] ?? { revealed: [] };
    if (current.revealed.includes(stepId)) return s;
    return { ...s, designs: { ...s.designs, [slug]: { ...current, revealed: [...current.revealed, stepId], updatedAt: Date.now() } } };
  });
}

export function recordQuiz(id: string, result: Omit<QuizResult, "at">) {
  updateLearningState((s) => ({ ...s, quizzes: { ...s.quizzes, [id]: { ...result, at: Date.now() } } }));
}

export function recordCourseChapter(course: string, chapterId: string) {
  updateLearningState((s) => {
    const seen = s.courseChapters[course] ?? [];
    if (seen.includes(chapterId)) return s;
    return { ...s, courseChapters: { ...s.courseChapters, [course]: [...seen, chapterId] } };
  });
}

// ─── Free-text notes (kept separate so the main snapshot stays small) ────────

export function readNote(key: string): string {
  try {
    const all = JSON.parse(localStorage.getItem(NOTES_KEY) ?? "{}") as Record<string, string>;
    return all[key] ?? "";
  } catch {
    return "";
  }
}

export function writeNote(key: string, text: string) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTES_KEY) ?? "{}") as Record<string, string>;
    if (text.trim()) all[key] = text;
    else delete all[key];
    localStorage.setItem(NOTES_KEY, JSON.stringify(all));
  } catch {
    // Notes are a convenience; losing them is acceptable.
  }
}
