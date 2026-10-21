"use client";

import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ScenePlayer } from "@/components/learn/scene/ScenePlayer";
import { buildBacklogScene, buildPrefetchScene, simulateBacklog } from "@/lib/learn/rabbitmq/scenes";
import { DECISION_SCENARIOS, type Tech } from "@/lib/learn/rabbitmq/chapters";

// ─── Prefetch ────────────────────────────────────────────────────────────────

const PREFETCH_OPTIONS = [1, 2, 4];

export function PrefetchLab() {
  const [prefetch, setPrefetch] = useState(1);
  const scene = useMemo(() => buildPrefetchScene(prefetch), [prefetch]);
  const results = useMemo(
    () =>
      PREFETCH_OPTIONS.map((p) => {
        const s = buildPrefetchScene(p);
        return { p, ticks: s.steps.length - 2 };
      }),
    [],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-zinc-400" id="prefetch-label">
          Prefetch count
        </span>
        <div role="radiogroup" aria-labelledby="prefetch-label" className="flex gap-1.5">
          {PREFETCH_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={prefetch === p}
              onClick={() => setPrefetch(p)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-mono border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                prefetch === p ? "border-amber-500/50 bg-amber-500/15 text-amber-300" : "border-border text-zinc-400 hover:text-white",
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <span className="text-xs text-zinc-500">
          Total time:{" "}
          {results.map((r, i) => (
            <span key={r.p} className={cn(r.p === prefetch && "text-amber-300 font-semibold")}>
              {i > 0 && " · "}prefetch {r.p} → {r.ticks} ticks
            </span>
          ))}
        </span>
      </div>
      <ScenePlayer key={scene.id} scene={scene} />
    </div>
  );
}

// ─── Backlog ─────────────────────────────────────────────────────────────────

function Slider({ label, value, min, max, onChange, suffix }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; suffix: string }) {
  const id = useId();
  return (
    <div className="flex-1 min-w-[140px]">
      <label htmlFor={id} className="flex justify-between text-xs text-zinc-400 mb-1">
        <span>{label}</span>
        <span className="font-mono text-amber-300">
          {value} {suffix}
        </span>
      </label>
      <input id={id} type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-amber-500" />
    </div>
  );
}

function DepthChart({ depths, upTo }: { depths: number[]; upTo: number }) {
  const max = Math.max(10, ...depths);
  const w = 300;
  const h = 70;
  const step = w / Math.max(1, depths.length - 1);
  const points = depths.slice(0, upTo + 1).map((d, i) => `${i * step},${h - (d / max) * (h - 6) - 3}`);
  return (
    <div className="rounded-xl border border-border bg-zinc-950/60 p-3">
      <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
        <span>Queue depth over time (illustrative, not a benchmark)</span>
        <span className="font-mono text-amber-300">{depths[upTo]}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16" role="img" aria-label={`Queue depth by tick: ${depths.slice(0, upTo + 1).join(", ")}`}>
        <line x1={0} x2={w} y1={h - 3} y2={h - 3} stroke="#3f3f46" />
        <polyline points={points.join(" ")} fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinejoin="round" />
        {points.length > 0 && <circle cx={upTo * step} cy={h - (depths[upTo] / max) * (h - 6) - 3} r={3.5} fill="#f59e0b" />}
      </svg>
    </div>
  );
}

export function BacklogLab() {
  const [rate, setRate] = useState(6);
  const [consumers, setConsumers] = useState(2);
  const [perConsumer, setPerConsumer] = useState(2);
  const scene = useMemo(() => buildBacklogScene({ rate, consumers, perConsumer }), [rate, consumers, perConsumer]);
  const depths = useMemo(() => simulateBacklog({ rate, consumers, perConsumer }), [rate, consumers, perConsumer]);
  const capacity = consumers * perConsumer;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-card p-3">
        <Slider label="Producer rate" value={rate} min={1} max={10} onChange={setRate} suffix="msg/tick" />
        <Slider label="Workers" value={consumers} min={1} max={4} onChange={setConsumers} suffix="" />
        <Slider label="Speed per worker" value={perConsumer} min={1} max={3} onChange={setPerConsumer} suffix="msg/tick" />
        <p className={cn("w-full text-xs", rate > capacity ? "text-rose-300" : rate < capacity ? "text-emerald-300" : "text-amber-300")}>
          Arrivals {rate}/tick vs capacity {capacity}/tick →{" "}
          {rate > capacity ? `backlog grows by ${rate - capacity} per tick` : rate < capacity ? "backlog drains" : "backlog holds steady"}
        </p>
      </div>
      <ScenePlayer key={scene.id} scene={scene} renderBelow={(i) => <DepthChart depths={depths} upTo={i} />} />
    </div>
  );
}

// ─── Decision scenarios ──────────────────────────────────────────────────────

const TECH_LABEL: Record<Tech, string> = { rabbitmq: "RabbitMQ", kafka: "Kafka", either: "Either" };

export function DecisionScenarios() {
  const [picks, setPicks] = useState<Record<string, Tech>>({});
  const correct = DECISION_SCENARIOS.filter((s) => picks[s.id] === s.best).length;
  const answered = Object.keys(picks).length;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-white font-semibold">Which would you pick?</h4>
        <span className="text-xs text-zinc-400" aria-live="polite">
          {answered === DECISION_SCENARIOS.length ? `${correct}/${DECISION_SCENARIOS.length} match the usual choice` : `${answered}/${DECISION_SCENARIOS.length} answered`}
        </span>
      </div>
      <ol className="space-y-3">
        {DECISION_SCENARIOS.map((s, i) => {
          const pick = picks[s.id];
          return (
            <li key={s.id} className="rounded-xl border border-border bg-zinc-950/50 p-3">
              <p className="text-sm text-zinc-100 mb-2">
                <span className="text-zinc-500 mr-1.5">{i + 1}.</span>
                {s.prompt}
              </p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Choose a technology for scenario ${i + 1}`}>
                {(["rabbitmq", "kafka"] as Tech[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={pick === t}
                    onClick={() => setPicks((p) => ({ ...p, [s.id]: t }))}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-semibold border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                      pick === t
                        ? t === s.best
                          ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                          : "border-amber-500/50 bg-amber-500/10 text-amber-300"
                        : "border-border text-zinc-400 hover:text-white",
                    )}
                  >
                    {TECH_LABEL[t]}
                  </button>
                ))}
              </div>
              {pick && (
                <p className="mt-2 text-xs leading-relaxed text-zinc-300" role="status">
                  <strong className={pick === s.best ? "text-emerald-300" : "text-amber-300"}>
                    {pick === s.best ? "Good call. " : `Usually ${TECH_LABEL[s.best]}. `}
                  </strong>
                  {s.explanation}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
