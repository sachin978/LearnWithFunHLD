"use client";
import { useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useReactFlow,
  type Connection,
  type NodeTypes,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ComponentNode from "./NodeComponent";
import { useSimulatorStore } from "@/lib/simulator/store";
import { COMPONENTS } from "@/lib/simulator/components-data";
import type { NodeData } from "@/lib/simulator/store";

const nodeTypes: NodeTypes = { componentNode: ComponentNode };

let nodeIdCounter = Date.now();
const newId = () => `node_${++nodeIdCounter}`;

export default function SimCanvas() {
  const { nodes, edges, setNodes, setEdges, setSelectedNodeId, setRightTab, deleteNode } =
    useSimulatorStore();
  const { screenToFlowPosition } = useReactFlow();
  const canvasRef = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (conn: Connection) => setEdges((eds) => addEdge({ ...conn, animated: true, style: { stroke: "#6366f1", strokeWidth: 2 } }, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const componentId = e.dataTransfer.getData("application/systemsim");
      if (!componentId) return;
      const def = COMPONENTS.find((c) => c.id === componentId);
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
    [screenToFlowPosition, setNodes],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      setSelectedNodeId(node.id);
      setRightTab("props");
    },
    [setSelectedNodeId, setRightTab],
  );

  const onPaneClick = useCallback(() => setSelectedNodeId(null), [setSelectedNodeId]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const { selectedNodeId } = useSimulatorStore.getState();
        if (selectedNodeId) deleteNode(selectedNodeId);
      }
    },
    [deleteNode],
  );

  return (
    <div ref={canvasRef} className="flex-1 h-full outline-none" onKeyDown={onKeyDown} tabIndex={0}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
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
        onPaneClick={onPaneClick}
        fitView
        deleteKeyCode={null}
        style={{ background: "#09090b" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="#27272a" />
        <Controls className="!bg-zinc-900 !border-zinc-700 [&_button]:!bg-zinc-800 [&_button]:!border-zinc-700 [&_button]:!text-white" />
        <MiniMap
          className="!bg-zinc-900 !border-zinc-700"
          nodeColor={(n) => {
            const d = n.data as NodeData;
            const map: Record<string, string> = { indigo: "#6366f1", violet: "#8b5cf6", emerald: "#10b981", amber: "#f59e0b", rose: "#f43f5e" };
            return map[d.color] ?? "#6366f1";
          }}
        />

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <div className="text-center">
              <div className="text-5xl mb-4">🏗️</div>
              <h3 className="text-white text-lg font-semibold mb-2">Build an architecture that scales</h3>
              <p className="text-zinc-500 text-sm max-w-xs">
                Pick a problem from the left panel, then drag components onto the canvas and connect them.
              </p>
              <div className="mt-4 text-zinc-600 text-xs">Drag from sidebar · Delete to remove · Scroll to zoom</div>
            </div>
          </div>
        )}
      </ReactFlow>
    </div>
  );
}
