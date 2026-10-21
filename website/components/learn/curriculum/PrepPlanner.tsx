"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookOpen, CalendarDays, Layers, PenTool, Sparkles, Timer, ListChecks, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FINAL_CHECKLIST, PREP_HORIZONS, PREP_PLANS, planMinutes, type PrepHorizon, type TaskKind } from "@/lib/learn/curriculum/prep";
import { PREP_PROGRESS_KEY, PROGRESS_EVENT, parsePrepProgress, savePrepProgress, type PrepProgress } from "@/lib/learn/progress";

const KIND: Record<TaskKind, { label: string; icon: typeof BookOpen; cls: string }> = {
  learn: { label: "Learn", icon: BookOpen, cls: "text-amber-300" },
  design: { label: "Design", icon: PenTool, cls: "text-indigo-300" },
  deep: { label: "Deep dive", icon: Layers, cls: "text-violet-300" },
  simulate: { label: "Mock", icon: Timer, cls: "text-sky-300" },
  review: { label: "Review", icon: ListChecks, cls: "text-emerald-300" },
};

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(PROGRESS_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(PROGRESS_EVENT, cb);
  };
}
function snapshot() {
  try {
    return localStorage.getItem(PREP_PROGRESS_KEY) ?? "";
  } catch {
    return "";
  }
}

