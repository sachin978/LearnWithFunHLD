"use client";
import { ReactFlowProvider } from "@xyflow/react";
import Toolbar from "./Toolbar";
import Sidebar from "./Sidebar";
import SimCanvas from "./SimCanvas";
import RightPanel from "./RightPanel";

export default function SimulatorApp() {
  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen w-screen bg-zinc-950 overflow-hidden">
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
