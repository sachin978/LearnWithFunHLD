import type { Node, Edge } from "@xyflow/react";
import type { NodeData } from "./store";
import type { Problem } from "./problems-data";
import { COMPONENTS } from "./components-data";

// ── Constants (match original simulator thresholds) ────────────────────────
const UTILIZATION_WARNING  = 0.5;
const UTILIZATION_CRITICAL = 0.8;
const LATENCY_SPIKE_THRESHOLD  = 0.7;
const LATENCY_SPIKE_MULTIPLIER = 3;

// Load-balancing components split traffic equally among children.
// All other components fan out full QPS to every child.
const LOAD_BALANCING_IDS = new Set(["load-balancer", "api-gateway"]);

// Async component IDs — edges marked async are excluded from latency path
// (but still propagate QPS).
const ASYNC_COMPONENT_IDS = new Set(["message-queue", "pub-sub", "pubsub", "monitoring", "notification-service"]);

// ── Types ──────────────────────────────────────────────────────────────────
export interface NodeResult {
  nodeId: string;
  label: string;
  incomingRps: number;
  deliveredRps: number;   // min(incoming, capacity) — actual throughput
  capacity: number;       // rpsCapacity * instances
  utilisation: number;    // 0-2 (capped at 2 for display)
  latencyMs: number;      // effective per-node latency under load
  status: "healthy" | "warning" | "critical" | "idle";
  isBottleneck: boolean;
  suggestion: string;
}

