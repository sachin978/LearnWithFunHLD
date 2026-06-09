"use client";
import { useState } from "react";
import { useSimulatorStore } from "@/lib/simulator/store";
import { COMPONENTS, CATEGORIES, CATEGORY_COLORS } from "@/lib/simulator/components-data";
import { PROBLEMS } from "@/lib/simulator/problems-data";
import type { ComponentCategory } from "@/lib/simulator/components-data";

function DraggableComponent({ id, name, icon, category, rpsCapacity }: { id: string; name: string; icon: string; category: ComponentCategory; rpsCapacity: number }) {
  const c = CATEGORY_COLORS[category];
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/systemsim", id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${c.border} ${c.bg} cursor-grab active:cursor-grabbing hover:brightness-125 transition select-none`}
    >
      <span className="text-base">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-white text-xs font-medium truncate">{name}</div>
        <div className="text-zinc-500 text-[10px]">{rpsCapacity}k RPS</div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { leftTab, setLeftTab, setActiveProblem, activeProblem } = useSimulatorStore();
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORIES));

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const filtered = COMPONENTS.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-64 flex-shrink-0 flex flex-col border-r border-zinc-800 bg-zinc-950 overflow-hidden">
      {/* Tab switcher */}
      <div className="flex border-b border-zinc-800">
        {(["components", "problems"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setLeftTab(tab)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize transition
              ${leftTab === tab ? "text-white border-b-2 border-indigo-500" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Components panel */}
      {leftTab === "components" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search components…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-2 scrollbar-thin scrollbar-track-zinc-950 scrollbar-thumb-zinc-700">
            {search ? (
              <div className="space-y-1.5">
                {filtered.map((c) => (
                  <DraggableComponent key={c.id} {...c} />
                ))}
                {filtered.length === 0 && <p className="text-zinc-500 text-xs text-center py-4">No components found</p>}
              </div>
            ) : (
              CATEGORIES.map((cat) => {
                const items = COMPONENTS.filter((c) => c.category === cat);
                const isOpen = expandedCategories.has(cat);
                const colors = CATEGORY_COLORS[cat];
                return (
                  <div key={cat}>
                    <button
                      onClick={() => toggleCategory(cat)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold ${colors.text} hover:bg-zinc-900 transition`}
                    >
                      <span>{cat} <span className="text-zinc-600 font-normal">({items.length})</span></span>
                      <span>{isOpen ? "▾" : "▸"}</span>
                    </button>
                    {isOpen && (
                      <div className="space-y-1 mt-1 ml-1">
                        {items.map((c) => <DraggableComponent key={c.id} {...c} />)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Problems panel */}
      {leftTab === "problems" && (
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
          {PROBLEMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProblem(p)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border transition
                ${activeProblem?.id === p.id
                  ? "border-indigo-500/60 bg-indigo-500/10"
                  : "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900"
                }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-white text-xs font-semibold truncate">{p.name}</span>
                <span className={`text-[10px] ml-1 flex-shrink-0 px-1.5 py-0.5 rounded font-medium
                  ${p.difficulty === "Easy" ? "bg-emerald-500/20 text-emerald-400" :
                    p.difficulty === "Medium" ? "bg-amber-500/20 text-amber-400" :
                    "bg-rose-500/20 text-rose-400"}`}>
                  {p.difficulty}
                </span>
              </div>
              <div className="text-zinc-500 text-[10px]">{p.category}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
