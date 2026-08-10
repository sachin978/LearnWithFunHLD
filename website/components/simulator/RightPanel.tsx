"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, SlidersHorizontal, Zap, Target, Gauge, Scale } from "lucide-react";
import { useSimulatorStore } from "@/lib/simulator/store";
import type { RightTab } from "@/lib/simulator/store";
import PropsPanel from "./panels/PropsPanel";
import SimulatePanel from "./panels/SimulatePanel";
import ScorePanel from "./panels/ScorePanel";
import CapacityPanel from "./panels/CapacityPanel";
import TradeoffsPanel from "./panels/TradeoffsPanel";

const MIN_WIDTH = 240;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 288;

const TABS: { id: RightTab; label: string; icon: typeof SlidersHorizontal }[] = [
  { id: "props",      label: "Props",      icon: SlidersHorizontal },
  { id: "simulate",   label: "Simulate",   icon: Zap },
  { id: "score",      label: "Score",      icon: Target },
  { id: "capacity",   label: "Capacity",   icon: Gauge },
  { id: "tradeoffs",  label: "Trade-offs", icon: Scale },
];

const PANELS: Record<RightTab, React.ComponentType> = {
  props: PropsPanel,
  simulate: SimulatePanel,
  score: ScorePanel,
  capacity: CapacityPanel,
  tradeoffs: TradeoffsPanel,
};

export default function RightPanel() {
  const { rightTab, setRightTab, rightPanelCollapsed, setRightPanelCollapsed } = useSimulatorStore();
  const ActivePanel = PANELS[rightTab];

  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);

  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    dragState.current = { startX: e.clientX, startWidth: width };
    setIsResizing(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!dragState.current) return;
      // Panel is on the right edge, so dragging left (negative delta) grows it.
      const delta = dragState.current.startX - moveEvent.clientX;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragState.current.startWidth + delta));
      setWidth(next);
    };
    const handlePointerUp = () => {
      dragState.current = null;
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <motion.div
      animate={{ width: rightPanelCollapsed ? 28 : width }}
      transition={{ duration: isResizing ? 0 : 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex-shrink-0 flex flex-col border-l border-zinc-800 bg-zinc-950 overflow-hidden"
    >
      {!rightPanelCollapsed && (
        <div
          onPointerDown={handleResizeStart}
          title="Drag to resize"
          className={`absolute left-0 top-0 bottom-0 w-1.5 z-20 cursor-col-resize transition-colors ${isResizing ? "bg-indigo-500/60" : "hover:bg-indigo-500/40"}`}
        />
      )}
      <AnimatePresence mode="wait" initial={false}>
        {rightPanelCollapsed ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-7 flex flex-col items-center py-2"
          >
            <button
              onClick={() => setRightPanelCollapsed(false)}
              title="Expand panel"
              className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-900 transition"
            >
              <ChevronLeft size={14} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, delay: 0.08 }}
            className="w-full flex flex-col flex-1 overflow-hidden"
          >
            {/* Tab bar */}
            <div className="flex items-center border-b border-zinc-800">
              <div className="flex flex-1 overflow-x-auto">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                  <button
                    key={tab.id}
                    onClick={() => setRightTab(tab.id)}
                    title={tab.label}
                    className={`relative flex-shrink-0 px-3 py-2.5 text-xs font-semibold flex flex-col items-center gap-0.5 transition-colors
                      ${rightTab === tab.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    <Icon size={16} className={rightTab === tab.id ? "text-indigo-400" : ""} />
                    <span className="text-[10px]">{tab.label}</span>
                    {rightTab === tab.id && (
                      <motion.div
                        layoutId="right-tab-indicator"
                        className="absolute left-0 right-0 bottom-0 h-0.5 bg-indigo-500"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                  </button>
                  );
                })}
              </div>
              <button
                onClick={() => setRightPanelCollapsed(true)}
                title="Collapse panel"
                className="px-1.5 self-stretch flex items-center text-zinc-500 hover:text-white transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={rightTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="h-full"
                >
                  <ActivePanel />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
