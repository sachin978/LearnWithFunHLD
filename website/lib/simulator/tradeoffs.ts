export interface Tradeoff {
  icon: string;
  title: string;
  check: (ids: Set<string>) => boolean;
  pro: string;
  con: string;
  category: string;
}

export const TRADEOFFS: Tradeoff[] = [
  // ── Caching ──
  {
    icon: "⚡", category: "Caching", title: "Cache-Aside Pattern",
    check: (ids) => ids.has("cache"),
    pro: "Dramatically reduces database read load and p99 latency for hot data.",
    con: "Cache invalidation complexity; risk of serving stale data on writes.",
  },
  {
    icon: "📝", category: "Caching", title: "Write-Through Cache",
    check: (ids) => ids.has("cache") && (ids.has("sql-db") || ids.has("nosql-db")),
    pro: "Cache always consistent with DB; no stale reads after writes.",
    con: "Higher write latency; every write hits both cache and DB.",
  },
  // ── Storage ──
  {
    icon: "📦", category: "Storage", title: "NoSQL-only Storage",
    check: (ids) => ids.has("nosql-db") && !ids.has("sql-db"),
    pro: "Horizontal scalability and flexible schema for unstructured or semi-structured data.",
    con: "No ACID transactions across documents; harder to enforce referential integrity.",
  },
  {
    icon: "🗃️", category: "Storage", title: "Relational-only Storage",
    check: (ids) => ids.has("sql-db") && !ids.has("nosql-db"),
    pro: "Strong ACID guarantees; powerful JOINs and ad-hoc query flexibility.",
    con: "Harder to scale horizontally; schema migrations are expensive at scale.",
  },
  {
    icon: "🔀", category: "Storage", title: "Polyglot Persistence",
    check: (ids) => ids.has("sql-db") && ids.has("nosql-db"),
    pro: "Use each database for what it does best; optimised reads and writes per workload.",
    con: "Operational overhead; data sync between stores; more complex consistency model.",
  },
  {
    icon: "🔍", category: "Storage", title: "Dedicated Search Index",
    check: (ids) => ids.has("search"),
    pro: "Full-text search with ranking and faceting beyond what SQL LIKE can offer.",
    con: "Dual-write complexity; index lag means eventually consistent search results.",
  },
  {
    icon: "🕸️", category: "Storage", title: "Graph Database",
    check: (ids) => ids.has("graph-db"),
    pro: "Efficient traversal of deep relationships (social graphs, recommendations).",
    con: "Niche query model; limited horizontal scalability; harder to migrate from relational.",
  },
  {
    icon: "📈", category: "Storage", title: "Time-Series Database",
    check: (ids) => ids.has("timeseries-db"),
    pro: "Optimised storage and query for append-heavy timestamped data; automatic downsampling.",
    con: "Purpose-built — poor for non-time-series queries; another system to maintain.",
  },
  {
    icon: "🗄️", category: "Storage", title: "Object Storage",
    check: (ids) => ids.has("object-storage"),
    pro: "Virtually unlimited, cheap blob storage (S3-compatible); built-in durability.",
    con: "High latency (75ms+); not suitable for transactional or low-latency workloads.",
  },
  // ── Messaging ──
  {
    icon: "📬", category: "Messaging", title: "Async Message Queue",
    check: (ids) => ids.has("message-queue"),
    pro: "Decouples producers from consumers; absorbs traffic spikes; enables retry logic.",
    con: "Added latency; eventual consistency; harder to trace failures end-to-end.",
  },
  {
    icon: "📡", category: "Messaging", title: "Pub/Sub Fanout",
    check: (ids) => ids.has("pub-sub"),
    pro: "One-to-many event delivery; consumers are independent and easily added.",
    con: "At-least-once delivery means consumers must be idempotent; ordering not guaranteed.",
  },
  // ── Networking ──
  {
    icon: "🌍", category: "Networking", title: "CDN for Static Assets",
    check: (ids) => ids.has("cdn"),
    pro: "Drastically lowers latency for static content; offloads 80-95% of origin traffic.",
    con: "Cache invalidation lag (TTL); egress cost at very high volume; less control at edge.",
  },
  {
    icon: "⚖️", category: "Networking", title: "Horizontal Load Balancing",
    check: (ids) => ids.has("load-balancer"),
    pro: "Enables horizontal scaling and fault tolerance across compute replicas.",
    con: "Session affinity challenges; the LB itself can be a SPOF if not redundant.",
  },
  {
    icon: "🚪", category: "Networking", title: "API Gateway",
    check: (ids) => ids.has("api-gateway"),
    pro: "Centralized auth, routing, rate limiting, and protocol translation at one entry point.",
    con: "Additional hop adds latency; can become a bottleneck if underpowered; operational cost.",
  },
  {
    icon: "🚦", category: "Networking", title: "Rate Limiting",
    check: (ids) => ids.has("rate-limiter"),
    pro: "Protects downstream services; prevents abuse and DDoS; fair usage enforcement.",
    con: "May reject legitimate traffic under flash crowds; distributed state sync is hard.",
  },
  // ── Compute ──
  {
    icon: "🔌", category: "Compute", title: "WebSocket / Real-time",
    check: (ids) => ids.has("websocket-server"),
    pro: "Low-latency bidirectional communication; eliminates polling overhead.",
    con: "Stateful long-lived connections; harder to scale horizontally; not HTTP/2 compatible.",
  },
  {
    icon: "🌊", category: "Compute", title: "Stream Processing",
    check: (ids) => ids.has("stream-processor"),
    pro: "Real-time transformations and aggregations on unbounded event streams.",
    con: "Exactly-once semantics are hard; high operational complexity (Flink, Kafka Streams).",
  },
  // ── Infrastructure ──
  {
    icon: "📊", category: "Infrastructure", title: "Observability / Monitoring",
    check: (ids) => ids.has("monitoring"),
    pro: "Detect failures early; SLA tracking; informs capacity planning decisions.",
    con: "High-cardinality metrics are expensive; alert fatigue if thresholds are misconfigured.",
  },
  {
    icon: "🔐", category: "Infrastructure", title: "Dedicated Auth Service",
    check: (ids) => ids.has("auth-service"),
    pro: "Centralised identity management; single policy enforcement point; auditable.",
    con: "Auth becomes a critical dependency; extra network hop on every authenticated request.",
  },
  {
    icon: "⚡", category: "Infrastructure", title: "Circuit Breaker",
    check: (ids) => ids.has("circuit-breaker"),
    pro: "Stops cascading failures by fast-failing to unavailable downstream services.",
    con: "False-positives can break healthy traffic; half-open state requires careful tuning.",
  },
  {
    icon: "🏭", category: "Storage", title: "Data Warehouse (OLAP)",
    check: (ids) => ids.has("data-warehouse"),
    pro: "Massively parallel analytics over billions of rows; decoupled from OLTP workload.",
    con: "Very high query latency (seconds to minutes); high cost; not for real-time reads.",
  },
];
