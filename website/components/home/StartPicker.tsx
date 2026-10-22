"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, CalendarDays, Compass, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PlanSummary {
  horizon: 1 | 3 | 7;
  label: string;
  tagline: string;
  essentials: number;
  essentialMinutes: number;
  days: { title: string; focus: string }[];
}

export interface StartPickerData {
  plans: PlanSummary[];
  roadmap: { stages: number; lessons: number; minMinutes: number; maxMinutes: number; firstStages: string[]; firstLesson: { title: string; href: string } | null };
  practice: { problems: number; easy: number; medium: number; hard: number; phases: number; walkthrough: { title: string; href: string } };
}

type Choice = "soon" | "week" | "deep" | "practice";

const OPTIONS: { id: Choice; label: string; hint: string; icon: typeof Compass; tone: string }[] = [
  { id: "soon", label: "My interview is in the next few days", hint: "1 or 3-day plan", icon: CalendarClock, tone: "amber" },
  { id: "week", label: "My interview is about a week away", hint: "7-day plan", icon: CalendarDays, tone: "amber" },
  { id: "deep", label: "No interview yet — I want to really understand it", hint: "Step-by-step course", icon: Compass, tone: "emerald" },
  { id: "practice", label: "I know the basics — I want to practise", hint: "Design simulator", icon: PenTool, tone: "indigo" },
];

const TONE = {
  amber: { on: "border-amber-500/60 bg-amber-500/[0.08]", icon: "text-amber-300", cta: "bg-amber-500 hover:bg-amber-400 text-zinc-950 focus-visible:ring-amber-300" },
  emerald: { on: "border-emerald-500/60 bg-emerald-500/[0.08]", icon: "text-emerald-300", cta: "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 focus-visible:ring-emerald-300" },
  indigo: { on: "border-indigo-500/60 bg-indigo-500/[0.10]", icon: "text-indigo-300", cta: "bg-indigo-600 hover:bg-indigo-500 text-white focus-visible:ring-indigo-400" },
} as const;

const hours = (min: number) => (min < 90 ? `${min} min` : `${Math.round((min / 60) * 2) / 2} h`);

