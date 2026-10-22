import { AlertTriangle, BookOpen, Lightbulb, Target, Sparkles, ListChecks, Wrench, MessageSquare, Clock } from "lucide-react";
import type { Chapter } from "@/lib/learn/types";
import { RichText } from "./RichText";
import { KnowledgeCheck } from "./KnowledgeCheck";
import { CodeBlock } from "./CodeBlock";

function SubHeading({ icon: Icon, children }: { icon: React.ComponentType<{ size?: number; className?: string }>; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-base font-semibold text-white mb-3">
      <Icon size={16} className="text-indigo-400" />
      {children}
    </h3>
  );
}

/**
 * Server-rendered chapter body following the shared lesson structure:
 * problem → simple explanation → analogy → real-world → interactive lab →
 * walkthrough → technical details → table/code → mistakes → interview →
 * takeaways → knowledge check. Only the lab, code copy and quiz hydrate.
 */
export function ChapterView({ chapter, total, lab, quizKey }: { chapter: Chapter; total: number; lab?: React.ReactNode; quizKey?: string }) {
  return (
    <section id={chapter.id} aria-labelledby={`${chapter.id}-title`} className="scroll-mt-32 lg:scroll-mt-20 py-12 border-t border-border first:border-t-0 first:pt-4">
      <header className="mb-8">
        <div className="flex items-center gap-3 text-xs mb-3">
          <span className="px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 font-medium">
            Chapter {chapter.number} of {total}
          </span>
          <span className="flex items-center gap-1 text-zinc-500">
            <Clock size={12} /> {chapter.minutes} min
          </span>
        </div>
        <h2 id={`${chapter.id}-title`} className="text-2xl md:text-3xl font-bold tracking-tight text-white">
          {chapter.title}
        </h2>
      </header>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-rose-300/80 font-semibold mb-2">The problem</div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            <RichText text={chapter.problem} />
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-emerald-300/80 font-semibold mb-2">In plain English</div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            <RichText text={chapter.simple} />
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-sky-300/80 font-semibold mb-2">Analogy</div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            <RichText text={chapter.analogy} />
          </p>
        </div>
      </div>

      {chapter.realWorld && (
        <div className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-5">
          <SubHeading icon={Target}>Real-world scenario: {chapter.realWorld.title}</SubHeading>
          <div className="space-y-2 text-sm text-zinc-300 leading-relaxed">
            {chapter.realWorld.body.map((p, i) => (
              <p key={i}>
                <RichText text={p} />
              </p>
            ))}
          </div>
        </div>
      )}

      {lab && (
        <div className="mb-10">
          <SubHeading icon={Sparkles}>See it in action</SubHeading>
          {lab}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)] mb-8">
        <div>
          <SubHeading icon={ListChecks}>Step by step</SubHeading>
          <ol className="space-y-2">
            {chapter.walkthrough.map((w, i) => (
              <li key={i} className="flex gap-3 text-sm text-zinc-300 leading-relaxed">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 text-[11px] font-mono">{i + 1}</span>
                <span>
                  <RichText text={w} />
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <SubHeading icon={Wrench}>{chapter.number === 12 ? "Core concepts, side by side" : "Technical details"}</SubHeading>
          <ul className="space-y-2.5">
            {chapter.technical.map((t, i) => (
              <li key={i} className="relative pl-4 text-sm text-zinc-300 leading-relaxed before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-indigo-400/70">
                <RichText text={t} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {chapter.table && (
        <div className="mb-8 rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <caption className="text-left px-4 py-3 text-sm font-semibold text-white bg-card border-b border-border">{chapter.table.caption}</caption>
              <thead>
                <tr className="bg-zinc-900/60">
                  {chapter.table.headers.map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chapter.table.rows.map((row, ri) => (
                  <tr key={ri} className="border-t border-border/70">
                    {row.map((cell, ci) =>
                      ci === 0 ? (
                        <th key={ci} scope="row" className="text-left align-top px-4 py-2.5 font-medium text-zinc-100">
                          <RichText text={cell} />
                        </th>
                      ) : (
                        <td key={ci} className="align-top px-4 py-2.5 text-zinc-300">
                          <RichText text={cell} />
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {chapter.code && (
        <div className="mb-8 space-y-4">
          <SubHeading icon={BookOpen}>Code</SubHeading>
          {chapter.code.map((c) => (
            <CodeBlock key={c.filename} sample={c} />
          ))}
        </div>
      )}

      <div className="mb-8">
        <SubHeading icon={AlertTriangle}>Common mistakes</SubHeading>
        <div className="grid gap-3 md:grid-cols-2">
          {chapter.mistakes.map((m, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 text-sm">
              <p className="text-rose-300 mb-1.5">
                <span className="font-semibold">✕ Myth: </span>
                <RichText text={m.myth} />
              </p>
              <p className="text-zinc-300">
                <span className="font-semibold text-emerald-300">✓ Reality: </span>
                <RichText text={m.reality} />
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <SubHeading icon={MessageSquare}>{chapter.number === 12 ? "Scenario questions" : "Interview questions"}</SubHeading>
        <div className="space-y-2">
          {chapter.interview.map((q, i) => (
            <details key={i} className="group rounded-xl border border-border bg-card open:border-indigo-500/30">
              <summary className="cursor-pointer list-none flex items-start gap-3 px-4 py-3 text-sm font-medium text-zinc-100 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 [&::-webkit-details-marker]:hidden">
                <span className="text-indigo-400 font-mono text-xs mt-0.5">Q{i + 1}</span>
                <span className="flex-1">
                  <RichText text={q.q} />
                </span>
                <span className="text-zinc-500 text-xs transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <div className="px-4 pb-4 pl-11 space-y-3 text-sm">
                <p className="text-zinc-300">
                  <span className="text-[11px] uppercase tracking-wider text-emerald-300/80 font-semibold mr-2">Short answer</span>
                  <RichText text={q.short} />
                </p>
                {q.detailed && (
                  <div className="rounded-lg border border-border bg-zinc-950/60 p-3 space-y-1.5 text-zinc-300">
                    <div className="text-[11px] uppercase tracking-wider text-indigo-300/80 font-semibold">Interview-ready answer</div>
                    {q.detailed.map((d, di) => (
                      <p key={di}>
                        <RichText text={d} />
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5">
        <SubHeading icon={Lightbulb}>Key takeaways</SubHeading>
        <ul className="grid gap-2 sm:grid-cols-2">
          {chapter.takeaways.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-200">
              <span className="text-emerald-400" aria-hidden>
                ✓
              </span>
              <span>
                <RichText text={t} />
              </span>
            </li>
          ))}
        </ul>
      </div>

      <KnowledgeCheck questions={chapter.quiz} trackAs={quizKey} />
    </section>
  );
}
