import type { Node, Edge } from "@xyflow/react";
import type { NodeData } from "./store";

// ── Types ──────────────────────────────────────────────────────────────────
export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;   // always 20
  feedback: string[]; // things to improve
  passed: string[];   // checks that passed
}

export interface ScoreResult {
  total: number;        // 0-100
  categories: CategoryScore[];
  verdict: string;
  verdictColor: string;
  summary: string;
}

// ── Normalise component IDs (handles legacy IDs from earlier implementation) ─
function normaliseId(id: string): string {
  if (id === "pubsub")       return "pub-sub";
  if (id === "geospatial")   return "geospatial-index";
  if (id === "coordination") return "coordination-service";
  return id;
}

// ── Constants ──────────────────────────────────────────────────────────────
const LOAD_BALANCING  = new Set(["load-balancer", "api-gateway"]);
const DURABLE_STORES  = new Set(["sql-db", "nosql-db", "object-storage", "timeseries-db", "graph-db", "file-store"]);
const ASYNC_IDS       = new Set(["message-queue", "pub-sub", "monitoring", "notification-service"]);

// ── Graph helpers ──────────────────────────────────────────────────────────

function buildAdjacency(nodes: Node[], edges: Edge[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    if (e.source !== e.target && adj.has(e.source)) {
      adj.get(e.source)!.push(e.target);
    }
  }
  return adj;
}

/** BFS from entry nodes (in-degree 0 with outgoing edges) → reachable set. */
function buildReachableSet(nodes: Node[], edges: Edge[]): Set<string> {
  const adj = buildAdjacency(nodes, edges);
  const inDeg = new Map<string, number>();
  for (const n of nodes) inDeg.set(n.id, 0);
  for (const e of edges) {
    if (e.source !== e.target && inDeg.has(e.target)) {
      inDeg.set(e.target, (inDeg.get(e.target) ?? 0) + 1);
    }
  }

  const reachable = new Set<string>();

  // Special case: single node, no edges
  if (edges.length === 0 && nodes.length === 1) {
    reachable.add(nodes[0].id);
    return reachable;
  }

  const entries = nodes.filter(
    (n) => (inDeg.get(n.id) ?? 0) === 0 && (adj.get(n.id)?.length ?? 0) > 0,
  );
  const queue = entries.map((n) => n.id);
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    if (reachable.has(id)) continue;
    reachable.add(id);
    for (const child of adj.get(id) ?? []) queue.push(child);
  }
  return reachable;
}

/** Returns the set of normalised componentIds that are in the reachable set. */
function connectedComponentIds(nodes: Node[], reachable: Set<string>): Set<string> {
  const ids = new Set<string>();
  for (const n of nodes) {
    if (reachable.has(n.id)) ids.add(normaliseId((n.data as NodeData).componentId));
  }
  return ids;
}

function connectedNodes(nodes: Node[], reachable: Set<string>): Node[] {
  return nodes.filter((n) => reachable.has(n.id));
}

// ── Topological hop depth (sync edges only) ────────────────────────────────
function syncDepth(nodes: Node[], edges: Edge[]): { depth: number; cyclic: boolean } {
  const syncEdges = edges.filter((e) => {
    const srcData = nodes.find((n) => n.id === e.source)?.data as NodeData | undefined;
    return !ASYNC_IDS.has(normaliseId(srcData?.componentId ?? ""));
  });

  const adj = new Map<string, string[]>();
  const inDeg = new Map<string, number>();
  for (const n of nodes) { adj.set(n.id, []); inDeg.set(n.id, 0); }
  for (const e of syncEdges) {
    if (e.source === e.target) continue;
    adj.get(e.source)?.push(e.target);
    inDeg.set(e.target, (inDeg.get(e.target) ?? 0) + 1);
  }

  const depth = new Map<string, number>();
  const queue: string[] = [];
  for (const n of nodes) {
    if ((inDeg.get(n.id) ?? 0) === 0) { queue.push(n.id); depth.set(n.id, 0); }
  }

  let processed = 0;
  while (queue.length > 0) {
    const id = queue.shift()!;
    processed++;
    const d = depth.get(id) ?? 0;
    for (const child of adj.get(id) ?? []) {
      const nd = d + 1;
      if (nd > (depth.get(child) ?? 0)) depth.set(child, nd);
      inDeg.set(child, (inDeg.get(child) ?? 0) - 1);
      if ((inDeg.get(child) ?? 0) === 0) queue.push(child);
    }
  }

  if (processed < nodes.length) return { depth: nodes.length, cyclic: true };
  return { depth: Math.max(0, ...Array.from(depth.values())), cyclic: false };
}

