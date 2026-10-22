import { designShortTitle, getBrief, getDesign } from "./curriculum";
import { ROADMAP, type LessonKind, type RoadmapStage } from "./curriculum/roadmap";
import { WORKFLOW } from "./curriculum/types";
import type { BriefProgress, DesignProgress, LearningState } from "./learning-state";

/**
 * Course structure and completion, derived only from recorded actions.
 *
 *   Course → 12 stages → lessons → steps
 *
 * A brief's six steps follow the learning loop. The four reading steps count
 * once the learner has scrolled to the end of them; Explain counts once they
 * compared their own answer with the model answer; Recall once they answered
 * the self-test. A design walkthrough is complete when all seven steps were
 * attempted; a course chapter when its knowledge check was answered.
 * "Complete" means the activities were done — never that a topic is mastered.
 */

export const LESSON_STEPS = [
  { id: "understand", label: "Understand", todo: "Read the problem and the intuition" },
  { id: "visualize", label: "Visualize", todo: "Go through how it works" },
  { id: "practise", label: "Practise", todo: "Work through the example" },
  { id: "apply", label: "Apply", todo: "Read the trade-offs and failure modes" },
  { id: "explain", label: "Explain", todo: "Explain it yourself, then compare with the model answer" },
  { id: "recall", label: "Recall", todo: "Answer the self-test" },
] as const;

export type LessonStepId = (typeof LESSON_STEPS)[number]["id"];

/** Steps completed by scrolling to their end (the others need an action). */
export const READING_STEPS: LessonStepId[] = ["understand", "visualize", "practise", "apply"];

export interface Completion {
  done: number;
  total: number;
  started: boolean;
  complete: boolean;
}

const completion = (done: number, total: number, started = done > 0): Completion => ({ done, total, started, complete: total > 0 && done >= total });

const slugOf = (href: string) => href.split("#")[0].split("/").pop() ?? "";

export function briefStepsDone(p: BriefProgress | undefined): Set<LessonStepId> {
  const done = new Set<LessonStepId>();
  for (const s of READING_STEPS) if (p?.seen?.includes(s)) done.add(s);
  if (p?.explainedAt) done.add("explain");
  if (p?.recall) done.add("recall");
  return done;
}

export function briefCompletion(p: BriefProgress | undefined): Completion {
  const done = briefStepsDone(p).size;
  return completion(done, LESSON_STEPS.length, done > 0 || Boolean(p?.openedAt));
}

export function designCompletion(d: DesignProgress | undefined): Completion {
  const done = Math.min(d?.revealed.length ?? 0, WORKFLOW.length);
  return completion(done, WORKFLOW.length, done > 0 || Boolean(d?.openedAt));
}

/** Storage key for a course chapter's knowledge check (the last chapter's is the final assessment). */
export const chapterQuizKey = (course: string, chapterId: string) => `${course}:${chapterId}`;

export function chapterComplete(learning: LearningState, course: string, chapterId: string): boolean {
  return Boolean(learning.quizzes[chapterQuizKey(course, chapterId)]);
}

// ─── Stages → lessons ────────────────────────────────────────────────────────

/** One lesson in a stage. Several roadmap topics can share one lesson (e.g. four caching topics → the caching brief). */
export interface StageLesson {
  key: string;
  kind: LessonKind;
  title: string;
  href?: string;
  minutes?: number;
  level: "essential" | "advanced";
  /** The roadmap topics this lesson covers in this stage. */
  topics: string[];
  /** Optional deep dives are listed but don't count towards stage or course completion. */
  optional: boolean;
}

