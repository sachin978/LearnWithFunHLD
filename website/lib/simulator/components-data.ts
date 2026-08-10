export type ComponentCategory = "Client" | "Networking" | "Compute" | "Storage" | "Messaging" | "Infrastructure";

export interface ComponentDef {
  id: string;
  name: string;
  category: ComponentCategory;
  rpsCapacity: number;  // thousands per second (k/s)
  latencyMs: number;    // base latency in milliseconds
  scalable: boolean;
  stateful: boolean;
  description: string;
  icon: string;
  color: string;
}

// `icon` holds a semantic key resolved through lib/simulator/icon-registry.tsx
// — either a generic architecture icon (e.g. "database") or, when a component
// IS a specific technology (e.g. Redis), that vendor's real logo.
export const COMPONENTS: ComponentDef[] = [
  // Client — the traffic source. Capacity is set very high so it's never
  // the bottleneck; it only exists to show where requests originate from.
  { id: "client",          name: "Client",            category: "Client",          rpsCapacity: 100000, latencyMs: 0,  scalable: true,  stateful: false, icon: "monitor-smartphone", color: "sky",   description: "End-user browsers/devices originating requests" },
  // Networking
  { id: "dns",             name: "DNS",               category: "Networking",      rpsCapacity: 100,  latencyMs: 10,   scalable: true,  stateful: false, icon: "globe",            color: "indigo",  description: "Resolves domain names to IP addresses" },
  { id: "cdn",             name: "CDN",               category: "Networking",      rpsCapacity: 500,  latencyMs: 15,   scalable: true,  stateful: false, icon: "route",            color: "indigo",  description: "Serves static assets from edge locations globally" },
  { id: "load-balancer",   name: "Load Balancer",     category: "Networking",      rpsCapacity: 1000, latencyMs: 1,    scalable: true,  stateful: false, icon: "waypoints",        color: "indigo",  description: "Distributes traffic across server instances" },
  { id: "api-gateway",     name: "API Gateway",       category: "Networking",      rpsCapacity: 50,   latencyMs: 10,   scalable: true,  stateful: false, icon: "door-open",        color: "indigo",  description: "Single entry point with routing, auth, and rate limiting" },
  { id: "rate-limiter",    name: "Rate Limiter",      category: "Networking",      rpsCapacity: 80,   latencyMs: 1,    scalable: true,  stateful: true,  icon: "gauge",            color: "indigo",  description: "Controls request rate to prevent abuse" },
  { id: "reverse-proxy",   name: "Reverse Proxy",     category: "Networking",      rpsCapacity: 100,  latencyMs: 1,    scalable: true,  stateful: false, icon: "arrow-right-left", color: "indigo",  description: "Forwards client requests to backend servers" },
  { id: "origin-shield",   name: "Origin Shield",     category: "Networking",      rpsCapacity: 200,  latencyMs: 5,    scalable: true,  stateful: false, icon: "shield",           color: "indigo",  description: "Extra caching layer between CDN and origin" },
  // Compute
  { id: "app-server",      name: "App Server",        category: "Compute",         rpsCapacity: 5,    latencyMs: 20,   scalable: true,  stateful: false, icon: "server",           color: "violet",  description: "Handles business logic" },
  { id: "auth-service",    name: "Auth Service",      category: "Compute",         rpsCapacity: 10,   latencyMs: 15,   scalable: true,  stateful: false, icon: "key-round",        color: "violet",  description: "Authentication and authorization" },
  { id: "websocket-server",name: "WebSocket Server",  category: "Compute",         rpsCapacity: 50,   latencyMs: 2,    scalable: true,  stateful: true,  icon: "plug",             color: "violet",  description: "Persistent bidirectional connections" },
  { id: "task-scheduler",  name: "Task Scheduler",    category: "Compute",         rpsCapacity: 10,   latencyMs: 50,   scalable: true,  stateful: false, icon: "clock",            color: "violet",  description: "Schedules and runs background jobs" },
  { id: "stream-processor",name: "Stream Processor",  category: "Compute",         rpsCapacity: 200,  latencyMs: 10,   scalable: true,  stateful: true,  icon: "waves",            color: "violet",  description: "Real-time stream processing (Kafka Streams, Flink)" },
  { id: "notification-service", name: "Notification Service", category: "Compute", rpsCapacity: 50,   latencyMs: 100,  scalable: true,  stateful: false, icon: "bell",             color: "violet",  description: "Push notifications, email, SMS delivery" },
  { id: "custom",          name: "Custom Component",  category: "Compute",         rpsCapacity: 50,   latencyMs: 10,   scalable: true,  stateful: false, icon: "wrench",           color: "violet",  description: "User-defined custom component" },
  // Storage
  { id: "sql-db",          name: "SQL Database",      category: "Storage",         rpsCapacity: 10,   latencyMs: 8,    scalable: false, stateful: true,  icon: "database",         color: "emerald", description: "Relational DB with ACID guarantees (PostgreSQL, MySQL)" },
  { id: "nosql-db",        name: "NoSQL Database",    category: "Storage",         rpsCapacity: 50,   latencyMs: 3,    scalable: true,  stateful: true,  icon: "boxes",            color: "emerald", description: "Non-relational flexible schema (MongoDB, DynamoDB)" },
  { id: "cache",           name: "Cache / Redis",     category: "Storage",         rpsCapacity: 100,  latencyMs: 1,    scalable: true,  stateful: true,  icon: "redis",            color: "emerald", description: "In-memory data store for ultra-low latency reads" },
  { id: "object-storage",  name: "Object Storage",    category: "Storage",         rpsCapacity: 25,   latencyMs: 75,   scalable: true,  stateful: true,  icon: "hard-drive",       color: "emerald", description: "Blob storage for files and media (S3, GCS)" },
  { id: "search",          name: "Search / ES",       category: "Storage",         rpsCapacity: 20,   latencyMs: 10,   scalable: true,  stateful: true,  icon: "search",           color: "emerald", description: "Full-text search engine (Elasticsearch)" },
  { id: "graph-db",        name: "Graph Database",    category: "Storage",         rpsCapacity: 8,    latencyMs: 15,   scalable: true,  stateful: true,  icon: "share-2",          color: "emerald", description: "Graph relationship storage (Neo4j)" },
  { id: "timeseries-db",   name: "Time-Series DB",    category: "Storage",         rpsCapacity: 100,  latencyMs: 3,    scalable: true,  stateful: true,  icon: "trending-up",      color: "emerald", description: "Optimised for timestamped data (InfluxDB)" },
  { id: "data-warehouse",  name: "Data Warehouse",    category: "Storage",         rpsCapacity: 0.05, latencyMs: 5000, scalable: true,  stateful: true,  icon: "warehouse",        color: "emerald", description: "OLAP analytics database (Redshift, BigQuery)" },
  { id: "file-store",      name: "File Store",        category: "Storage",         rpsCapacity: 10,   latencyMs: 10,   scalable: true,  stateful: true,  icon: "folder",           color: "emerald", description: "Network file system (NFS, EFS)" },
  { id: "vector-db",       name: "Vector Database",   category: "Storage",         rpsCapacity: 10,   latencyMs: 10,   scalable: true,  stateful: true,  icon: "brain-circuit",    color: "emerald", description: "Vector embeddings for ML (Pinecone, Weaviate)" },
  { id: "geospatial-index",name: "Geospatial Index",  category: "Storage",         rpsCapacity: 50,   latencyMs: 5,    scalable: true,  stateful: true,  icon: "map-pin",          color: "emerald", description: "Location-based spatial queries" },
  // Messaging
  { id: "message-queue",   name: "Message Queue",     category: "Messaging",       rpsCapacity: 100,  latencyMs: 5,    scalable: true,  stateful: true,  icon: "inbox",            color: "amber",   description: "Async message queue (RabbitMQ, SQS)" },
  { id: "pub-sub",         name: "Pub/Sub",           category: "Messaging",       rpsCapacity: 200,  latencyMs: 5,    scalable: true,  stateful: true,  icon: "rss",              color: "amber",   description: "Publish-subscribe messaging (Kafka, Google Pub/Sub)" },
  // Infrastructure
  { id: "service-mesh",    name: "Service Mesh",      category: "Infrastructure",  rpsCapacity: 80,   latencyMs: 2,    scalable: true,  stateful: false, icon: "network",          color: "cyan",    description: "Service-to-service communication (Istio, Linkerd)" },
  { id: "monitoring",      name: "Monitoring",        category: "Infrastructure",  rpsCapacity: 500,  latencyMs: 5,    scalable: true,  stateful: true,  icon: "activity",         color: "cyan",    description: "Metrics, alerting, observability (Prometheus, Datadog)" },
  { id: "service-discovery",name:"Service Discovery", category: "Infrastructure",  rpsCapacity: 50,   latencyMs: 1,    scalable: true,  stateful: true,  icon: "radar",            color: "cyan",    description: "Auto-detects services in the network (Consul)" },
  { id: "distributed-lock",name: "Distributed Lock",  category: "Infrastructure",  rpsCapacity: 10,   latencyMs: 5,    scalable: false, stateful: true,  icon: "lock",             color: "cyan",    description: "Distributed mutual exclusion (Zookeeper, Redis)" },
  { id: "circuit-breaker", name: "Circuit Breaker",   category: "Infrastructure",  rpsCapacity: 100,  latencyMs: 1,    scalable: true,  stateful: true,  icon: "zap-off",          color: "cyan",    description: "Stops cascading failures to downstream services" },
  { id: "coordination-service", name: "Coordination Service", category: "Infrastructure", rpsCapacity: 20, latencyMs: 5, scalable: true, stateful: true, icon: "git-merge",       color: "cyan",   description: "Distributed coordination (Zookeeper, etcd)" },
  { id: "id-generator",    name: "ID Generator",      category: "Infrastructure",  rpsCapacity: 500,  latencyMs: 1,    scalable: true,  stateful: true,  icon: "hash",             color: "cyan",    description: "Distributed unique ID generation (Snowflake)" },
  { id: "sharded-counter", name: "Sharded Counter",   category: "Infrastructure",  rpsCapacity: 500,  latencyMs: 2,    scalable: true,  stateful: true,  icon: "sigma",            color: "cyan",    description: "High-throughput distributed counter" },
  { id: "config-service",  name: "Config Service",    category: "Infrastructure",  rpsCapacity: 50,   latencyMs: 2,    scalable: true,  stateful: true,  icon: "settings-2",       color: "cyan",    description: "Centralised config management (Consul, AppConfig)" },
];

