"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CATEGORY_COLORS } from "@/lib/simulator/components-data";
import type { NodeData } from "@/lib/simulator/store";
import type { ComponentCategory } from "@/lib/simulator/components-data";

function ComponentNode({ data, selected }: NodeProps) {
  const d = data as NodeData;
  const c = CATEGORY_COLORS[d.category as ComponentCategory] ?? CATEGORY_COLORS.Compute;

  return (
    <div
      className={`
        relative min-w-[130px] rounded-xl border-2 ${c.border}
        ${c.bg} backdrop-blur-sm
        ${selected ? "ring-2 ring-white/40 ring-offset-1 ring-offset-transparent" : ""}
        transition-all duration-150 cursor-pointer
      `}
    >
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !border-2 !border-zinc-600 !bg-zinc-900" />

      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg leading-none">{d.icon}</span>
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
      </div>

      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !border-2 !border-zinc-600 !bg-zinc-900" />
    </div>
  );
}

export default memo(ComponentNode);