function buildStageLessons(stage: RoadmapStage): StageLesson[] {
  const out: StageLesson[] = [];
  const byKey = new Map<string, StageLesson>();
  for (const t of stage.lessons) {
    const key = t.href ?? `planned:${t.title}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.topics.push(t.title);
      if (t.level === "essential") existing.level = "essential";
      continue;
    }
    let title = t.title;
    let minutes: number | undefined;
    if (t.kind === "brief" && t.href) {
      const b = getBrief(slugOf(t.href));
      if (b) {
        title = b.title;
        minutes = b.minutes;
      }
    }
    if (t.kind === "design" && t.href) {
      const d = getDesign(slugOf(t.href));
      if (d) {
        title = designShortTitle(d);
        minutes = d.minutes;
      }
    }
    const lesson: StageLesson = { key, kind: t.kind, title, href: t.href, minutes, level: t.level, topics: [t.title], optional: Boolean(t.optional) };
    byKey.set(key, lesson);
    out.push(lesson);
  }
  return out;
}

const STAGE_LESSONS = new Map(ROADMAP.map((s) => [s.number, buildStageLessons(s)]));

export function stageLessons(stage: RoadmapStage): StageLesson[] {
  return STAGE_LESSONS.get(stage.number) ?? [];
}

export const isAvailable = (l: StageLesson) => Boolean(l.href) && l.kind !== "planned";

/** Available and part of the required path (optional deep dives excluded). */
export const counts = (l: StageLesson) => isAvailable(l) && !l.optional;

export function lessonCompletion(l: StageLesson, learning: LearningState): Completion {
  if (!isAvailable(l) || !l.href) return completion(0, 0);
  const slug = slugOf(l.href);
  if (l.kind === "brief") return briefCompletion(learning.briefs[slug]);
  if (l.kind === "design") return designCompletion(learning.designs[slug]);
  if (l.kind === "course") {
    const chapter = l.href.split("#")[1];
    if (!chapter) return completion(0, 0, (learning.courseChapters[slug] ?? []).length > 0);
    const done = chapterComplete(learning, slug, chapter);
    return completion(done ? 1 : 0, 1, done || (learning.courseChapters[slug] ?? []).includes(chapter));
  }
  return completion(0, 0);
}

export interface StageProgress extends Completion {
  stage: RoadmapStage;
  lessons: StageLesson[];
  /** Topics with no lesson yet. */
  planned: number;
}

export function stageProgress(stage: RoadmapStage, learning: LearningState): StageProgress {
  const lessons = stageLessons(stage);
  const available = lessons.filter(counts);
  const states = available.map((l) => lessonCompletion(l, learning));
  const done = states.filter((c) => c.complete).length;
  return {
    ...completion(done, available.length, states.some((c) => c.started)),
    stage,
    lessons,
    planned: lessons.filter((l) => !isAvailable(l)).length,
  };
}

export interface CourseProgress extends Completion {
  stages: StageProgress[];
  /** The first stage that isn't complete — where the learner is in the course. */
  current: StageProgress | null;
}

/** Whole-roadmap progress over unique lessons (a lesson listed in two stages counts once). */
export function courseProgress(learning: LearningState): CourseProgress {
  const stages = ROADMAP.map((s) => stageProgress(s, learning));
  const unique = new Map<string, StageLesson>();
  for (const s of stages) for (const l of s.lessons) if (counts(l) && !unique.has(l.key)) unique.set(l.key, l);
  const states = [...unique.values()].map((l) => lessonCompletion(l, learning));
  const done = states.filter((c) => c.complete).length;
  return {
    ...completion(done, unique.size, states.some((c) => c.started)),
    stages,
    current: stages.find((s) => s.total > 0 && !s.complete) ?? null,
  };
}

/** The first lesson in roadmap order that isn't complete. */
export function nextIncompleteLesson(learning: LearningState): { stage: RoadmapStage; lesson: StageLesson; completion: Completion } | null {
  for (const stage of ROADMAP) {
    for (const lesson of stageLessons(stage)) {
      if (!counts(lesson)) continue;
      const c = lessonCompletion(lesson, learning);
      if (!c.complete) return { stage, lesson, completion: c };
    }
  }
  return null;
}

/** "Stage 4 · Lesson 1 of 2" — the lesson's place among the available lessons of a stage. */
export function lessonPosition(key: string, preferredStage?: number): { stage: RoadmapStage; index: number; count: number } | null {
  const ordered = preferredStage ? [...ROADMAP.filter((s) => s.number === preferredStage), ...ROADMAP] : ROADMAP;
  for (const stage of ordered) {
    const available = stageLessons(stage).filter(counts);
    const index = available.findIndex((l) => l.key === key);
    if (index >= 0) return { stage, index, count: available.length };
  }
  return null;
}
