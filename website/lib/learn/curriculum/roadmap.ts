import { briefHref, designHref, designShortTitle, getBrief, getDesign } from "./index";

/**
 * Learn In Depth — 12 stages in the order a beginner should take them.
 * Every lesson either links to a real page (and is labelled by what it is)
 * or is honestly marked "planned". Nothing pretends to exist.
 */

export type LessonKind = "course" | "brief" | "design" | "simulator" | "planned";

export interface RoadmapLesson {
  title: string;
  kind: LessonKind;
  href?: string;
  /** Shown for simulator-only items: the exact problem name in the simulator. */
  note?: string;
  /** Essential for interviews, or a deeper/advanced topic. */
  level: "essential" | "advanced";
  /** The brief that covers this topic — several related topics share one brief. */
  source?: string;
  /** An optional deep dive: shown in its stage but not counted towards completion. */
  optional?: boolean;
}

export interface RoadmapStage {
  number: number;
  id: string;
  title: string;
  goal: string;
  /** Why interviewers care about this stage. */
  whyItMatters: string;
  /** Stage numbers that should come first (empty = start anywhere). */
  prerequisites: number[];
  /** What you can explain or design after the stage. */
  outcomes: string[];
  lessons: RoadmapLesson[];
}

type Level = RoadmapLesson["level"];

const brief = (title: string, slug: string, level: Level = "essential"): RoadmapLesson => {
  const b = getBrief(slug);
  if (!b) throw new Error(`Unknown brief ${slug}`);
  return { title, kind: "brief", href: briefHref(slug), level, source: b.shortTitle };
};
const deepDive = (title: string, href: string): RoadmapLesson => ({ title, kind: "course", href, level: "advanced", optional: true });
const design = (slug: string): RoadmapLesson => {
  const d = getDesign(slug);
  if (!d) throw new Error(`Unknown design ${slug}`);
  return { title: designShortTitle(d), kind: "design", href: designHref(slug), level: d.level === "Advanced" ? "advanced" : "essential" };
};
const planned = (title: string, level: Level = "essential"): RoadmapLesson => ({ title, kind: "planned", level });

