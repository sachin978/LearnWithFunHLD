import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowLeft, BookOpen, CheckCircle2, Clock } from "lucide-react";
import { SiteFooter } from "@/components/ui/site-footer";
import { LearnTopNav } from "@/components/learn/LearnTopNav";
import { BrandMark } from "@/components/learn/BrandMark";
import { RichText } from "@/components/learn/RichText";
import { ChapterView } from "@/components/learn/ChapterView";
import { ChapterNavigation, ReadingProgress } from "@/components/learn/ChapterNavigation";
import { ChapterLab } from "@/components/learn/rabbitmq/ChapterLab";
import { RABBITMQ_COURSE } from "@/lib/learn/rabbitmq/chapters";
import { chapterQuizKey } from "@/lib/learn/completion";

export const metadata: Metadata = {
  title: "RabbitMQ, visually — Learn | WireUp System",
  description:
    "An interactive RabbitMQ course: animated message flows, exchange routing playground, acks and redelivery, durability, retries and DLX, quorum queues, Kafka comparison, Python lab and interview prep.",
};

export default function RabbitMQCoursePage() {
  const course = RABBITMQ_COURSE;
  const minutes = course.chapters.reduce((s, c) => s + c.minutes, 0);
  const courseRef = { slug: course.slug, title: "RabbitMQ" };
  const navChapters = course.chapters.map(({ id, number, navTitle, minutes }) => ({ id, number, navTitle, minutes }));

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <ReadingProgress />
      <LearnTopNav crumb={{ label: "RabbitMQ", href: "/learn/rabbitmq" }} />

      <header className="relative px-4 pt-14 pb-12 overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.10),transparent_55%),radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.12),transparent_55%)] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-8 text-sm">
            <Link href="/learn/roadmap#messaging" className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              <ArrowLeft size={14} /> Roadmap
            </Link>
            <Link href="/learn/roadmap#messaging" className="text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-500/60">
              Stage 6 · Messaging and asynchronous systems
            </Link>
            <Link href="/learn/concepts/message-queues" className="text-xs text-zinc-500 hover:text-white">
              Short on time? Read the 10-minute message queue brief →
            </Link>
          </div>
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] items-start">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center">
                  <BrandMark brand="rabbitmq" size={30} />
                </div>
                <div className="text-xs text-zinc-400 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={13} /> {course.chapters.length} chapters
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} /> ~{minutes} min total
                  </div>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">{course.title}</h1>
              <p className="text-lg text-zinc-300 mb-3">{course.tagline}</p>
              <p className="text-muted-foreground mb-8 max-w-2xl">
                <RichText text={course.intro} />
              </p>
              <a
                href={`#${course.chapters[0].id}`}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold py-3 px-6 rounded-xl transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                Start learning <ArrowDown size={16} />
              </a>
            </div>
            <div className="rounded-2xl border border-border bg-card/80 p-5">
              <h2 className="text-sm font-semibold text-white mb-3">You will be able to</h2>
              <ul className="space-y-2.5">
                {course.objectives.map((o) => (
                  <li key={o} className="flex gap-2.5 text-sm text-zinc-300">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <RichText text={o} />
                  </li>
                ))}
              </ul>
              <p className="mt-4 pt-4 border-t border-border text-xs text-zinc-500">
                Every animation has play, pause, step and speed controls. Scenes start once when you scroll to them and respect your reduced-motion setting.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10 pt-6">
        <aside className="hidden lg:block">
          <ChapterNavigation chapters={navChapters} variant="desktop" course={courseRef} />
        </aside>
        <main id="course" className="min-w-0">
          <ChapterNavigation chapters={navChapters} variant="mobile" course={courseRef} />
          {course.chapters.map((chapter) => (
            <ChapterView key={chapter.id} chapter={chapter} total={course.chapters.length} lab={<ChapterLab chapterId={chapter.id} />} quizKey={chapterQuizKey(course.slug, chapter.id)} />
          ))}
          <div className="py-12 border-t border-border text-center">
            <p className="text-zinc-400 mb-4">You&apos;ve reached the end of the RabbitMQ course.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/learn/roadmap" className="border border-border text-zinc-300 hover:text-white hover:border-white/30 font-semibold py-2.5 px-6 rounded-xl transition">
                ← Back to the roadmap
              </Link>
              <a href="/simulator" target="_blank" rel="noopener noreferrer" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 rounded-xl transition">
                Design with it in the simulator
              </a>
            </div>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