// ── Cache-before-DB: cache wired to DB (direct, 2-hop, or cache-aside) ────
function hasCacheBeforeDB(nodes: Node[], edges: Edge[], connIds: Set<string>): boolean {
  if (!connIds.has("cache")) return false;
  const dbTarget = new Set(["sql-db", "nosql-db"]);
  if (![...dbTarget].some((d) => connIds.has(d))) return false;

  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) adj.get(e.source)?.push(e.target);

  const cacheNodes = nodes.filter((n) => normaliseId((n.data as NodeData).componentId) === "cache");
  const dbIds = new Set(nodes.filter((n) => dbTarget.has(normaliseId((n.data as NodeData).componentId))).map((n) => n.id));

  for (const cn of cacheNodes) {
    for (const c1 of adj.get(cn.id) ?? []) {
      if (dbIds.has(c1)) return true;
      for (const c2 of adj.get(c1) ?? []) if (dbIds.has(c2)) return true;
    }
    // Cache-aside: shared parent
    const cacheParents = new Set(edges.filter((e) => e.target === cn.id).map((e) => e.source));
    for (const dbId of dbIds) {
      const dbParents = new Set(edges.filter((e) => e.target === dbId).map((e) => e.source));
      for (const p of cacheParents) if (dbParents.has(p)) return true;
    }
  }
  return false;
}

// ── LB feeds compute (directly or via api-gateway / rate-limiter) ──────────
function hasLBtoCompute(nodes: Node[], edges: Edge[], adj: Map<string, string[]>): boolean {
  const lbNodes = nodes.filter((n) => LOAD_BALANCING.has(normaliseId((n.data as NodeData).componentId)));
  const computeIds = new Set(nodes.filter((n) => (n.data as NodeData).category === "Compute").map((n) => n.id));
  const bridgeIds = new Set(nodes.filter((n) => ["api-gateway","rate-limiter"].includes(normaliseId((n.data as NodeData).componentId))).map((n) => n.id));

  for (const lb of lbNodes) {
    for (const c of adj.get(lb.id) ?? []) {
      if (computeIds.has(c)) return true;
      if (bridgeIds.has(c)) for (const gc of adj.get(c) ?? []) if (computeIds.has(gc)) return true;
    }
  }
  return false;
}

// ── Redundancy: LB/CDN fans out to ≥2 children, or ≥2 instances of type ──
function hasRedundancy(connected: Node[], adj: Map<string, string[]>): boolean {
  const entryComps = connected.filter((n) => ["load-balancer","api-gateway","cdn"].includes(normaliseId((n.data as NodeData).componentId)));
  for (const e of entryComps) if ((adj.get(e.id) ?? []).length >= 2) return true;

  const byType = new Map<string, number>();
  for (const n of connected) {
    const id = normaliseId((n.data as NodeData).componentId);
    byType.set(id, (byType.get(id) ?? 0) + 1);
  }
  for (const [, count] of byType) if (count >= 2) return true;
  return false;
}

// ── Verdict scale (matches original) ──────────────────────────────────────
function getVerdict(total: number): { verdict: string; verdictColor: string } {
  if (total >= 86) return { verdict: "Architect Level", verdictColor: "text-emerald-400" };
  if (total >= 71) return { verdict: "Excellent",       verdictColor: "text-cyan-400" };
  if (total >= 51) return { verdict: "Good",            verdictColor: "text-blue-400" };
  if (total >= 31) return { verdict: "Decent",          verdictColor: "text-amber-400" };
  return                 { verdict: "Needs Work",       verdictColor: "text-rose-400" };
}

// ── Scoring rules (20 pts each) ────────────────────────────────────────────

