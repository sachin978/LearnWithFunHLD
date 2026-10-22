import { DESIGNS, briefHref, designHref, designShortTitle, getBrief } from "./curriculum";
import { PREP_PLANS } from "./curriculum/prep";
import { WORKFLOW } from "./curriculum/types";
import type { LearnProgress, PrepProgress } from "./progress";
import type { LearningState } from "./learning-state";
import { deckStatus } from "./review";
import { LESSON_STEPS, briefCompletion, briefStepsDone, chapterQuizKey } from "./completion";

/**
 * Personalised next actions, derived only from what the learner has actually
 * done. Returns nothing when there's no activity — callers then show the
 * default two paths instead of generic recommendations.
 */

export interface NextStep {
  id: string;
  /** Lower = more specific to the learner's situation, shown first. */
  priority: number;
  kind: "prep" | "revisit" | "review" | "lesson" | "design" | "quiz" | "course" | "mock";
  title: string;
  detail: string;
  href: string;
  cta: string;
}

const TOTAL_STEPS = WORKFLOW.length;

export function computeNextSteps(
  learning: LearningState,
  prep: PrepProgress,
  course: LearnProgress | null,
  now = Date.now(),
): NextStep[] {
  const steps: NextStep[] = [];

  // The next essential task in an active prep plan.
  if (prep.last) {
    const plan = PREP_PLANS[prep.last];
    const done = new Set(prep.done[String(prep.last) as "1" | "3" | "7"] ?? []);
    const next = plan.days.flatMap((d) => d.tasks.map((t) => ({ ...t, day: d.title }))).find((t) => t.essential && !done.has(t.id));
    if (next) {
      steps.push({
        id: "prep",
        priority: 1,
        kind: "prep",
        title: `Next in your ${plan.label} plan`,
        detail: `${next.day}: ${next.title}`,
        href: next.href.startsWith("#") ? `/learn/interview-prep?days=${prep.last}${next.href}` : next.href,
        cta: "Start task",
      });
    }
  }

  // Self-tests answered weakly — the clearest signal of a gap.
  const weak = Object.entries(learning.briefs)
    .filter(([, p]) => p.recall === "weak")
    .sort((a, b) => (b[1].recallAt ?? 0) - (a[1].recallAt ?? 0));
  for (const [slug] of weak.slice(0, 1)) {
    const b = getBrief(slug);
    if (b) {
      steps.push({
        id: `revisit-${slug}`,
        priority: 2,
        kind: "revisit",
        title: `Revisit ${b.shortTitle}`,
        detail: "Your self-test answer missed the key idea. Re-read the worked example, then try the question again.",
        href: `${briefHref(slug)}#test-yourself`,
        cta: "Try again",
      });
    }
  }

  // Spaced review that's due, or an invitation to start once a few briefs are open.
  const deck = deckStatus(learning.review, now);
  if (deck.due.length > 0) {
    steps.push({
      id: "review",
      priority: 3,
      kind: "review",
      title: `${deck.due.length} review card${deck.due.length === 1 ? "" : "s"} due`,
      detail: "Answer from memory, then check yourself — a few minutes now keeps it fresh for the interview.",
      href: "/learn/review",
      cta: "Review now",
    });
  } else if (Object.keys(learning.review).length === 0 && Object.values(learning.briefs).filter((p) => p.openedAt).length >= 2) {
    steps.push({
      id: "review-start",
      priority: 7,
      kind: "review",
      title: "Lock in what you've read",
      detail: "You've opened a few briefs. Spaced review asks you their interview questions again over the next days.",
      href: "/learn/review",
      cta: "Start reviewing",
    });
  }

  // A brief started but not finished — the most recently active one.
  const lastActive = (p: LearningState["briefs"][string]) => Math.max(p.openedAt ?? 0, p.recallAt ?? 0, p.explainedAt ?? 0);
  const partialBrief = Object.entries(learning.briefs)
    .filter(([slug, p]) => {
      const c = briefCompletion(p);
      return c.done > 0 && !c.complete && !weak.some(([w]) => w === slug);
    })
    .sort((a, b) => lastActive(b[1]) - lastActive(a[1]))[0];
  if (partialBrief) {
    const [slug, p] = partialBrief;
    const b = getBrief(slug);
    const done = briefStepsDone(p);
    const todo = LESSON_STEPS.find((s) => !done.has(s.id));
    if (b && todo) {
      steps.push({
        id: `finish-${slug}`,
        priority: 5,
        kind: "lesson",
        title: `Finish ${b.shortTitle}`,
        detail: `${done.size} of ${LESSON_STEPS.length} steps done. Next: ${todo.todo.charAt(0).toLowerCase()}${todo.todo.slice(1)}.`,
        href: `${briefHref(slug)}#${todo.id === "recall" ? "test-yourself" : todo.id}`,
        cta: "Continue",
      });
    }
  }

  // A design walkthrough left part-way through.
  const partial = Object.entries(learning.designs)
    .filter(([, d]) => d.revealed.length > 0 && d.revealed.length < TOTAL_STEPS)
    .sort((a, b) => (b[1].updatedAt ?? 0) - (a[1].updatedAt ?? 0))[0];
  if (partial) {
    const d = DESIGNS.find((x) => x.slug === partial[0]);
    if (d) {
      steps.push({
        id: `design-${d.slug}`,
        priority: 5,
        kind: "design",
        title: `Continue: ${designShortTitle(d)}`,
        detail: `${partial[1].revealed.length} of ${TOTAL_STEPS} steps attempted.`,
        href: designHref(d.slug),
        cta: "Continue",
      });
    }
  }

  // Quiz questions answered incorrectly.
  const rabbitQuiz = learning.quizzes[chapterQuizKey("rabbitmq", "cheat-sheet")];
  if (rabbitQuiz && rabbitQuiz.missed.length > 0) {
    steps.push({
      id: "quiz-rabbitmq",
      priority: 4,
      kind: "quiz",
      title: `Review ${rabbitQuiz.missed.length} missed RabbitMQ question${rabbitQuiz.missed.length === 1 ? "" : "s"}`,
      detail: `You scored ${rabbitQuiz.score}/${rabbitQuiz.total} on the final assessment. The questions you missed are marked, and each answer explains why the other options fail.`,
      href: "/learn/rabbitmq#final-assessment",
      cta: "Review",
    });
  }

  // A course in progress.
  if (course && course.chapterNumber < course.totalChapters) {
    steps.push({
      id: "course",
      priority: 6,
      kind: "course",
      title: `Continue ${course.courseTitle}`,
      detail: `You reached chapter ${course.chapterNumber} of ${course.totalChapters}: ${course.chapterTitle}.`,
      href: `/learn/${course.course}#${course.chapterId}`,
      cta: "Continue",
    });
  }

  // Ready for a mock: two or more designs fully worked through.
  const finishedDesigns = Object.values(learning.designs).filter((d) => d.revealed.length >= TOTAL_STEPS).length;
  if (finishedDesigns >= 2 && !steps.some((s) => s.kind === "prep")) {
    steps.push({
      id: "mock",
      priority: 8,
      kind: "mock",
      title: "Try a timed mock interview",
      detail: `You've worked through ${finishedDesigns} designs. Practise one you haven't seen, out loud, in 45 minutes.`,
      href: "/simulator",
      cta: "Open simulator",
    });
  }

  // Specific signals (plan, missed answers, due reviews) before generic nudges.
  return steps.sort((a, b) => a.priority - b.priority);
}
