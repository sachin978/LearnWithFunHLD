import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Node, Edge } from "@xyflow/react";
import type { Problem } from "./problems-data";
import type { SimulationResult } from "./simulation";
import type { ScoreResult } from "./scoring";

export interface NodeData extends Record<string, unknown> {
  componentId: string;
  label: string;
  rpsCapacity: number;
  instances: number;
  category: string;
  icon: string;
  color: string;
  notes: string;
}

export type LeftTab = "components" | "problems";
export type RightTab = "props" | "simulate" | "score" | "capacity" | "tradeoffs";

interface SimulatorState {
  nodes: Node[];
  edges: Edge[];
  activeProblem: Problem | null;
  leftTab: LeftTab;
  rightTab: RightTab;
  selectedNodeId: string | null;
  simulationResult: SimulationResult | null;
  scoreResult: ScoreResult | null;
  interviewActive: boolean;
  interviewPhase: number;     // 0-5
  interviewTimeLeft: number;  // seconds

  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  setActiveProblem: (p: Problem | null) => void;
  setLeftTab: (t: LeftTab) => void;
  setRightTab: (t: RightTab) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSimulationResult: (r: SimulationResult | null) => void;
  setScoreResult: (r: ScoreResult | null) => void;
  updateNodeData: (id: string, patch: Partial<NodeData>) => void;
  deleteNode: (id: string) => void;
  clearCanvas: () => void;
  setInterviewActive: (v: boolean) => void;
  setInterviewPhase: (p: number) => void;
  setInterviewTimeLeft: (s: number) => void;
}

export const useSimulatorStore = create<SimulatorState>()(
  persist(
    (set) => ({
      nodes: [],
      edges: [],
      activeProblem: null,
      leftTab: "components",
      rightTab: "props",
      selectedNodeId: null,
      simulationResult: null,
      scoreResult: null,
      interviewActive: false,
      interviewPhase: 0,
      interviewTimeLeft: 600,

      setNodes: (nodes) =>
        set((s) => ({ nodes: typeof nodes === "function" ? nodes(s.nodes) : nodes })),
      setEdges: (edges) =>
        set((s) => ({ edges: typeof edges === "function" ? edges(s.edges) : edges })),
      setActiveProblem: (p) => set({ activeProblem: p, simulationResult: null, scoreResult: null }),
      setLeftTab: (t) => set({ leftTab: t }),
      setRightTab: (t) => set({ rightTab: t }),
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
      setSimulationResult: (r) => set({ simulationResult: r }),
      setScoreResult: (r) => set({ scoreResult: r }),
      updateNodeData: (id, patch) =>
        set((s) => ({
          nodes: s.nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, ...patch } } : n,
          ),
        })),
      deleteNode: (id) =>
        set((s) => ({
          nodes: s.nodes.filter((n) => n.id !== id),
          edges: s.edges.filter((e) => e.source !== id && e.target !== id),
          selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
        })),
      clearCanvas: () =>
        set({ nodes: [], edges: [], selectedNodeId: null, simulationResult: null, scoreResult: null }),
      setInterviewActive: (v) => set({ interviewActive: v }),
      setInterviewPhase: (p) => set({ interviewPhase: p }),
      setInterviewTimeLeft: (s) => set({ interviewTimeLeft: s }),
    }),
    { name: "systemsim-canvas", partialize: (s) => ({ nodes: s.nodes, edges: s.edges, activeProblem: s.activeProblem }) },
  ),
);
