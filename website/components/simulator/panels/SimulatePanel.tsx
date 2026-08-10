"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useSimulatorStore } from "@/lib/simulator/store";
import { runSimulation } from "@/lib/simulator/simulation";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.25, ease: "easeOut" as const } }),
};

export default function SimulatePanel() {
  const { nodes, edges, activeProblem, simulationResult, setSimulationResult } = useSimulatorStore();

  const run = () => setSimulationResult(runSimulation(nodes, edges, activeProblem));

  const fmtLatency = (ms: number) =>
    ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      <div>
        <div className="text-sm font-semibold text-white mb-1">Load Simulation</div>
        <p className="text-zinc-500 text-xs">
          Simulates traffic flow through your architecture and identifies bottlenecks.
        </p>
      </div>

      <motion.button
        onClick={run}
        disabled={!activeProblem || nodes.length === 0}
        whileHover={{ scale: !activeProblem || nodes.length === 0 ? 1 : 1.02 }}
        whileTap={{ scale: !activeProblem || nodes.length === 0 ? 1 : 0.98 }}
        className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
      >
        ⚡ Run Simulation
      </motion.button>

      {!activeProblem && (
        <p className="text-zinc-500 text-xs text-center">Select a problem first to define load requirements.</p>
      )}

      <AnimatePresence>
        {simulationResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className={`px-3 py-2 rounded-lg text-xs font-medium ${simulationResult.bottlenecks.length === 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"}`}
            >
              {simulationResult.summary}
            </motion.div>

            {/* Global metrics */}
            <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp} className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg border border-zinc-700 bg-zinc-900 text-center">
                <div className="text-white font-bold text-sm">{simulationResult.totalRps}k</div>
                <div className="text-zinc-500 text-[10px]">Total RPS</div>
              </div>
              <div className="p-2 rounded-lg border border-zinc-700 bg-zinc-900 text-center">
                <div className="text-white font-bold text-sm">{simulationResult.throughput.toFixed(1)}k</div>
                <div className="text-zinc-500 text-[10px]">Throughput</div>
              </div>
              <div className={`p-2 rounded-lg border text-center ${simulationResult.totalLatencyMs > 1000 ? "border-rose-500/40 bg-rose-500/5" : simulationResult.totalLatencyMs > 200 ? "border-amber-500/40 bg-amber-500/5" : "border-zinc-700 bg-zinc-900"}`}>
                <div className="text-white font-bold text-sm">{fmtLatency(simulationResult.totalLatencyMs)}</div>
                <div className="text-zinc-500 text-[10px]">Path Latency</div>
              </div>
            </motion.div>

            {/* Per-node results */}
            {simulationResult.allNodes.map((r, i) => (
              <motion.div
                key={r.nodeId}
                custom={i + 2}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className={`p-3 rounded-lg border ${r.status === "critical" ? "border-rose-500/40 bg-rose-500/5" : r.status === "warning" ? "border-amber-500/40 bg-amber-500/5" : r.status === "idle" ? "border-zinc-700/50 bg-zinc-900/40" : "border-zinc-700 bg-zinc-900"}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-white text-xs font-medium truncate">{r.label}</span>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-1">
                    <span className="text-[10px] text-zinc-500">{fmtLatency(r.latencyMs)}</span>
                    <span className={`text-[10px] font-bold ${r.status === "critical" ? "text-rose-400" : r.status === "warning" ? "text-amber-400" : r.status === "idle" ? "text-zinc-600" : "text-emerald-400"}`}>
                      {r.status === "critical" ? "BOTTLENECK" : r.status === "warning" ? "WARN" : r.status === "idle" ? "IDLE" : "OK"}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-1">
                  <motion.div
                    className={`h-full rounded-full ${r.status === "critical" ? "bg-rose-500" : r.status === "warning" ? "bg-amber-500" : r.status === "idle" ? "bg-zinc-700" : "bg-emerald-500"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(r.utilisation * 100, 100)}%` }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 + i * 0.04 }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>{r.incomingRps.toFixed(1)}k / {r.capacity}k RPS</span>
                  <span>{Math.round(r.utilisation * 100)}%</span>
                </div>
                {r.status !== "healthy" && r.status !== "idle" && (
                  <p className="mt-1 text-[10px] text-zinc-400">{r.suggestion}</p>
                )}
              </motion.div>
            ))}

            {/* Warnings */}
            {simulationResult.warnings.length > 0 && (
              <div className="space-y-1">
                {simulationResult.warnings.map((w, i) => (
                  <motion.div
                    key={i}
                    custom={i + simulationResult.allNodes.length + 2}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    className="flex gap-2 text-[11px] text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-lg px-2.5 py-1.5"
                  >
                    <span className="flex-shrink-0">⚠</span>
                    <span>{w}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
