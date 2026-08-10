"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useSimulatorStore } from "@/lib/simulator/store";
import { scoreArchitecture } from "@/lib/simulator/scoring";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.25, ease: "easeOut" as const } }),
};

export default function ScorePanel() {
  const { nodes, edges, scoreResult, setScoreResult } = useSimulatorStore();

  const run = () => setScoreResult(scoreArchitecture(nodes, edges));

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      <div>
        <div className="text-sm font-semibold text-white mb-1">Interview Scoring</div>
        <p className="text-zinc-500 text-xs">Evaluates your architecture across 5 dimensions — 20 points each.</p>
      </div>

      <motion.button
        onClick={run}
        disabled={nodes.length === 0}
        whileHover={{ scale: nodes.length === 0 ? 1 : 1.02 }}
        whileTap={{ scale: nodes.length === 0 ? 1 : 0.98 }}
        className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
      >
        🎯 Score Design
      </motion.button>

      <AnimatePresence>
        {scoreResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Total score */}
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex items-center gap-4 p-3 rounded-lg border border-zinc-700 bg-zinc-900"
            >
              <div className="text-center min-w-[56px]">
                <div className={`text-3xl font-black ${scoreResult.verdictColor}`}>{scoreResult.total}</div>
                <div className="text-zinc-500 text-[10px]">/ 100</div>
              </div>
              <div className="flex-1">
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden mb-1.5">
                  <motion.div
                    className={`h-full rounded-full ${scoreResult.total >= 86 ? "bg-emerald-500" : scoreResult.total >= 71 ? "bg-cyan-500" : scoreResult.total >= 51 ? "bg-blue-500" : scoreResult.total >= 31 ? "bg-amber-500" : "bg-rose-500"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${scoreResult.total}%` }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                  />
                </div>
                <div className={`text-sm font-bold ${scoreResult.verdictColor}`}>{scoreResult.verdict}</div>
                <p className="text-zinc-400 text-[11px] mt-0.5 leading-snug">{scoreResult.summary}</p>
              </div>
            </motion.div>

            {/* 5-category breakdown */}
            {scoreResult.categories.map((cat, i) => {
              const pct = (cat.score / cat.maxScore) * 100;
              const barColor = pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500";
              return (
                <motion.div
                  key={cat.category}
                  custom={i + 1}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  className="p-3 rounded-lg border border-zinc-700 bg-zinc-900/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs font-semibold">{cat.category}</span>
                    <span className="text-xs font-bold text-zinc-300">{cat.score}/{cat.maxScore}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${barColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 + i * 0.05 }}
                    />
                  </div>
                  {cat.passed.length > 0 && (
                    <ul className="space-y-0.5">
                      {cat.passed.map((p) => (
                        <li key={p} className="flex gap-1.5 text-[11px]">
                          <span className="text-emerald-400 flex-shrink-0">✓</span>
                          <span className="text-zinc-300">{p}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {cat.feedback.length > 0 && (
                    <ul className="space-y-0.5">
                      {cat.feedback.map((f) => (
                        <li key={f} className="flex gap-1.5 text-[11px]">
                          <span className="text-zinc-500 flex-shrink-0">○</span>
                          <span className="text-zinc-500">{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
