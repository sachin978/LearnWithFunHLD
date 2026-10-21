"use client";

import { useId, useState } from "react";
import { Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes, formatCount } from "@/lib/learn/format";

interface Inputs {
  dau: number;
  readsPerUser: number;
  writesPerUser: number;
  bytesPerWrite: number;
  years: number;
  peak: number;
  replicas: number;
}

const PRESETS: { id: string; label: string; inputs: Inputs }[] = [
  { id: "photos", label: "Photo sharing", inputs: { dau: 10_000_000, readsPerUser: 50, writesPerUser: 0.2, bytesPerWrite: 2_000_000, years: 5, peak: 3, replicas: 3 } },
  { id: "url", label: "URL shortener", inputs: { dau: 10_000_000, readsPerUser: 33, writesPerUser: 0.33, bytesPerWrite: 500, years: 5, peak: 2.5, replicas: 3 } },
  { id: "chat", label: "Chat app", inputs: { dau: 50_000_000, readsPerUser: 80, writesPerUser: 40, bytesPerWrite: 200, years: 5, peak: 2.5, replicas: 3 } },
  { id: "feed", label: "News feed", inputs: { dau: 200_000_000, readsPerUser: 10, writesPerUser: 0.5, bytesPerWrite: 1_000, years: 5, peak: 3, replicas: 3 } },
];

function NumberField({ label, hint, value, onChange, step = "any" }: { label: string; hint?: string; value: number; onChange: (v: number) => void; step?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-zinc-400 mb-1">
        {label} {hint && <span className="text-zinc-600">({hint})</span>}
      </label>
      <input
        id={id}
        type="number"
        min={0}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="w-full rounded-lg border border-border bg-zinc-950 px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500/60 focus-visible:ring-2 focus-visible:ring-amber-500/30"
      />
    </div>
  );
}

/**
 * Practise step for estimation: change the assumptions and see every step of
 * the derivation, plus what the numbers suggest for the design. The
 * "suggestions" are rough rules of thumb to discuss, not hard limits.
 */
