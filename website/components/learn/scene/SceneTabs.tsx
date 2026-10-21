"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SceneTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

/** Accessible tablist (arrow keys move focus) for switching between scenes. */
export function SceneTabs({ tabs, label }: { tabs: SceneTab[]; label: string }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const baseId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    setActive(tabs[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label={label} className="flex flex-wrap gap-1.5">
        {tabs.map((t, i) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              type="button"
              id={`${baseId}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                selected ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-300" : "border-border text-zinc-400 hover:text-white hover:border-zinc-600",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) =>
        t.id === active ? (
          <div key={t.id} role="tabpanel" id={`${baseId}-panel-${t.id}`} aria-labelledby={`${baseId}-tab-${t.id}`}>
            {t.content}
          </div>
        ) : null,
      )}
    </div>
  );
}