const fmt = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} h ${min % 60 ? `${min % 60} min` : ""}`.trim() : `${min} min`);

function parseHorizon(v: string | null): PrepHorizon | null {
  const n = Number(v);
  return n === 1 || n === 3 || n === 7 ? n : null;
}

/**
 * Reduce choice overload: the learner answers one question ("how long until
 * your interview?") and only then sees a plan sized to it. Progress is real —
 * checked by the learner and stored in this browser only.
 */
export function PrepPlanner() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = useSyncExternalStore(subscribe, snapshot, () => "");
  const [memory, setMemory] = useState<PrepProgress | null>(null);
  const progress = useMemo(() => memory ?? parsePrepProgress(raw || null), [memory, raw]);

  const horizon = parseHorizon(params.get("days")) ?? progress.last ?? null;
  const plan = horizon ? PREP_PLANS[horizon] : null;
  const done = new Set(horizon ? progress.done[String(horizon) as "1" | "3" | "7"] ?? [] : []);

  const persist = (next: PrepProgress) => {
    if (!savePrepProgress(next)) setMemory(next);
  };

  const choose = (h: PrepHorizon) => {
    persist({ ...progress, last: h });
    router.replace(`${pathname}?days=${h}`, { scroll: false });
  };

  const toggle = (id: string) => {
    if (!horizon) return;
    const key = String(horizon) as "1" | "3" | "7";
    const set = new Set(progress.done[key] ?? []);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    persist({ ...progress, last: horizon, done: { ...progress.done, [key]: [...set] } });
  };

  const allTasks = plan ? plan.days.flatMap((d) => d.tasks) : [];
  const essentialTasks = allTasks.filter((t) => t.essential);
  const essentialDone = essentialTasks.filter((t) => done.has(t.id)).length;

  return (
    <div className="space-y-8">
      <section aria-labelledby="horizon-q" className="rounded-3xl border border-amber-500/25 bg-card p-5 sm:p-6">
        <h2 id="horizon-q" className="flex items-center gap-2 text-lg font-semibold text-white mb-1">
          <CalendarDays size={18} className="text-amber-400" /> How long until your interview?
        </h2>
        <p className="text-sm text-zinc-400 mb-4">Pick one — the plan below changes what you study, not just how it&apos;s spread out.</p>
        <div role="radiogroup" aria-labelledby="horizon-q" className="grid gap-3 sm:grid-cols-3">
          {PREP_HORIZONS.map((h) => {
            const p = PREP_PLANS[h];
            const selected = h === horizon;
            return (
              <button
                key={h}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose(h)}
                className={cn(
                  "text-left rounded-2xl border p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
                  selected ? "border-amber-500/60 bg-amber-500/10" : "border-border bg-background/50 hover:border-amber-500/40",
                )}
              >
                <span className="block text-2xl font-bold text-white">{p.label}</span>
                <span className="block text-sm text-amber-300 font-medium">{p.tagline}</span>
                <span className="block mt-2 text-xs text-zinc-500">
                  ~{fmt(planMinutes(p, true))} essential · {p.days.flatMap((d) => d.tasks).filter((t) => t.kind === "design").length} design exercises
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {plan && (
        <section aria-labelledby="plan-heading" className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 id="plan-heading" className="text-2xl font-bold text-white">
                Your {plan.label} plan
              </h2>
              <p className="text-sm text-zinc-400 mt-1">{plan.dailyLoad}</p>
            </div>
            <div className="min-w-[220px]" aria-live="polite">
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Essential tasks done</span>
                <span className="font-mono text-amber-300">
                  {essentialDone}/{essentialTasks.length}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={essentialTasks.length} aria-valuenow={essentialDone} aria-label="Essential tasks completed">
                <div className="h-full bg-amber-400 transition-all" style={{ width: `${(essentialDone / Math.max(1, essentialTasks.length)) * 100}%` }} />
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-500 rounded-xl border border-border bg-background/50 px-3 py-2">
            Rapid prep helps you prioritise and revise — it isn&apos;t a substitute for deep understanding. Every topic links to an in-depth lesson if you want more. Ticks are saved in this browser only.
          </p>

          <ol className="space-y-4">
            {plan.days.map((day) => {
              const dayDone = day.tasks.filter((t) => t.essential).every((t) => done.has(t.id));
              return (
                <li key={day.title} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                    <h3 className="text-white font-semibold">
                      {day.title} <span className="text-zinc-500 font-normal">· {day.focus}</span>
                    </h3>
                    <span className="text-xs text-zinc-500">
                      ~{fmt(day.tasks.filter((t) => t.essential).reduce((s, t) => s + t.minutes, 0))} essential
                    </span>
                  </div>
                  {dayDone && (
                    <p className="mb-3 flex items-center gap-2 text-sm text-emerald-300" role="status">
                      <CheckCircle2 size={15} /> {day.title} essentials complete — nice work.
                    </p>
                  )}
                  <ul className="space-y-2">
                    {day.tasks.map((t) => {
                      const k = KIND[t.kind];
                      const checked = done.has(t.id);
                      const inputId = `task-${horizon}-${t.id}`;
                      return (
                        <li key={t.id} className={cn("flex items-start gap-3 rounded-xl border px-3 py-2.5", checked ? "border-emerald-500/25 bg-emerald-500/[0.04]" : "border-border/70 bg-background/40")}>
                          <input id={inputId} type="checkbox" checked={checked} onChange={() => toggle(t.id)} className="mt-1 h-4 w-4 shrink-0 accent-amber-500" aria-label={`Mark "${t.title}" done`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider", k.cls)}>
                                <k.icon size={12} /> {k.label}
                              </span>
                              {!t.essential && <span className="text-[10px] uppercase tracking-wider text-zinc-500 border border-border rounded px-1.5">Optional</span>}
                              <span className="text-[11px] text-zinc-600">{t.minutes} min</span>
                            </div>
                            {t.href.startsWith("#") ? (
                              <a href={t.href} className={cn("block text-sm hover:text-white", checked ? "text-zinc-500 line-through" : "text-zinc-200")}>
                                {t.title}
                              </a>
                            ) : (
                              <Link href={t.href} className={cn("block text-sm hover:text-white", checked ? "text-zinc-500 line-through" : "text-zinc-200")}>
                                {t.title}
                              </Link>
                            )}
                            {t.deepHref && (
                              <Link href={t.deepHref} className="mt-0.5 inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200">
                                Understand this in depth: {t.deepLabel} <ArrowRight size={11} />
                              </Link>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ol>

          {essentialTasks.length > 0 && essentialDone === essentialTasks.length && (
            <p className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 text-sm text-emerald-200" role="status">
              <Sparkles size={16} /> Every essential task in your {plan.label} plan is done. Do one more timed mock, then rest before the interview.
            </p>
          )}
        </section>
      )}

      <section id="checklist" aria-labelledby="checklist-heading" className="scroll-mt-24 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5">
        <h2 id="checklist-heading" className="flex items-center gap-2 text-white font-semibold mb-1">
          <ListChecks size={16} className="text-emerald-400" /> Final revision checklist
        </h2>
        <p className="text-xs text-zinc-500 mb-3">The night before: if you can&apos;t say yes to one of these, revisit the linked brief.</p>
        <ul className="space-y-2">
          {FINAL_CHECKLIST.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-zinc-300">
              <span className="text-emerald-400" aria-hidden>
                ☐
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