export function EstimationLab() {
  const [inputs, setInputs] = useState<Inputs>(PRESETS[0].inputs);
  const [preset, setPreset] = useState<string>(PRESETS[0].id);
  const set = (k: keyof Inputs) => (v: number) => {
    setInputs((s) => ({ ...s, [k]: v }));
    setPreset("custom");
  };

  const readsDay = inputs.dau * inputs.readsPerUser;
  const writesDay = inputs.dau * inputs.writesPerUser;
  const readsSec = readsDay / 86_400;
  const writesSec = writesDay / 86_400;
  const peakReads = readsSec * inputs.peak;
  const peakWrites = writesSec * inputs.peak;
  const ratio = writesDay > 0 ? readsDay / writesDay : Infinity;
  const bytesDay = writesDay * inputs.bytesPerWrite;
  const rawTotal = bytesDay * 365 * inputs.years;
  const replicated = rawTotal * inputs.replicas;

  const signals: string[] = [];
  if (inputs.bytesPerWrite >= 1_000_000) signals.push("Large objects: keep the blobs in object storage, metadata in a database, and serve reads through a CDN.");
  if (peakReads > 5_000) signals.push(`~${formatCount(peakReads)} reads/s at peak: caching (and possibly read replicas) is worth discussing.`);
  if (peakWrites > 5_000) signals.push(`~${formatCount(peakWrites)} writes/s at peak may exceed one primary: discuss partitioning (sharding) or buffering writes through a queue.`);
  if (inputs.bytesPerWrite < 1_000_000 && replicated > 10e12) signals.push(`~${formatBytes(replicated)} with replicas over ${inputs.years} years: plan partitioning and archiving older data.`);
  if (ratio >= 10) signals.push(`Read-heavy (${formatCount(ratio)}:1): optimise the read path — caching, precomputation.`);
  else if (ratio <= 1) signals.push("Write-heavy: favour append-friendly storage partitioned by the main access key.");
  if (signals.length === 0) signals.push("Small enough for a single well-provisioned database with replicas — don't over-engineer it.");

  const line = (label: string, formula: string, result: string) => ({ label, formula, result });
  const lines = [
    line("Reads per day", `${formatCount(inputs.dau)} users × ${inputs.readsPerUser}`, formatCount(readsDay)),
    line("Average reads/s", `${formatCount(readsDay)} ÷ 86,400 s (≈ ÷ 10⁵)`, `${formatCount(readsSec)}/s`),
    line("Peak reads/s", `${formatCount(readsSec)} × ${inputs.peak}`, `${formatCount(peakReads)}/s`),
    line("Writes per day", `${formatCount(inputs.dau)} users × ${inputs.writesPerUser}`, formatCount(writesDay)),
    line("Average / peak writes/s", `${formatCount(writesDay)} ÷ 86,400, then × ${inputs.peak}`, `${formatCount(writesSec)}/s · ${formatCount(peakWrites)}/s`),
    line("Read : write", "reads per day ÷ writes per day", Number.isFinite(ratio) ? `${formatCount(ratio)} : 1` : "—"),
    line("New data per day", `${formatCount(writesDay)} × ${formatBytes(inputs.bytesPerWrite)}`, formatBytes(bytesDay)),
    line(`Storage over ${inputs.years} years`, `${formatBytes(bytesDay)} × 365 × ${inputs.years}`, formatBytes(rawTotal)),
    line(`With ${inputs.replicas} replicas`, `${formatBytes(rawTotal)} × ${inputs.replicas}`, formatBytes(replicated)),
  ];

  return (
    <section aria-labelledby="estimation-lab" className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
      <div>
        <h3 id="estimation-lab" className="flex items-center gap-2 text-sm font-semibold text-white">
          <Calculator size={15} className="text-amber-400" /> Lab: derive an estimate step by step
        </h3>
        <p className="mt-1 text-xs text-zinc-400">Pick a scenario or change the assumptions. Every line shows its arithmetic, so you can practise saying it out loud.</p>
      </div>

      <div role="group" aria-label="Scenario presets" className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={preset === p.id}
            onClick={() => {
              setInputs(p.inputs);
              setPreset(p.id);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
              preset === p.id ? "border-amber-500/50 bg-amber-500/15 text-amber-300" : "border-border text-zinc-400 hover:text-white",
            )}
          >
            {p.label}
          </button>
        ))}
        {preset === "custom" && <span className="px-2 py-1.5 text-xs text-zinc-500">Custom assumptions</span>}
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <NumberField label="Daily active users" value={inputs.dau} onChange={set("dau")} step="1000000" />
        <NumberField label="Reads per user/day" value={inputs.readsPerUser} onChange={set("readsPerUser")} />
        <NumberField label="Writes per user/day" value={inputs.writesPerUser} onChange={set("writesPerUser")} />
        <NumberField label="Bytes per write" value={inputs.bytesPerWrite} onChange={set("bytesPerWrite")} step="100" />
        <NumberField label="Retention" hint="years" value={inputs.years} onChange={set("years")} step="1" />
        <NumberField label="Peak factor" hint="× average" value={inputs.peak} onChange={set("peak")} step="0.5" />
        <NumberField label="Replication factor" value={inputs.replicas} onChange={set("replicas")} step="1" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm min-w-[480px]">
          <caption className="sr-only">Derivation</caption>
          <tbody>
            {lines.map((l) => (
              <tr key={l.label} className="border-b border-border/60 last:border-0">
                <th scope="row" className="text-left font-medium text-zinc-300 px-3 py-2 whitespace-nowrap">
                  {l.label}
                </th>
                <td className="px-3 py-2 text-xs text-zinc-500 font-mono">{l.formula}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold text-white whitespace-nowrap">{l.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-3" aria-live="polite">
        <p className="text-xs font-semibold text-amber-300 mb-1.5">What the numbers suggest</p>
        <ul className="space-y-1 text-sm text-zinc-200 list-disc pl-5">
          {signals.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-zinc-500">Rough rules of thumb to discuss, not hard limits — real capacity depends on hardware, data shape and query patterns.</p>
      </div>
    </section>
  );
}
