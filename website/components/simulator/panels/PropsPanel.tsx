"use client";
import { useSimulatorStore } from "@/lib/simulator/store";
import type { NodeData } from "@/lib/simulator/store";

export default function PropsPanel() {
  const { nodes, selectedNodeId, activeProblem, updateNodeData, deleteNode } = useSimulatorStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!activeProblem) {
    return (
      <div className="p-4 text-center">
        <div className="text-3xl mb-3">📋</div>
        <p className="text-zinc-400 text-sm font-medium">No problem selected</p>
        <p className="text-zinc-600 text-xs mt-1">Pick a problem from the Problems tab to load requirements.</p>
      </div>
    );
  }

  const req = activeProblem.requirements;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Requirements */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-white">Requirements</span>
          <span className="text-xs text-zinc-500">— {activeProblem.name}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: "Reads/sec", value: `${req.readsPerSec}k` },
            { label: "Writes/sec", value: `${req.writesPerSec}k` },
            { label: "Storage", value: req.storage },
            { label: "Latency SLA", value: req.latencySLA },
            { label: "Users", value: req.users },
          ].map((m) => (
            <div key={m.label} className="bg-zinc-900 rounded-lg p-2 text-center">
              <div className="text-indigo-300 text-sm font-bold">{m.value}</div>
              <div className="text-zinc-500 text-[10px]">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Constraints */}
        <details className="group">
          <summary className="text-xs text-zinc-400 cursor-pointer hover:text-white list-none flex items-center justify-between">
            <span>Constraints</span>
            <span className="group-open:rotate-90 transition-transform">▶</span>
          </summary>
          <ul className="mt-2 space-y-1">
            {activeProblem.constraints.map((c, i) => (
              <li key={i} className="text-zinc-400 text-[11px] flex gap-1.5">
                <span className="text-indigo-500 flex-shrink-0">•</span>{c}
              </li>
            ))}
          </ul>
        </details>

        {/* Hints */}
        <details className="group mt-2">
          <summary className="text-xs text-zinc-400 cursor-pointer hover:text-white list-none flex items-center justify-between">
            <span>Hints</span>
            <span className="group-open:rotate-90 transition-transform">▶</span>
          </summary>
          <ul className="mt-2 space-y-1">
            {activeProblem.hints.map((h, i) => (
              <li key={i} className="text-zinc-400 text-[11px] flex gap-1.5">
                <span className="text-amber-500 flex-shrink-0">💡</span>{h}
              </li>
            ))}
          </ul>
        </details>
      </div>

      {/* Node Props */}
      {selectedNode ? (
        <div className="p-4 space-y-3">
          <div className="text-sm font-semibold text-white mb-3">Component Properties</div>
          {([
            { key: "label", label: "Name", type: "text" },
            { key: "rpsCapacity", label: "RPS Capacity (k/s)", type: "number" },
            { key: "instances", label: "Instances", type: "number" },
          ] as const).map(({ key, label, type }) => (
            <div key={key}>
              <label className="text-zinc-400 text-xs mb-1 block">{label}</label>
              <input
                type={type}
                value={String((selectedNode.data as NodeData)[key] ?? "")}
                onChange={(e) => updateNodeData(selectedNode.id, { [key]: type === "number" ? Number(e.target.value) : e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                min={type === "number" ? 1 : undefined}
              />
            </div>
          ))}
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">Notes</label>
            <textarea
              value={String((selectedNode.data as NodeData).notes ?? "")}
              onChange={(e) => updateNodeData(selectedNode.id, { notes: e.target.value })}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 resize-none"
              placeholder="Add design notes…"
            />
          </div>
          <button
            onClick={() => deleteNode(selectedNode.id)}
            className="w-full py-1.5 text-xs rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
          >
            Delete Component
          </button>
        </div>
      ) : (
        <div className="p-4 text-center">
          <p className="text-zinc-500 text-xs">Click a component on the canvas to edit its properties.</p>
        </div>
      )}
    </div>
  );
}
