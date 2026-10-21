"use client";

import { ScenePlayer } from "@/components/learn/scene/ScenePlayer";
import { asyncMessagingScene } from "@/lib/learn/rabbitmq/scenes";
import { cacheAsideScene, loadBalancerScene, requestFlowScene } from "@/lib/learn/curriculum/scenes";
import type { ConceptBrief } from "@/lib/learn/curriculum/types";
import type { SceneDefinition } from "@/lib/learn/scene/types";

const SCENES: Record<NonNullable<ConceptBrief["sceneId"]>, SceneDefinition> = {
  "request-flow": requestFlowScene,
  "cache-aside": cacheAsideScene,
  "load-balancer": loadBalancerScene,
  "async-messaging": asyncMessagingScene,
};

/** Reuses the shared scene engine; scenes are looked up by id so brief data stays serializable. */
export function BriefScene({ sceneId }: { sceneId: NonNullable<ConceptBrief["sceneId"]> }) {
  return <ScenePlayer scene={SCENES[sceneId]} />;
}
