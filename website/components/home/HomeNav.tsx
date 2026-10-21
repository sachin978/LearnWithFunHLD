"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const LINKS = [
  { label: "Learn", href: "/learn" },
  { label: "Practice", href: "/simulator" },
  { label: "Features", href: "/features" },
];

/**
 * Jakob's law: a conventional top bar (wordmark left, links, one primary
 * action right) on every screen size — matching the /learn and /features
 * bars instead of the old floating, bottom-docked mobile pill.
 */
export function HomeNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav aria-label="Main" className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="text-white font-bold text-lg shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          WireUp System
        </Link>
        <ul className="hidden md:flex items-center gap-1 text-sm">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Link
            href="/simulator"
            className="hidden sm:inline-flex bg-indigo-600 hover:bg-indigo-500 transition text-white text-sm font-semibold px-4 py-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            Open simulator
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="home-mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border text-zinc-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>
      {open && (
        <div id="home-mobile-menu" className="md:hidden border-t border-border bg-background/95 px-4 py-3">
          <ul className="space-y-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-3 rounded-lg text-zinc-200 hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
