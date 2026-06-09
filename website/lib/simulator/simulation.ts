import type { Node, Edge } from "@xyflow/react";
import type { NodeData } from "./store";
import type { Problem } from "./problems-data";

export interface NodeResult {
  nodeId: string;
  label: string;
  incomingRps: number;
  capacity: number;       // effective capacity = rpsCapacity * instances
  utilisation: number;    // 0-1
  status: "ok" | "warning" | "critical";
  suggestion: string;
}

export interface SimulationResult {
  totalRps: number;
  bottlenecks: NodeResult[];
  allNodes: NodeResult[];
  summary: string;
}

export function runSimulation(
  nodes: Node[],
  edges: Edge[],
  problem: Problem | null,
): SimulationResult {
  if (!problem || nodes.length === 0) {
    return { totalRps: 0, bottlenecks: [], allNodes: [], summary: "Select a problem and add components to simulate." };
  }

  const totalRps = problem.requirements.readsPerSec + problem.requirements.writesPerSec;

  // Build adjacency for load propagation
  const outgoing: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  nodes.forEach((n) => { outgoing[n.id] = []; inDegree[n.id] = 0; });
  edges.forEach((e) => {
    outgoing[e.source]?.push(e.target);
    inDegree[e.target] = (inDegree[e.target] ?? 0) + 1;
  });

  // Entry nodes = no incoming edges
  const entryNodes = nodes.filter((n) => (inDegree[n.id] ?? 0) === 0);

  // BFS-based load propagation
  const nodeLoad: Record<string, number> = {};
  const queue: string[] = [];

  // Seed entry nodes with full load split evenly
  const seed = entryNodes.length > 0 ? totalRps / entryNodes.length : totalRps;
  entryNodes.forEach((n) => { nodeLoad[n.id] = seed; queue.push(n.id); });

  const visited = new Set<string>();
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const load = nodeLoad[id] ?? 0;
    const children = outgoing[id] ?? [];
    if (children.length > 0) {
      const share = load / children.length;
      children.forEach((c) => {
        nodeLoad[c] = (nodeLoad[c] ?? 0) + share;
        queue.push(c);
      });
    }
  }

  const allNodes: NodeResult[] = nodes.map((n) => {
    const data = n.data as NodeData;
    const incomingRps = nodeLoad[n.id] ?? totalRps; // fallback: assume full load
    const instances = data.instances ?? 1;
    const capacity = data.rpsCapacity * instances;
    const utilisation = capacity > 0 ? incomingRps / capacity : Infinity;
    const status = utilisation > 1 ? "critical" : utilisation > 0.75 ? "warning" : "ok";
    const neededInstances = capacity > 0 ? Math.ceil(incomingRps / data.rpsCapacity) : 1;
    const suggestion =
      status === "critical"
        ? `Scale to ≥${neededInstances} instances (need ${incomingRps.toFixed(1)}k RPS, have ${capacity}k)`
        : status === "warning"
        ? `Near capacity — consider ${neededInstances + 1} instances`
        : "Healthy";
    return { nodeId: n.id, label: data.label, incomingRps, capacity, utilisation, status, suggestion };
  });

  const bottlenecks = allNodes.filter((r) => r.status !== "ok");

  const summary =
    bottlenecks.length === 0
      ? `✅ Architecture handles ${totalRps}k RPS — no bottlenecks detected.`
      : `⚠️ ${bottlenecks.length} bottleneck${bottlenecks.length > 1 ? "s" : ""} detected at ${totalRps}k total RPS.`;

  return { totalRps, bottlenecks, allNodes, summary };
}
