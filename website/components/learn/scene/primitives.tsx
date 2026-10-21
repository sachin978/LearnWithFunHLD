"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Send, Shuffle, Inbox, Cog, Server, User, Container, Database, Boxes, type LucideIcon } from "lucide-react";
import type { ActorKind, ActorStatus, SceneActor, SceneEdge, SceneToken, TokenState, Tone } from "@/lib/learn/scene/types";

// ─── Palette ─────────────────────────────────────────────────────────────────

export const TONE_HEX: Record<Tone, string> = {
  amber: "#f59e0b",
  indigo: "#818cf8",
  emerald: "#34d399",
  rose: "#fb7185",
  sky: "#38bdf8",
  violet: "#a78bfa",
  zinc: "#a1a1aa",
};

const KIND_TONE: Record<ActorKind, Tone> = {
  producer: "sky",
  exchange: "indigo",
  queue: "amber",
  consumer: "emerald",
  service: "zinc",
  client: "sky",
  broker: "zinc",
  store: "violet",
  node: "indigo",
};

const KIND_ICON: Record<ActorKind, LucideIcon> = {
  producer: Send,
  exchange: Shuffle,
  queue: Inbox,
  consumer: Cog,
  service: Server,
  client: User,
  broker: Container,
  store: Database,
  node: Boxes,
};

/** Every token state gets a color, a shape and a glyph — never color alone. */
export const TOKEN_STYLE: Record<TokenState, { tone: Tone; glyph?: string; label: string; shape: "circle" | "square" }> = {
  idle: { tone: "zinc", label: "Idle", shape: "circle" },
  transit: { tone: "amber", label: "In transit", shape: "circle", glyph: "→" },
  accepted: { tone: "amber", label: "Accepted by exchange", shape: "circle", glyph: "•" },
  queued: { tone: "amber", label: "Queued", shape: "circle" },
  delivered: { tone: "sky", label: "Delivered (unacked)", shape: "circle", glyph: "…" },
  processing: { tone: "sky", label: "Processing", shape: "circle", glyph: "⟳" },
  acked: { tone: "emerald", label: "Acknowledged", shape: "circle", glyph: "✓" },
  rejected: { tone: "rose", label: "Rejected / failed", shape: "circle", glyph: "✕" },
  returned: { tone: "rose", label: "Returned / nacked", shape: "circle", glyph: "↩" },
  redelivered: { tone: "violet", label: "Redelivered", shape: "circle", glyph: "↻" },
  dead: { tone: "rose", label: "Dead-lettered", shape: "square", glyph: "☓" },
  lost: { tone: "rose", label: "Lost / dropped", shape: "circle", glyph: "✕" },
  stored: { tone: "indigo", label: "Stored on disk / replica", shape: "square" },
};

// ─── Geometry ────────────────────────────────────────────────────────────────

export function actorSize(a: SceneActor): { w: number; h: number } {
  const defaults: Record<ActorKind, [number, number]> = {
    queue: [170, 58],
    exchange: [130, 58],
    store: [150, 62],
    broker: [300, 240],
    producer: [120, 56],
    consumer: [120, 56],
    service: [120, 56],
    client: [110, 56],
    node: [140, 60],
  };
  const [w, h] = defaults[a.kind];
  return { w: a.w ?? w, h: a.h ?? h };
}

/** Point where the ray from a rect's centre toward (tx, ty) exits the rect. */
function exitPoint(a: SceneActor, tx: number, ty: number, gap = 4) {
  const { w, h } = actorSize(a);
  const dx = tx - a.x;
  const dy = ty - a.y;
  if (dx === 0 && dy === 0) return { x: a.x, y: a.y };
  const sx = dx === 0 ? Infinity : (w / 2 + gap) / Math.abs(dx);
  const sy = dy === 0 ? Infinity : (h / 2 + gap) / Math.abs(dy);
  const s = Math.min(sx, sy);
  return { x: a.x + dx * s, y: a.y + dy * s };
}

export function edgeEndpoints(from: SceneActor, to: SceneActor, offset = 0) {
  const p1 = exitPoint(from, to.x, to.y);
  const p2 = exitPoint(to, from.x, from.y, 7);
  const len = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
  const nx = (-(p2.y - p1.y) / len) * offset;
  const ny = ((p2.x - p1.x) / len) * offset;
  return { p1: { x: p1.x + nx, y: p1.y + ny }, p2: { x: p2.x + nx, y: p2.y + ny }, shiftY: ny };
}

/** Kinds whose tokens sit in a row inside the box rather than on its edge. */
export const SLOTTED: ActorKind[] = ["queue", "store"];