export const CATEGORIES: ComponentCategory[] = ["Client", "Networking", "Compute", "Storage", "Messaging", "Infrastructure"];

export const CATEGORY_COLORS: Record<ComponentCategory, { border: string; bg: string; text: string; badge: string }> = {
  Networking:     { border: "border-indigo-500/60", bg: "bg-indigo-500/10",  text: "text-indigo-300",  badge: "bg-indigo-500/20 text-indigo-300" },
  Compute:        { border: "border-violet-500/60", bg: "bg-violet-500/10",  text: "text-violet-300",  badge: "bg-violet-500/20 text-violet-300" },
  Storage:        { border: "border-emerald-500/60",bg: "bg-emerald-500/10", text: "text-emerald-300", badge: "bg-emerald-500/20 text-emerald-300" },
  Messaging:      { border: "border-amber-500/60",  bg: "bg-amber-500/10",   text: "text-amber-300",   badge: "bg-amber-500/20 text-amber-300" },
  Infrastructure: { border: "border-cyan-500/60",   bg: "bg-cyan-500/10",    text: "text-cyan-300",    badge: "bg-cyan-500/20 text-cyan-300" },
  Client:         { border: "border-sky-500/60",    bg: "bg-sky-500/10",     text: "text-sky-300",     badge: "bg-sky-500/20 text-sky-300" },
};
