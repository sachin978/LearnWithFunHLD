"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { CheckCircle2, ChevronDown, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveLearnProgress } from "@/lib/learn/progress";
import { recordCourseChapter, useLearningState } from "@/lib/learn/learning-state";
import { chapterComplete } from "@/lib/learn/completion";

export interface NavChapter {
  id: string;
  number: number;
  navTitle: string;
  minutes: number;
}

/**
 * Highlights the chapter currently in the reading zone of the viewport.
 * `onReach` fires only when a chapter genuinely scrolls into that zone (never
 * on initial render), so saved progress reflects real reading.
 */
function useActiveChapter(ids: string[], onReach?: (id: string) => void) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActive(visible[0].target.id);
          onReach?.(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids, onReach]);
  return active;
}

export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 right-0 h-0.5 origin-left z-[60] bg-gradient-to-r from-indigo-500 via-indigo-400 to-amber-400"
      style={{ scaleX }}
    />
  );
}

function ChapterList({ chapters, active, completed, onNavigate }: { chapters: NavChapter[]; active: string; completed: Set<string>; onNavigate?: () => void }) {
  return (
    <ol className="space-y-0.5">
      {chapters.map((c) => {
        const isActive = c.id === active;
        const isDone = completed.has(c.id);
        return (
          <li key={c.id}>
            <a
              href={`#${c.id}`}
              onClick={onNavigate}
              aria-current={isActive ? "location" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                isActive ? "bg-indigo-500/10 text-indigo-300" : "text-zinc-400 hover:text-white hover:bg-zinc-900",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-mono",
                  isDone
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : isActive
                      ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-200"
                      : "border-zinc-700 text-zinc-500 group-hover:border-zinc-500",
                )}
              >
                {isDone ? <CheckCircle2 size={13} aria-label="complete" /> : c.number}
              </span>
              <span className="flex-1 leading-snug">{c.navTitle}</span>
              <span className="text-[10px] text-zinc-600">{c.minutes}m</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * "desktop": sticky sidebar with scroll-spy, rendered in the aside column.
 * "mobile": collapsible bar that sticks under the top nav; render it inside
 * the content column so it stays pinned while chapters scroll past.
 */
export function ChapterNavigation({
  chapters,
  variant,
  course,
}: {
  chapters: NavChapter[];
  variant: "mobile" | "desktop";
  /** When set, the reached chapter is remembered for the home page's Continue chip. */
  course?: { slug: string; title: string };
}) {
  const [ids] = useState(() => chapters.map((c) => c.id));
  // Both variants are always mounted (one is CSS-hidden); only the desktop one records progress.
  const onReach = useCallback(
    (id: string) => {
      const c = chapters.find((ch) => ch.id === id);
      if (!course || variant !== "desktop" || !c) return;
      saveLearnProgress({ course: course.slug, courseTitle: course.title, chapterId: c.id, chapterNumber: c.number, chapterTitle: c.navTitle, totalChapters: chapters.length });
      recordCourseChapter(course.slug, c.id);
    },
    [chapters, course, variant],
  );
  const active = useActiveChapter(ids, onReach);
  const [open, setOpen] = useState(false);
  const learning = useLearningState();
  // A chapter is complete once its knowledge check (or the final assessment) is answered.
  const completed = new Set(course ? chapters.filter((c) => chapterComplete(learning, course.slug, c.id)).map((c) => c.id) : []);
  const current = chapters.find((c) => c.id === active) ?? chapters[0];
  const progress = Math.round((completed.size / chapters.length) * 100);

  if (variant === "mobile")
    return (
      <div className="lg:hidden sticky top-14 z-40 -mx-4 px-4 py-2 border-b border-border bg-background/90 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-chapter-menu"
          className="w-full flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <ListOrdered size={15} className="text-indigo-400" />
          <span className="truncate">
            <span className="text-zinc-500 mr-1">Ch {current.number}/{chapters.length}</span>
            {current.navTitle}
          </span>
          {course && (
            <span className="ml-auto shrink-0 text-[11px] font-mono text-emerald-300/80" aria-label={`${completed.size} of ${chapters.length} chapters complete`}>
              {completed.size}/{chapters.length} ✓
            </span>
          )}
          <ChevronDown size={15} className={cn(!course && "ml-auto", "shrink-0 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <nav id="mobile-chapter-menu" aria-label="Chapters" className="mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-card p-2">
            <ChapterList chapters={chapters} active={active} completed={completed} onNavigate={() => setOpen(false)} />
          </nav>
        )}
      </div>
    );

  return (
      <nav aria-label="Chapters" className="hidden lg:block sticky top-20 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
        <div className="mb-3 px-3">
          <div className="flex justify-between text-[11px] text-zinc-500 mb-1.5">
            <span>Course progress</span>
            <span>
              {completed.size} of {chapters.length} chapters complete
            </span>
          </div>
          <div className="h-1 rounded-full bg-zinc-800 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Chapters complete">
            <div className={cn("h-full transition-all duration-500", progress === 100 ? "bg-emerald-400" : "bg-indigo-500")} style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-[10px] text-zinc-600">A chapter counts once you answer its knowledge check.</p>
        </div>
        <ChapterList chapters={chapters} active={active} completed={completed} />
      </nav>
  );
}
