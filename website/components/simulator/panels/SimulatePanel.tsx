"use client";
import { useSimulatorStore } from "@/lib/simulator/store";
import { runSimulation } from "@/lib/simulator/simulation";

export default function SimulatePanel() {
  const { nodes, edges, activeProblem, simulationResult, setSimulationResult, setRightTab } = useSimulatorStore();

  const run = () => {
    const result = runSimulation(nodes, edges, activeProblem);
    setSimulationResult(result);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      <div>
        <div className="text-sm font-semibold text-white mb-1">Load Simulation</div>
        <p className="text-zinc-500 text-xs">
          Simulates traffic flow through your architecture and identifies bottlenecks.
        </p>
      </div>

      <button
        onClick={run}
        disabled={!activeProblem || nodes.length === 0}
        className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
      >
        ⚡ Run Simulation
      </button>

      {!activeProblem && (
        <p className="text-zinc-500 text-xs text-center">Select a problem first to define load requirements.</p>
      )}

      {simulationResult && (
        <div className="space-y-3">
          <div className={`px-3 py-2 rounded-lg text-xs font-medium ${simulationResult.bottlenecks.length === 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"}`}>
            {simulationResult.summary}
          </div>

          <div className="text-xs text-zinc-400">
            Total load: <span className="text-white font-mono">{simulationResult.totalRps}k RPS</span>
          </div>

          {simulationResult.allNodes.map((r) => (
            <div key={r.nodeId} className={`p-3 rounded-lg border ${r.status === "critical" ? "border-rose-500/40 bg-rose-500/5" : r.status === "warning" ? "border-amber-500/40 bg-amber-500/5" : "border-zinc-700 bg-zinc-900"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-xs font-medium truncate">{r.label}</span>
                <span className={`text-[10px] font-bold ml-1 flex-shrink-0 ${r.status === "critical" ? "text-rose-400" : r.status === "warning" ? "text-amber-400" : "text-emerald-400"}`}>
                  {r.status === "critical" ? "BOTTLENECK" : r.status === "warning" ? "WARNING" : "OK"}
                </span>
              </div>
              {/* Utilisation bar */}
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full ${r.status === "critical" ? "bg-rose-500" : r.status === "warning" ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(r.utilisation * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>{r.incomingRps.toFixed(1)}k / {r.capacity}k RPS</span>
                <span>{Math.round(r.utilisation * 100)}%</span>
              </div>
              {r.status !== "ok" && <p className="mt-1 text-[10px] text-zinc-400">{r.suggestion}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
