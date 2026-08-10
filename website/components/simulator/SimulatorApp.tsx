"use client";
import { ReactFlowProvider } from "@xyflow/react";
import Toolbar from "./Toolbar";
import Sidebar from "./Sidebar";
import SimCanvas from "./SimCanvas";
import RightPanel from "./RightPanel";
import { useSimulatorStore } from "@/lib/simulator/store";

export default function SimulatorApp() {
  const simTheme = useSimulatorStore((s) => s.simTheme);

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
    </ReactFlowProvider>
  );
}