function scoreScalability(
  nodes: Node[], edges: Edge[], connIds: Set<string>, connected: Node[], adj: Map<string, string[]>,
): CategoryScore {
  let score = 0;
  const feedback: string[] = [];
  const passed: string[] = [];

  if (connIds.has("load-balancer")) {
    score += 3; passed.push("Load balancer distributes traffic across instances");
  } else feedback.push("Add a Load Balancer to enable horizontal scaling");

  const hasScalableCompute = connected.some((n) => {
    const d = n.data as NodeData;
    return d.category === "Compute";
  });
  if (hasScalableCompute) {
    score += 3; passed.push("Scalable compute tier present");
  } else feedback.push("Add compute components (App Server, Auth Service, etc.)");

  if (connIds.has("cache")) {
    score += 3; passed.push("Cache reduces database load and improves scale");
  } else feedback.push("Add Cache / Redis to offload database at scale");

  if (connIds.has("message-queue") || connIds.has("pub-sub")) {
    score += 3; passed.push("Message queue enables async workload scaling");
  } else feedback.push("Add a Message Queue for async and fan-out scalability");

  const hasNoSQL = connIds.has("nosql-db");
  const hasSQLReplicas = connected.some((n) => {
    const d = n.data as NodeData;
    return d.componentId === "sql-db" && (d.instances ?? 1) > 1;
  });
  if (hasNoSQL || hasSQLReplicas) {
    score += 3; passed.push("Scalable database tier (NoSQL or replicated SQL)");
  } else feedback.push("Use NoSQL or add SQL replicas for database scalability");

  if (connIds.has("cdn")) {
    score += 3; passed.push("CDN offloads static content at global scale");
  } else feedback.push("Add a CDN for static asset delivery at scale");

  if (hasLBtoCompute(nodes, edges, adj)) {
    score += 2; passed.push("Load balancer correctly wired to compute tier");
  } else if (connIds.has("load-balancer")) {
    feedback.push("Wire the Load Balancer to your compute tier");
  }

  return { category: "Scalability", score: Math.min(score, 20), maxScore: 20, feedback, passed };
}

function scoreAvailability(
  nodes: Node[], edges: Edge[], connIds: Set<string>, connected: Node[], adj: Map<string, string[]>,
): CategoryScore {
  let score = 0;
  const feedback: string[] = [];
  const passed: string[] = [];

  // ≥70% of ALL nodes must be scalable (non-stateful or instances>1)
  const scalableCount = nodes.filter((n) => {
    const d = n.data as NodeData;
    return (d as any).scalable !== false || (d.instances ?? 1) > 1;
  }).length;
  if (scalableCount >= Math.ceil(nodes.length * 0.7)) {
    score += 3; passed.push("≥70% of components are horizontally scalable — no SPOF");
  } else feedback.push("Increase redundancy — over 30% of your components are single-instance stateful");

  const hasDBReplica = connected.some((n) => {
    const d = n.data as NodeData;
    return DURABLE_STORES.has(normaliseId(d.componentId)) && (d.instances ?? 1) > 1;
  });
  if (hasDBReplica) {
    score += 3; passed.push("Database replication enabled (instances > 1)");
  } else feedback.push("Enable DB replication — set instances > 1 on a storage component");

  if (nodes.length > 2 && hasRedundancy(connected, adj)) {
    score += 3; passed.push("Redundant paths or duplicate components detected");
  } else if (nodes.length > 2) {
    feedback.push("Add redundant paths or duplicate critical components for fault tolerance");
  }

  if (connIds.has("monitoring")) {
    score += 3; passed.push("Monitoring provides observability and alerting");
  } else feedback.push("Add Monitoring for observability and failure detection");

  if (connIds.has("rate-limiter") || connIds.has("api-gateway")) {
    score += 3; passed.push("Rate limiter / API gateway protects availability under load");
  } else feedback.push("Add a Rate Limiter or API Gateway to protect against overload");

  if (connIds.has("cache") && (connIds.has("sql-db") || connIds.has("nosql-db"))) {
    score += 3; passed.push("Cache + DB pair enables graceful degradation");
  } else feedback.push("Pair Cache with your database for graceful degradation under failure");

  if (connIds.has("message-queue") || connIds.has("pub-sub")) {
    score += 2; passed.push("Message queue decouples services for resilience");
  } else feedback.push("A Message Queue decouples services and improves fault isolation");

  return { category: "Availability", score: Math.min(score, 20), maxScore: 20, feedback, passed };
}