export function tokenPosition(
  token: SceneToken,
  orderAtActor: number,
  countAtActor: number,
  actors: Map<string, SceneActor>,
  edges: Map<string, SceneEdge>,
): { x: number; y: number } {
  if (token.edge) {
    const e = edges.get(token.edge);
    const a = e && actors.get(e.from);
    const b = e && actors.get(e.to);
    if (a && b) {
      const { p1, p2 } = edgeEndpoints(a, b, e.offset);
      const t = token.t ?? 0.5;
      return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
    }
  }
  const actor = token.at ? actors.get(token.at) : undefined;
  if (!actor) return { x: 0, y: 0 };
  const { w, h } = actorSize(actor);
  if (SLOTTED.includes(actor.kind)) {
    const i = token.slot ?? orderAtActor;
    const n = Math.max(countAtActor, (token.slot ?? 0) + 1);
    const spacing = n > 1 ? Math.min(22, (w - 36) / (n - 1)) : 0;
    return { x: actor.x - w / 2 + 18 + i * spacing, y: actor.y + h / 2 - 15 };
  }
  return { x: actor.x + (orderAtActor - (countAtActor - 1) / 2) * 22, y: actor.y + h / 2 };
}

// ─── Actor nodes ─────────────────────────────────────────────────────────────

interface NodeProps {
  actor: SceneActor;
  status: ActorStatus;
  badge?: string;
  badgeTone?: Tone;
  animate: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

function statusStroke(kindTone: Tone, status: ActorStatus): { stroke: string; fill: string; dash?: string; opacity: number; width: number } {
  const accent = TONE_HEX[kindTone];
  switch (status) {
    case "active":
      return { stroke: accent, fill: `${accent}1f`, opacity: 1, width: 2 };
    case "busy":
      return { stroke: TONE_HEX.amber, fill: "#f59e0b14", opacity: 1, width: 2 };
    case "ok":
      return { stroke: TONE_HEX.emerald, fill: "#34d39914", opacity: 1, width: 2 };
    case "failed":
      return { stroke: TONE_HEX.rose, fill: "#fb71851f", opacity: 1, width: 2 };
    case "down":
      return { stroke: TONE_HEX.rose, fill: "#18181b", dash: "5 4", opacity: 0.45, width: 1.5 };
    case "leader":
      return { stroke: TONE_HEX.indigo, fill: "#818cf826", opacity: 1, width: 2.5 };
    case "muted":
      return { stroke: "#3f3f46", fill: "#18181b", opacity: 0.45, width: 1 };
    case "selected":
      return { stroke: "#fafafa", fill: `${accent}26`, opacity: 1, width: 2.5 };
    default:
      return { stroke: `${accent}99`, fill: "#18181b", opacity: 1, width: 1.5 };
  }
}

function Badge({ x, y, text, tone = "zinc" }: { x: number; y: number; text: string; tone?: Tone }) {
  const width = Math.max(36, text.length * 6.1 + 16);
  const color = TONE_HEX[tone];
  return (
    <motion.g initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <rect x={x - width / 2} y={y - 10} width={width} height={19} rx={9.5} fill="#09090b" stroke={`${color}aa`} strokeWidth={1} />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize={10.5} fontWeight={600} fill={color}>
        {text}
      </text>
    </motion.g>
  );
}

/**
 * Generic actor box. ProducerNode / ExchangeNode / QueueNode / ConsumerNode
 * are thin aliases so scene code reads naturally; the kind drives color,
 * icon and token layout.
 */
export function ActorNode({ actor, status, badge, badgeTone, animate, selected, onSelect }: NodeProps) {
  const { w, h } = actorSize(actor);
  const kindTone = KIND_TONE[actor.kind];
  const s = statusStroke(kindTone, selected ? "selected" : status);
  const Icon = KIND_ICON[actor.kind];
  const slotted = SLOTTED.includes(actor.kind);
  const isBroker = actor.kind === "broker";
  const left = actor.x - w / 2;
  const top = actor.y - h / 2;
  const labelY = slotted || isBroker ? top + 17 : actor.sub ? actor.y - 2 : actor.y + 4.5;
  const subY = slotted || isBroker ? top + 30 : actor.y + 13;
  const interactive = Boolean(onSelect);

  return (
    <motion.g
      animate={status === "failed" && animate ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.45 }}
      opacity={s.opacity}
      style={{ transition: "opacity 0.4s" }}
      {...(interactive
        ? {
            role: "button",
            tabIndex: 0,
            "aria-label": `${actor.label}${actor.sub ? `, ${actor.sub}` : ""}. Show definition`,
            "aria-pressed": selected,
            onClick: () => onSelect?.(actor.id),
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.(actor.id);
              }
            },
            className: "cursor-pointer outline-none focus-visible:[&>rect:first-of-type]:stroke-white",
          }
        : {})}
    >
      <rect
        x={left}
        y={top}
        width={w}
        height={h}
        rx={actor.kind === "store" ? 14 : isBroker ? 16 : 10}
        fill={isBroker ? "transparent" : s.fill}
        stroke={s.stroke}
        strokeWidth={s.width}
        strokeDasharray={isBroker && status !== "down" ? "6 5" : s.dash}
        style={{ transition: "stroke 0.35s, fill 0.35s" }}
      />
      {status === "busy" && animate && (
        <motion.rect
          x={left}
          y={top}
          width={w}
          height={h}
          rx={10}
          fill="none"
          stroke={TONE_HEX.amber}
          strokeWidth={2}
          initial={{ opacity: 0.1 }}
          animate={{ opacity: [0.1, 0.6, 0.1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      )}
      <Icon x={left + 8} y={top + 7} width={13} height={13} color={TONE_HEX[kindTone]} strokeWidth={2} aria-hidden />
      <text x={isBroker ? left + 28 : actor.x} y={labelY} textAnchor={isBroker ? "start" : "middle"} fontSize={13} fontWeight={600} fill="#fafafa">
        {actor.label}
      </text>
      {actor.sub && (
        <text x={actor.x} y={subY} textAnchor="middle" fontSize={10.5} fill="#a1a1aa">
          {actor.sub}
        </text>
      )}
      <AnimatePresence>{badge && <Badge key={badge} x={actor.x} y={top - 14} text={badge} tone={badgeTone} />}</AnimatePresence>
    </motion.g>
  );
}

export const ProducerNode = ActorNode;
export const ExchangeNode = ActorNode;
export const QueueNode = ActorNode;
export const ConsumerNode = ActorNode;

// ─── Edges ───────────────────────────────────────────────────────────────────

/**
 * Straight connector between two actors. When active it lights up amber and,
 * while the scene is playing, carries the same travelling dot used by the
 * simulator's FlowEdge so the two experiences feel like one product.
 */
export function SceneFlowEdge({
  edge,
  from,
  to,
  state,
  animate,
  markerPrefix,
}: {
  edge: SceneEdge;
  from: SceneActor;
  to: SceneActor;
  state?: "active" | "muted" | "failed";
  animate: boolean;
  markerPrefix: string;
}) {
  const { p1, p2, shiftY } = edgeEndpoints(from, to, edge.offset);
  const path = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
  const color = state === "active" ? TONE_HEX.amber : state === "failed" ? TONE_HEX.rose : "#52525b";
  const marker = state === "active" ? "active" : state === "failed" ? "failed" : "idle";
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  return (
    <g opacity={state === "muted" ? 0.25 : 1} style={{ transition: "opacity 0.4s" }}>
      <path
        d={path}
        stroke={color}
        strokeWidth={state === "active" ? 2.2 : 1.5}
        strokeDasharray={edge.dashed || state === "failed" ? "5 4" : undefined}
        fill="none"
        markerEnd={`url(#${markerPrefix}-${marker})`}
        style={{ transition: "stroke 0.35s" }}
      />
      {state === "active" && animate && (
        <circle r={3.5} fill={color} style={{ filter: `drop-shadow(0 0 3px ${color})` }}>
          <animateMotion dur="1.2s" repeatCount="indefinite" path={path} />
        </circle>
      )}
      {edge.label && (
        <text
          x={midX}
          y={shiftY > 0 ? midY + 16 : midY - 7}
          textAnchor="middle"
          fontSize={10}
          fill={state === "active" ? TONE_HEX.amber : "#a1a1aa"}
          stroke="#09090b"
          strokeWidth={4}
          paintOrder="stroke"
        >
          {edge.label}
        </text>
      )}
    </g>
  );
}

export function EdgeMarkers({ prefix }: { prefix: string }) {
  const markers: [string, string][] = [
    ["idle", "#52525b"],
    ["active", TONE_HEX.amber],
    ["failed", TONE_HEX.rose],
  ];
  return (
    <defs>
      {markers.map(([name, color]) => (
        <marker key={name} id={`${prefix}-${name}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      ))}
    </defs>
  );
}

// ─── Message token ───────────────────────────────────────────────────────────

export function MessageToken({
  token,
  x,
  y,
  duration,
  animate,
}: {
  token: SceneToken;
  x: number;
  y: number;
  duration: number;
  animate: boolean;
}) {
  const style = TOKEN_STYLE[token.state];
  const color = TONE_HEX[token.tone ?? style.tone];
  const stateColor = TONE_HEX[style.tone];
  const faded = token.state === "lost";
  const r = 9;

  return (
    <motion.g
      initial={{ x, y, scale: 0, opacity: 0 }}
      animate={{ x, y, scale: 1, opacity: faded ? 0.45 : 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration, ease: "easeInOut" }}
      aria-hidden
    >
      {style.shape === "square" ? (
        <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={3} fill="#09090b" stroke={color} strokeWidth={2} />
      ) : (
        <circle r={r} fill="#09090b" stroke={color} strokeWidth={2} strokeDasharray={faded ? "3 3" : undefined} />
      )}
      <circle r={r - 3} fill={`${color}40`} />
      {token.state === "processing" && animate && (
        <motion.circle
          r={r + 4}
          fill="none"
          stroke={stateColor}
          strokeWidth={1.5}
          strokeDasharray="4 5"
          animate={{ rotate: 360 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        />
      )}
      {token.label && (
        <text y={3.5} textAnchor="middle" fontSize={token.label.length > 2 ? 7.5 : 9.5} fontWeight={700} fill="#fafafa">
          {token.label}
        </text>
      )}
      {style.glyph && token.state !== "queued" && (
        <g transform={`translate(${r - 1}, ${-r + 1})`}>
          <circle r={5.5} fill={stateColor} />
          <text y={3} textAnchor="middle" fontSize={8} fontWeight={800} fill="#09090b">
            {style.glyph}
          </text>
        </g>
      )}
    </motion.g>
  );
}
