export type ComponentCategory =
  | "Client"
  | "Networking"
  | "Compute"
  | "Storage"
  | "Messaging"
  | "Infrastructure"
  | "Observability"
  | "Network"
  | "AI & Agents"
  | "External";

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
// Within each category, entries are ordered roughly by real-world industry
// prevalence (most commonly used/seen in production architectures first),
// so the sidebar surfaces the components you're most likely to reach for
// before the more specialized/niche ones.
export const COMPONENTS: ComponentDef[] = [
  // Client — the traffic source. Capacity is set very high so it's never
  // the bottleneck; it only exists to show where requests originate from.
  { id: "client",          name: "Client",            category: "Client",          rpsCapacity: 100000, latencyMs: 0,  scalable: true,  stateful: false, icon: "monitor-smartphone", color: "sky",   description: "End-user browsers/devices originating requests" },
  { id: "web-browser",     name: "Web Browser",       category: "Client",          rpsCapacity: 100000, latencyMs: 0,  scalable: true,  stateful: false, icon: "app-window",         color: "sky",   description: "Browser-based client originating requests" },
  { id: "mobile",          name: "Mobile",            category: "Client",          rpsCapacity: 100000, latencyMs: 0,  scalable: true,  stateful: false, icon: "smartphone",         color: "sky",   description: "Native iOS/Android app originating requests" },
  // Networking (Traffic & Edge)
  { id: "load-balancer",   name: "Load Balancer",     category: "Networking",      rpsCapacity: 1000, latencyMs: 1,    scalable: true,  stateful: false, icon: "waypoints",        color: "indigo",  description: "Distributes traffic across server instances" },
  { id: "cdn",             name: "CDN",               category: "Networking",      rpsCapacity: 500,  latencyMs: 15,   scalable: true,  stateful: false, icon: "route",            color: "indigo",  description: "Serves static assets from edge locations globally" },
  { id: "cloudflare",      name: "Cloudflare",        category: "Networking",      rpsCapacity: 1000, latencyMs: 8,    scalable: true,  stateful: false, icon: "cloudflare",       color: "indigo",  description: "Global CDN, DNS, and DDoS/WAF edge network" },
  { id: "api-gateway",     name: "API Gateway",       category: "Networking",      rpsCapacity: 50,   latencyMs: 10,   scalable: true,  stateful: false, icon: "door-open",        color: "indigo",  description: "Single entry point with routing, auth, and rate limiting" },
  { id: "dns",             name: "DNS",               category: "Networking",      rpsCapacity: 100,  latencyMs: 10,   scalable: true,  stateful: false, icon: "globe",            color: "indigo",  description: "Resolves domain names to IP addresses" },
  { id: "reverse-proxy",   name: "Reverse Proxy",     category: "Networking",      rpsCapacity: 100,  latencyMs: 1,    scalable: true,  stateful: false, icon: "arrow-right-left", color: "indigo",  description: "Forwards client requests to backend servers" },
  { id: "waf",             name: "WAF",               category: "Networking",      rpsCapacity: 300,  latencyMs: 3,    scalable: true,  stateful: false, icon: "shield-alert",     color: "indigo",  description: "Filters malicious traffic before it reaches your origin" },
  { id: "rate-limiter",    name: "Rate Limiter",      category: "Networking",      rpsCapacity: 80,   latencyMs: 1,    scalable: true,  stateful: true,  icon: "gauge",            color: "indigo",  description: "Controls request rate to prevent abuse" },
  { id: "ingress",         name: "Ingress",           category: "Networking",      rpsCapacity: 500,  latencyMs: 2,    scalable: true,  stateful: false, icon: "log-in",           color: "indigo",  description: "Kubernetes entrypoint routing external traffic into the cluster" },
  { id: "fastly",          name: "Fastly",            category: "Networking",      rpsCapacity: 800,  latencyMs: 10,   scalable: true,  stateful: false, icon: "fastly",           color: "indigo",  description: "Edge CDN and compute platform" },
  { id: "origin-shield",   name: "Origin Shield",     category: "Networking",      rpsCapacity: 200,  latencyMs: 5,    scalable: true,  stateful: false, icon: "shield",           color: "indigo",  description: "Extra caching layer between CDN and origin" },
  // Compute
  { id: "app-server",      name: "App Server",        category: "Compute",         rpsCapacity: 5,    latencyMs: 20,   scalable: true,  stateful: false, icon: "server",           color: "violet",  description: "Handles business logic" },
  { id: "nodejs",          name: "Node.js",           category: "Compute",         rpsCapacity: 8,    latencyMs: 15,   scalable: true,  stateful: false, icon: "nodejs",           color: "violet",  description: "Event-driven JavaScript runtime for I/O-bound services" },
  { id: "python-service",  name: "Python",            category: "Compute",         rpsCapacity: 4,    latencyMs: 25,   scalable: true,  stateful: false, icon: "python",           color: "violet",  description: "Python service (Django/Flask/FastAPI) handling business logic" },
  { id: "go-service",      name: "Go Service",        category: "Compute",         rpsCapacity: 15,   latencyMs: 8,    scalable: true,  stateful: false, icon: "go",               color: "violet",  description: "High-throughput compiled Go microservice" },
  { id: "auth-service",    name: "Auth Service",      category: "Compute",         rpsCapacity: 10,   latencyMs: 15,   scalable: true,  stateful: false, icon: "key-round",        color: "violet",  description: "Authentication and authorization" },
  { id: "serverless",      name: "Serverless",        category: "Compute",         rpsCapacity: 20,   latencyMs: 50,   scalable: true,  stateful: false, icon: "function-square",  color: "violet",  description: "Auto-scaling FaaS runtime billed per invocation (Lambda, Cloud Functions)" },
  { id: "cloud-function",  name: "Cloud Function",    category: "Compute",         rpsCapacity: 20,   latencyMs: 60,   scalable: true,  stateful: false, icon: "cloud-cog",        color: "violet",  description: "Single-purpose managed cloud function triggered by events" },
  { id: "worker",          name: "Worker",            category: "Compute",         rpsCapacity: 20,   latencyMs: 30,   scalable: true,  stateful: false, icon: "cpu",              color: "violet",  description: "Background worker process for async job execution" },
  { id: "websocket-server",name: "WebSocket Server",  category: "Compute",         rpsCapacity: 50,   latencyMs: 2,    scalable: true,  stateful: true,  icon: "plug",             color: "violet",  description: "Persistent bidirectional connections" },
  { id: "task-scheduler",  name: "Task Scheduler",    category: "Compute",         rpsCapacity: 10,   latencyMs: 50,   scalable: true,  stateful: false, icon: "clock",            color: "violet",  description: "Schedules and runs background jobs" },
  { id: "notification-service", name: "Notification Service", category: "Compute", rpsCapacity: 50,   latencyMs: 100,  scalable: true,  stateful: false, icon: "bell",             color: "violet",  description: "Push notifications, email, SMS delivery" },
  { id: "stream-processor",name: "Stream Processor",  category: "Compute",         rpsCapacity: 200,  latencyMs: 10,   scalable: true,  stateful: true,  icon: "waves",            color: "violet",  description: "Real-time stream processing (Kafka Streams, Flink)" },
  { id: "sidekiq",         name: "Sidekiq",           category: "Compute",         rpsCapacity: 15,   latencyMs: 20,   scalable: true,  stateful: false, icon: "sidekiq",          color: "violet",  description: "Background job processor for Ruby apps" },
  { id: "jwt-validator",   name: "JWT Validator",     category: "Compute",         rpsCapacity: 200,  latencyMs: 1,    scalable: true,  stateful: false, icon: "file-key-2",       color: "violet",  description: "Verifies and decodes JWT bearer tokens on incoming requests" },
  { id: "keycloak",        name: "Keycloak",          category: "Compute",         rpsCapacity: 10,   latencyMs: 15,   scalable: true,  stateful: true,  icon: "keycloak",         color: "violet",  description: "Open-source identity and access management" },
  { id: "vault",           name: "Vault",             category: "Compute",         rpsCapacity: 50,   latencyMs: 5,    scalable: true,  stateful: true,  icon: "vault",            color: "violet",  description: "Secrets management and data encryption (HashiCorp Vault)" },
  { id: "analytics",       name: "Analytics",         category: "Compute",         rpsCapacity: 30,   latencyMs: 40,   scalable: true,  stateful: false, icon: "bar-chart-3",      color: "violet",  description: "Real-time analytics / event processing service" },
  { id: "apache-spark",    name: "Apache Spark",      category: "Compute",         rpsCapacity: 0.5,  latencyMs: 2000, scalable: true,  stateful: false, icon: "apachespark",      color: "violet",  description: "Distributed batch/stream data processing engine" },
  { id: "dbt",             name: "dbt",               category: "Compute",         rpsCapacity: 0.1,  latencyMs: 5000, scalable: false, stateful: false, icon: "layers",           color: "violet",  description: "SQL-based data transformation pipeline" },
  { id: "temporal",        name: "Temporal",          category: "Compute",         rpsCapacity: 30,   latencyMs: 10,   scalable: true,  stateful: true,  icon: "temporal",         color: "violet",  description: "Durable workflow orchestration engine" },
  { id: "embedding-model", name: "Embedding Model",   category: "Compute",         rpsCapacity: 2,    latencyMs: 80,   scalable: true,  stateful: false, icon: "atom",             color: "violet",  description: "Generates vector embeddings from text/image input" },
  { id: "custom",          name: "Custom Component",  category: "Compute",         rpsCapacity: 50,   latencyMs: 10,   scalable: true,  stateful: false, icon: "wrench",           color: "violet",  description: "User-defined custom component" },
  // Storage
  { id: "sql-db",          name: "SQL Database",      category: "Storage",         rpsCapacity: 10,   latencyMs: 8,    scalable: false, stateful: true,  icon: "database",         color: "emerald", description: "Relational DB with ACID guarantees (PostgreSQL, MySQL)" },
  { id: "cache",           name: "Cache / Redis",     category: "Storage",         rpsCapacity: 100,  latencyMs: 1,    scalable: true,  stateful: true,  icon: "redis",            color: "emerald", description: "In-memory data store for ultra-low latency reads" },
  { id: "nosql-db",        name: "NoSQL Database",    category: "Storage",         rpsCapacity: 50,   latencyMs: 3,    scalable: true,  stateful: true,  icon: "boxes",            color: "emerald", description: "Non-relational flexible schema (MongoDB, DynamoDB)" },
  { id: "mysql",           name: "MySQL",             category: "Storage",         rpsCapacity: 10,   latencyMs: 8,    scalable: false, stateful: true,  icon: "mysql",            color: "emerald", description: "Popular open-source relational database" },
  { id: "object-storage",  name: "Object Storage",    category: "Storage",         rpsCapacity: 25,   latencyMs: 75,   scalable: true,  stateful: true,  icon: "hard-drive",       color: "emerald", description: "Blob storage for files and media (S3, GCS)" },
  { id: "dynamodb",        name: "DynamoDB",          category: "Storage",         rpsCapacity: 100,  latencyMs: 3,    scalable: true,  stateful: true,  icon: "table-2",          color: "emerald", description: "Fully-managed AWS key-value/document NoSQL database" },
  { id: "search",          name: "Search / ES",       category: "Storage",         rpsCapacity: 20,   latencyMs: 10,   scalable: true,  stateful: true,  icon: "search",           color: "emerald", description: "Full-text search engine (Elasticsearch)" },
  { id: "data-warehouse",  name: "Data Warehouse",    category: "Storage",         rpsCapacity: 0.05, latencyMs: 5000, scalable: true,  stateful: true,  icon: "warehouse",        color: "emerald", description: "OLAP analytics database (Redshift, BigQuery)" },
  { id: "clickhouse",      name: "ClickHouse",        category: "Storage",         rpsCapacity: 150,  latencyMs: 5,    scalable: true,  stateful: true,  icon: "clickhouse",       color: "emerald", description: "Columnar OLAP database for real-time analytics" },
  { id: "memcached",       name: "Memcached",         category: "Storage",         rpsCapacity: 80,   latencyMs: 1,    scalable: true,  stateful: true,  icon: "memory-stick",     color: "emerald", description: "Distributed in-memory key-value cache" },
  { id: "gcs",             name: "GCS",               category: "Storage",         rpsCapacity: 25,   latencyMs: 70,   scalable: true,  stateful: true,  icon: "gcs",              color: "emerald", description: "Google Cloud Storage — blob storage for files and media" },
  { id: "cassandra",       name: "Cassandra",         category: "Storage",         rpsCapacity: 100,  latencyMs: 4,    scalable: true,  stateful: true,  icon: "cassandra",        color: "emerald", description: "Wide-column distributed NoSQL database" },
  { id: "cockroachdb",     name: "CockroachDB",       category: "Storage",         rpsCapacity: 30,   latencyMs: 6,    scalable: true,  stateful: true,  icon: "cockroachdb",      color: "emerald", description: "Distributed SQL database with horizontal scalability" },
  { id: "timescaledb",     name: "TimescaleDB",       category: "Storage",         rpsCapacity: 100,  latencyMs: 3,    scalable: true,  stateful: true,  icon: "timescaledb",      color: "emerald", description: "Time-series extension for PostgreSQL" },
  { id: "influxdb",        name: "InfluxDB",          category: "Storage",         rpsCapacity: 100,  latencyMs: 3,    scalable: true,  stateful: true,  icon: "influxdb",         color: "emerald", description: "Time-series database for metrics and events" },
  { id: "timeseries-db",   name: "Time-Series DB",    category: "Storage",         rpsCapacity: 100,  latencyMs: 3,    scalable: true,  stateful: true,  icon: "trending-up",      color: "emerald", description: "Optimised for timestamped data (InfluxDB)" },
  { id: "vector-db",       name: "Vector Database",   category: "Storage",         rpsCapacity: 10,   latencyMs: 10,   scalable: true,  stateful: true,  icon: "brain-circuit",    color: "emerald", description: "Vector embeddings for ML (Pinecone, Weaviate)" },
  { id: "pinecone",        name: "Pinecone",          category: "Storage",         rpsCapacity: 10,   latencyMs: 12,   scalable: true,  stateful: true,  icon: "layers-3",         color: "emerald", description: "Managed vector database for similarity search" },
  { id: "weaviate",        name: "Weaviate",          category: "Storage",         rpsCapacity: 10,   latencyMs: 12,   scalable: true,  stateful: true,  icon: "blocks",           color: "emerald", description: "Open-source vector database with hybrid search" },
  { id: "qdrant",          name: "Qdrant",            category: "Storage",         rpsCapacity: 10,   latencyMs: 12,   scalable: true,  stateful: true,  icon: "qdrant",           color: "emerald", description: "Open-source vector similarity search engine" },
  { id: "opensearch",      name: "OpenSearch",        category: "Storage",         rpsCapacity: 20,   latencyMs: 10,   scalable: true,  stateful: true,  icon: "opensearch",       color: "emerald", description: "Open-source fork of Elasticsearch for search/log analytics" },
  { id: "graph-db",        name: "Graph Database",    category: "Storage",         rpsCapacity: 8,    latencyMs: 15,   scalable: true,  stateful: true,  icon: "share-2",          color: "emerald", description: "Graph relationship storage (Neo4j)" },
  { id: "neo4j",           name: "Neo4j",             category: "Storage",         rpsCapacity: 8,    latencyMs: 15,   scalable: true,  stateful: true,  icon: "neo4j",            color: "emerald", description: "Native graph database for connected data" },
  { id: "milvus",          name: "Milvus",            category: "Storage",         rpsCapacity: 10,   latencyMs: 12,   scalable: true,  stateful: true,  icon: "milvus",           color: "emerald", description: "Open-source vector database built for scale" },
  { id: "scylladb",        name: "ScyllaDB",          category: "Storage",         rpsCapacity: 200,  latencyMs: 2,    scalable: true,  stateful: true,  icon: "scylladb",         color: "emerald", description: "Cassandra-compatible database written in C++ for high throughput" },
  { id: "file-store",      name: "File Store",        category: "Storage",         rpsCapacity: 10,   latencyMs: 10,   scalable: true,  stateful: true,  icon: "folder",           color: "emerald", description: "Network file system (NFS, EFS)" },
  { id: "vitess",          name: "Vitess",            category: "Storage",         rpsCapacity: 50,   latencyMs: 5,    scalable: true,  stateful: true,  icon: "vitess",           color: "emerald", description: "Horizontally-sharded MySQL clustering system" },
  { id: "tidb",            name: "TiDB",              category: "Storage",         rpsCapacity: 60,   latencyMs: 5,    scalable: true,  stateful: true,  icon: "tidb",             color: "emerald", description: "MySQL-compatible distributed HTAP database" },
  { id: "dragonfly",       name: "Dragonfly",         category: "Storage",         rpsCapacity: 150,  latencyMs: 1,    scalable: true,  stateful: true,  icon: "flame",            color: "emerald", description: "Redis/Memcached-compatible in-memory store, multi-threaded" },
  { id: "geospatial-index",name: "Geospatial Index",  category: "Storage",         rpsCapacity: 50,   latencyMs: 5,    scalable: true,  stateful: true,  icon: "map-pin",          color: "emerald", description: "Location-based spatial queries" },
  { id: "neptune",         name: "Neptune",           category: "Storage",         rpsCapacity: 10,   latencyMs: 15,   scalable: true,  stateful: true,  icon: "git-branch",       color: "emerald", description: "Managed AWS graph database (property graph & RDF)" },
  // Messaging
  { id: "message-queue",   name: "Message Queue",     category: "Messaging",       rpsCapacity: 100,  latencyMs: 5,    scalable: true,  stateful: true,  icon: "inbox",            color: "amber",   description: "Async message queue (RabbitMQ, SQS)" },
  { id: "kafka",           name: "Kafka",             category: "Messaging",       rpsCapacity: 500,  latencyMs: 3,    scalable: true,  stateful: true,  icon: "kafka",            color: "amber",   description: "Distributed event streaming platform" },
  { id: "pub-sub",         name: "Pub/Sub",           category: "Messaging",       rpsCapacity: 200,  latencyMs: 5,    scalable: true,  stateful: true,  icon: "rss",              color: "amber",   description: "Publish-subscribe messaging (Kafka, Google Pub/Sub)" },
  { id: "sqs",             name: "SQS",               category: "Messaging",       rpsCapacity: 100,  latencyMs: 8,    scalable: true,  stateful: true,  icon: "rows-3",           color: "amber",   description: "Fully-managed AWS message queue" },
  { id: "event-stream",    name: "Event Stream",      category: "Messaging",       rpsCapacity: 200,  latencyMs: 5,    scalable: true,  stateful: true,  icon: "radio",            color: "amber",   description: "Ordered, replayable log of domain events" },
  { id: "redis-pubsub",    name: "Redis Pub/Sub",     category: "Messaging",       rpsCapacity: 150,  latencyMs: 1,    scalable: true,  stateful: true,  icon: "redis",            color: "amber",   description: "Lightweight fire-and-forget pub/sub over Redis" },
  { id: "nats",            name: "NATS",              category: "Messaging",       rpsCapacity: 300,  latencyMs: 1,    scalable: true,  stateful: true,  icon: "nats",             color: "amber",   description: "Lightweight high-performance messaging system" },
  { id: "redpanda",        name: "Redpanda",          category: "Messaging",       rpsCapacity: 500,  latencyMs: 2,    scalable: true,  stateful: true,  icon: "audio-waveform",   color: "amber",   description: "Kafka-compatible streaming platform without ZooKeeper" },
  // Infrastructure
  { id: "monitoring",      name: "Monitoring",        category: "Infrastructure",  rpsCapacity: 500,  latencyMs: 5,    scalable: true,  stateful: true,  icon: "activity",         color: "cyan",    description: "Metrics, alerting, observability (Prometheus, Datadog)" },
  { id: "service-mesh",    name: "Service Mesh",      category: "Infrastructure",  rpsCapacity: 80,   latencyMs: 2,    scalable: true,  stateful: false, icon: "network",          color: "cyan",    description: "Service-to-service communication (Istio, Linkerd)" },
  { id: "circuit-breaker", name: "Circuit Breaker",   category: "Infrastructure",  rpsCapacity: 100,  latencyMs: 1,    scalable: true,  stateful: true,  icon: "zap-off",          color: "cyan",    description: "Stops cascading failures to downstream services" },
  { id: "service-discovery",name:"Service Discovery", category: "Infrastructure",  rpsCapacity: 50,   latencyMs: 1,    scalable: true,  stateful: true,  icon: "radar",            color: "cyan",    description: "Auto-detects services in the network (Consul)" },
  { id: "config-service",  name: "Config Service",    category: "Infrastructure",  rpsCapacity: 50,   latencyMs: 2,    scalable: true,  stateful: true,  icon: "settings-2",       color: "cyan",    description: "Centralised config management (Consul, AppConfig)" },
  { id: "distributed-lock",name: "Distributed Lock",  category: "Infrastructure",  rpsCapacity: 10,   latencyMs: 5,    scalable: false, stateful: true,  icon: "lock",             color: "cyan",    description: "Distributed mutual exclusion (Zookeeper, Redis)" },
  { id: "coordination-service", name: "Coordination Service", category: "Infrastructure", rpsCapacity: 20, latencyMs: 5, scalable: true, stateful: true, icon: "git-merge",       color: "cyan",   description: "Distributed coordination (Zookeeper, etcd)" },
  { id: "id-generator",    name: "ID Generator",      category: "Infrastructure",  rpsCapacity: 500,  latencyMs: 1,    scalable: true,  stateful: true,  icon: "hash",             color: "cyan",    description: "Distributed unique ID generation (Snowflake)" },
  { id: "sharded-counter", name: "Sharded Counter",   category: "Infrastructure",  rpsCapacity: 500,  latencyMs: 2,    scalable: true,  stateful: true,  icon: "sigma",            color: "cyan",    description: "High-throughput distributed counter" },
  // Observability
  { id: "metrics",         name: "Metrics",           category: "Observability",   rpsCapacity: 1000, latencyMs: 2,    scalable: true,  stateful: true,  icon: "line-chart",       color: "rose",    description: "Collects and stores time-series system metrics" },
  { id: "logs",            name: "Logs",              category: "Observability",   rpsCapacity: 1000, latencyMs: 5,    scalable: true,  stateful: true,  icon: "scroll-text",      color: "rose",    description: "Centralized log aggregation and storage" },
  { id: "health-check",    name: "Health Check",      category: "Observability",   rpsCapacity: 500,  latencyMs: 1,    scalable: true,  stateful: false, icon: "heart-pulse",      color: "rose",    description: "Periodic liveness/readiness probing of services" },
  { id: "alerting",        name: "Alerting",          category: "Observability",   rpsCapacity: 200,  latencyMs: 5,    scalable: true,  stateful: false, icon: "bell-ring",        color: "rose",    description: "Evaluates rules and fires alerts on threshold breaches" },
  { id: "tracing",         name: "Tracing",           category: "Observability",   rpsCapacity: 500,  latencyMs: 3,    scalable: true,  stateful: true,  icon: "git-commit-horizontal", color: "rose", description: "Distributed request tracing across services" },
  { id: "jaeger",          name: "Jaeger",            category: "Observability",   rpsCapacity: 500,  latencyMs: 3,    scalable: true,  stateful: true,  icon: "jaeger",           color: "rose",    description: "Distributed tracing system (CNCF)" },
  { id: "loki",            name: "Loki",              category: "Observability",   rpsCapacity: 1000, latencyMs: 5,    scalable: true,  stateful: true,  icon: "file-search-2",    color: "rose",    description: "Horizontally-scalable log aggregation system (Grafana)" },
  // Network
  { id: "nginx",           name: "Nginx",             category: "Network",         rpsCapacity: 200,  latencyMs: 1,    scalable: true,  stateful: false, icon: "nginx",            color: "blue",    description: "High-performance reverse proxy and web server" },
  { id: "vpc",             name: "VPC",               category: "Network",         rpsCapacity: 100000, latencyMs: 0,  scalable: true,  stateful: false, icon: "container",        color: "blue",    description: "Isolated virtual network for cloud resources" },
  { id: "subnet",          name: "Subnet",            category: "Network",         rpsCapacity: 100000, latencyMs: 0,  scalable: true,  stateful: false, icon: "split",            color: "blue",    description: "Segmented IP address range within a VPC" },
  { id: "firewall",        name: "Firewall",          category: "Network",         rpsCapacity: 1000, latencyMs: 1,    scalable: true,  stateful: false, icon: "shield-ban",       color: "blue",    description: "Filters network traffic by rule-based policy" },
  { id: "nat-gateway",     name: "NAT Gateway",       category: "Network",         rpsCapacity: 500,  latencyMs: 1,    scalable: true,  stateful: false, icon: "shuffle",          color: "blue",    description: "Lets private subnet resources reach the internet outbound" },
  { id: "envoy",           name: "Envoy",             category: "Network",         rpsCapacity: 300,  latencyMs: 1,    scalable: true,  stateful: false, icon: "envoy",            color: "blue",    description: "Cloud-native L7 proxy used as a sidecar/edge proxy" },
  { id: "haproxy",         name: "HAProxy",           category: "Network",         rpsCapacity: 500,  latencyMs: 1,    scalable: true,  stateful: false, icon: "arrow-right-left", color: "blue",    description: "High-performance TCP/HTTP load balancer" },
  { id: "kong",            name: "Kong",              category: "Network",         rpsCapacity: 100,  latencyMs: 3,    scalable: true,  stateful: false, icon: "kong",             color: "blue",    description: "API gateway built on Nginx/OpenResty" },
  { id: "vpn",             name: "VPN",               category: "Network",         rpsCapacity: 200,  latencyMs: 10,   scalable: true,  stateful: false, icon: "shield-check",     color: "blue",    description: "Encrypted tunnel connecting private networks" },
  { id: "consul",          name: "Consul",            category: "Network",         rpsCapacity: 100,  latencyMs: 2,    scalable: true,  stateful: true,  icon: "consul",           color: "blue",    description: "Service networking: discovery, mesh, and config (HashiCorp)" },
  { id: "traefik",         name: "Traefik",           category: "Network",         rpsCapacity: 200,  latencyMs: 1,    scalable: true,  stateful: false, icon: "traefik",          color: "blue",    description: "Cloud-native reverse proxy and ingress controller" },
  { id: "linkerd",         name: "Linkerd",           category: "Network",         rpsCapacity: 300,  latencyMs: 1,    scalable: true,  stateful: false, icon: "linkerd",          color: "blue",    description: "Lightweight service mesh for Kubernetes" },
  { id: "anycast-lb",      name: "Anycast LB",        category: "Network",         rpsCapacity: 2000, latencyMs: 1,    scalable: true,  stateful: false, icon: "signal",           color: "blue",    description: "Load balancer advertised from multiple regions via anycast routing" },
  // AI & Agents
  { id: "llm-gateway",     name: "LLM Gateway",       category: "AI & Agents",     rpsCapacity: 5,    latencyMs: 500,  scalable: true,  stateful: false, icon: "router",           color: "fuchsia", description: "Unified routing/rate-limiting layer across LLM providers" },
  { id: "orchestrator",    name: "Orchestrator",      category: "AI & Agents",     rpsCapacity: 5,    latencyMs: 200,  scalable: true,  stateful: true,  icon: "workflow",         color: "fuchsia", description: "Coordinates multi-step agent/tool execution" },
  { id: "memory-fabric",   name: "Memory Fabric",     category: "AI & Agents",     rpsCapacity: 20,   latencyMs: 10,   scalable: true,  stateful: true,  icon: "layers",           color: "fuchsia", description: "Long/short-term memory store for agent context" },
  { id: "tool-registry",   name: "Tool Registry",     category: "AI & Agents",     rpsCapacity: 50,   latencyMs: 5,    scalable: true,  stateful: true,  icon: "clipboard-list",   color: "fuchsia", description: "Catalog of callable tools/functions available to agents" },
  { id: "safety-mesh",     name: "Safety Mesh",       category: "AI & Agents",     rpsCapacity: 10,   latencyMs: 50,   scalable: true,  stateful: false, icon: "shield-check",     color: "fuchsia", description: "Content moderation and guardrails across agent I/O" },
  // External
  { id: "webhook",         name: "Webhook",           category: "External",        rpsCapacity: 20,   latencyMs: 100,  scalable: true,  stateful: false, icon: "webhook",          color: "orange",  description: "Inbound HTTP callback from an external system" },
  { id: "third-party-api", name: "3rd Party API",     category: "External",        rpsCapacity: 20,   latencyMs: 150,  scalable: false, stateful: false, icon: "external-link",    color: "orange",  description: "External vendor API dependency outside your control" },
  { id: "payment",         name: "Payment",           category: "External",        rpsCapacity: 10,   latencyMs: 300,  scalable: false, stateful: false, icon: "credit-card",      color: "orange",  description: "Third-party payment processor (Stripe, PayPal)" },
  { id: "email",           name: "Email",             category: "External",        rpsCapacity: 10,   latencyMs: 200,  scalable: false, stateful: false, icon: "mail",             color: "orange",  description: "Transactional email delivery provider" },
  { id: "cron-trigger",    name: "Cron Trigger",      category: "External",        rpsCapacity: 1,    latencyMs: 50,   scalable: false, stateful: false, icon: "timer",            color: "orange",  description: "Time-based trigger that invokes a job on a schedule" },
  { id: "daily-batch",     name: "Daily Batch",       category: "External",        rpsCapacity: 0.01, latencyMs: 5000, scalable: false, stateful: false, icon: "calendar-clock",   color: "orange",  description: "Scheduled once-daily batch job" },
];