function scoreLatency(
  nodes: Node[], edges: Edge[], connIds: Set<string>, connected: Node[], adj: Map<string, string[]>,
): CategoryScore {
  let score = 0;
  const feedback: string[] = [];
  const passed: string[] = [];

  if (connIds.has("cdn")) {
    score += 3; passed.push("CDN serves edge-cached content with minimal latency");
  } else feedback.push("Add a CDN to serve static content from the edge");

  if (hasCacheBeforeDB(nodes, edges, connIds)) {
    score += 4; passed.push("Cache is correctly wired in front of the database");
  } else if (connIds.has("cache")) {
    score += 1;
    feedback.push("Cache is present but not wired in front of the database — connect cache → DB");
  } else {
    feedback.push("Add Cache in front of your database to eliminate read latency");
  }

  const { depth, cyclic } = syncDepth(nodes, edges);
  if (cyclic) {
    feedback.push("Cycle detected in synchronous path — remove circular service dependencies");
  } else if (depth <= 6) {
    score += 4; passed.push(`Sync path is ${depth} hop${depth !== 1 ? "s" : ""} — excellent depth`);
  } else if (depth <= 8) {
    score += 2; passed.push(`Sync path is ${depth} hops — acceptable`);
    feedback.push("Path depth is 7–8 hops — consider reducing the service chain length");
  } else {
    feedback.push(`Sync path is ${depth} hops — too deep, simplify the service chain`);
  }

  if (connIds.has("dns")) {
    score += 1; passed.push("DNS layer for domain resolution");
  }

  if (connIds.has("message-queue") || connIds.has("pub-sub")) {
    score += 4; passed.push("Message queue offloads async work off the critical latency path");
  } else feedback.push("Add a Message Queue to move slow async tasks off the hot path");

  if (connIds.has("load-balancer")) {
    score += 2; passed.push("Load balancer reduces per-node saturation latency");
  } else feedback.push("A Load Balancer distributes load, keeping individual node latency low");

  if (connIds.has("cache") || connIds.has("nosql-db")) {
    score += 2; passed.push("Low-latency data store in design");
  } else feedback.push("Include Cache or NoSQL for sub-millisecond data access");

  return { category: "Latency", score: Math.min(score, 20), maxScore: 20, feedback, passed };
}

function scoreCostEfficiency(
  nodes: Node[], edges: Edge[], connIds: Set<string>, connected: Node[],
): CategoryScore {
  let score = 0;
  const feedback: string[] = [];
  const passed: string[] = [];

  const count = nodes.length;
  if (count >= 3 && count <= 25) {
    score += 3; passed.push(`${count} components — well-sized design`);
  } else if (count < 3) {
    score += 1; feedback.push("Design is under-provisioned — add more components");
  } else if (count <= 35) {
    score += 1; feedback.push("Design is getting complex (26–35 components) — consider simplifying");
  } else {
    feedback.push("Over-engineered — more than 35 components; consolidate where possible");
  }

  const storageCount = nodes.filter((n) => (n.data as NodeData).category === "Storage").length;
  if (storageCount >= 1 && storageCount <= 5) {
    score += 3; passed.push(`${storageCount} storage tier${storageCount > 1 ? "s" : ""} — cost efficient`);
  } else if (storageCount === 0) {
    feedback.push("No persistent storage — add a database");
  } else {
    feedback.push("Too many storage tiers (>5) — consolidate to reduce operational cost");
  }

  if (connIds.has("cache") && (connIds.has("sql-db") || connIds.has("nosql-db"))) {
    score += 3; passed.push("Cache reduces expensive database read costs");
  } else feedback.push("Cache + DB pair reduces costly DB reads");

  const edgeSrcs = new Set(edges.map((e) => e.source));
  const edgeTgts = new Set(edges.map((e) => e.target));
  const disconnected = nodes.filter((n) => !edgeSrcs.has(n.id) && !edgeTgts.has(n.id)).length;
  if (disconnected === 0) {
    score += 3; passed.push("All components are connected — no wasted resources");
  } else {
    feedback.push(`${disconnected} orphaned component${disconnected > 1 ? "s" : ""} — wire everything or remove unused`);
  }

  if (connIds.has("cdn")) {
    score += 3; passed.push("CDN offloads origin bandwidth — reduces cost at scale");
  } else feedback.push("A CDN reduces bandwidth cost by serving assets from the edge");

  if (connIds.has("message-queue") || connIds.has("pub-sub")) {
    score += 3; passed.push("Message queue smooths traffic spikes — avoids over-provisioning");
  } else feedback.push("A Message Queue prevents over-provisioning by absorbing traffic bursts");

  const hasDuplicateNetworking =
    connIds.has("api-gateway") && connIds.has("rate-limiter") && connIds.has("service-mesh");
  if (!hasDuplicateNetworking) {
    score += 2; passed.push("No redundant networking layers");
  } else feedback.push("API Gateway + Rate Limiter + Service Mesh overlap — consolidate to reduce cost");

  return { category: "Cost Efficiency", score: Math.min(score, 20), maxScore: 20, feedback, passed };
}

