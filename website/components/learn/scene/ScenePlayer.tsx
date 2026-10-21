"use client";

import { useId, useMemo, useRef } from "react";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SceneDefinition, TokenState } from "@/lib/learn/scene/types";
import { SceneCanvas } from "./SceneCanvas";
import { TOKEN_STYLE, TONE_HEX } from "./primitives";
import { useScenePlayer, type Speed } from "./useScenePlayer";

const SPEEDS: Speed[] = [0.5, 1, 2];

export function SceneControls({
  index,
  total,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onPrev,
  onNext,
  onReplay,
  onGoTo,
  onSpeed,
  label,
}: {
  index: number;
  total: number;
  isPlaying: boolean;
  speed: Speed;
  onPlay: () => void;
  onPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReplay: () => void;
  onGoTo: (i: number) => void;
  onSpeed: (s: Speed) => void;
  label: string;
}) {
  const btn =
    "inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-zinc-900 text-zinc-300 hover:text-white hover:border-indigo-500/50 disabled:opacity-35 disabled:pointer-events-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`${label} playback controls`}>
      <button type="button" className={btn} onClick={onPrev} disabled={index === 0} aria-label="Previous step">
        <SkipBack size={15} />
      </button>
      {isPlaying ? (
        <button type="button" className={cn(btn, "w-auto px-3 gap-1.5 text-white border-indigo-500/50 bg-indigo-600/20")} onClick={onPause} aria-label="Pause">
          <Pause size={15} /> <span className="text-xs font-semibold">Pause</span>
        </button>
      ) : (
        <button type="button" className={cn(btn, "w-auto px-3 gap-1.5 text-white border-indigo-500/50 bg-indigo-600/20")} onClick={onPlay} aria-label={index >= total - 1 ? "Play from start" : "Play"}>
          <Play size={15} /> <span className="text-xs font-semibold">Play</span>
        </button>
      )}
      <button type="button" className={btn} onClick={onNext} disabled={index >= total - 1} aria-label="Next step">
        <SkipForward size={15} />
      </button>
      <button type="button" className={btn} onClick={onReplay} aria-label="Replay from the beginning">
        <RotateCcw size={15} />
      </button>

      <div className="flex items-center gap-1 ml-1" role="group" aria-label="Jump to step">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onGoTo(i)}
            aria-label={`Go to step ${i + 1}`}
            aria-current={i === index ? "step" : undefined}
            className={cn(
              "h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              i === index ? "w-5 bg-amber-400" : i < index ? "w-2 bg-amber-400/40 hover:bg-amber-400/70" : "w-2 bg-zinc-700 hover:bg-zinc-500",
            )}
          />
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1 rounded-lg border border-border p-0.5" role="radiogroup" aria-label="Playback speed">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={speed === s}
            onClick={() => onSpeed(s)}
            className={cn(
              "px-2 py-1 rounded-md text-xs font-mono transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              speed === s ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}

export function SceneCaption({ index, total, title, caption, srText }: { index: number; total: number; title: string; caption: string; srText?: string }) {
  return (
    <div aria-live="polite" aria-atomic="true" className="min-h-[4.5rem] rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3">
      <div className="flex items-baseline gap-2 text-xs mb-1">
        <span className="font-mono text-amber-400">
          Step {index + 1}/{total}
        </span>
        <span className="font-semibold text-zinc-200">{title}</span>
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed">{caption}</p>
      {srText && <p className="sr-only">{srText}</p>}
    </div>
  );
}

function SceneLegend({ states }: { states: TokenState[] }) {
  if (!states.length) return null;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-zinc-400" aria-label="Message state legend">
      {states.map((s) => {
        const st = TOKEN_STYLE[s];
        return (
          <li key={s} className="flex items-center gap-1.5">
            <span
              className={cn("inline-flex items-center justify-center w-3.5 h-3.5 border-2 text-[8px] font-bold", st.shape === "square" ? "rounded-[3px]" : "rounded-full")}
              style={{ borderColor: TONE_HEX[st.tone], color: TONE_HEX[st.tone] }}
              aria-hidden
            >
              {st.glyph && s !== "queued" ? st.glyph : ""}
            </span>
            {st.label}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A complete, self-contained animated scene: diagram + caption + controls +
 * legend. `renderBelow` renders extra UI (e.g. a chart) for the current step.
 */
export function ScenePlayer({
  scene,
  autoplay = true,
  selectedActorId,
  onActorSelect,
  renderBelow,
  className,
}: {
  scene: SceneDefinition;
  autoplay?: boolean;
  selectedActorId?: string | null;
  onActorSelect?: (id: string) => void;
  renderBelow?: (index: number) => React.ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLElement>(null);
  const player = useScenePlayer(scene.id, scene.steps, containerRef, { autoplay });
  const titleId = useId();
  const states = useMemo(() => {
    const seen = new Set<TokenState>();
    scene.steps.forEach((s) => s.tokens.forEach((t) => seen.add(t.state)));
    return Object.keys(TOKEN_STYLE).filter((k) => seen.has(k as TokenState)) as TokenState[];
  }, [scene.steps]);

  if (!player.step) return null;

  return (
    <figure ref={containerRef} aria-labelledby={titleId} className={cn("rounded-2xl border border-border bg-card/60 p-3 sm:p-4 space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <figcaption id={titleId} className="text-sm font-semibold text-white">
          {scene.title}
        </figcaption>
        {player.reducedMotion && <span className="text-[10px] uppercase tracking-wider text-zinc-500">reduced motion</span>}
      </div>
      <div className="-mx-1 overflow-x-auto rounded-xl bg-background/60 border border-border/60">
        <div className="min-w-[520px] px-1 py-2">
          <SceneCanvas
            scene={scene}
            step={player.step}
            running={player.running}
            reducedMotion={player.reducedMotion}
            speed={player.speed}
            selectedActorId={selectedActorId}
            onActorSelect={onActorSelect}
          />
        </div>
      </div>
      <SceneCaption index={player.index} total={player.total} title={player.step.title} caption={player.step.caption} srText={player.step.srText} />
      {renderBelow?.(player.index)}
      <SceneControls
        label={scene.title}
        index={player.index}
        total={player.total}
        isPlaying={player.isPlaying}
        speed={player.speed}
        onPlay={player.play}
        onPause={player.pause}
        onPrev={player.prev}
        onNext={player.next}
        onReplay={player.replay}
        onGoTo={player.goTo}
        onSpeed={player.setSpeed}
      />
      <SceneLegend states={states} />
    </figure>
  );
}
