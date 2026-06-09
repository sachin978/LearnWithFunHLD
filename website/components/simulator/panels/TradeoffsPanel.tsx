"use client";
import { useSimulatorStore } from "@/lib/simulator/store";
import type { NodeData } from "@/lib/simulator/store";

const TRADEOFFS: { check: (ids: Set<string>) => boolean; title: string; pro: string; con: string; icon: string }[] = [
  {
    check: (ids) => ids.has("cache"),
    icon: "⚡",
    title: "Caching Layer",
    pro: "Dramatically reduces database load and latency for hot reads.",
    con: "Cache invalidation complexity; risk of serving stale data.",
  },
  {
    check: (ids) => ids.has("nosql-db") && !ids.has("sql-db"),
    icon: "📦",
    title: "NoSQL-only Storage",
    pro: "Horizontal scalability and flexible schema for unstructured data.",
    con: "No ACID transactions; harder to enforce data integrity constraints.",
  },
  {
    check: (ids) => ids.has("sql-db") && !ids.has("nosql-db"),
    icon: "🗃️",
    title: "Relational-only Storage",
    pro: "Strong ACID guarantees; powerful joins and query flexibility.",
    con: "Harder to scale horizontally; schema migrations are expensive.",
  },
  {
    check: (ids) => ids.has("message-queue") || ids.has("pubsub"),
    icon: "📬",
    title: "Async Messaging",
    pro: "Decouples services; absorbs traffic spikes; enables fan-out.",
    con: "Added latency; eventual consistency; harder to debug failures.",
  },
  {
    check: (ids) => ids.has("cdn"),
    icon: "🌍",
    title: "CDN",
    pro: "Drastically lowers latency for static assets; offloads origin traffic.",
    con: "Cache invalidation lag; cost at high egress; less control over edge.",
  },
  {
    check: (ids) => ids.has("load-balancer"),
    icon: "⚖️",
    title: "Load Balancing",
    pro: "Enables horizontal scaling and fault tolerance.",
    con: "Single point of failure if not redundant; session affinity challenges.",
  },
  {
    check: (ids) => ids.has("websocket-server"),
    icon: "🔌",
    title: "WebSocket / Real-time",
    pro: "Low-latency bidirectional communication; no polling overhead.",
    con: "Stateful connections; harder to scale; not HTTP/2 compatible.",
  },
  {
    check: (ids) => ids.has("stream-processor"),
    icon: "🌊",
    title: "Stream Processing",
    pro: "Real-time insights and transformations on event data.",
    con: "Operational complexity; exactly-once semantics are hard.",
  },
];

export default function TradeoffsPanel() {
  const { nodes } = useSimulatorStore();
  const presentIds = new Set(nodes.map((n) => (n.data as NodeData).componentId));
  const applicable = TRADEOFFS.filter((t) => t.check(presentIds));

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-3">
      <div>
        <div className="text-sm font-semibold text-white mb-1">Trade-off Analysis</div>
        <p className="text-zinc-500 text-xs">Auto-detected trade-offs based on components in your design.</p>
      </div>

      {nodes.length === 0 && (
        <p className="text-zinc-500 text-xs text-center py-4">Add components to see trade-off analysis.</p>
      )}

      {applicable.length === 0 && nodes.length > 0 && (
        <p className="text-zinc-500 text-xs text-center py-4">No notable trade-offs detected yet.</p>
      )}

      {applicable.map((t) => (
        <div key={t.title} className="p-3 rounded-lg border border-zinc-700 bg-zinc-900 space-y-2">
          <div className="flex items-center gap-2">
            <span>{t.icon}</span>
            <span className="text-white text-xs font-semibold">{t.title}</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex gap-2 text-[11px]">
              <span className="text-emerald-400 flex-shrink-0">✓</span>
              <span className="text-zinc-300">{t.pro}</span>
            </div>
            <div className="flex gap-2 text-[11px]">
              <span className="text-rose-400 flex-shrink-0">✗</span>
              <span className="text-zinc-400">{t.con}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
