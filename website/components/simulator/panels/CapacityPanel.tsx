"use client";
import { useSimulatorStore } from "@/lib/simulator/store";
import type { NodeData } from "@/lib/simulator/store";

export default function CapacityPanel() {
  const { nodes, activeProblem } = useSimulatorStore();

  if (!activeProblem) {
    return <div className="p-4 text-center text-zinc-500 text-xs">Select a problem to see capacity planning.</div>;
  }

  const req = activeProblem.requirements;
  const totalRps = req.readsPerSec + req.writesPerSec;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      <div className="text-sm font-semibold text-white">Capacity Planning</div>

      {/* Problem requirements */}
      <div className="p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/5">
        <div className="text-indigo-400 text-xs font-semibold mb-2">Target Load</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-zinc-400">Reads: </span><span className="text-white">{req.readsPerSec}k/s</span></div>
          <div><span className="text-zinc-400">Writes: </span><span className="text-white">{req.writesPerSec}k/s</span></div>
          <div><span className="text-zinc-400">Total: </span><span className="text-white font-bold">{totalRps}k/s</span></div>
          <div><span className="text-zinc-400">Storage: </span><span className="text-white">{req.storage}</span></div>
          <div className="col-span-2"><span className="text-zinc-400">Latency: </span><span className="text-white">{req.latencySLA}</span></div>
        </div>
      </div>

      {nodes.length === 0 ? (
        <p className="text-zinc-500 text-xs text-center">Add components to the canvas to see capacity analysis.</p>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-zinc-400 font-medium">Your Components vs Required Load</div>
          {nodes.map((n) => {
            const d = n.data as NodeData;
            const capacity = d.rpsCapacity * (d.instances ?? 1);
            const needed = Math.ceil(totalRps / d.rpsCapacity);
            const ok = capacity >= totalRps;
            return (
              <div key={n.id} className={`p-3 rounded-lg border ${ok ? "border-zinc-700 bg-zinc-900" : "border-rose-500/30 bg-rose-500/5"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-xs font-medium truncate">{d.label}</span>
                  <span className={`text-[10px] font-bold ${ok ? "text-emerald-400" : "text-rose-400"}`}>
                    {ok ? "✓" : `Need ×${needed}`}
                  </span>
                </div>
                <div className="text-zinc-500 text-[10px]">
                  {d.instances ?? 1}×{d.rpsCapacity}k = <span className="text-white">{capacity}k RPS</span>
                  {!ok && <span className="text-rose-400"> (need {totalRps}k)</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
