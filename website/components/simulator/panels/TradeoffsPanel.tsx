"use client";
import { motion } from "framer-motion";
import { useSimulatorStore } from "@/lib/simulator/store";
import type { NodeData } from "@/lib/simulator/store";
import { TRADEOFFS } from "@/lib/simulator/tradeoffs";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.25, ease: "easeOut" as const } }),
};

export default function TradeoffsPanel() {
  const { nodes } = useSimulatorStore();
  const presentIds = new Set(nodes.map((n) => (n.data as NodeData).componentId));
  const applicable = TRADEOFFS.filter((t) => t.check(presentIds));

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-3">
      <div>
        <div className="text-sm font-semibold text-white mb-1">Trade-off Analysis</div>
        <p className="text-zinc-500 text-xs">Auto-detected trade-offs based on components in your design.</p>
      </div>

      {nodes.length === 0 && (
        <p className="text-zinc-500 text-xs text-center py-4">Add components to see trade-off analysis.</p>
      )}

      {applicable.length === 0 && nodes.length > 0 && (
        <p className="text-zinc-500 text-xs text-center py-4">No notable trade-offs detected yet.</p>
      )}

      {applicable.map((t, i) => (
        <motion.div
          key={t.title}
          custom={i}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="p-3 rounded-lg border border-zinc-700 bg-zinc-900 space-y-2 hover:border-zinc-600 transition-colors"
        >
          <div className="flex items-start gap-2">
            <span className="text-base leading-none mt-0.5">{t.icon}</span>
            <div>
              <span className="text-white text-xs font-semibold">{t.title}</span>
              <span className="ml-1.5 text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{t.category}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex gap-2 text-[11px]">
              <span className="text-emerald-400 flex-shrink-0 font-bold">+</span>
              <span className="text-zinc-300">{t.pro}</span>
            </div>
            <div className="flex gap-2 text-[11px]">
              <span className="text-rose-400 flex-shrink-0 font-bold">−</span>
              <span className="text-zinc-400">{t.con}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
