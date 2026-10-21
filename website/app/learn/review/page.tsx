import type { Metadata } from "next";
import Link from "next/link";
import { Repeat } from "lucide-react";
import { SiteFooter } from "@/components/ui/site-footer";
import { LearnTopNav } from "@/components/learn/LearnTopNav";
import { ReviewSession } from "@/components/learn/curriculum/ReviewSession";

export const metadata: Metadata = {
  title: "Spaced review — system design interview questions | WireUp System",
  description: "Answer system design interview questions from memory, check yourself, and let spaced repetition bring back the ones you miss.",
};

export default function ReviewPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <LearnTopNav crumb={{ label: "Spaced review", href: "/learn/review" }} />
      <header className="px-4 pt-10 pb-6">
        <div className="max-w-3xl mx-auto">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">
            <Repeat size={13} /> Spaced review
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Recall it before the interviewer asks.</h1>
          <p className="mt-3 text-zinc-400">
            Recognising an answer when you read it is not the same as producing it under pressure. Answer each question from memory, then check — cards you miss come back
            tomorrow, cards you know come back days later.
          </p>
        </div>
      </header>
      <main className="px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <ReviewSession />
          <p className="text-sm text-zinc-500">
            Want more context first?{" "}
            <Link href="/learn/roadmap" className="text-emerald-300 hover:text-emerald-200">
              Browse the roadmap
            </Link>{" "}
            or{" "}
            <Link href="/learn/interview-prep" className="text-amber-300 hover:text-amber-200">
              follow a prep plan
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