export const ROADMAP: RoadmapStage[] = [
  {
    number: 1,
    id: "fundamentals",
    title: "Web and system design fundamentals",
    goal: "Know how a request travels from a browser to a server and back.",
    whyItMatters: "Every design question starts with a request travelling from a client to your servers and back. If you can't trace that path, you can't say where latency comes from or what breaks.",
    prerequisites: [],
    outcomes: ["Trace a request from DNS to the database and back", "Explain latency, throughput and bandwidth", "Read and sketch simple REST APIs"],
    lessons: [
      planned("What system design means"),
      brief("How the internet works: DNS, HTTP, HTTPS", "http-request-flow"),
      planned("Client, frontend, backend and server"),
      brief("What happens when you open a website?", "http-request-flow"),
      brief("APIs, REST and JSON", "api-data-modeling"),
      brief("Latency, bandwidth and throughput", "http-request-flow"),
    ],
  },
  {
    number: 2,
    id: "backend",
    title: "Backend architecture",
    goal: "Understand what happens inside the server tier and how services are structured.",
    whyItMatters: "Interviewers expect you to know what happens inside the server tier — statelessness, timeouts, how services are split — because it decides how you scale and what fails together.",
    prerequisites: [1],
    outcomes: ["Explain why app servers should be stateless", "Design an API with sensible errors and idempotency", "Discuss monolith vs microservices trade-offs"],
    lessons: [
      brief("Backend request lifecycle", "http-request-flow"),
      planned("Web servers and application servers"),
      brief("Monoliths and layered architecture", "monolith-microservices"),
      brief("API design", "api-data-modeling"),
      brief("Authentication and sessions", "security-fundamentals"),
      brief("Stateless vs stateful services", "load-balancing"),
      brief("Error handling, timeouts and retries", "reliability-patterns"),
      brief("Introduction to microservices", "monolith-microservices"),
    ],
  },
  {
    number: 3,
    id: "databases",
    title: "Databases and data modeling",
    goal: "Choose a database from access patterns and make the hot queries fast.",
    whyItMatters: "The database is usually the hardest component to scale and the most expensive to change. Choosing storage and indexes from access patterns is a core interview skill.",
    prerequisites: [1, 2],
    outcomes: ["Choose SQL or NoSQL per data set and justify it", "Design indexes for the hot queries", "Explain transactions and the anomalies isolation prevents"],
    lessons: [
      brief("SQL vs NoSQL", "databases"),
      brief("Data modeling and access patterns", "api-data-modeling"),
      planned("Primary and foreign keys, relationships"),
      brief("Indexes and query optimization", "databases"),
      brief("Transactions and ACID", "databases"),
      planned("Connection pooling", "advanced"),
      planned("Read vs write workload considerations", "advanced"),
    ],
  },
  {
    number: 4,
    id: "caching",
    title: "Performance and caching",
    goal: "Find bottlenecks and remove repeated work without serving wrong data.",
    whyItMatters: "Almost every large design uses caching, and interviewers probe the hard parts: hit ratios, invalidation, stampedes and what happens when the cache fails.",
    prerequisites: [3],
    outcomes: ["Justify a cache with a hit-ratio estimate", "Choose a caching strategy, TTL and invalidation approach", "Explain stampedes and cache-failure behaviour"],
    lessons: [
      planned("Identifying bottlenecks"),
      brief("Cache-aside, write-through, write-back", "caching"),
      brief("Redis as a cache", "caching"),
      brief("TTL, invalidation and eviction", "caching"),
      brief("CDN fundamentals", "cdn-object-storage"),
      brief("Consistency and stale cache data", "caching"),
    ],
  },
  {
    number: 5,
    id: "scaling",
    title: "Scaling and traffic management",
    goal: "Grow beyond one machine for both servers and data.",
    whyItMatters: "\"What happens at 10× traffic?\" is the most common follow-up question. Answering it needs horizontal scaling, replication, sharding and a capacity estimate.",
    prerequisites: [2, 3, 4],
    outcomes: ["Size a stateless tier for peak with redundancy", "Explain when to replicate and when to shard", "Pick a shard key and discuss its costs"],
    lessons: [
      brief("Vertical vs horizontal scaling", "load-balancing"),
      brief("Load balancers and reverse proxies", "load-balancing"),
      brief("Health checks", "load-balancing"),
      brief("Rate limiting", "reliability-patterns"),
      brief("API gateways", "api-gateway", "advanced"),
      brief("Database replication", "replication-sharding"),
      brief("Sharding and partitioning", "replication-sharding"),
      brief("Capacity estimation", "estimation"),
    ],
  },
  {
    number: 6,
    id: "messaging",
    title: "Messaging and asynchronous systems",
    goal: "Decouple services with queues and keep messages safe through failures.",
    whyItMatters: "Queues appear in notification, ordering, video and feed designs. Interviewers test whether you understand delivery guarantees and duplicates — not just that queues exist.",
    prerequisites: [2, 5],
    outcomes: ["Decide when work should be asynchronous", "Explain acks, at-least-once delivery and idempotent consumers", "Design retries and dead-letter handling"],
    lessons: [
      brief("Synchronous vs asynchronous communication", "message-queues"),
      brief("Why message queues exist", "message-queues"),
      brief("Producers, consumers and brokers", "message-queues"),
      brief("Acknowledgements, redelivery and idempotency", "message-queues"),
      brief("Durability and persistence", "message-queues", "advanced"),
      brief("Retries and dead-letter queues", "message-queues"),
      brief("Queues vs logs (RabbitMQ vs Kafka)", "message-queues"),
      deepDive("Deep dive: RabbitMQ, visually — 12 animated chapters", "/learn/rabbitmq"),
    ],
  },
  {
    number: 7,
    id: "reliability",
    title: "Distributed systems and reliability",
    goal: "Design for partial failure and choose consistency deliberately.",
    whyItMatters: "Distributed systems fail partially. Strong candidates explain timeouts, retries, idempotency and consistency choices precisely instead of hand-waving \"we'll make it reliable\".",
    prerequisites: [5, 6],
    outcomes: ["Stop a slow dependency from cascading", "Explain CAP correctly and choose consistency per feature", "Make retried operations safe with idempotency"],
    lessons: [
      brief("Partial failures", "reliability-patterns"),
      brief("Retries, exponential backoff and jitter", "reliability-patterns"),
      brief("Idempotency", "reliability-patterns"),
      brief("Circuit breakers and graceful degradation", "reliability-patterns"),
      brief("Consistency, availability and CAP", "cap-consistency"),
      brief("Eventual consistency", "cap-consistency"),
      brief("Distributed locks, leases and fencing", "distributed-locks", "advanced"),
    ],
  },
  {
    number: 8,
    id: "storage",
    title: "Storage and content delivery",
    goal: "Store and serve large files efficiently worldwide.",
    whyItMatters: "Any design with photos, videos or documents needs object storage, a CDN and a clear upload/download path that keeps bytes off your servers.",
    prerequisites: [4, 5],
    outcomes: ["Design presigned upload and download paths", "Explain CDN caching, TTLs and versioned URLs", "Plan async processing for uploaded media"],
    lessons: [
      brief("Object storage", "cdn-object-storage"),
      brief("Upload/download architecture and presigned URLs", "cdn-object-storage"),
      brief("CDN delivery", "cdn-object-storage"),
      design("file-storage"),
      design("video-streaming"),
    ],
  },
  {
    number: 9,
    id: "observability",
    title: "Observability and production readiness",
    goal: "Know when something is wrong, and why.",
    whyItMatters: "\"How would you know it's broken?\" separates engineers who operate systems from those who only draw them. Metrics, logs, traces and SLOs make failure discussions concrete.",
    prerequisites: [5, 7],
    outcomes: ["Choose metrics and alerts for a service", "Explain SLIs, SLOs and error budgets", "Debug a slow request across services"],
    lessons: [
      brief("Logs, metrics and tracing", "observability"),
      brief("Monitoring and alerts", "observability"),
      brief("Debugging production failures", "observability", "advanced"),
      brief("SLIs, SLOs and SLAs", "observability"),
    ],
  },
  {
    number: 10,
    id: "security",
    title: "Security",
    goal: "Protect data in transit, at rest and at the API boundary.",
    whyItMatters: "Authentication, authorisation and protecting public APIs come up in almost every design — usually as a follow-up when you least expect it.",
    prerequisites: [1, 2],
    outcomes: ["Explain authentication vs authorisation", "Secure an API against common abuse", "Handle secrets and encryption sensibly"],
    lessons: [
      brief("TLS and secure communication", "security-fundamentals"),
      brief("Authentication and authorization", "security-fundamentals"),
      brief("API security and abuse prevention", "security-fundamentals"),
      brief("Secrets management", "security-fundamentals", "advanced"),
    ],
  },
  {
    number: 11,
    id: "methodology",
    title: "System design interview methodology",
    goal: "Turn knowledge into a structured, well-communicated interview answer.",
    whyItMatters: "Knowledge isn't enough: interviews reward a structured approach, explicit estimates and clearly communicated trade-offs. Useful from day one, essential before any mock interview.",
    prerequisites: [],
    outcomes: ["Run a 45-minute interview with the 7-step workflow", "Estimate scale in a few minutes and use the numbers", "Define APIs and data models from access patterns"],
    lessons: [
      brief("Clarifying functional and non-functional requirements", "interview-framework"),
      brief("Back-of-the-envelope estimation", "estimation"),
      brief("API and database design", "api-data-modeling"),
      brief("High-level architecture, deep dives and trade-offs", "interview-framework"),
      brief("Failure scenarios and communicating clearly", "interview-framework"),
    ],
  },
  {
    number: 12,
    id: "designs",
    title: "End-to-end design problems",
    goal: "Combine the building blocks into complete systems — beginner to advanced.",
    whyItMatters: "Interviews ask you to combine everything into one coherent system under time pressure. Walkthroughs show how the building blocks fit together and where the hard trade-offs are.",
    prerequisites: [11, 4, 5, 6],
    outcomes: ["Move from an ambiguous prompt to a defensible architecture", "Defend trade-offs under follow-up questions", "Summarise a design in 60 seconds"],
    lessons: [
      design("url-shortener"),
      design("rate-limiter"),
      design("notification-system"),
      design("file-storage"),
      design("chat-app"),
      design("news-feed"),
      design("video-streaming"),
      design("ecommerce"),
    ],
  },
];

export const LESSON_KIND_LABEL: Record<LessonKind, string> = {
  course: "Interactive course",
  brief: "Interview brief",
  design: "Design walkthrough",
  simulator: "Simulator problem",
  planned: "Planned",
};

export function stageTitle(n: number): string {
  return ROADMAP.find((s) => s.number === n)?.title ?? `Stage ${n}`;
}
