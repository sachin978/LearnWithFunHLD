"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useSimulatorStore } from "@/lib/simulator/store";
import { COMPONENTS, CATEGORIES, CATEGORY_COLORS } from "@/lib/simulator/components-data";
import { ComponentIcon } from "@/lib/simulator/icon-registry";
import { PROBLEMS_BY_DIFFICULTY } from "@/lib/simulator/problems-data";
import type { ComponentCategory, ComponentDef } from "@/lib/simulator/components-data";
import { addComponentAtCenter, cancelDrag, endDrag, moveDrag } from "@/lib/simulator/dnd";

/** Pixels the pointer must travel before a press becomes a drag (below that it's a click). */
const DRAG_THRESHOLD = 5;

function DraggableComponent({ id, name, icon, category, rpsCapacity, isCustom }: { id: string; name: string; icon: string; category: ComponentCategory; rpsCapacity: number; isCustom?: boolean }) {
  const c = CATEGORY_COLORS[category];
  const press = useRef<{ x: number; y: number; dragging: boolean } | null>(null);

  // Pointer-event drag (see lib/simulator/dnd.ts for why not HTML5 drag-and-drop).
  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    press.current = { x: e.clientX, y: e.clientY, dragging: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const p = press.current;
    if (!p) return;
    if (!p.dragging && Math.hypot(e.clientX - p.x, e.clientY - p.y) < DRAG_THRESHOLD) return;
    p.dragging = true;
    moveDrag(id, name, e.clientX, e.clientY);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const p = press.current;
    press.current = null;
    if (!p) return;
    if (p.dragging) endDrag(e.clientX, e.clientY);
    else addComponentAtCenter(id); // a plain click adds it to the middle of the canvas
  };
  const onPointerCancel = () => {
    press.current = null;
    cancelDrag();
  };

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      // Pointer presses are handled above; this only fires for keyboard (Enter/Space).
      onClick={(e) => {
        if (e.detail === 0) addComponentAtCenter(id);
      }}
      onDragStart={(e) => e.preventDefault()}
      title={`${name}${isCustom ? " (custom component)" : ""} — drag onto the canvas, or click to add`}
      className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg border ${isCustom ? "border-dashed" : ""} ${c.border} ${c.bg} cursor-grab active:cursor-grabbing hover:brightness-125 hover:-translate-y-0.5 active:scale-[0.98] transition-[filter,transform] duration-150 select-none touch-pan-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
    >
      <ComponentIcon iconKey={icon} size={16} className={c.text} />
      <div className="flex-1 min-w-0">
        <div className="text-white text-xs font-medium truncate">{name}</div>
        <div className="text-zinc-500 text-[10px]">{rpsCapacity}k RPS</div>
      </div>
    </button>
  );
}

/** Modal for defining a new reusable custom component (e.g. "Order Service") —
 * it's added to the same library used everywhere else, so once created it
 * drags, connects, and edits exactly like a built-in component. */
function NewCustomComponentModal({ onClose }: { onClose: () => void }) {
  const addCustomComponent = useSimulatorStore((s) => s.addCustomComponent);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ComponentCategory>("Compute");
  const [rpsCapacity, setRpsCapacity] = useState(10);

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const def: ComponentDef = {
      id: `custom-${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`,
      name: trimmed,
      category,
      rpsCapacity: Math.max(0, rpsCapacity),
      latencyMs: 10,
      scalable: true,
      stateful: false,
      description: "User-defined custom component",
      icon: "wrench",
      color: "violet",
    };
    addCustomComponent(def);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 w-80 shadow-2xl"
      >
        <div className="text-white font-semibold mb-3">New Custom Component</div>

        <label className="text-zinc-400 text-xs mb-1 block">Name</label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="e.g. Order Service"
          className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 mb-3"
        />

        <label className="text-zinc-400 text-xs mb-1 block">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ComponentCategory)}
          className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 mb-3"
        >
          {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        <label className="text-zinc-400 text-xs mb-1 block">RPS Capacity (k/s)</label>
        <input
          type="number"
          min={0}
          value={rpsCapacity}
          onChange={(e) => setRpsCapacity(Number(e.target.value))}
          className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 mb-4"
        />

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
          <motion.button
            onClick={create}
            disabled={!name.trim()}
            whileHover={{ scale: name.trim() ? 1.03 : 1 }}
            whileTap={{ scale: name.trim() ? 0.97 : 1 }}
            className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Create
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Sidebar() {
  const { leftTab, setLeftTab, setActiveProblem, activeProblem, leftPanelCollapsed, setLeftPanelCollapsed, customComponents } = useSimulatorStore();
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORIES));
  const [newComponentOpen, setNewComponentOpen] = useState(false);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  // Custom components live in the same library everywhere they're used —
  // search, category grouping, drag-and-drop all just see one merged list.
  const allComponents = [...COMPONENTS, ...customComponents];
  const customIds = new Set(customComponents.map((c) => c.id));
  const filtered = allComponents.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

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
                <div className="p-2 space-y-2">
                  <input
                    type="text"
                    placeholder="Search components…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
                  />
                  <button
                    onClick={() => setNewComponentOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-zinc-700 text-zinc-400 text-xs font-medium hover:border-indigo-500/50 hover:text-indigo-300 transition-colors"
                  >
                    <Plus size={13} /> New Custom Component
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-2 scrollbar-thin scrollbar-track-zinc-950 scrollbar-thumb-zinc-700">
                  {search ? (
                    <div className="space-y-1.5">
                      {filtered.map((c) => (
                        <DraggableComponent key={c.id} {...c} isCustom={customIds.has(c.id)} />
                      ))}
                      {filtered.length === 0 && <p className="text-zinc-500 text-xs text-center py-4">No components found</p>}
                    </div>
                  ) : (
                    CATEGORIES.map((cat) => {
                      const items = allComponents.filter((c) => c.category === cat);
                      const isOpen = expandedCategories.has(cat);
                      const colors = CATEGORY_COLORS[cat];
                      if (items.length === 0) return null;
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
                                {items.map((c) => <DraggableComponent key={c.id} {...c} isCustom={customIds.has(c.id)} />)}
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

            <AnimatePresence>
              {newComponentOpen && <NewCustomComponentModal onClose={() => setNewComponentOpen(false)} />}
            </AnimatePresence>

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
