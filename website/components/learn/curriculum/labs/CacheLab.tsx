"use client";

import { useId, useState } from "react";
import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/learn/format";

const CACHE_MS = 1;
const DB_MS = 10;

function Slider({ label, value, min, max, step, onChange, display }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; display: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex justify-between text-xs text-zinc-400 mb-1">
        <span>{label}</span>
        <span className="font-mono text-amber-300">{display}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-amber-500" />
    </div>
  );
}

/**
 * Practise step for caching: change traffic, hit ratio and database capacity
 * and watch database load and latency respond. A deliberately simple model
 * (no queueing effects below saturation) with its formulas shown.
 */
export function CacheLab() {
  const [reads, setReads] = useState(20000);
  const [hitPct, setHitPct] = useState(90);
  const [capacity, setCapacity] = useState(4000);
  const [cacheDown, setCacheDown] = useState(false);

  const h = cacheDown ? 0 : hitPct / 100;
  const dbReads = reads * (1 - h);
  const utilisation = dbReads / capacity;
  const avgLatency = h * CACHE_MS + (1 - h) * (CACHE_MS + DB_MS);
  const minHit = Math.max(0, 1 - capacity / reads);
  const status = utilisation > 1 ? "overloaded" : utilisation > 0.7 ? "near" : "healthy";

  const STATUS = {
    healthy: { label: "Healthy", text: "The database has headroom.", cls: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10" },
    near: { label: "Near capacity", text: "Little headroom: a traffic spike or a drop in hit ratio would overload it.", cls: "text-amber-300 border-amber-500/40 bg-amber-500/10" },
    overloaded: {
      label: "Overloaded",
      text: "More reads arrive than the database can serve: requests queue, latency climbs without bound and timeouts cascade.",
      cls: "text-rose-300 border-rose-500/40 bg-rose-500/10",
    },
  } as const;

  const s = STATUS[status];
  const hitWidth = Math.round(h * 100);

  return (
    <section aria-labelledby="cache-lab" className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
      <div>
        <h3 id="cache-lab" className="flex items-center gap-2 text-sm font-semibold text-white">
          <FlaskConical size={15} className="text-amber-400" /> Lab: how the hit ratio decides database load
        </h3>
        <p className="mt-1 text-xs text-zinc-400">A simplified model: cache reads take {CACHE_MS} ms, database reads {DB_MS} ms. Change the inputs and watch what happens.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Slider label="Read traffic" value={reads} min={1000} max={50000} step={1000} onChange={setReads} display={`${formatCount(reads)}/s`} />
        <Slider label="Cache hit ratio" value={hitPct} min={0} max={99} step={1} onChange={setHitPct} display={cacheDown ? "0% (down)" : `${hitPct}%`} />
        <Slider label="Database capacity" value={capacity} min={1000} max={20000} step={500} onChange={setCapacity} display={`${formatCount(capacity)}/s`} />
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
        <input type="checkbox" checked={cacheDown} onChange={(e) => setCacheDown(e.target.checked)} className="h-4 w-4 accent-rose-500" />
        Simulate the cache going down
      </label>

      <div aria-hidden className="space-y-1.5">
        <div className="flex h-6 overflow-hidden rounded-lg border border-border text-[10px] font-semibold">
          <div className="flex items-center justify-center bg-emerald-500/30 text-emerald-100 transition-all" style={{ width: `${hitWidth}%` }}>
            {hitWidth >= 15 && "cache hits"}
          </div>
          <div className="flex items-center justify-center bg-rose-500/30 text-rose-100 transition-all" style={{ width: `${100 - hitWidth}%` }}>
            {100 - hitWidth >= 15 && "to database"}
          </div>
        </div>
        <div className="relative h-3 rounded-full bg-zinc-800 overflow-hidden">
          <div className={cn("h-full transition-all", status === "overloaded" ? "bg-rose-500" : status === "near" ? "bg-amber-400" : "bg-emerald-500")} style={{ width: `${Math.min(100, utilisation * 100)}%` }} />
        </div>
        <p className="text-[11px] text-zinc-500">Database utilisation</p>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { k: "Database reads", v: `${formatCount(dbReads)}/s` },
          { k: "Utilisation", v: `${Math.round(utilisation * 100)}%` },
          { k: "Average latency", v: status === "overloaded" ? "unbounded" : `${avgLatency.toFixed(1)} ms` },
          { k: "Hit ratio needed", v: `≥ ${Math.ceil(minHit * 100)}%` },
        ].map((m) => (
          <div key={m.k} className="rounded-xl border border-border bg-background/60 p-3">
            <dt className="text-[11px] text-zinc-500">{m.k}</dt>
            <dd className="text-lg font-semibold text-white font-mono">{m.v}</dd>
          </div>
        ))}
      </dl>

      <p className={cn("rounded-xl border px-3 py-2 text-sm", s.cls)} aria-live="polite">
        <strong>{s.label}.</strong> <span className="text-zinc-200">{s.text}</span>
      </p>

      <details className="text-xs text-zinc-400">
        <summary className="cursor-pointer text-zinc-300">Formulas and what to try</summary>
        <ul className="mt-2 space-y-1 list-disc pl-5">
          <li>Database reads = traffic × (1 − hit ratio). Utilisation = database reads ÷ capacity.</li>
          <li>Average latency = hit ratio × {CACHE_MS} ms + (1 − hit ratio) × ({CACHE_MS} + {DB_MS}) ms (a miss checks the cache, then the database).</li>
          <li>Minimum hit ratio = 1 − capacity ÷ traffic — below it, the database can&apos;t keep up.</li>
          <li>Try: at 20k reads/s, lower the hit ratio until the database overloads. Then tick &quot;cache down&quot; — this is why cache failures need a plan.</li>
        </ul>
      </details>
    </section>
  );
}
