"use client";
import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Plus } from "lucide-react";
import { CATEGORY_COLORS, COMPONENTS } from "@/lib/simulator/components-data";
import { ComponentIcon } from "@/lib/simulator/icon-registry";
import { useSimulatorStore } from "@/lib/simulator/store";
import { calculateUtilization, getTrafficColor, TRAFFIC_STATUS_LABEL } from "@/lib/simulator/traffic";
import type { NodeData } from "@/lib/simulator/store";
import type { ComponentCategory } from "@/lib/simulator/components-data";

/** The "+" button's picker — only ever mounted while a node is selected and
 * open, so it can afford to hold its own search state locally. Adding an
 * item wires a new node onto the selected one via the same store action
 * used everywhere else nodes get created. */
function AddComponentMenu({ sourceId, onClose }: { sourceId: string; onClose: () => void }) {
  const customComponents = useSimulatorStore((s) => s.customComponents);
  const addConnectedNode = useSimulatorStore((s) => s.addConnectedNode);
  const [search, setSearch] = useState("");

  const options = [...COMPONENTS, ...customComponents].filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      {/* Invisible click-catcher — closes the menu on outside click without
          dimming the canvas like a real modal would. */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        onClick={(e) => e.stopPropagation()}
        className="nodrag nopan absolute left-full bottom-0 ml-2 z-50 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden"
      >
        <input
          autoFocus
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Add component…"
          className="w-full bg-zinc-800 border-b border-zinc-700 px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 outline-none"
        />
        <div className="max-h-52 overflow-y-auto py-1">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                addConnectedNode(sourceId, {
                  componentId: opt.id,
                  label: opt.name,
                  rpsCapacity: opt.rpsCapacity,
                  category: opt.category,
                  icon: opt.icon,
                  color: opt.color,
                });
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-zinc-800 transition-colors"
            >
              <ComponentIcon iconKey={opt.icon} size={13} className="text-zinc-400 flex-shrink-0" />
              <span className="text-white text-xs truncate">{opt.name}</span>
            </button>
          ))}
          {options.length === 0 && <p className="text-zinc-500 text-[11px] text-center py-3">No matches</p>}
        </div>
      </div>
    </>
  );
}

function ComponentNode({ id, data, selected }: NodeProps) {
  const d = data as NodeData;
  const c = CATEGORY_COLORS[d.category as ComponentCategory] ?? CATEGORY_COLORS.Compute;
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  // Once a simulation has been run, border/background shift onto a live
  // capacity-based traffic color for this node — category colors are the
  // default look while you're still designing (no simulation data yet).
  const simulationResult = useSimulatorStore((s) => s.simulationResult);
  const nodeResult = simulationResult?.allNodes.find((n) => n.nodeId === id);
  const utilization = nodeResult ? calculateUtilization(nodeResult.incomingRps, nodeResult.capacity) : null;
  const traffic = utilization !== null ? getTrafficColor(utilization) : null;
  const loadStyle = traffic
    ? {
        borderColor: `rgb(${traffic.rgb})`,
        backgroundColor: `rgba(${traffic.rgb}, 0.14)`,
        boxShadow: `0 0 14px rgba(${traffic.rgb}, 0.4)`,
      }
    : undefined;

  const tooltip = nodeResult && utilization !== null && traffic
    ? `${d.label}\nTraffic: ${nodeResult.incomingRps.toFixed(1)}k / ${nodeResult.capacity}k RPS\nUtilization: ${Math.round(utilization)}%\nStatus: ${TRAFFIC_STATUS_LABEL[traffic.status]}`
    : d.label;

  return (
    <div
      style={loadStyle}
      title={tooltip}
      className={`
        relative min-w-[130px] rounded-xl border-2 ${c.border}
        ${c.bg} backdrop-blur-sm
        ${selected ? "ring-2 ring-white/40 ring-offset-1 ring-offset-transparent" : ""}
        transition-[background-color,border-color,box-shadow] duration-500 cursor-pointer
      `}
    >
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !border-2 !border-zinc-600 !bg-zinc-900" />

      {/* Quick-add — only reachable once this node is selected, so it never
          clutters an unselected canvas. Adds a new node wired to this one. */}
      {selected && (
        // Bottom-right corner, not the right edge — the source Handle already
        // owns the right-edge midpoint, so this sits clear of it.
        <div className="nodrag nopan absolute -bottom-3 -right-3 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAddMenuOpen((v) => !v);
            }}
            title="Add connected component"
            className="w-6 h-6 rounded-full bg-indigo-600 hover:bg-indigo-500 border-2 border-zinc-950 text-white flex items-center justify-center shadow-lg transition-colors"
          >
            <Plus size={13} strokeWidth={2.5} />
          </button>
          {addMenuOpen && <AddComponentMenu sourceId={id} onClose={() => setAddMenuOpen(false)} />}
        </div>
      )}

      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 mb-1">
          <ComponentIcon iconKey={d.icon} size={16} className={c.text} />
          <span className="text-white text-xs font-semibold truncate max-w-[90px]">{d.label}</span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${c.badge}`}>
            {d.category}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">
            {d.rpsCapacity * (d.instances ?? 1)}k RPS
          </span>
        </div>
        {(d.instances ?? 1) > 1 && (
          <div className="mt-1 text-[10px] text-zinc-500">×{d.instances} instances</div>
        )}
        {traffic && utilization !== null && (
          <div className="mt-1.5 h-1 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${Math.min(utilization, 100)}%`, backgroundColor: `rgb(${traffic.rgb})` }}
            />
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !border-2 !border-zinc-600 !bg-zinc-900" />
    </div>
  );
}

export default memo(ComponentNode);
