"use client";
import { useSimulatorStore } from "@/lib/simulator/store";
import type { RightTab } from "@/lib/simulator/store";
import PropsPanel from "./panels/PropsPanel";
import SimulatePanel from "./panels/SimulatePanel";
import ScorePanel from "./panels/ScorePanel";
import CapacityPanel from "./panels/CapacityPanel";
import TradeoffsPanel from "./panels/TradeoffsPanel";

const TABS: { id: RightTab; label: string; icon: string }[] = [
  { id: "props",      label: "Props",      icon: "🔧" },
  { id: "simulate",   label: "Simulate",   icon: "⚡" },
  { id: "score",      label: "Score",      icon: "🎯" },
  { id: "capacity",   label: "Capacity",   icon: "📊" },
  { id: "tradeoffs",  label: "Trade-offs", icon: "⚖️" },
];

export default function RightPanel() {
  const { rightTab, setRightTab } = useSimulatorStore();

  return (
    <div className="w-72 flex-shrink-0 flex flex-col border-l border-zinc-800 bg-zinc-950 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-zinc-800 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setRightTab(tab.id)}
            title={tab.label}
            className={`flex-shrink-0 px-3 py-2.5 text-xs font-semibold flex flex-col items-center gap-0.5 transition
              ${rightTab === tab.id ? "text-white border-b-2 border-indigo-500" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="text-[10px]">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-hidden">
        {rightTab === "props"     && <PropsPanel />}
        {rightTab === "simulate"  && <SimulatePanel />}
        {rightTab === "score"     && <ScorePanel />}
        {rightTab === "capacity"  && <CapacityPanel />}
        {rightTab === "tradeoffs" && <TradeoffsPanel />}
      </div>
    </div>
  );
}