function scoreTradeoffs(
  nodes: Node[], edges: Edge[], connIds: Set<string>, connected: Node[],
): CategoryScore {
  let score = 0;
  const feedback: string[] = [];
  const passed: string[] = [];

  if (connIds.has("cache") && (connIds.has("sql-db") || connIds.has("nosql-db"))) {
    score += 3; passed.push("Read/write separation via cache layer");
  } else feedback.push("Cache + DB combination demonstrates read/write separation trade-off awareness");

  const storageVariants = ["sql-db","nosql-db","timeseries-db","graph-db","search","object-storage"];
  const presentStorage = storageVariants.filter((t) => connIds.has(t));
  if (presentStorage.length >= 2) {
    score += 3; passed.push(`Polyglot persistence — ${presentStorage.length} storage types`);
  } else if (presentStorage.length === 1) {
    score += 1; feedback.push("Consider adding a second storage type for polyglot persistence");
  } else {
    feedback.push("No durable storage — add a database");
  }

  if (connIds.has("message-queue") || connIds.has("pub-sub")) {
    score += 3; passed.push("Async messaging decouples producers from consumers");
  } else feedback.push("Add a Message Queue to demonstrate sync vs async trade-off awareness");

  if (connIds.has("rate-limiter") || connIds.has("api-gateway")) {
    score += 3; passed.push("API gateway / rate limiter shows defense-in-depth thinking");
  } else feedback.push("Add Rate Limiter or API Gateway for defense in depth");

  const categories = new Set(connected.map((n) => (n.data as NodeData).category));
  if (categories.size >= 4) {
    score += 3; passed.push(`Architecture spans ${categories.size} categories — broad design`);
  } else if (categories.size === 3) {
    score += 1; feedback.push("Add components from more categories to reach ≥4 architectural domains");
  } else {
    feedback.push("Architecture is too narrow — cover more domains (networking, compute, storage, messaging)");
  }

  const hasAuth = connIds.has("auth-service") || (connIds.has("api-gateway") && connIds.has("rate-limiter"));
  if (hasAuth) {
    score += 3; passed.push("Authentication / authorization layer present");
  } else feedback.push("Add Auth Service (or API Gateway + Rate Limiter) for a security layer");

  if (connIds.has("monitoring")) {
    score += 2; passed.push("Monitoring shows observability awareness");
  } else feedback.push("Add Monitoring — observability is a key production trade-off");

  return { category: "Trade-offs", score: Math.min(score, 20), maxScore: 20, feedback, passed };
}

// ── Main entry point ───────────────────────────────────────────────────────

export function scoreArchitecture(nodes: Node[], edges: Edge[]): ScoreResult {
  if (nodes.length === 0) {
    return {
      total: 0, categories: [],
      verdict: "Needs Work", verdictColor: "text-rose-400",
      summary: "Add components to your design to receive a score.",
    };
  }

  const reachable  = buildReachableSet(nodes, edges);
  const adj        = buildAdjacency(nodes, edges);
  const connIds    = connectedComponentIds(nodes, reachable);
  const connected  = connectedNodes(nodes, reachable);

  const categories = [
    scoreScalability(nodes, edges, connIds, connected, adj),
    scoreAvailability(nodes, edges, connIds, connected, adj),
    scoreLatency(nodes, edges, connIds, connected, adj),
    scoreCostEfficiency(nodes, edges, connIds, connected),
    scoreTradeoffs(nodes, edges, connIds, connected),
  ];

  const rawTotal = categories.reduce((s, c) => s + c.score, 0);
  const total    = Math.max(0, Math.min(rawTotal, 100));
  const { verdict, verdictColor } = getVerdict(total);

  const allFeedback = categories.flatMap((c) => c.feedback);
  const summary =
    total >= 86 ? "Outstanding system design — production-ready architecture!"
    : allFeedback.length > 0 ? allFeedback[0]
    : "Keep refining your design.";

  return { total, categories, verdict, verdictColor, summary };
}
