export type ComponentCategory = "Networking" | "Compute" | "Storage" | "Messaging" | "Infrastructure";

export interface ComponentDef {
  id: string;
  name: string;
  category: ComponentCategory;
  rpsCapacity: number; // k/s (thousands per second)
  description: string;
  icon: string;
  color: string;
}

export const COMPONENTS: ComponentDef[] = [
  // Networking
  { id: "dns", name: "DNS", category: "Networking", rpsCapacity: 100, icon: "🌐", color: "indigo", description: "Resolves domain names to IP addresses" },
  { id: "cdn", name: "CDN", category: "Networking", rpsCapacity: 500, icon: "🌍", color: "indigo", description: "Serves static assets from edge locations globally" },
  { id: "load-balancer", name: "Load Balancer", category: "Networking", rpsCapacity: 1000, icon: "⚖️", color: "indigo", description: "Distributes traffic across server instances" },
  { id: "api-gateway", name: "API Gateway", category: "Networking", rpsCapacity: 50, icon: "🚪", color: "indigo", description: "Single entry point with routing, auth, and rate limiting" },
  { id: "rate-limiter", name: "Rate Limiter", category: "Networking", rpsCapacity: 80, icon: "🚦", color: "indigo", description: "Controls request rate to prevent abuse" },
  { id: "reverse-proxy", name: "Reverse Proxy", category: "Networking", rpsCapacity: 100, icon: "🔄", color: "indigo", description: "Forwards client requests to backend servers" },
  { id: "origin-shield", name: "Origin Shield", category: "Networking", rpsCapacity: 200, icon: "🛡️", color: "indigo", description: "Extra caching layer between CDN and origin" },
  // Compute
  { id: "app-server", name: "App Server", category: "Compute", rpsCapacity: 5, icon: "💻", color: "violet", description: "Handles business logic" },
  { id: "auth-service", name: "Auth Service", category: "Compute", rpsCapacity: 10, icon: "🔐", color: "violet", description: "Authentication and authorization" },
  { id: "websocket-server", name: "WebSocket Server", category: "Compute", rpsCapacity: 50, icon: "🔌", color: "violet", description: "Persistent bidirectional connections" },
  { id: "task-scheduler", name: "Task Scheduler", category: "Compute", rpsCapacity: 10, icon: "⏰", color: "violet", description: "Schedules and runs background jobs" },
  { id: "stream-processor", name: "Stream Processor", category: "Compute", rpsCapacity: 200, icon: "🌊", color: "violet", description: "Real-time stream processing (Kafka Streams, Flink)" },
  { id: "notification-service", name: "Notification Service", category: "Compute", rpsCapacity: 50, icon: "🔔", color: "violet", description: "Push notifications, email, SMS delivery" },
  { id: "custom", name: "Custom Component", category: "Compute", rpsCapacity: 50, icon: "🔧", color: "violet", description: "User-defined custom component" },
  // Storage
  { id: "sql-db", name: "SQL Database", category: "Storage", rpsCapacity: 10, icon: "🗃️", color: "emerald", description: "Relational DB with ACID guarantees (PostgreSQL, MySQL)" },
  { id: "nosql-db", name: "NoSQL Database", category: "Storage", rpsCapacity: 50, icon: "📦", color: "emerald", description: "Non-relational flexible schema (MongoDB, DynamoDB)" },
  { id: "cache", name: "Cache / Redis", category: "Storage", rpsCapacity: 100, icon: "⚡", color: "emerald", description: "In-memory data store for ultra-low latency reads" },
  { id: "object-storage", name: "Object Storage", category: "Storage", rpsCapacity: 25, icon: "🗄️", color: "emerald", description: "Blob storage for files and media (S3, GCS)" },
  { id: "search", name: "Search / ES", category: "Storage", rpsCapacity: 20, icon: "🔍", color: "emerald", description: "Full-text search engine (Elasticsearch)" },
  { id: "graph-db", name: "Graph Database", category: "Storage", rpsCapacity: 8, icon: "🕸️", color: "emerald", description: "Graph relationship storage (Neo4j)" },
  { id: "timeseries-db", name: "Time-Series DB", category: "Storage", rpsCapacity: 100, icon: "📈", color: "emerald", description: "Optimised for timestamped data (InfluxDB)" },
  { id: "data-warehouse", name: "Data Warehouse", category: "Storage", rpsCapacity: 1, icon: "🏭", color: "emerald", description: "OLAP analytics database (Redshift, BigQuery)" },
  { id: "file-store", name: "File Store", category: "Storage", rpsCapacity: 10, icon: "📁", color: "emerald", description: "Network file system (NFS, EFS)" },
  { id: "vector-db", name: "Vector Database", category: "Storage", rpsCapacity: 10, icon: "🧮", color: "emerald", description: "Vector embeddings for ML (Pinecone, Weaviate)" },
  { id: "geospatial", name: "Geospatial Index", category: "Storage", rpsCapacity: 50, icon: "📍", color: "emerald", description: "Location-based spatial queries" },
  // Messaging
  { id: "message-queue", name: "Message Queue", category: "Messaging", rpsCapacity: 100, icon: "📬", color: "amber", description: "Async message queue (RabbitMQ, SQS)" },
  { id: "pubsub", name: "Pub/Sub", category: "Messaging", rpsCapacity: 200, icon: "📡", color: "amber", description: "Publish-subscribe messaging (Kafka, Google Pub/Sub)" },
  // Infrastructure
  { id: "service-mesh", name: "Service Mesh", category: "Infrastructure", rpsCapacity: 80, icon: "🕸️", color: "rose", description: "Service-to-service communication (Istio, Linkerd)" },
  { id: "monitoring", name: "Monitoring", category: "Infrastructure", rpsCapacity: 500, icon: "📊", color: "rose", description: "Metrics, alerting, observability (Prometheus, Datadog)" },
  { id: "service-discovery", name: "Service Discovery", category: "Infrastructure", rpsCapacity: 50, icon: "🔭", color: "rose", description: "Auto-detects services in the network (Consul)" },
  { id: "distributed-lock", name: "Distributed Lock", category: "Infrastructure", rpsCapacity: 10, icon: "🔒", color: "rose", description: "Distributed mutual exclusion (Zookeeper, Redis)" },
  { id: "circuit-breaker", name: "Circuit Breaker", category: "Infrastructure", rpsCapacity: 100, icon: "⚡", color: "rose", description: "Stops cascading failures to downstream services" },
  { id: "coordination", name: "Coordination Service", category: "Infrastructure", rpsCapacity: 20, icon: "🎯", color: "rose", description: "Distributed coordination (Zookeeper, etcd)" },
  { id: "id-generator", name: "ID Generator", category: "Infrastructure", rpsCapacity: 500, icon: "🔢", color: "rose", description: "Distributed unique ID generation (Snowflake)" },
  { id: "sharded-counter", name: "Sharded Counter", category: "Infrastructure", rpsCapacity: 500, icon: "🔢", color: "rose", description: "High-throughput distributed counter" },
  { id: "config-service", name: "Config Service", category: "Infrastructure", rpsCapacity: 50, icon: "⚙️", color: "rose", description: "Centralised config management (Consul, AppConfig)" },
];

export const CATEGORIES: ComponentCategory[] = ["Networking", "Compute", "Storage", "Messaging", "Infrastructure"];

export const CATEGORY_COLORS: Record<ComponentCategory, { border: string; bg: string; text: string; badge: string }> = {
  Networking:     { border: "border-indigo-500/60", bg: "bg-indigo-500/10", text: "text-indigo-300", badge: "bg-indigo-500/20 text-indigo-300" },
  Compute:        { border: "border-violet-500/60",  bg: "bg-violet-500/10",  text: "text-violet-300",  badge: "bg-violet-500/20 text-violet-300" },
  Storage:        { border: "border-emerald-500/60", bg: "bg-emerald-500/10", text: "text-emerald-300", badge: "bg-emerald-500/20 text-emerald-300" },
  Messaging:      { border: "border-amber-500/60",   bg: "bg-amber-500/10",   text: "text-amber-300",   badge: "bg-amber-500/20 text-amber-300" },
  Infrastructure: { border: "border-rose-500/60",    bg: "bg-rose-500/10",    text: "text-rose-300",    badge: "bg-rose-500/20 text-rose-300" },
};
