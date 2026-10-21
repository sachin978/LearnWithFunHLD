import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Zap } from "lucide-react";
import { SiteFooter } from "@/components/ui/site-footer";
import { LearnTopNav } from "@/components/learn/LearnTopNav";
import { PrepPlanner } from "@/components/learn/curriculum/PrepPlanner";

export const metadata: Metadata = {
  title: "Rapid Interview Prep — 1, 3 or 7-day plans | WireUp System",
  description:
    "Interview coming up? Get a prioritised system design revision plan for 1, 3 or 7 days: the interview framework, essential building blocks, practice designs and a timed mock.",
};

const PARTS = [
  { n: 1, title: "The interview framework", text: "Requirements, estimation, APIs, architecture, trade-offs." },
  { n: 2, title: "Essential building blocks", text: "Databases, caching, load balancing, sharding, queues, reliability, CAP." },
  { n: 3, title: "Practice common designs", text: "URL shortener to news feed — answer each step before revealing." },
  { n: 4, title: "Interview simulation", text: "A timed mock, out loud, then a final revision checklist." },
];

export default function InterviewPrepPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <LearnTopNav crumb={{ label: "Rapid Interview Prep", href: "/learn/interview-prep" }} />

      <header className="relative px-4 pt-10 pb-8 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.10),transparent_55%)]" />
        <div className="relative max-w-4xl mx-auto">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">
            <Zap size={13} /> Rapid Interview Prep
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">Interview coming up? Start here.</h1>
          <p className="mt-4 text-zinc-400 text-lg max-w-2xl">
            Focus on the concepts, design patterns and interview framework that matter most. Learn what to prioritise, practise explaining trade-offs, and find your gaps before interview day.
          </p>
          <ol className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PARTS.map((p) => (
              <li key={p.n} className="rounded-xl border border-border bg-card/70 p-3">
                <span className="text-[11px] font-mono text-amber-400">Part {p.n}</span>
                <span className="block text-sm font-semibold text-white">{p.title}</span>
                <span className="hidden sm:block text-xs text-zinc-500 mt-0.5">{p.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </header>

      <main className="px-4">
        <div className="max-w-4xl mx-auto space-y-10">
        <Suspense fallback={<div className="h-56 rounded-3xl border border-amber-500/25 bg-card animate-pulse" aria-label="Loading plan selector" />}>
          <PrepPlanner />
        </Suspense>

        <p className="text-sm text-zinc-400">
          Want the full picture instead?{" "}
          <Link href="/learn/roadmap" className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200">
            Explore the learning roadmap <ArrowRight size={13} />
          </Link>
        </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
