"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { SceneCanvas } from "@/components/learn/scene/SceneCanvas";
import { usePrefersReducedMotion } from "@/components/learn/scene/usePrefersReducedMotion";
import { homePreviewScene } from "@/lib/learn/rabbitmq/scenes";

const MAX_LOOPS = 3;
/** The step shown when motion is reduced: the message safely queued. */
const STATIC_STEP = 2;

/**
 * Show, don't tell: a real lesson scene playing inside the Learn card. It is
 * the only looping animation in the hero, runs only while visible, and stops
 * after a few loops so it never competes with reading.
 */
export function LearnPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [loops, setLoops] = useState(0);
  const steps = homePreviewScene.steps;
  const running = inView && !reduced && loops < MAX_LOOPS;

  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => {
      if (index < steps.length - 1) {
        setIndex(index + 1);
      } else {
        setLoops((l) => l + 1);
        if (loops + 1 < MAX_LOOPS) setIndex(0);
      }
    }, steps[index].durationMs ?? 1500);
    return () => clearTimeout(timer);
  }, [running, index, loops, steps]);

  const shown = reduced ? STATIC_STEP : index;
  const step = steps[shown];

  return (
    <div ref={ref} className="rounded-xl border border-amber-500/15 bg-background/70 px-2 pt-1 pb-2.5">
      <SceneCanvas scene={homePreviewScene} step={step} running={running} reducedMotion={reduced} speed={1} />
      <div className="flex items-center gap-2 px-1.5 text-[11px]">
        <span className="font-mono text-amber-400 shrink-0">
          {shown + 1}/{steps.length}
        </span>
        <span className="text-zinc-400 truncate">{step.caption}</span>
      </div>
    </div>
  );
}
