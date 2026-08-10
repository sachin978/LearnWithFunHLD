"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSimulatorStore } from "@/lib/simulator/store";
import { COMPONENTS, CATEGORIES, CATEGORY_COLORS } from "@/lib/simulator/components-data";
import { ComponentIcon } from "@/lib/simulator/icon-registry";
import { PROBLEMS_BY_DIFFICULTY } from "@/lib/simulator/problems-data";
import type { ComponentCategory } from "@/lib/simulator/components-data";

function DraggableComponent({ id, name, icon, category, rpsCapacity }: { id: string; name: string; icon: string; category: ComponentCategory; rpsCapacity: number }) {
  const c = CATEGORY_COLORS[category];
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/wireup-system", id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${c.border} ${c.bg} cursor-grab active:cursor-grabbing hover:brightness-125 hover:-translate-y-0.5 active:scale-[0.98] transition-[filter,transform] duration-150 select-none`}
    >
      <ComponentIcon iconKey={icon} size={16} className={c.text} />
      <div className="flex-1 min-w-0">
        <div className="text-white text-xs font-medium truncate">{name}</div>
        <div className="text-zinc-500 text-[10px]">{rpsCapacity}k RPS</div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { leftTab, setLeftTab, setActiveProblem, activeProblem, leftPanelCollapsed, setLeftPanelCollapsed } = useSimulatorStore();
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
    <motion.div
      animate={{ width: leftPanelCollapsed ? 28 : 256 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="flex-shrink-0 flex flex-col border-r border-zinc-800 bg-zinc-950 overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        {leftPanelCollapsed ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-7 flex flex-col items-center py-2"
          >
            <button
              onClick={() => setLeftPanelCollapsed(false)}
              title="Expand sidebar"
              className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-900 transition"
            >
              <ChevronRight size={14} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, delay: 0.08 }}
            className="w-64 flex flex-col flex-1 overflow-hidden"
          >
            {/* Tab switcher — Components only unlocks once a problem is picked,
                so users aren't dropping components with no context. */}
            <div className="flex items-center border-b border-zinc-800">
              {(["problems", "components"] as const)
                .filter((tab) => tab === "problems" || activeProblem)
                .map((tab) => (
                <button
                  key={tab}
                  onClick={() => setLeftTab(tab)}
                  className={`flex-1 py-2.5 text-xs font-semibold capitalize transition
                    ${leftTab === tab ? "text-white border-b-2 border-indigo-500" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  {tab}
                </button>
              ))}
              <button
                onClick={() => setLeftPanelCollapsed(true)}
                title="Collapse sidebar"
                className="px-1.5 self-stretch flex items-center text-zinc-500 hover:text-white transition"
              >
                <ChevronLeft size={14} />
              </button>
            </div>

            {/* Components panel — only reachable once a problem is active */}
            {leftTab === "components" && activeProblem && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Search components…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
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
                            <motion.span animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.15 }}>▸</motion.span>
                          </button>
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="space-y-1 mt-1 ml-1 overflow-hidden"
                              >
                                {items.map((c) => <DraggableComponent key={c.id} {...c} />)}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Problems panel — also the fallback if "components" was somehow
                left active with no problem selected */}
            {(leftTab === "problems" || !activeProblem) && (
              <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
                {PROBLEMS_BY_DIFFICULTY.map((p) => (
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
