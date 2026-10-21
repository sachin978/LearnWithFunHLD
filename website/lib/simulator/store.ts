import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Node, Edge } from "@xyflow/react";
import type { Problem } from "./problems-data";
import type { SimulationResult } from "./simulation";
import type { ScoreResult } from "./scoring";
import { DEFAULT_CAPACITY_INPUTS, type CapacityInputs } from "./capacity";
import type { ComponentDef } from "./components-data";

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

/** One undo/redo checkpoint — just the two arrays that make up "the design". */
interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
}

interface SimulatorState {
  nodes: Node[];
  edges: Edge[];
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  customComponents: ComponentDef[];
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

  /** `history: false` applies the update without an undo checkpoint (e.g. React Flow measuring a node). */
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[]), opts?: { history?: boolean }) => void;
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  undo: () => void;
  redo: () => void;
  addCustomComponent: (def: ComponentDef) => void;
  /** Adds a new node near `sourceId` and wires an edge from it — the "+" button on a selected node. */
  addConnectedNode: (sourceId: string, def: { componentId: string; label: string; rpsCapacity: number; category: string; icon: string; color: string }) => void;
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

// ── Undo/redo bookkeeping ────────────────────────────────────────────────
// A "checkpoint" snapshots {nodes, edges} onto `past` right before a
// mutation is applied. Rapid-fire calls (dragging a node, typing in a
// props field) are collapsed into a single checkpoint via a short burst
// window, so undo removes "that drag" or "that edit", not one pixel or
// one keystroke at a time. Lives outside the store (module-level) since
// it's pure timing bookkeeping, not reactive state.
const HISTORY_LIMIT = 60;
const BURST_WINDOW_MS = 450;
let burstOpen = false;
let burstTimer: ReturnType<typeof setTimeout> | null = null;

/** Returns the `{past, future}` patch to merge into a state update that's
 * about to change nodes/edges — pure, so it's safe to spread straight into
 * a `set()` return value instead of calling `set()` a second time. Still
 * has one side effect (the burst timer), which is fine since it only ever
 * runs once per real mutation, never during React re-renders. */
function historyPatch(s: SimulatorState): Partial<SimulatorState> {
  const patch = burstOpen ? {} : { past: [...s.past, { nodes: s.nodes, edges: s.edges }].slice(-HISTORY_LIMIT), future: [] };
  burstOpen = true;
  if (burstTimer) clearTimeout(burstTimer);
  burstTimer = setTimeout(() => { burstOpen = false; burstTimer = null; }, BURST_WINDOW_MS);
  return patch;
}

/** True when two arrays hold the exact same items in the exact same order —
 * cheap way to tell a real edit apart from a no-op re-wrap. ReactFlow fires
 * onNodesChange/onEdgesChange for selection too, not just edits, and the
 * canvas's change-reducer always returns a fresh `[...prev]` even when
 * nothing in it actually changed — so without this, merely clicking a node
 * would push a bogus undo step. */
function sameItems<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((item, i) => item === b[i]);
}

export const useSimulatorStore = create<SimulatorState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      past: [],
      future: [],
      customComponents: [],
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

      setNodes: (nodes, opts) =>
        set((s) => {
          const next = typeof nodes === "function" ? nodes(s.nodes) : nodes;
          if (sameItems(next, s.nodes) || opts?.history === false) return { nodes: next };
          return { nodes: next, ...historyPatch(s) };
        }),
      setEdges: (edges) =>
        set((s) => {
          const next = typeof edges === "function" ? edges(s.edges) : edges;
          if (sameItems(next, s.edges)) return { edges: next };
          return { edges: next, ...historyPatch(s) };
        }),
      undo: () => {
        const { past, future, nodes, edges } = get();
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        set({
          past: past.slice(0, -1),
          future: [{ nodes, edges }, ...future].slice(0, HISTORY_LIMIT),
          nodes: previous.nodes,
          edges: previous.edges,
          selectedNodeId: null,
          selectedEdgeId: null,
        });
      },
      redo: () => {
        const { past, future, nodes, edges } = get();
        if (future.length === 0) return;
        const next = future[0];
        set({
          future: future.slice(1),
          past: [...past, { nodes, edges }].slice(-HISTORY_LIMIT),
          nodes: next.nodes,
          edges: next.edges,
          selectedNodeId: null,
          selectedEdgeId: null,
        });
      },
      addCustomComponent: (def) => set((s) => ({ customComponents: [...s.customComponents, def] })),
      addConnectedNode: (sourceId, def) =>
        set((s) => {
          const source = s.nodes.find((n) => n.id === sourceId);
          const position = source
            ? { x: source.position.x + 240, y: source.position.y }
            : { x: 200, y: 200 };
          const id = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          const newNode: Node = {
            id,
            type: "componentNode",
            position,
            data: {
              componentId: def.componentId,
              label: def.label,
              rpsCapacity: def.rpsCapacity,
              instances: 1,
              category: def.category,
              icon: def.icon,
              color: def.color,
              notes: "",
            },
          };
          const newEdge: Edge = { id: `edge_${Date.now()}`, source: sourceId, target: id, type: "flowEdge" };
          return {
            nodes: [...s.nodes, newNode],
            edges: source ? [...s.edges, newEdge] : s.edges,
            selectedNodeId: id,
            ...historyPatch(s),
          };
        }),
      setActiveProblem: (p) => set({ activeProblem: p, simulationResult: null, scoreResult: null, leftTab: p ? "components" : "problems" }),
      setLeftTab: (t) => set({ leftTab: t }),
      setRightTab: (t) => set({ rightTab: t }),
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
      setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),
      deleteEdge: (id) =>
        set((s) => ({
          edges: s.edges.filter((e) => e.id !== id),
          selectedEdgeId: s.selectedEdgeId === id ? null : s.selectedEdgeId,
          ...historyPatch(s),
        })),
      setSimulationResult: (r) => set({ simulationResult: r }),
      setScoreResult: (r) => set({ scoreResult: r }),
      updateNodeData: (id, patch) =>
        set((s) => ({
          nodes: s.nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, ...patch } } : n,
          ),
          ...historyPatch(s),
        })),
      deleteNode: (id) =>
        set((s) => ({
          nodes: s.nodes.filter((n) => n.id !== id),
          edges: s.edges.filter((e) => e.source !== id && e.target !== id),
          selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
          ...historyPatch(s),
        })),
      clearCanvas: () =>
        set((s) => ({
          nodes: [], edges: [], selectedNodeId: null, simulationResult: null, scoreResult: null, viewport: null,
          ...historyPatch(s),
        })),
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
    { name: "wireup-system-canvas", partialize: (s) => ({ nodes: s.nodes, edges: s.edges, activeProblem: s.activeProblem, simTheme: s.simTheme, viewport: s.viewport, capacityInputs: s.capacityInputs, leftTab: s.leftTab, customComponents: s.customComponents }) },
  ),
);
