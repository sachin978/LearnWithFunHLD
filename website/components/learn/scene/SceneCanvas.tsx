"use client";

import { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import type { SceneDefinition, SceneStep } from "@/lib/learn/scene/types";
import { ActorNode, EdgeMarkers, MessageToken, SceneFlowEdge, tokenPosition } from "./primitives";

/** Pure renderer: draws one step of a scene. All motion is between snapshots. */
export function SceneCanvas({
  scene,
  step,
  running,
  reducedMotion,
  speed,
  selectedActorId,
  onActorSelect,
}: {
  scene: SceneDefinition;
  step: SceneStep;
  running: boolean;
  reducedMotion: boolean;
  speed: number;
  selectedActorId?: string | null;
  onActorSelect?: (id: string) => void;
}) {
  const actors = useMemo(() => new Map(scene.actors.map((a) => [a.id, a])), [scene.actors]);
  const edges = useMemo(() => new Map(scene.edges.map((e) => [e.id, e])), [scene.edges]);
  const markerPrefix = `mk-${scene.id}`;
  const animateLoops = running && !reducedMotion;
  const tokenDuration = reducedMotion ? 0 : Math.min(0.8, ((step.durationMs ?? 2000) / 1000) * 0.4) / speed;

  const placed = useMemo(() => {
    const counts = new Map<string, number>();
    step.tokens.forEach((t) => t.at && counts.set(t.at, (counts.get(t.at) ?? 0) + 1));
    const seen = new Map<string, number>();
    return step.tokens.map((t) => {
      const order = t.at ? (seen.get(t.at) ?? 0) : 0;
      if (t.at) seen.set(t.at, order + 1);
      return { token: t, ...tokenPosition(t, order, t.at ? counts.get(t.at) ?? 1 : 1, actors, edges) };
    });
  }, [step.tokens, actors, edges]);

  return (
    <svg viewBox={`0 0 ${scene.width} ${scene.height}`} className="w-full h-auto select-none" role="img" aria-label={`${scene.description} Current step: ${step.srText ?? step.caption}`}>
      <EdgeMarkers prefix={markerPrefix} />
      {scene.actors
        .filter((a) => a.kind === "broker")
        .map((a) => (
          <ActorNode key={a.id} actor={a} status={step.actors?.[a.id]?.status ?? "idle"} badge={step.actors?.[a.id]?.badge} badgeTone={step.actors?.[a.id]?.badgeTone} animate={!reducedMotion} />
        ))}
      {scene.edges.map((e) => {
        const from = actors.get(e.from);
        const to = actors.get(e.to);
        if (!from || !to) return null;
        return <SceneFlowEdge key={e.id} edge={e} from={from} to={to} state={step.edges?.[e.id]} animate={animateLoops} markerPrefix={markerPrefix} />;
      })}
      {scene.actors
        .filter((a) => a.kind !== "broker")
        .map((a) => (
          <ActorNode
            key={a.id}
            actor={a}
            status={step.actors?.[a.id]?.status ?? "idle"}
            badge={step.actors?.[a.id]?.badge}
            badgeTone={step.actors?.[a.id]?.badgeTone}
            animate={!reducedMotion}
            selected={selectedActorId === a.id}
            onSelect={onActorSelect}
          />
        ))}
      <AnimatePresence>
        {placed.map(({ token, x, y }) => (
          <MessageToken key={token.id} token={token} x={x} y={y} duration={tokenDuration} animate={animateLoops} />
        ))}
      </AnimatePresence>
    </svg>
  );
}
