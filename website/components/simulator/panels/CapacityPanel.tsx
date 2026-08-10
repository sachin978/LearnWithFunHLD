"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useSimulatorStore } from "@/lib/simulator/store";
import type { NodeData } from "@/lib/simulator/store";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.25, ease: "easeOut" as const } }),
};

function fmt(n: number, decimals = 1): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(decimals)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(decimals)}K`;
  return n.toFixed(decimals);
}

export default function CapacityPanel() {
  const { nodes, activeProblem } = useSimulatorStore();

  const [dau,         setDau]         = useState(10_000_000); // 10M
  const [reqPerUser,  setReqPerUser]  = useState(10);
  const [writeRatio,  setWriteRatio]  = useState(10);          // %
  const [dataSizeKB,  setDataSizeKB]  = useState(1);           // KB per write

  // ── Derived estimations ──────────────────────────────────────────────────
  const totalQPS     = (dau * reqPerUser) / 86_400;
  const peakQPS      = totalQPS * 3;
  const writeQPS     = totalQPS * (writeRatio / 100);
  const readQPS      = totalQPS - writeQPS;
  const writesPerDay = writeQPS * 86_400;
  const storageYear  = (writesPerDay * dataSizeKB * 365) / (1024 * 1024); // GB/year
  const bandwidthMBs = (peakQPS * dataSizeKB) / 1024;                     // MB/s

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      <div className="text-sm font-semibold text-white">Capacity Estimation</div>

      {/* User inputs */}
      <div className="p-3 rounded-lg border border-zinc-700 bg-zinc-900 space-y-3">
        <div className="text-xs text-zinc-400 font-medium">Estimation Inputs</div>
        {[
          { label: "DAU",           value: dau,        set: setDau,        min: 1_000,   max: 5_000_000_000, step: 1_000_000 },
          { label: "Req / User",    value: reqPerUser,  set: setReqPerUser, min: 1,       max: 1000,          step: 1 },
          { label: "Write ratio %", value: writeRatio,  set: setWriteRatio, min: 1,       max: 99,            step: 1 },
          { label: "Data size KB",  value: dataSizeKB,  set: setDataSizeKB, min: 0.1,     max: 10_000,        step: 1 },
        ].map(({ label, value, set, min, max, step }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-zinc-400 text-xs w-28 flex-shrink-0">{label}</span>
            <input
              type="number"
              value={value}
              onChange={(e) => set(Number(e.target.value))}
              min={min} max={max} step={step}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
            />
          </div>
        ))}
      </div>

      {/* Derived numbers */}
      <div className="p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/5">
        <div className="text-indigo-400 text-xs font-semibold mb-2">Estimated Numbers</div>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
          <Row label="Avg QPS"        value={`${fmt(totalQPS)}/s`} />
          <Row label="Peak QPS (3×)"  value={`${fmt(peakQPS)}/s`} highlight />
          <Row label="Read QPS"       value={`${fmt(readQPS)}/s`} />
          <Row label="Write QPS"      value={`${fmt(writeQPS)}/s`} />
          <Row label="Storage / year" value={`${storageYear.toFixed(1)} GB`} highlight />
          <Row label="Bandwidth peak" value={`${bandwidthMBs.toFixed(1)} MB/s`} />
        </div>
      </div>

      {/* Problem requirements */}
      {activeProblem && (
        <div className="p-3 rounded-lg border border-violet-500/30 bg-violet-500/5">
          <div className="text-violet-400 text-xs font-semibold mb-2">Problem Requirements</div>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-xs">
            <Row label="Reads"   value={`${activeProblem.requirements.readsPerSec}k/s`} />
            <Row label="Writes"  value={`${activeProblem.requirements.writesPerSec}k/s`} />
            <Row label="Storage" value={activeProblem.requirements.storage} />
            <Row label="Latency" value={activeProblem.requirements.latencySLA} />
          </div>
        </div>
      )}

      {/* Per-component capacity */}
      {nodes.length > 0 && activeProblem && (
        <div className="space-y-2">
          <div className="text-xs text-zinc-400 font-medium">Component Capacity vs Peak Load</div>
          {(() => {
            const peakK = peakQPS / 1000;
            return nodes.map((n, i) => {
              const d  = n.data as NodeData;
              const cap = d.rpsCapacity * (d.instances ?? 1);
              const ok  = cap >= peakK;
              const needed = Math.ceil(peakK / d.rpsCapacity);
              return (
                <motion.div
                  key={n.id}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  className={`p-2.5 rounded-lg border ${ok ? "border-zinc-700 bg-zinc-900" : "border-rose-500/30 bg-rose-500/5"}`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-white text-xs font-medium truncate">{d.label}</span>
                    <span className={`text-[10px] font-bold flex-shrink-0 ml-1 ${ok ? "text-emerald-400" : "text-rose-400"}`}>
                      {ok ? "✓ OK" : `Need ×${needed}`}
                    </span>
                  </div>
                  <div className="text-zinc-500 text-[10px]">
                    {d.instances ?? 1}×{d.rpsCapacity}k = <span className="text-zinc-300">{cap}k RPS</span>
                    {!ok && <span className="text-rose-400"> (peak: {peakK.toFixed(1)}k)</span>}
                  </div>
                </motion.div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <>
      <span className="text-zinc-400">{label}</span>
      <span className={highlight ? "text-white font-bold" : "text-zinc-200"}>{value}</span>
    </>
  );
}
