import { track } from "@vercel/analytics";

/**
 * Privacy-conscious learning analytics via the Vercel Analytics package the
 * site already uses. Events describe learning actions only — no user IDs,
 * no free text, nothing personal — so the team can see which lessons,
 * self-tests and plans actually get used. (Custom events are only collected
 * on Vercel plans that support them; elsewhere this is a harmless no-op.)
 */
export type LearningEvent =
  | "prep_task_toggled"
  | "self_test_answered"
  | "explain_compared"
  | "design_step_revealed"
  | "quiz_completed"
  | "review_rated";

export function trackLearning(event: LearningEvent, properties?: Record<string, string | number | boolean>) {
  try {
    track(event, properties);
  } catch {
    // Analytics must never break learning.
  }
}
