"use client";
import { useSyncExternalStore } from "react";
import { getDragState, subscribeDrag } from "@/lib/simulator/dnd";

/** Follows the pointer while a sidebar component is being dragged onto the canvas. */
export default function DragGhost() {
  const drag = useSyncExternalStore(subscribeDrag, getDragState, () => null);
  if (!drag) return null;
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed z-[200] -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 px-3 py-2 text-xs font-semibold shadow-2xl backdrop-blur-sm transition-colors ${
        drag.overCanvas ? "border-indigo-400 bg-indigo-500/25 text-white" : "border-zinc-600 bg-zinc-900/90 text-zinc-300"
      }`}
      style={{ left: drag.x, top: drag.y, cursor: "grabbing" }}
    >
      {drag.label}
      <span className="block text-[10px] font-normal opacity-70">{drag.overCanvas ? "Release to add" : "Drop on the canvas"}</span>
    </div>
  );
}
