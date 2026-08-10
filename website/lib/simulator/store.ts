import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Node, Edge } from "@xyflow/react";
import type { Problem } from "./problems-data";
import type { SimulationResult } from "./simulation";
import type { ScoreResult } from "./scoring";
import { DEFAULT_CAPACITY_INPUTS, type CapacityInputs } from "./capacity";

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
export type SimTheme = "dark" | "light";
export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

interface SimulatorState {
  nodes: Node[];
  edges: Edge[];
  activeProblem: Problem | null;
  leftTab: LeftTab;
  rightTab: RightTab;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  simulationResult: SimulationResult | null;
  scoreResult: ScoreResult | null;
  interviewActive: boolean;
  interviewPhase: number;     // 0-5
  interviewTimeLeft: number;  // seconds
  simTheme: SimTheme;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  viewport: CanvasViewport | null;
  capacityInputs: CapacityInputs;
  tourOpen: boolean;

  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  setActiveProblem: (p: Problem | null) => void;
  setLeftTab: (t: LeftTab) => void;
  setRightTab: (t: RightTab) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  deleteEdge: (id: string) => void;
  setSimulationResult: (r: SimulationResult | null) => void;
  setScoreResult: (r: ScoreResult | null) => void;
  updateNodeData: (id: string, patch: Partial<NodeData>) => void;
  deleteNode: (id: string) => void;
  clearCanvas: () => void;
  setInterviewActive: (v: boolean) => void;
  setInterviewPhase: (p: number) => void;
  setInterviewTimeLeft: (s: number) => void;
  setSimTheme: (t: SimTheme) => void;
  setLeftPanelCollapsed: (v: boolean) => void;
  setRightPanelCollapsed: (v: boolean) => void;
  setViewport: (v: CanvasViewport) => void;
  setCapacityInputs: (patch: Partial<CapacityInputs>) => void;
  setTourOpen: (v: boolean) => void;
}

export const useSimulatorStore = create<SimulatorState>()(
  persist(
    (set) => ({
      nodes: [],
      edges: [],
      activeProblem: null,
      leftTab: "problems",
      rightTab: "props",
      selectedNodeId: null,
      selectedEdgeId: null,
      simulationResult: null,
      scoreResult: null,
      interviewActive: false,
      interviewPhase: 0,
      interviewTimeLeft: 600,
      simTheme: "dark",
      leftPanelCollapsed: false,
      rightPanelCollapsed: false,
      viewport: null,
      capacityInputs: DEFAULT_CAPACITY_INPUTS,
      tourOpen: false,

      setNodes: (nodes) =>
        set((s) => ({ nodes: typeof nodes === "function" ? nodes(s.nodes) : nodes })),
      setEdges: (edges) =>
        set((s) => ({ edges: typeof edges === "function" ? edges(s.edges) : edges })),
      setActiveProblem: (p) => set({ activeProblem: p, simulationResult: null, scoreResult: null, leftTab: p ? "components" : "problems" }),
      setLeftTab: (t) => set({ leftTab: t }),
      setRightTab: (t) => set({ rightTab: t }),
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
      setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),
      deleteEdge: (id) =>
        set((s) => ({
          edges: s.edges.filter((e) => e.id !== id),
          selectedEdgeId: s.selectedEdgeId === id ? null : s.selectedEdgeId,
        })),
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
        set({ nodes: [], edges: [], selectedNodeId: null, simulationResult: null, scoreResult: null, viewport: null }),
      setInterviewActive: (v) => set({ interviewActive: v }),
      setInterviewPhase: (p) => set({ interviewPhase: p }),
      setInterviewTimeLeft: (s) => set({ interviewTimeLeft: s }),
      setSimTheme: (t) => set({ simTheme: t }),
      setLeftPanelCollapsed: (v) => set({ leftPanelCollapsed: v }),
      setRightPanelCollapsed: (v) => set({ rightPanelCollapsed: v }),
      setViewport: (v) => set({ viewport: v }),
      setCapacityInputs: (patch) => set((s) => ({ capacityInputs: { ...s.capacityInputs, ...patch } })),
      setTourOpen: (v) => set({ tourOpen: v }),
    }),
    { name: "wireup-system-canvas", partialize: (s) => ({ nodes: s.nodes, edges: s.edges, activeProblem: s.activeProblem, simTheme: s.simTheme, viewport: s.viewport, capacityInputs: s.capacityInputs, leftTab: s.leftTab }) },
  ),
);
