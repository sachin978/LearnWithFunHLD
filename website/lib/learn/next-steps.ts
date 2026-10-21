import { BRIEFS, DESIGNS, briefHref, designHref, designShortTitle, getBrief } from "./curriculum";
import { PREP_PLANS } from "./curriculum/prep";
import { ROADMAP, type RoadmapLesson, type RoadmapStage } from "./curriculum/roadmap";
import { WORKFLOW } from "./curriculum/types";
import type { LearnProgress, PrepProgress } from "./progress";
import type { LearningState } from "./learning-state";
import { deckStatus } from "./review";

/**
 * Personalised next actions, derived only from what the learner has actually
 * done. Returns nothing when there's no activity — callers then show the
 * default two paths instead of generic recommendations.
 */

export interface NextStep {
  id: string;
  /** Lower = more specific to the learner's situation, shown first. */
  priority: number;
  kind: "prep" | "revisit" | "review" | "design" | "quiz" | "course" | "mock";
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
  const rabbitQuiz = learning.quizzes["rabbitmq-final"];
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

/** The first available roadmap lesson the learner hasn't opened yet, in stage order. */
export function nextRoadmapLesson(learning: LearningState): { stage: RoadmapStage; lesson: RoadmapLesson } | null {
  const openedBriefs = new Set(Object.entries(learning.briefs).filter(([, p]) => p.openedAt).map(([s]) => s));
  const openedDesigns = new Set(Object.entries(learning.designs).filter(([, d]) => d.openedAt).map(([s]) => s));
  const seenChapters = new Set(learning.courseChapters["rabbitmq"] ?? []);
  for (const stage of ROADMAP) {
    for (const lesson of stage.lessons) {
      if (!lesson.href || lesson.kind === "planned") continue;
      const slug = lesson.href.split("/").pop()?.split("#")[0] ?? "";
      if (lesson.kind === "brief" && !openedBriefs.has(slug)) return { stage, lesson };
      if (lesson.kind === "design" && !openedDesigns.has(slug)) return { stage, lesson };
      if (lesson.kind === "course") {
        const chapter = lesson.href.split("#")[1];
        if (chapter && !seenChapters.has(chapter)) return { stage, lesson };
      }
    }
  }
  return null;
}

/** Human-readable status for one roadmap lesson, from recorded actions only. */
export function lessonStatus(lesson: RoadmapLesson, learning: LearningState): { label: string; tone: "zinc" | "emerald" | "amber" | "rose" | "indigo" } | null {
  if (!lesson.href) return null;
  const path = lesson.href.split("#")[0];
  const slug = path.split("/").pop() ?? "";
  if (lesson.kind === "brief") {
    const p = learning.briefs[slug];
    if (!p) return null;
    if (p.recall === "best") return { label: "Self-test: strong", tone: "emerald" };
    if (p.recall === "valid") return { label: "Self-test: partly right", tone: "amber" };
    if (p.recall === "weak") return { label: "Self-test: missed", tone: "rose" };
    return p.openedAt ? { label: "Opened", tone: "zinc" } : null;
  }
  if (lesson.kind === "design") {
    const d = learning.designs[slug];
    if (!d) return null;
    if (d.revealed.length >= TOTAL_STEPS) return { label: "All steps attempted", tone: "emerald" };
    if (d.revealed.length > 0) return { label: `${d.revealed.length}/${TOTAL_STEPS} steps`, tone: "amber" };
    return d.openedAt ? { label: "Opened", tone: "zinc" } : null;
  }
  if (lesson.kind === "course") {
    const chapter = lesson.href.split("#")[1];
    if (chapter && (learning.courseChapters["rabbitmq"] ?? []).includes(chapter)) return { label: "Visited", tone: "indigo" };
  }
  return null;
}

export const ALL_BRIEF_SLUGS = BRIEFS.map((b) => b.slug);
