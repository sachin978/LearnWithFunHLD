"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Layers, PenTool, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLearningState } from "@/lib/learn/learning-state";
import { briefCompletion, designCompletion, type Completion } from "@/lib/learn/completion";
import { BRIEFS, DESIGNS, briefHref, designHref, designShortTitle } from "@/lib/learn/curriculum";
import type { ConceptBrief } from "@/lib/learn/curriculum/types";
import { ProgressRing } from "./LessonProgress";

/** Topic areas for browsing. Any brief not listed here still appears, under "More topics". */
const GROUPS: { title: string; slugs: string[]; deepDive?: { label: string; href: string } }[] = [
  { title: "Foundations", slugs: ["http-request-flow", "api-data-modeling", "monolith-microservices", "interview-framework", "estimation"] },
  { title: "Data and storage", slugs: ["databases", "replication-sharding", "caching", "cdn-object-storage"] },
  { title: "Scaling and traffic", slugs: ["load-balancing", "api-gateway"] },
  {
    title: "Async processing and reliability",
    slugs: ["message-queues", "reliability-patterns", "cap-consistency", "distributed-locks"],
    deepDive: { label: "Optional deep dive: RabbitMQ, visually (12 animated chapters)", href: "/learn/rabbitmq" },
  },
  { title: "Operations and security", slugs: ["observability", "security-fundamentals"] },
];

const LEVEL_STYLE = { Beginner: "text-emerald-300", Intermediate: "text-amber-300", Advanced: "text-rose-300" } as const;

function Status({ c }: { c: Completion }) {
  if (c.complete)
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-emerald-300">
        <CheckCircle2 size={14} /> Done
      </span>
    );
  if (c.done > 0) return <ProgressRing done={c.done} total={c.total} size={28} />;
  return null;
}

/**
 * Browse every lesson in one place — grouped by area, searchable, with the
 * learner's completion on each card (from recorded actions only).
 */
export function TopicLibrary() {
  const learning = useLearningState();
  const [query, setQuery] = useState("");
  const searchId = useId();
  const q = query.trim().toLowerCase();
  const matches = (text: string) => !q || text.toLowerCase().includes(q);

  const listed = new Set(GROUPS.flatMap((g) => g.slugs));
  const groups = [...GROUPS, { title: "More topics", slugs: BRIEFS.filter((b) => !listed.has(b.slug)).map((b) => b.slug) }]
    .map((g) => ({
      ...g,
      briefs: g.slugs
        .map((s) => BRIEFS.find((b) => b.slug === s))
        .filter((b): b is ConceptBrief => b !== undefined && matches(`${b.title} ${b.shortTitle} ${b.summary}`)),
    }))
    .filter((g) => g.briefs.length > 0);
  const designs = DESIGNS.filter((d) => matches(`${d.title} ${d.summary}`));
  const briefsDone = BRIEFS.filter((b) => briefCompletion(learning.briefs[b.slug]).complete).length;
  const designsDone = DESIGNS.filter((d) => designCompletion(learning.designs[d.slug]).complete).length;

  return (
    <section id="topics" aria-labelledby="topics-heading" className="scroll-mt-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div>
          <h2 id="topics-heading" className="text-xl font-bold text-white">
            Browse every topic
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            {BRIEFS.length} concept lessons and {DESIGNS.length} design problems. Open any of them directly.
            {briefsDone + designsDone > 0 && (
              <span className="text-emerald-300">
                {" "}
                You&apos;ve completed {briefsDone + designsDone}.
              </span>
            )}
          </p>
        </div>
        <div className="relative sm:w-64">
          <label htmlFor={searchId} className="sr-only">
            Search topics
          </label>
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: cache, sharding, queues…"
            className="w-full rounded-xl border border-border bg-card pl-8 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 focus-visible:ring-2 focus-visible:ring-indigo-500/30"
          />
        </div>
      </div>

      <div className="space-y-5">
        {groups.map((g) => (
          <div key={g.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">{g.title}</h3>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {g.briefs.map((b) => {
                const c = briefCompletion(learning.briefs[b.slug]);
                return (
                  <li key={b.slug}>
                    <Link
                      href={briefHref(b.slug)}
                      className={cn(
                        "flex h-full items-center gap-3 rounded-xl border bg-card px-3 py-2.5 hover:border-zinc-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                        c.complete ? "border-emerald-500/25" : "border-border",
                      )}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-zinc-100 truncate">{b.shortTitle}</span>
                        <span className="block text-[11px] text-zinc-500">
                          ~{b.minutes} min · Stage {b.stage}
                          {c.started && !c.complete && c.done === 0 ? " · Opened" : ""}
                        </span>
                      </span>
                      <Status c={c} />
                    </Link>
                  </li>
                );
              })}
            </ul>
            {g.deepDive && (
              <Link href={g.deepDive.href} className="mt-2 inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white">
                <Layers size={12} className="text-amber-400" /> {g.deepDive.label} <ArrowRight size={11} />
              </Link>
            )}
          </div>
        ))}

        {designs.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Design problems</h3>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {designs.map((d) => {
                const c = designCompletion(learning.designs[d.slug]);
                return (
                  <li key={d.slug}>
                    <Link
                      href={designHref(d.slug)}
                      className={cn(
                        "flex h-full items-center gap-3 rounded-xl border bg-card px-3 py-2.5 hover:border-zinc-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                        c.complete ? "border-emerald-500/25" : "border-border",
                      )}
                    >
                      <PenTool size={14} className="shrink-0 text-emerald-300" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-zinc-100 truncate">{designShortTitle(d)}</span>
                        <span className="block text-[11px] text-zinc-500">
                          <span className={LEVEL_STYLE[d.level]}>{d.level}</span> · ~{d.minutes} min
                        </span>
                      </span>
                      <Status c={c} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {groups.length === 0 && designs.length === 0 && (
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-zinc-400">
            Nothing matches &ldquo;{query}&rdquo;. Try a broader word, or{" "}
            <button type="button" onClick={() => setQuery("")} className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2">
              clear the search
            </button>
            .
          </p>
        )}
      </div>
    </section>
  );
}
