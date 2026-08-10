"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CATEGORY_COLORS } from "@/lib/simulator/components-data";
import { ComponentIcon } from "@/lib/simulator/icon-registry";
import { useSimulatorStore } from "@/lib/simulator/store";
import { calculateUtilization, getTrafficColor, TRAFFIC_STATUS_LABEL } from "@/lib/simulator/traffic";
import type { NodeData } from "@/lib/simulator/store";
import type { ComponentCategory } from "@/lib/simulator/components-data";

function ComponentNode({ id, data, selected }: NodeProps) {
  const d = data as NodeData;
  const c = CATEGORY_COLORS[d.category as ComponentCategory] ?? CATEGORY_COLORS.Compute;

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
