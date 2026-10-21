"use client";

import { useMemo, useState } from "react";
import { Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

const LIMIT = 5;
const WINDOW = 10; // seconds
const DURATION = 30;

type Algo = "fixed" | "sliding" | "token";

const PATTERNS: { id: string; label: string; description: string; times: number[] }[] = [
  {
    id: "edge",
    label: "Burst at a window edge",
    description: "5 requests just before t = 10 s and 5 just after.",
    times: [8.0, 8.4, 8.8, 9.2, 9.6, 10.0, 10.4, 10.8, 11.2, 11.6],
  },
  {
    id: "burst",
    label: "Sudden burst",
    description: "12 requests within ~1 s at t = 2 s, then a few more later.",
    times: [...Array.from({ length: 12 }, (_, i) => 2 + i * 0.1), 13, 13.5, 14, 14.5],
  },
  {
    id: "steady",
    label: "Steady overload",
    description: "One request every 1.5 s — faster than the allowed average of one per 2 s.",
    times: Array.from({ length: 20 }, (_, i) => 0.5 + i * 1.5),
  },
];

const ALGOS: { id: Algo; label: string; rule: string }[] = [
  { id: "fixed", label: "Fixed window", rule: `≤ ${LIMIT} per clock window [0–10), [10–20), …` },
  { id: "sliding", label: "Sliding window log", rule: `≤ ${LIMIT} in any trailing ${WINDOW} s` },
  { id: "token", label: "Token bucket", rule: `capacity ${LIMIT}, refills ${LIMIT / WINDOW} token/s, starts full` },
];

/** Pure, deterministic simulation of each algorithm over the same request times. */
function simulate(algo: Algo, times: number[]): boolean[] {
  const allowed: boolean[] = [];
  const accepted: number[] = [];
  let tokens = LIMIT;
  let lastRefill = 0;
  for (const t of times) {
    let ok: boolean;
    if (algo === "fixed") {
      const windowStart = Math.floor(t / WINDOW) * WINDOW;
      ok = accepted.filter((a) => a >= windowStart && a < windowStart + WINDOW).length < LIMIT;
    } else if (algo === "sliding") {
      ok = accepted.filter((a) => a > t - WINDOW && a <= t).length < LIMIT;
    } else {
      tokens = Math.min(LIMIT, tokens + (t - lastRefill) * (LIMIT / WINDOW));
      lastRefill = t;
      ok = tokens >= 1 - 1e-9;
      if (ok) tokens -= 1;
    }
    if (ok) accepted.push(t);
    allowed.push(ok);
  }
  return allowed;
}

/** Most accepted requests inside any 10-second span. */
function maxInWindow(times: number[], allowed: boolean[]): number {
  const acc = times.filter((_, i) => allowed[i]);
  let best = 0;
  for (let i = 0; i < acc.length; i++) {
    let j = i;
    while (j < acc.length && acc[j] < acc[i] + WINDOW) j++;
    best = Math.max(best, j - i);
  }
  return best;
}

function Timeline({ times, allowed, showWindows }: { times: number[]; allowed: boolean[]; showWindows: boolean }) {
  const W = 600;
  const x = (t: number) => 16 + (t / DURATION) * (W - 32);
  return (
    <svg viewBox={`0 0 ${W} 46`} className="w-full h-auto" aria-hidden>
      <line x1={16} x2={W - 16} y1={30} y2={30} stroke="#3f3f46" />
      {[0, 10, 20, 30].map((t) => (
        <g key={t}>
          {showWindows && t > 0 && t < DURATION && <line x1={x(t)} x2={x(t)} y1={4} y2={36} stroke="#6366f1" strokeDasharray="3 3" strokeOpacity={0.7} />}
          <text x={x(t)} y={44} textAnchor="middle" fontSize={9} fill="#71717a">
            {t}s
          </text>
        </g>
      ))}
      {times.map((t, i) => (
        <g key={i} transform={`translate(${x(t)}, ${allowed[i] ? 18 : 18})`}>
          {allowed[i] ? (
            <circle r={4.5} fill="#34d399" stroke="#065f46" strokeWidth={1} />
          ) : (
            <g stroke="#fb7185" strokeWidth={1.8}>
              <line x1={-3.5} y1={-3.5} x2={3.5} y2={3.5} />
              <line x1={3.5} y1={-3.5} x2={-3.5} y2={3.5} />
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

type Result = { id: Algo; accepted: number; peak: number };

function insight(patternId: string, results: Result[]): string {
  const r = Object.fromEntries(results.map((x) => [x.id, x])) as Record<Algo, Result>;
  if (patternId === "edge")
    return `the fixed window let ${r.fixed.peak} requests through within a few seconds — ${r.fixed.peak > LIMIT ? "twice" : "within"} the limit — because the burst straddles a window boundary. The sliding log never exceeds ${LIMIT} in any ${WINDOW} s. The token bucket allowed ${r.token.peak}: its full capacity plus what refilled meanwhile. In any ${WINDOW} s a token bucket can allow up to capacity + refill × ${WINDOW} s, so choose the capacity deliberately.`;
  if (patternId === "burst")
    return `all three let through the first ${LIMIT} requests of the burst and reject the rest (${r.fixed.accepted}, ${r.sliding.accepted} and ${r.token.accepted} allowed overall). A burst beyond the limit or bucket capacity is cut off whichever algorithm you choose — the differences show up at boundaries and in sustained traffic.`;
  return `arrivals exceed the allowed average, so requests get rejected. The fixed window and sliding log allow ${r.fixed.accepted} and ${r.sliding.accepted} (the fixed window still peaks at ${r.fixed.peak} in one ${WINDOW} s span across a boundary). The token bucket allows ${r.token.accepted}: clients spend saved-up capacity first and are throttled once the bucket drains — over longer periods it converges to the refill rate.`;
}

/**
 * Practise step for rate limiting: the same traffic through three algorithms.
 * The "most in any 10 s" figure exposes the fixed-window edge burst.
 */
export function RateLimiterLab() {
  const [patternId, setPatternId] = useState(PATTERNS[0].id);
  const pattern = PATTERNS.find((p) => p.id === patternId) ?? PATTERNS[0];
  const results = useMemo(
    () =>
      ALGOS.map((a) => {
        const allowed = simulate(a.id, pattern.times);
        return { ...a, allowed, accepted: allowed.filter(Boolean).length, peak: maxInWindow(pattern.times, allowed) };
      }),
    [pattern],
  );

  return (
    <section aria-labelledby="rl-lab" className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
      <div>
        <h3 id="rl-lab" className="flex items-center gap-2 text-sm font-semibold text-white">
          <Gauge size={15} className="text-amber-400" /> Lab: three rate-limiting algorithms, same traffic
        </h3>
        <p className="mt-1 text-xs text-zinc-400">
          Limit: {LIMIT} requests per {WINDOW} s. Green dots are allowed, red crosses get HTTP 429.
        </p>
      </div>

      <div role="radiogroup" aria-label="Traffic pattern" className="flex flex-wrap gap-1.5">
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={p.id === patternId}
            onClick={() => setPatternId(p.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
              p.id === patternId ? "border-amber-500/50 bg-amber-500/15 text-amber-300" : "border-border text-zinc-400 hover:text-white",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-zinc-400">{pattern.description}</p>

      <div className="space-y-3">
        {results.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-background/60 p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-white">
                {r.label} <span className="text-xs font-normal text-zinc-500">· {r.rule}</span>
              </p>
              <p className="text-xs text-zinc-400">
                allowed <span className="font-mono text-white">{r.accepted}</span>/{pattern.times.length} · most in any {WINDOW} s:{" "}
                <span className={cn("font-mono font-semibold", r.peak > LIMIT ? "text-rose-300" : "text-emerald-300")}>{r.peak}</span>
              </p>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[420px]">
                <Timeline times={pattern.times} allowed={r.allowed} showWindows={r.id === "fixed"} />
              </div>
            </div>
            <p className="sr-only">
              {r.label}: {r.accepted} of {pattern.times.length} requests allowed; at most {r.peak} allowed within any {WINDOW}-second span.
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-400" aria-live="polite">
        <strong className="text-zinc-200">What to notice: </strong>
        {insight(pattern.id, results)}
      </p>
    </section>
  );
}