function Cta({ href, tone, children }: { href: string; tone: keyof typeof TONE; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2", TONE[tone].cta)}>
      {children} <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

/**
 * Goal-first onboarding: one question ("where are you?") instead of a menu of
 * products. Each answer reveals a concrete plan — real task counts, time and
 * the first step — with a single primary action. A keyboard-operable radio group.
 */
export function StartPicker({ data }: { data: StartPickerData }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const plan = (h: 1 | 3 | 7) => data.plans.find((p) => p.horizon === h);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const delta = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + OPTIONS.length) % OPTIONS.length;
    setChoice(OPTIONS[next].id);
    refs.current[next]?.focus();
  };

  const focusIndex = choice ? OPTIONS.findIndex((o) => o.id === choice) : 0;

  return (
    <section id="start" aria-labelledby="start-heading" className="scroll-mt-20 rounded-3xl border border-border bg-card/90 p-4 sm:p-5 shadow-2xl shadow-black/30">
      <h2 id="start-heading" className="text-lg font-semibold text-white">
        Where should you start?
      </h2>
      <p className="text-xs text-zinc-500 mt-0.5 mb-3">Answer one question and we&apos;ll show you a plan. You can change it any time.</p>

      <div role="radiogroup" aria-labelledby="start-heading" className="grid gap-2">
        {OPTIONS.map((o, i) => {
          const on = choice === o.id;
          const t = TONE[o.tone as keyof typeof TONE];
          return (
            <button
              key={o.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={i === focusIndex ? 0 : -1}
              onClick={() => setChoice(o.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                on ? t.on : "border-border bg-background/40 hover:border-zinc-600",
              )}
            >
              <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full border", on ? "border-white" : "border-zinc-600")} aria-hidden>
                {on && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
              <o.icon size={16} className={cn("shrink-0", t.icon)} aria-hidden />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-zinc-100">{o.label}</span>
              </span>
              <span className="hidden sm:block shrink-0 text-[11px] text-zinc-500">{o.hint}</span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="mt-3 rounded-2xl border border-border/70 bg-background/50 p-4 min-h-[148px]">
        {choice === null && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-300">
              <strong className="text-white">Have an interview date?</strong> Pick a prep plan — it covers only the most-asked topics, in order. <strong className="text-white">No date yet?</strong> Take the step-by-step course and build a solid foundation.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <button type="button" onClick={() => setChoice("week")} className="rounded-lg border border-amber-500/30 px-2.5 py-1.5 text-amber-200 hover:border-amber-500/60">
                Show me a prep plan
              </button>
              <button type="button" onClick={() => setChoice("deep")} className="rounded-lg border border-emerald-500/30 px-2.5 py-1.5 text-emerald-200 hover:border-emerald-500/60">
                Show me the course
              </button>
            </div>
          </div>
        )}

        {choice === "soon" && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-300">Both plans cover only the most-asked topics, in order, and end with a timed practice interview. Short on time? Take the 1-day plan.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[plan(1), plan(3)].map(
                (p) =>
                  p && (
                    <Link
                      key={p.horizon}
                      href={`/learn/interview-prep?days=${p.horizon}`}
                      className="group rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-3 hover:border-amber-500/70 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-base font-bold text-white">{p.label}</span>
                        <ArrowRight size={14} className="text-amber-300 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                      <span className="block text-[11px] text-amber-300/80">{p.tagline}</span>
                      <span className="mt-1.5 block text-xs text-zinc-400">
                        {p.essentials} must-do tasks · about {hours(p.essentialMinutes)}
                      </span>
                    </Link>
                  ),
              )}
            </div>
          </div>
        )}

        {choice === "week" &&
          (() => {
            const p = plan(7);
            if (!p) return null;
            return (
              <div className="space-y-3">
                <p className="text-sm text-zinc-300">
                  <strong className="text-white">{p.label}:</strong> {p.essentials} must-do tasks, about {hours(Math.round(p.essentialMinutes / p.days.length))} a day, plus practice designs and a timed mock interview.
                </p>
                <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-400">
                  {p.days.map((d) => (
                    <li key={d.title} className="truncate">
                      <span className="text-amber-300/80 mr-1.5">{d.title}</span>
                      {d.focus}
                    </li>
                  ))}
                </ol>
                <Cta href="/learn/interview-prep?days=7" tone="amber">
                  See my 7-day plan
                </Cta>
              </div>
            );
          })()}

        {choice === "deep" && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-300">
              <strong className="text-white">{data.roadmap.stages} stages, {data.roadmap.lessons} lessons</strong>, {data.roadmap.minMinutes}–{data.roadmap.maxMinutes} minutes each. Start from the basics and go at your own pace — every lesson ends with how to explain it in an interview.
            </p>
            <ol className="flex flex-wrap gap-1.5 text-[11px] text-zinc-400">
              {data.roadmap.firstStages.map((s, i) => (
                <li key={s} className="rounded-md border border-emerald-500/20 px-2 py-1">
                  <span className="font-mono text-emerald-400/80 mr-1">{i + 1}</span>
                  {s}
                </li>
              ))}
              <li className="px-1 py-1 text-zinc-600">…</li>
            </ol>
            <div className="flex flex-wrap items-center gap-3">
              {data.roadmap.firstLesson && (
                <Cta href={data.roadmap.firstLesson.href} tone="emerald">
                  Start the first lesson
                </Cta>
              )}
              <Link href="/learn/roadmap" className="text-sm text-emerald-300 hover:text-emerald-200">
                See all {data.roadmap.stages} stages →
              </Link>
            </div>
          </div>
        )}

        {choice === "practice" && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-300">
              <strong className="text-white">{data.practice.problems} real interview questions</strong> ({data.practice.easy} easy, {data.practice.medium} medium, {data.practice.hard} hard). Drag components onto a canvas, send traffic through your design and get a score — or try a timed mock interview.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Cta href="/simulator" tone="indigo">
                Open the simulator
              </Cta>
              <Link href={data.practice.walkthrough.href} className="text-sm text-indigo-300 hover:text-indigo-200">
                Not ready? Try a guided walkthrough first: {data.practice.walkthrough.title} →
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
