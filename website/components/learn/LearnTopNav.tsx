import Link from "next/link";

/** Sticky top bar shared by /learn pages — same shape as the /features nav. */
export function LearnTopNav({ crumb }: { crumb?: { label: string; href: string } }) {
  return (
    <nav aria-label="Site" className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 text-sm">
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg shrink-0">
            WireUp System
          </Link>
          <span className="text-zinc-600" aria-hidden>
            /
          </span>
          <Link href="/learn" className="text-zinc-300 hover:text-white font-medium">
            Learn
          </Link>
          {crumb && (
            <>
              <span className="text-zinc-600 hidden sm:inline" aria-hidden>
                /
              </span>
              <Link href={crumb.href} className="text-amber-400 font-medium truncate hidden sm:inline" aria-current="page">
                {crumb.label}
              </Link>
            </>
          )}
        </div>
        <a
          href="/simulator"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 bg-indigo-600 hover:bg-indigo-500 transition text-white text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <span className="hidden sm:inline">Open Simulator →</span>
          <span className="sm:hidden">Simulator</span>
        </a>
      </div>
    </nav>
  );
}
