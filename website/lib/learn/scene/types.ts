/**
 * Scene engine types for the /learn animated lessons.
 *
 * A scene is pure data: a fixed set of actors (boxes) and edges (wires), plus
 * an ordered list of steps. Each step is a complete snapshot of where every
 * message token sits and what state each actor is in — so playback is just
 * "render snapshot N". That makes Previous / Next / Replay deterministic and
 * always reversible: there is no hidden timer state to rewind.
 */

export type Tone = "amber" | "indigo" | "emerald" | "rose" | "sky" | "violet" | "zinc";

export type ActorKind =
  | "producer"
  | "exchange"
  | "queue"
  | "consumer"
  | "service"
  | "client"
  | "broker"
  | "store"
  | "node";

export type ActorStatus =
  | "idle"
  | "active"
  | "busy"
  | "ok"
  | "failed"
  | "down"
  | "leader"
  | "muted"
  | "selected";

export interface SceneActor {
  id: string;
  kind: ActorKind;
  label: string;
  /** Small secondary line under the label, e.g. a binding key. */
  sub?: string;
  /** Centre coordinates in viewBox units. */
  x: number;
  y: number;
  w?: number;
  h?: number;
}

export interface SceneEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  /** Perpendicular shift, so two edges between the same actors don't overlap. */
  offset?: number;
}

/**
 * Every visible lifecycle state of a message. Each one has its own color AND
 * glyph (see MessageToken) so state never relies on color alone.
 */
export type TokenState =
  | "idle"
  | "transit"
  | "accepted"
  | "queued"
  | "delivered"
  | "processing"
  | "acked"
  | "rejected"
  | "returned"
  | "redelivered"
  | "dead"
  | "lost"
  | "stored";

export interface SceneToken {
  /** Stable id — the same id across steps is what makes a token glide. */
  id: string;
  state: TokenState;
  /** Sit inside / on an actor… */
  at?: string;
  /** …or part-way along an edge (t = 0 → from, 1 → to). */
  edge?: string;
  t?: number;
  /** Explicit slot inside a queue; otherwise tokens are laid out in order. */
  slot?: number;
  /** 1–3 characters drawn inside the token, e.g. "1" or "A". */
  label?: string;
  /** Override the state color, e.g. to color-code routing keys. */
  tone?: Tone;
}

export interface ActorStepState {
  status?: ActorStatus;
  /** Short pill drawn above the actor, e.g. "crashed" or "prefetch 1". */
  badge?: string;
  badgeTone?: Tone;
}

export interface SceneStep {
  title: string;
  /** Visible caption — what just happened and why it matters. */
  caption: string;
  /** Full textual description of the state for screen readers. */
  srText?: string;
  tokens: SceneToken[];
  actors?: Record<string, ActorStepState>;
  edges?: Record<string, "active" | "muted" | "failed">;
  /** How long the step holds during playback, at 1× speed. */
  durationMs?: number;
}

export interface SceneDefinition {
  id: string;
  title: string;
  /** One-sentence description used as the figure's accessible name. */
  description: string;
  width: number;
  height: number;
  actors: SceneActor[];
  edges: SceneEdge[];
  steps: SceneStep[];
}
