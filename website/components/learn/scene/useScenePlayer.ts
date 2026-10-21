"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useInView } from "framer-motion";
import { useSceneStore } from "@/lib/learn/scene/store";
import type { SceneStep } from "@/lib/learn/scene/types";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export type Speed = 0.5 | 1 | 2;

const DEFAULT_STEP_MS = 2000;

/**
 * Deterministic playback over a list of scene steps.
 *
 * - The rendered state is purely a function of `index`, so prev/next/replay
 *   are always safe and exact.
 * - Advancing uses a single timeout per step, cleared on every change and on
 *   unmount — no drifting intervals.
 * - Playback only advances while the scene is on screen and owns the global
 *   "active scene" slot, so off-screen or competing scenes stay paused.
 * - The caller owns `containerRef` (attached to the scene's root element) so
 *   no ref ever flows through render-time state.
 * - Autoplays at most once, the first time it scrolls into view, and never
 *   after the user has touched the controls or when reduced motion is on.
 */
export function useScenePlayer(
  sceneId: string,
  steps: SceneStep[],
  containerRef: RefObject<HTMLElement | null>,
  { autoplay = true }: { autoplay?: boolean } = {},
) {
  const reducedMotion = usePrefersReducedMotion();
  const inView = useInView(containerRef, { amount: 0.5 });

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const interacted = useRef(false);
  const autoplayed = useRef(false);

  const active = useSceneStore((s) => s.active);
  const setActive = useSceneStore((s) => s.setActive);

  const last = Math.max(0, steps.length - 1);
  const isPlaying = playing && active === sceneId;
  const running = isPlaying && inView;

  useEffect(() => {
    if (!running) return;
    const duration = (steps[index]?.durationMs ?? DEFAULT_STEP_MS) / speed;
    const timer = setTimeout(() => {
      if (index >= last) setPlaying(false);
      else setIndex((i) => Math.min(i + 1, last));
    }, duration);
    return () => clearTimeout(timer);
  }, [running, index, speed, last, steps]);

  useEffect(() => {
    if (!autoplay || reducedMotion || !inView) return;
    if (autoplayed.current || interacted.current) return;
    const timer = setTimeout(() => {
      autoplayed.current = true;
      setActive(sceneId);
      setPlaying(true);
    }, 450);
    return () => clearTimeout(timer);
  }, [autoplay, reducedMotion, inView, sceneId, setActive]);

  const touch = useCallback(() => {
    interacted.current = true;
    autoplayed.current = true;
  }, []);

  const play = useCallback(() => {
    touch();
    if (index >= last) setIndex(0);
    setActive(sceneId);
    setPlaying(true);
  }, [touch, index, last, sceneId, setActive]);

  const pause = useCallback(() => {
    touch();
    setPlaying(false);
  }, [touch]);

  const goTo = useCallback(
    (i: number) => {
      touch();
      setPlaying(false);
      setIndex(Math.max(0, Math.min(i, last)));
    },
    [touch, last],
  );

  const replay = useCallback(() => {
    touch();
    setIndex(0);
    setActive(sceneId);
    setPlaying(true);
  }, [touch, sceneId, setActive]);

  const changeSpeed = useCallback((s: Speed) => {
    touch();
    setSpeed(s);
  }, [touch]);

  return {
    index,
    step: steps[index],
    total: steps.length,
    isPlaying,
    running,
    speed,
    reducedMotion,
    play,
    pause,
    next: () => goTo(index + 1),
    prev: () => goTo(index - 1),
    goTo,
    replay,
    setSpeed: changeSpeed,
  };
}
