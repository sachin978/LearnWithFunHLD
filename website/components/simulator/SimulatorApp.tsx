"use client";
import { useEffect, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import Toolbar from "./Toolbar";
import Sidebar from "./Sidebar";
import SimCanvas from "./SimCanvas";
import RightPanel from "./RightPanel";
import ProductTour from "./ProductTour";
import { useSimulatorStore } from "@/lib/simulator/store";
import { runSimulation } from "@/lib/simulator/simulation";

export default function SimulatorApp() {
  const simTheme = useSimulatorStore((s) => s.simTheme);
  const nodes = useSimulatorStore((s) => s.nodes);
  const edges = useSimulatorStore((s) => s.edges);
  const activeProblem = useSimulatorStore((s) => s.activeProblem);
  const setSimulationResult = useSimulatorStore((s) => s.setSimulationResult);

  // Keep traffic/capacity coloring genuinely real-time: recompute the
  // simulation (debounced) whenever the architecture changes, instead of
  // only ever updating when someone presses "Run Simulation". The manual
  // button in the Simulate tab still works exactly as before — this just
  // means node/edge/flow colors track the canvas live as you build.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!activeProblem || nodes.length === 0) {
      setSimulationResult(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setSimulationResult(runSimulation(nodes, edges, activeProblem));
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, activeProblem]);

  // Global undo/redo shortcuts — window-level (not scoped to the canvas div)
  // so they work no matter what on the page has focus, EXCEPT while the
  // user is actually typing in a field, where Ctrl+Z should do the normal
  // browser text-undo instead of touching the canvas.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isUndoRedo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z";
      if (!isUndoRedo) return;

      const target = e.target as HTMLElement | null;
      const isTextInput =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (isTextInput) return;

      e.preventDefault();
      const { undo, redo } = useSimulatorStore.getState();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <ReactFlowProvider>
      <div className={`flex flex-col h-screen w-screen overflow-hidden ${simTheme === "dark" ? "bg-zinc-950" : "bg-white sim-light"}`}>
        <Toolbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <SimCanvas />
          <RightPanel />
        </div>
      </div>
      <ProductTour />
    </ReactFlowProvider>
  );
}