export const CATEGORIES: ComponentCategory[] = ["Client", "Networking", "Compute", "Storage", "Messaging", "Infrastructure", "Observability", "Network", "AI & Agents", "External"];

export const CATEGORY_COLORS: Record<ComponentCategory, { border: string; bg: string; text: string; badge: string }> = {
  Networking:     { border: "border-indigo-500/60", bg: "bg-indigo-500/10",  text: "text-indigo-300",  badge: "bg-indigo-500/20 text-indigo-300" },
  Compute:        { border: "border-violet-500/60", bg: "bg-violet-500/10",  text: "text-violet-300",  badge: "bg-violet-500/20 text-violet-300" },
  Storage:        { border: "border-emerald-500/60",bg: "bg-emerald-500/10", text: "text-emerald-300", badge: "bg-emerald-500/20 text-emerald-300" },
  Messaging:      { border: "border-amber-500/60",  bg: "bg-amber-500/10",   text: "text-amber-300",   badge: "bg-amber-500/20 text-amber-300" },
  Infrastructure: { border: "border-cyan-500/60",   bg: "bg-cyan-500/10",    text: "text-cyan-300",    badge: "bg-cyan-500/20 text-cyan-300" },
  Client:         { border: "border-sky-500/60",    bg: "bg-sky-500/10",     text: "text-sky-300",     badge: "bg-sky-500/20 text-sky-300" },
  Observability:  { border: "border-rose-500/60",   bg: "bg-rose-500/10",    text: "text-rose-300",    badge: "bg-rose-500/20 text-rose-300" },
  Network:        { border: "border-blue-500/60",   bg: "bg-blue-500/10",   text: "text-blue-300",    badge: "bg-blue-500/20 text-blue-300" },
  "AI & Agents":  { border: "border-fuchsia-500/60",bg: "bg-fuchsia-500/10",text: "text-fuchsia-300", badge: "bg-fuchsia-500/20 text-fuchsia-300" },
  External:       { border: "border-orange-500/60", bg: "bg-orange-500/10", text: "text-orange-300",  badge: "bg-orange-500/20 text-orange-300" },
};
