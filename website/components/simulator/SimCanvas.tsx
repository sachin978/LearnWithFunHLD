"use client";
import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  addEdge,
  useReactFlow,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  type OnMoveEnd,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ComponentNode from "./NodeComponent";
import FlowEdge from "./FlowEdge";
import { useSimulatorStore } from "@/lib/simulator/store";
import { COMPONENTS } from "@/lib/simulator/components-data";
import { UTILIZATION_LEGEND } from "@/lib/simulator/traffic";
import type { NodeData } from "@/lib/simulator/store";

const nodeTypes: NodeTypes = { componentNode: ComponentNode };
const edgeTypes: EdgeTypes = { flowEdge: FlowEdge };

let nodeIdCounter = Date.now();
const newId = () => `node_${++nodeIdCounter}`;

export default function SimCanvas() {
  const { nodes, edges, setNodes, setEdges, selectedNodeId, setSelectedNodeId, setRightTab, deleteNode, simTheme, viewport, setViewport, simulationResult, selectedEdgeId, setSelectedEdgeId, deleteEdge, customComponents, setRightPanelCollapsed } =
    useSimulatorStore();

  // Reflect the selected edge/node as ReactFlow's own `selected` flag
  // (purely for rendering — the underlying stored arrays are untouched) so
  // selection highlighting, Delete/Backspace, and the node's "+" button
  // (which only shows once selected) all have something real to read.
  const displayEdges = edges.map((e) => (e.selected !== (e.id === selectedEdgeId) ? { ...e, selected: e.id === selectedEdgeId } : e));
  const displayNodes = nodes.map((n) => (n.selected !== (n.id === selectedNodeId) ? { ...n, selected: n.id === selectedNodeId } : n));

  const isLight = simTheme === "light";
  const { screenToFlowPosition } = useReactFlow();
  const canvasRef = useRef<HTMLDivElement>(null);
  // Snapshot the viewport we had at mount — once the user has one saved, never
  // auto-fit again so refreshes restore exactly where they left off.
  const hadSavedViewport = useRef(viewport !== null);

  const onMoveEnd = useCallback<OnMoveEnd>(
    (_, vp) => setViewport({ x: vp.x, y: vp.y, zoom: vp.zoom }),
    [setViewport],
  );

  const onConnect = useCallback(
    (conn: Connection) => setEdges((eds) => addEdge({ ...conn, type: "flowEdge", style: { stroke: "#6366f1", strokeWidth: 2 } }, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const componentId = e.dataTransfer.getData("application/wireup-system");
      if (!componentId) return;
      const def = [...COMPONENTS, ...customComponents].find((c) => c.id === componentId);
      if (!def) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const data: NodeData = {
        componentId: def.id,
        label: def.name,
        rpsCapacity: def.rpsCapacity,
        instances: 1,
        category: def.category,
        icon: def.icon,
        color: def.color,
        notes: "",
      };
      setNodes((nds) => [...nds, { id: newId(), type: "componentNode", position, data }]);
    },
    [screenToFlowPosition, setNodes, customComponents],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      setSelectedNodeId(node.id);
      setSelectedEdgeId(null);
      setRightTab("props");
      // Selecting a component should surface its settings even if the panel
      // was minimized — no reason to make the user go find it themselves.
      setRightPanelCollapsed(false);
    },
    [setSelectedNodeId, setSelectedEdgeId, setRightTab, setRightPanelCollapsed],
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: { id: string }) => {
      setSelectedEdgeId(edge.id);
      setSelectedNodeId(null);
    },
    [setSelectedEdgeId, setSelectedNodeId],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [setSelectedNodeId, setSelectedEdgeId]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const { selectedNodeId, selectedEdgeId } = useSimulatorStore.getState();
        // A connection is a smaller, more "am I sure" target than a whole
        // node — if one's selected, delete it first rather than falling
        // through to whatever node happens to also be selected.
        if (selectedEdgeId) deleteEdge(selectedEdgeId);
        else if (selectedNodeId) deleteNode(selectedNodeId);
      }
    },
    [deleteNode, deleteEdge],
  );

  return (
    <div ref={canvasRef} className="flex-1 h-full outline-none" onKeyDown={onKeyDown} tabIndex={0}>
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: "flowEdge", style: { stroke: "#6366f1", strokeWidth: 2 } }}
        onNodesChange={(changes) => {
          setNodes((nds) => {
            let updated = [...nds];
            changes.forEach((change) => {
              if (change.type === "position" && change.position) {
                updated = updated.map((n) => n.id === change.id ? { ...n, position: change.position! } : n);
              }
              if (change.type === "remove") {
                updated = updated.filter((n) => n.id !== change.id);
              }
            });
            return updated;
          });
        }}
        onEdgesChange={(changes) => {
          setEdges((eds) => {
            let updated = [...eds];
            changes.forEach((change) => {
              if (change.type === "remove") updated = updated.filter((e) => e.id !== change.id);
            });
            return updated;
          });
        }}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onMoveEnd={onMoveEnd}
        {...(hadSavedViewport.current
          ? { defaultViewport: viewport! }
          : { fitView: true })}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
        style={{ background: isLight ? "#f8f8f8" : "#09090b" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1} color={isLight ? "#d4d4d8" : "#27272a"} />
        <Controls className={isLight
          ? "!bg-white !border-zinc-200 [&_button]:!bg-zinc-50 [&_button]:!border-zinc-200 [&_button]:!text-zinc-700"
          : "!bg-zinc-900 !border-zinc-700 [&_button]:!bg-zinc-800 [&_button]:!border-zinc-700 [&_button]:!text-white"
        } />

        {/* Traffic color legend — only meaningful once there's simulation data to color nodes/edges by */}
        {simulationResult && (
          <Panel position="bottom-right">
            <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-[10px] ${
              isLight ? "bg-white/90 border-zinc-200 text-zinc-600" : "bg-zinc-900/90 border-zinc-700 text-zinc-400"
            }`}>
              <span className="font-semibold uppercase tracking-wide">Load</span>
              {UTILIZATION_LEGEND.map((entry) => (
                <span key={entry.range} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.hex }} />
                  {entry.range}
                </span>
              ))}
            </div>
          </Panel>
        )}

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-center"
            >
              <motion.div
                className="text-5xl mb-4"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              >
                🏗️
              </motion.div>
              <h1 className="text-white text-base font-semibold mb-2">Build an architecture that scales</h1>
              <p className="text-zinc-500 text-sm max-w-xs">
                Pick a problem from the left panel, then drag components onto the canvas and connect them.
              </p>
              <div className="mt-4 text-zinc-600 text-xs">Drag from sidebar · Delete to remove · Scroll to zoom</div>
            </motion.div>
          </div>
        )}
      </ReactFlow>
    </div>
  );
}
