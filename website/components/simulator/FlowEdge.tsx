"use client";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { useSimulatorStore } from "@/lib/simulator/store";
import { calculateUtilization, getTrafficColor, TRAFFIC_STATUS_LABEL } from "@/lib/simulator/traffic";

/**
 * Default edge for the canvas — a solid connector with a small dot that
 * continuously travels from source to target, so a connection reads as
 * "requests flowing through here" rather than a static line.
 *
 * Once a simulation has been run, both the line and the traveling dot pick
 * up the same capacity-based traffic color as the node they feed into —
 * a connection pouring into an overloaded component reads as red, same as
 * the node itself.
 *
 * Clicking the connection selects it (thicker, dashed highlight); the small
 * × at its midpoint — or the Delete/Backspace key once selected — removes it.
 */
export default function FlowEdge({
  id,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  const simulationResult = useSimulatorStore((s) => s.simulationResult);
  const deleteEdge = useSimulatorStore((s) => s.deleteEdge);
  const targetResult = simulationResult?.allNodes.find((n) => n.nodeId === target);
  const utilization = targetResult ? calculateUtilization(targetResult.incomingRps, targetResult.capacity) : null;
  const traffic = utilization !== null ? getTrafficColor(utilization) : null;

  const baseColor = (style as React.CSSProperties | undefined)?.stroke ?? "#6366f1";
  const color = traffic ? `rgb(${traffic.rgb})` : baseColor;
  const edgeStyle = {
    ...style,
    ...(traffic ? { stroke: color } : null),
    strokeWidth: selected ? 3 : (style as React.CSSProperties | undefined)?.strokeWidth ?? 2,
    transition: "stroke 0.5s",
  };

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEdge(id);
  };

  return (
    <>
      <g>
        {traffic && utilization !== null && targetResult && (
          <title>
            {`${targetResult.label}\nTraffic: ${targetResult.incomingRps.toFixed(1)}k / ${targetResult.capacity}k RPS\nUtilization: ${Math.round(utilization)}%\nStatus: ${TRAFFIC_STATUS_LABEL[traffic.status]}`}
          </title>
        )}
        {selected && (
          <BaseEdge path={edgePath} style={{ stroke: "#ffffff", strokeWidth: 6, strokeOpacity: 0.15 }} />
        )}
        <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
        <circle r={3.5} fill={color} style={{ filter: `drop-shadow(0 0 3px ${color})`, transition: "fill 0.5s" }}>
          <animateMotion dur="1.8s" repeatCount="indefinite" path={edgePath} />
        </circle>
      </g>
      <EdgeLabelRenderer>
        <button
          onClick={onDelete}
          title="Delete connection"
          className={`nodrag nopan absolute flex items-center justify-center w-4 h-4 rounded-full
            text-[10px] leading-none border transition-all pointer-events-auto
            ${selected
              ? "bg-rose-600 border-rose-400 text-white opacity-100 scale-100"
              : "bg-zinc-800 border-zinc-600 text-zinc-400 opacity-60 hover:opacity-100 hover:bg-rose-600 hover:border-rose-400 hover:text-white scale-90 hover:scale-100"
            }`}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          ×
        </button>
      </EdgeLabelRenderer>
    </>
  );
}
