/**
 * Lightweight, client-only "where was I?" records used by the home page's
 * Continue chip. Nothing leaves the browser; every access is wrapped because
 * storage can be unavailable (private mode, blocked site data).
 */

export const LEARN_PROGRESS_KEY = "wireup-learn-progress";
/** Owned by the simulator's zustand `persist` config in lib/simulator/store.ts. */
export const SIMULATOR_STORAGE_KEY = "wireup-system-canvas";
/** Same-tab change notification (the native `storage` event only fires cross-tab). */
export const PROGRESS_EVENT = "wireup-progress";

export interface LearnProgress {
  course: string;
  courseTitle: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  totalChapters: number;
}

export function saveLearnProgress(progress: LearnProgress) {
  try {
    localStorage.setItem(LEARN_PROGRESS_KEY, JSON.stringify(progress));
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  } catch {
    // Storage unavailable — the Continue chip simply won't appear.
  }
}

export function parseLearnProgress(raw: string | null): LearnProgress | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<LearnProgress>;
    return p.course && p.chapterId && p.chapterNumber ? (p as LearnProgress) : null;
  } catch {
    return null;
  }
}

export interface SimulatorProgress {
  problemName: string | null;
  componentCount: number;
}

/** Reads the simulator's persisted canvas; null when nothing has been started. */
export function parseSimulatorProgress(raw: string | null): SimulatorProgress | null {
  if (!raw) return null;
  try {
    const state = (JSON.parse(raw) as { state?: { nodes?: unknown[]; activeProblem?: { name?: string } | null } }).state;
    const componentCount = Array.isArray(state?.nodes) ? state.nodes.length : 0;
    const problemName = state?.activeProblem?.name ?? null;
    return problemName || componentCount > 0 ? { problemName, componentCount } : null;
  } catch {
    return null;
  }
}

// ─── Rapid Interview Prep checklist ──────────────────────────────────────────

export const PREP_PROGRESS_KEY = "wireup-prep-progress";

/** Completed task ids per horizon, plus the plan the learner last opened. */
export interface PrepProgress {
  last?: 1 | 3 | 7;
  done: Partial<Record<"1" | "3" | "7", string[]>>;
}

export function parsePrepProgress(raw: string | null): PrepProgress {
  if (!raw) return { done: {} };
  try {
    const p = JSON.parse(raw) as PrepProgress;
    return { last: p.last, done: p.done ?? {} };
  } catch {
    return { done: {} };
  }
}

/** Returns false when storage is unavailable, so callers can fall back to memory. */
export function savePrepProgress(progress: PrepProgress): boolean {
  try {
    localStorage.setItem(PREP_PROGRESS_KEY, JSON.stringify(progress));
    window.dispatchEvent(new Event(PROGRESS_EVENT));
    return true;
  } catch {
    return false;
  }
}
