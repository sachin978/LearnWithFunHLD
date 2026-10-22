"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, ChevronDown, Clock3, Layers, PenTool, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLearningState, type LearningState } from "@/lib/learn/learning-state";
import { courseProgress, isAvailable, lessonCompletion, nextIncompleteLesson, type StageLesson, type StageProgress } from "@/lib/learn/completion";
import { LESSON_KIND_LABEL, ROADMAP, stageTitle, type LessonKind } from "@/lib/learn/curriculum/roadmap";
import { getDesign } from "@/lib/learn/curriculum";
import { ProgressRing } from "./LessonProgress";

const KIND_STYLE: Record<LessonKind, { cls: string; icon: typeof BookOpen }> = {
  course: { cls: "border-amber-500/40 bg-amber-500/10 text-amber-300", icon: Layers },
  brief: { cls: "border-indigo-500/35 bg-indigo-500/10 text-indigo-300", icon: BookOpen },
  design: { cls: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300", icon: PenTool },
  simulator: { cls: "border-sky-500/35 bg-sky-500/10 text-sky-300", icon: Target },
  planned: { cls: "border-border text-zinc-500", icon: Clock3 },
};

const LEVEL_STYLE = { Beginner: "text-emerald-300", Intermediate: "text-amber-300", Advanced: "text-rose-300" } as const;

const STEPS_LABEL: Partial<Record<LessonKind, string>> = { brief: "6 steps", design: "7 steps", course: "Knowledge check" };

// location.hash as an external store, so arriving at /learn/roadmap#messaging opens that stage.
function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
const useHash = () => useSyncExternalStore(subscribeHash, () => window.location.hash.slice(1), () => "");

type StageState = "complete" | "progress" | "todo" | "soon";
function stageState(s: StageProgress): StageState {
  if (s.total === 0) return "soon";
  if (s.complete) return "complete";
  return s.started ? "progress" : "todo";
}
const STATE_CHIP: Record<StageState, { label: string; cls: string }> = {
  complete: { label: "Complete", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
  progress: { label: "In progress", cls: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  todo: { label: "Not started", cls: "border-border text-zinc-500" },
  soon: { label: "Coming soon", cls: "border-border text-zinc-500" },
};

/** Course-level progress: overall meter, a 12-stage map and the lesson to continue with. */
export function CourseProgressHeader() {
  const learning = useLearningState();
  const cp = courseProgress(learning);
  const next = nextIncompleteLesson(learning);
  const pct = cp.total ? Math.round((cp.done / cp.total) * 100) : 0;

  return (
    <section aria-labelledby="course-progress" className="mt-8 rounded-3xl border border-border bg-card/80 p-5 space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <ProgressRing done={cp.done} total={cp.total} size={56} />
        <div className="flex-1 min-w-[200px]">
          <h2 id="course-progress" className="text-base font-semibold text-white">
            {cp.complete ? "Course complete" : cp.started ? "Your progress" : "Your course"}
          </h2>
          <p className="text-sm text-zinc-400">
            {cp.done} of {cp.total} lessons complete ({pct}%)
            {cp.current && cp.started ? ` · Stage ${cp.current.stage.number} in progress` : ""}
          </p>
        </div>
        {next?.lesson.href && (
          <Link
            href={next.lesson.href}
            className="group inline-flex items-center gap-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <span>
              <span className="block text-[11px] font-normal text-zinc-900/70">
                {next.completion.started ? "Continue" : cp.started ? "Up next" : "Start with"} · Stage {next.stage.number}
                {next.completion.started && next.completion.total > 1 ? ` · ${next.completion.done}/${next.completion.total} steps` : ""}
              </span>
              {next.lesson.title}
            </span>
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      <ol className="grid grid-cols-6 sm:grid-cols-12 gap-1.5" aria-label="Progress by stage">
        {cp.stages.map((s) => {
          const f = s.total ? s.done / s.total : 0;
          const isCurrent = cp.current?.stage.number === s.stage.number;
          return (
            <li key={s.stage.id}>
              <a
                href={`#${s.stage.id}`}
                title={`Stage ${s.stage.number}: ${s.stage.title} — ${s.done} of ${s.total} lessons complete`}
                aria-label={`Stage ${s.stage.number}: ${s.stage.title} — ${s.done} of ${s.total} lessons complete`}
                className={cn("block rounded-lg border p-1.5 hover:border-zinc-500 transition", isCurrent ? "border-amber-500/50" : "border-border")}
              >
                <span className="block h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <span className={cn("block h-full", s.complete ? "bg-emerald-400" : "bg-amber-400")} style={{ width: `${f * 100}%` }} />
                </span>
                <span className={cn("mt-1 block text-center text-[10px] font-mono", s.complete ? "text-emerald-300" : isCurrent ? "text-amber-300" : "text-zinc-500")}>
                  {s.complete ? "✓" : s.stage.number}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
      <p className="text-[11px] text-zinc-500">
        A lesson is complete when you&apos;ve done its activities: all six steps of a brief, all seven steps of a design, or a chapter&apos;s knowledge check. Saved in this browser only.
      </p>
    </section>
  );
}

export function RoadmapLegend() {
  const kinds = (Object.keys(LESSON_KIND_LABEL) as LessonKind[]).filter((k) => ROADMAP.some((s) => s.lessons.some((l) => l.kind === k)));
  return (
    <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500" aria-label="Legend">
      {kinds.map((k) => {
        const S = KIND_STYLE[k];
        return (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-md border", S.cls)}>
              <S.icon size={11} />
            </span>
            {LESSON_KIND_LABEL[k]}
          </span>
        );
      })}
    </div>
  );
}

function LessonRow({ lesson, learning }: { lesson: StageLesson; learning: LearningState }) {
  const S = KIND_STYLE[lesson.kind];
  const available = isAvailable(lesson);
  const c = lessonCompletion(lesson, learning);
  const slug = lesson.href?.split("#")[0].split("/").pop() ?? "";
  const designLevel = lesson.kind === "design" ? getDesign(slug)?.level : undefined;
  const weakRecall = lesson.kind === "brief" && learning.briefs[slug]?.recall === "weak";
  const showTopics = lesson.topics.length > 1 || (lesson.topics[0] && lesson.topics[0] !== lesson.title);

  const body = (
    <>
      <span className={cn("inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border", S.cls)} title={LESSON_KIND_LABEL[lesson.kind]}>
        <S.icon size={13} />
      </span>
      <span className="flex-1 min-w-0">
        <span className={cn("block text-sm leading-snug font-medium", available ? "text-zinc-100" : "text-zinc-500")}>{lesson.title}</span>
        <span className="block text-[11px] text-zinc-500">
          {designLevel && <span className={cn("mr-1.5", LEVEL_STYLE[designLevel])}>{designLevel}</span>}
          {!designLevel && lesson.level === "advanced" && <span className="mr-1.5 text-violet-300">Advanced</span>}
          {lesson.optional && <span className="mr-1.5 text-amber-300">Optional deep dive</span>}
          {available ? LESSON_KIND_LABEL[lesson.kind] : "Coming soon"}
          {lesson.minutes ? ` · ~${lesson.minutes} min` : ""}
          {available && !lesson.optional && STEPS_LABEL[lesson.kind] ? ` · ${STEPS_LABEL[lesson.kind]}` : ""}
        </span>
        {showTopics && <span className="mt-0.5 block text-[11px] text-zinc-400">Covers: {lesson.topics.join(" · ")}</span>}
        {weakRecall && <span className="mt-1 inline-block rounded border border-rose-500/30 px-1.5 py-px text-[10px] text-rose-300">Self-test: missed</span>}
      </span>
      {available &&
        (c.complete ? (
          <span className="shrink-0 self-center inline-flex items-center gap-1 text-[11px] text-emerald-300">
            <CheckCircle2 size={15} /> Complete
          </span>
        ) : c.done > 0 && c.total > 1 ? (
          <ProgressRing done={c.done} total={c.total} className="self-center" />
        ) : c.started ? (
          <span className="shrink-0 self-center text-[11px] text-zinc-400">Opened</span>
        ) : null)}
    </>
  );

  return (
    <li>
      {available && lesson.href ? (
        <Link
          href={lesson.href}
          className={cn(
            "flex items-start gap-3 rounded-xl border bg-card px-3 py-2.5 transition hover:border-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
            c.complete ? "border-emerald-500/25" : "border-border/70",
          )}
        >
          {body}
        </Link>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-dashed border-border/70 px-3 py-2.5" aria-label={`${lesson.title} (coming soon, not available yet)`}>
          {body}
        </div>
      )}
    </li>
  );
}

/**
 * The 12 stages as collapsible cards with per-stage progress. Stages in
 * progress (or the first unfinished one) open by default; arriving with a
 * #stage hash opens that stage. Collapsed content stays in the page, hidden.
 */
export function RoadmapStages() {
  const learning = useLearningState();
  const cp = courseProgress(learning);
  const hash = useHash();
  const [override, setOverride] = useState<Record<string, boolean>>({});

  const defaultOpen = (s: StageProgress) => s.stage.id === hash || (s.started && !s.complete) || cp.current?.stage.number === s.stage.number;
  const isOpen = (s: StageProgress) => override[s.stage.id] ?? defaultOpen(s);
  const setAll = (open: boolean) => setOverride(Object.fromEntries(cp.stages.map((s) => [s.stage.id, open])));
  const openStage = (id: string) => setOverride((o) => ({ ...o, [id]: true }));

  return (
    <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10">
      <nav aria-label="Stages" className="hidden lg:block sticky top-20 self-start">
        <ol className="space-y-0.5 text-sm">
          {cp.stages.map((s) => (
            <li key={s.stage.id}>
              <a
                href={`#${s.stage.id}`}
                onClick={() => openStage(s.stage.id)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900"
              >
                {s.complete ? (
                  <CheckCircle2 size={14} className="w-5 text-emerald-400" aria-label="complete" />
                ) : (
                  <span className="font-mono text-[11px] text-zinc-600 w-5">{String(s.stage.number).padStart(2, "0")}</span>
                )}
                <span className="truncate flex-1">{s.stage.title}</span>
                {s.total > 0 && (
                  <span className={cn("text-[10px] font-mono", s.complete ? "text-emerald-400" : s.started ? "text-amber-300" : "text-zinc-600")}>
                    {s.done}/{s.total}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div>
        <div className="mb-3 flex justify-end gap-3 text-xs">
          <button type="button" onClick={() => setAll(true)} className="text-zinc-400 hover:text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            Expand all
          </button>
          <button type="button" onClick={() => setAll(false)} className="text-zinc-400 hover:text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            Collapse all
          </button>
        </div>
        <ol className="space-y-3">
          {cp.stages.map((s) => {
            const open = isOpen(s);
            const state = stageState(s);
            const chip = STATE_CHIP[state];
            const isCurrent = cp.current?.stage.number === s.stage.number;
            const panelId = `${s.stage.id}-panel`;
            return (
              <li key={s.stage.id} id={s.stage.id} className={cn("scroll-mt-20 rounded-2xl border bg-card/60", isCurrent ? "border-amber-500/40" : s.complete ? "border-emerald-500/25" : "border-border")}>
                <h2>
                  <button
                    type="button"
                    onClick={() => setOverride((o) => ({ ...o, [s.stage.id]: !open }))}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    {s.total > 0 && (s.started || s.complete) ? (
                      <ProgressRing done={s.done} total={s.total} size={38} />
                    ) : (
                      <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-border font-mono text-sm text-zinc-400">{s.stage.number}</span>
                    )}
                    <span className="flex-1 min-w-0">
                      <span className="block text-[11px] text-zinc-500">
                        Stage {s.stage.number}
                        {isCurrent && <span className="ml-1.5 text-amber-300">· You are here</span>}
                      </span>
                      <span className="block font-semibold text-white leading-snug">{s.stage.title}</span>
                      <span className="block text-xs text-zinc-400 mt-0.5">{s.stage.goal}</span>
                    </span>
                    <span className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", chip.cls)}>{chip.label}</span>
                      {s.total > 0 && (
                        <span className="text-[11px] text-zinc-500">
                          {s.done}/{s.total} lessons{s.planned ? ` · ${s.planned} coming soon` : ""}
                        </span>
                      )}
                    </span>
                    <ChevronDown size={16} className={cn("shrink-0 text-zinc-500 transition-transform", open && "rotate-180")} />
                  </button>
                </h2>

                <div id={panelId} hidden={!open} className="px-4 pb-4 space-y-4">
                  <div className="sm:hidden flex items-center gap-2 text-[11px]">
                    <span className={cn("rounded-full border px-2 py-0.5", chip.cls)}>{chip.label}</span>
                    {s.total > 0 && (
                      <span className="text-zinc-500">
                        {s.done}/{s.total} lessons{s.planned ? ` · ${s.planned} coming soon` : ""}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-[1.3fr_1fr] text-sm">
                    <p className="text-zinc-300 leading-relaxed">
                      <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 mr-1.5">Why it matters</span>
                      {s.stage.whyItMatters}
                    </p>
                    <div className="text-xs text-zinc-400 space-y-1.5">
                      <p>
                        <span className="font-semibold text-zinc-300">Builds on: </span>
                        {s.stage.prerequisites.length
                          ? s.stage.prerequisites.map((n, i) => {
                              const target = ROADMAP.find((x) => x.number === n);
                              return (
                                <span key={n}>
                                  {i > 0 && ", "}
                                  <a href={`#${target?.id}`} onClick={() => target && openStage(target.id)} className="text-indigo-300 hover:text-indigo-200">
                                    {n}. {stageTitle(n)}
                                  </a>
                                </span>
                              );
                            })
                          : "nothing — start here anytime"}
                      </p>
                      <div>
                        <p className="font-semibold text-zinc-300">Afterwards you can:</p>
                        <ul className="mt-0.5 space-y-0.5">
                          {s.stage.outcomes.map((o) => (
                            <li key={o} className="flex gap-1.5">
                              <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-400" />
                              {o}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>


                  <ol className="grid gap-2">
                    {s.lessons.map((l) => (
                      <LessonRow key={l.key} lesson={l} learning={learning} />
                    ))}
                  </ol>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/** One-line course progress for path cards; renders nothing until the learner has started. */
export function CourseProgressInline() {
  const learning = useLearningState();
  const cp = courseProgress(learning);
  if (!cp.started) return null;
  return (
    <div className="mb-4" aria-label={`${cp.done} of ${cp.total} lessons complete`}>
      <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
        <span>{cp.current ? `You're in Stage ${cp.current.stage.number}` : "Every stage complete"}</span>
        <span className="font-mono text-emerald-300">
          {cp.done}/{cp.total} lessons
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${cp.total ? (cp.done / cp.total) * 100 : 0}%` }} />
      </div>
    </div>
  );
}