export interface SimulationResult {
  totalRps: number;         // input load (reads + writes from problem)
  throughput: number;       // effective delivered throughput (bottleneck-limited)
  totalLatencyMs: number;   // longest synchronous path latency
  bottlenecks: NodeResult[];
  allNodes: NodeResult[];
  warnings: string[];
  summary: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Effective latency of a node under a given utilisation. */
function computeLatency(baseLatency: number, utilisation: number): number {
  if (utilisation > LATENCY_SPIKE_THRESHOLD) {
    return baseLatency * (1 + Math.max(0, utilisation - LATENCY_SPIKE_THRESHOLD) * LATENCY_SPIKE_MULTIPLIER);
  }
  return baseLatency;
}

/** Base latency for a component ID, looked up from component definitions. */
function getBaseLatency(componentId: string): number {
  const def = COMPONENTS.find((c) => c.id === componentId || (componentId === "pubsub" && c.id === "pub-sub") || (componentId === "geospatial" && c.id === "geospatial-index") || (componentId === "coordination" && c.id === "coordination-service"));
  return def?.latencyMs ?? 10;
}

/** Topological sort (Kahn's) on sync edges only to find max path depth & latency. */
function computePathLatency(
  nodes: Node[],
  edges: Edge[],
  nodeById: Map<string, Node>,
  effectiveLatency: Map<string, number>,
): { totalMs: number; cyclic: boolean } {
  // Only sync edges contribute to latency path
  const syncEdges = edges.filter((e) => {
    const srcData = nodeById.get(e.source)?.data as NodeData | undefined;
    return !ASYNC_COMPONENT_IDS.has(srcData?.componentId ?? "");
  });

  const adj = new Map<string, string[]>();
  const inDeg = new Map<string, number>();
  for (const n of nodes) { adj.set(n.id, []); inDeg.set(n.id, 0); }
  for (const e of syncEdges) {
    if (e.source === e.target) continue;
    adj.get(e.source)?.push(e.target);
    inDeg.set(e.target, (inDeg.get(e.target) ?? 0) + 1);
  }

  // Longest path (DP via topological order)
  const dist = new Map<string, number>();
  const queue: string[] = [];
  for (const n of nodes) {
    if ((inDeg.get(n.id) ?? 0) === 0) {
      queue.push(n.id);
      dist.set(n.id, effectiveLatency.get(n.id) ?? 0);
    }
  }

  let processed = 0;
  while (queue.length > 0) {
    const id = queue.shift()!;
    processed++;
    const d = dist.get(id) ?? 0;
    for (const child of adj.get(id) ?? []) {
      const newD = d + (effectiveLatency.get(child) ?? 0);
      if (newD > (dist.get(child) ?? 0)) dist.set(child, newD);
      inDeg.set(child, (inDeg.get(child) ?? 0) - 1);
      if ((inDeg.get(child) ?? 0) === 0) queue.push(child);
    }
  }

  if (processed < nodes.length) {
    return { totalMs: 0, cyclic: true };
  }
  const max = Math.max(0, ...Array.from(dist.values()));
  return { totalMs: max, cyclic: false };
}

// ── Main ───────────────────────────────────────────────────────────────────

export function runSimulation(
  nodes: Node[],
  edges: Edge[],
  problem: Problem | null,
): SimulationResult {
  if (!problem || nodes.length === 0) {
    return {
      totalRps: 0, throughput: 0, totalLatencyMs: 0,
      bottlenecks: [], allNodes: [], warnings: [],
      summary: "Select a problem and add components to simulate.",
    };
  }

  const totalRps = problem.requirements.readsPerSec + problem.requirements.writesPerSec;
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  // ── Build adjacency ──────────────────────────────────────────────────────
  const outgoing = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  for (const n of nodes) { outgoing.set(n.id, []); inDegree.set(n.id, 0); }
  for (const e of edges) {
    if (!outgoing.has(e.source) || !inDegree.has(e.target)) continue;
    outgoing.get(e.source)!.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }

  // ── Entry nodes: in-degree 0 with at least one outgoing edge ────────────
  let entryNodes = nodes.filter(
    (n) => (inDegree.get(n.id) ?? 0) === 0 && (outgoing.get(n.id)?.length ?? 0) > 0,
  );
  // Fallback: no edges at all → every node is an entry
  if (entryNodes.length === 0) entryNodes = [...nodes];

  // ── BFS load propagation ─────────────────────────────────────────────────
  const incomingQPS = new Map<string, number>();
  const deliveredQPS = new Map<string, number>();

  // Seed: split total load equally among entry nodes
  const seedPerEntry = totalRps / entryNodes.length;
  for (const n of entryNodes) incomingQPS.set(n.id, seedPerEntry);

  // Topological BFS
  const visitQueue: string[] = entryNodes.map((n) => n.id);
  const visited = new Set<string>();

  while (visitQueue.length > 0) {
    const id = visitQueue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const n = nodeById.get(id)!;
    const data = n.data as NodeData;
    const incoming = incomingQPS.get(id) ?? 0;
    const instances = data.instances ?? 1;
    // effectiveQPS in same k/s units as rpsCapacity
    const effectiveQPS = data.rpsCapacity * instances;
    // Capped at 2 (200%) for display
    const util = effectiveQPS <= 0 ? (incoming > 0 ? 2 : 0) : Math.min(incoming / effectiveQPS, 2);
    const delivered = Math.min(incoming, effectiveQPS);

    deliveredQPS.set(id, delivered);

    const children = outgoing.get(id) ?? [];
    if (children.length > 0) {
      // Load balancers split; everything else fans out full
      const isLB = LOAD_BALANCING_IDS.has(data.componentId);
      const qpsToChild = isLB ? delivered / children.length : delivered;
      for (const child of children) {
        incomingQPS.set(child, (incomingQPS.get(child) ?? 0) + qpsToChild);
        visitQueue.push(child);
      }
    }
  }

  // ── Per-node metrics ─────────────────────────────────────────────────────
  const effectiveLatency = new Map<string, number>();
  const warnings: string[] = [];

  const allNodes: NodeResult[] = nodes.map((n) => {
    const data = n.data as NodeData;
    const incoming = incomingQPS.get(n.id) ?? 0;
    const instances = data.instances ?? 1;
    const capacity = data.rpsCapacity * instances;
    const rawUtil = capacity <= 0 ? (incoming > 0 ? 2 : 0) : incoming / capacity;
    const util = Math.min(rawUtil, 2);
    const delivered = deliveredQPS.get(n.id) ?? Math.min(incoming, capacity);

    const baseLatency = getBaseLatency(data.componentId);
    const effLatency = computeLatency(baseLatency, util);
    effectiveLatency.set(n.id, effLatency);

    const status: NodeResult["status"] =
      incoming === 0 && capacity > 0 ? "idle" :
      rawUtil >= UTILIZATION_CRITICAL ? "critical" :
      rawUtil >= UTILIZATION_WARNING  ? "warning"  : "healthy";

    const isBottleneck = rawUtil >= UTILIZATION_CRITICAL;

    if (isBottleneck) {
      warnings.push(`${data.label} is a bottleneck — handling ${incoming.toFixed(1)}k/${capacity}k RPS`);
    }

    const neededInstances = capacity > 0 ? Math.ceil(incoming / data.rpsCapacity) : instances + 1;
    const suggestion =
      status === "critical"
        ? `Scale to ≥${neededInstances} instances (receiving ${incoming.toFixed(1)}k, capacity ${capacity}k RPS)`
        : status === "warning"
        ? `Approaching capacity — consider ${neededInstances + 1} instances`
        : status === "idle"
        ? "No traffic reaching this component — check connections"
        : "Healthy";

    return { nodeId: n.id, label: data.label, incomingRps: incoming, deliveredRps: delivered, capacity, utilisation: util, latencyMs: Math.round(effLatency), status, isBottleneck, suggestion };
  });

  const bottleneckNodes = allNodes.filter((r) => r.isBottleneck);

  // ── Effective throughput ─────────────────────────────────────────────────
  const throughput =
    bottleneckNodes.length > 0
      ? Math.min(totalRps, ...bottleneckNodes.map((r) => r.deliveredRps))
      : totalRps;

  // ── Total latency (longest sync path) ───────────────────────────────────
  const { totalMs, cyclic } = computePathLatency(nodes, edges, nodeById, effectiveLatency);
  if (cyclic) warnings.push("Cycle detected in synchronous path — remove circular dependencies");

  const summary =
    bottleneckNodes.length === 0
      ? `✅ Architecture handles ${totalRps}k RPS — no bottlenecks detected. Latency: ${totalMs}ms`
      : `⚠️ ${bottleneckNodes.length} bottleneck${bottleneckNodes.length > 1 ? "s" : ""} detected at ${totalRps}k total RPS. Effective throughput: ${throughput.toFixed(1)}k RPS`;

  return { totalRps, throughput, totalLatencyMs: totalMs, bottlenecks: bottleneckNodes, allNodes, warnings, summary };
}
