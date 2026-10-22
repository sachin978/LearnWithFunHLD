import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { SiteFooter } from "@/components/ui/site-footer";
import { LearnTopNav } from "@/components/learn/LearnTopNav";
import { CourseProgressHeader, RoadmapLegend, RoadmapStages } from "@/components/learn/curriculum/RoadmapCourse";
import { ROADMAP } from "@/lib/learn/curriculum/roadmap";

export const metadata: Metadata = {
  title: "Learn In Depth — the system design roadmap | WireUp System",
  description:
    "A 12-stage, beginner-friendly system design roadmap: web fundamentals, databases, caching, scaling, messaging, reliability, observability, security, interview methodology and end-to-end designs.",
};

export default function RoadmapPage() {
  const firstLesson = ROADMAP[0].lessons.find((l) => l.href);

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <LearnTopNav crumb={{ label: "Learn In Depth", href: "/learn/roadmap" }} />

      <main>
        <header className="relative px-4 pt-10 pb-6 overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.09),transparent_55%)]" />
          <div className="relative max-w-6xl mx-auto">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3">
              <Compass size={13} /> Learn In Depth
            </p>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">Build fundamentals that last.</h1>
            <p className="mt-4 text-zinc-400 text-lg max-w-2xl">
              Twelve stages, each a short set of lessons. Every lesson follows the same loop — understand, visualize, practise, apply, explain, recall — so each one ends with something you can say in an interview.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {firstLesson?.href && (
                <Link href="#fundamentals" className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 hover:border-emerald-400 text-emerald-200 font-semibold px-4 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
                  See Stage 1 <ArrowRight size={16} />
                </Link>
              )}
              <Link href="/learn/interview-prep" className="text-sm text-zinc-400 hover:text-white">
                Short on time? Rapid Interview Prep →
              </Link>
            </div>
            <CourseProgressHeader />
            <RoadmapLegend />
          </div>
        </header>

        <div className="px-4">
          <div className="max-w-6xl mx-auto">
            <RoadmapStages />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
