"use client";

import { useId, useState } from "react";
import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/learn/format";

/** p99 of an exponential distribution = ln(100) × mean. */
const P99_FACTOR = Math.log(100);
const CURVE_CAP = 25;

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

const ms = (v: number) => (v < 10 ? `${v.toFixed(1)} ms` : `${Math.round(v)} ms`);

/** "Latency as a multiple of service time" against utilisation, 0–99%. */
function curvePath(width: number, height: number): string {
  const pts: string[] = [];
  for (let i = 0; i <= 99; i++) {
    const u = i / 100;
    const y = Math.min(CURVE_CAP, 1 / (1 - u));
    pts.push(`${(u * width).toFixed(1)},${(height - (y / CURVE_CAP) * height).toFixed(1)}`);
  }
  return `M${pts.join(" L")}`;
}

/**
 * Practise step for bottlenecks: one resource serving one request at a time,
 * as an idealised M/M/1 queue (random arrivals and service times). Average
 * time in the system = service time ÷ (1 − utilisation); the time is
 * exponentially distributed, so p99 = ln(100) × average. Formulas are shown.
 */
export function QueueingLab() {
  const [rate, setRate] = useState(600);
  const [serviceMs, setServiceMs] = useState(1.25);

  const capacity = 1000 / serviceMs;
  const utilisation = rate / capacity;
  const overloaded = utilisation >= 1;
  const avg = overloaded ? Infinity : serviceMs / (1 - utilisation);
  const p99 = avg * P99_FACTOR;
  const inFlight = (rate * avg) / 1000;
  const backlogPerSec = rate - capacity;
  const status = overloaded ? "overloaded" : utilisation >= 0.9 ? "danger" : utilisation >= 0.7 ? "knee" : "healthy";

  const STATUS = {
    healthy: { label: "Comfortable", text: "Requests rarely wait long; there's headroom for spikes.", cls: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10" },
    knee: { label: "On the knee of the curve", text: "Each extra request per second now adds noticeably more waiting.", cls: "text-amber-300 border-amber-500/40 bg-amber-500/10" },
    danger: { label: "Running hot", text: "Waiting dominates the response time, and a small spike would multiply it.", cls: "text-rose-300 border-rose-500/40 bg-rose-500/10" },
    overloaded: {
      label: "Overloaded",
      text: `More requests arrive than can be served: the queue grows by about ${formatCount(backlogPerSec)} requests every second until clients time out.`,
      cls: "text-rose-300 border-rose-500/40 bg-rose-500/10",
    },
  } as const;
  const s = STATUS[status];

  const W = 300;
  const H = 120;
  const markerX = Math.min(0.99, utilisation) * W;
  const markerY = H - (Math.min(CURVE_CAP, overloaded ? CURVE_CAP : 1 / (1 - utilisation)) / CURVE_CAP) * H;

  return (
    <section aria-labelledby="queueing-lab" className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
      <div>
        <h3 id="queueing-lab" className="flex items-center gap-2 text-sm font-semibold text-white">
          <FlaskConical size={15} className="text-amber-400" /> Lab: why latency explodes near full utilisation
        </h3>
        <p className="mt-1 text-xs text-zinc-400">
          One resource — a database or a single worker — serving one request at a time, in an idealised queueing model. Change the traffic and the time each request takes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Slider label="Traffic" value={rate} min={100} max={1200} step={10} onChange={setRate} display={`${formatCount(rate)}/s`} />
        <Slider label="Time to serve one request" value={serviceMs} min={0.5} max={5} step={0.25} onChange={setServiceMs} display={`${serviceMs} ms`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_1.1fr] items-center">
        <svg viewBox={`-28 -8 ${W + 40} ${H + 30}`} className="w-full" aria-hidden>
          <line x1={0} y1={H} x2={W} y2={H} className="stroke-zinc-700" />
          <line x1={0} y1={0} x2={0} y2={H} className="stroke-zinc-700" />
          {[0.5, 0.7, 0.9].map((u) => (
            <g key={u}>
              <line x1={u * W} y1={0} x2={u * W} y2={H} className="stroke-zinc-800" strokeDasharray="3 3" />
              <text x={u * W} y={H + 13} textAnchor="middle" className="fill-zinc-500 text-[9px]">
                {Math.round(u * 100)}%
              </text>
            </g>
          ))}
          <text x={W} y={H + 13} textAnchor="end" className="fill-zinc-500 text-[9px]">
            100%
          </text>
          <text x={-6} y={4} textAnchor="end" className="fill-zinc-500 text-[9px]">
            {CURVE_CAP}×
          </text>
          <text x={-6} y={H} textAnchor="end" className="fill-zinc-500 text-[9px]">
            1×
          </text>
          <path d={curvePath(W, H)} fill="none" className="stroke-amber-400" strokeWidth={2} />
          <circle cx={markerX} cy={markerY} r={5} className={overloaded ? "fill-rose-500" : "fill-white"} />
          <text x={W / 2} y={H + 26} textAnchor="middle" className="fill-zinc-500 text-[9px]">
            utilisation → (latency shown as a multiple of the time to serve one request)
          </text>
        </svg>

        <dl className="grid grid-cols-2 gap-3">
          {[
            { k: "Capacity", v: `${formatCount(capacity)}/s` },
            { k: "Utilisation", v: overloaded ? `${Math.round(utilisation * 100)}% (over)` : `${Math.round(utilisation * 100)}%` },
            { k: "Average latency", v: overloaded ? "unbounded" : ms(avg) },
            { k: "p99 latency", v: overloaded ? "unbounded" : ms(p99) },
            { k: "Requests in flight", v: overloaded ? "growing" : inFlight.toFixed(1) },
            { k: "Time spent queueing", v: overloaded ? "unbounded" : ms(avg - serviceMs) },
          ].map((m) => (
            <div key={m.k} className="rounded-xl border border-border bg-background/60 p-3">
              <dt className="text-[11px] text-zinc-500">{m.k}</dt>
              <dd className="text-lg font-semibold text-white font-mono">{m.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className={cn("rounded-xl border px-3 py-2 text-sm", s.cls)} aria-live="polite">
        <strong>{s.label}.</strong> <span className="text-zinc-200">{s.text}</span>
      </p>

      <details className="text-xs text-zinc-400">
        <summary className="cursor-pointer text-zinc-300">Formulas and what to try</summary>
        <ul className="mt-2 space-y-1 list-disc pl-5">
          <li>Capacity = 1000 ÷ time per request (ms). Utilisation = traffic ÷ capacity.</li>
          <li>Average latency = time per request ÷ (1 − utilisation). p99 = ln(100) × average ≈ 4.6 × average (the time in this model is exponentially distributed).</li>
          <li>Requests in flight = traffic × average latency (Little&apos;s law) — they must fit in your workers and connection pools.</li>
          <li>Try: at 1.25 ms, raise traffic from 400/s to 760/s. Traffic grows 1.9×, but average latency grows 10× (2.5 → 25 ms).</li>
          <li>Then keep 760/s and cut the time per request to 1 ms (a faster query): utilisation drops to 76% and average latency to about 4.2 ms. Making each request cheaper raises capacity and cuts waiting.</li>
          <li>
            The model is idealised (M/M/1: random arrivals and service times, one server). Pools of workers push the knee towards higher utilisation and bursty traffic pulls it lower — but the shape holds.
          </li>
        </ul>
      </details>
    </section>
  );
}
