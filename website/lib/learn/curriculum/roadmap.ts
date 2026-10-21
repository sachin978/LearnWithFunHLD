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
}

export interface RoadmapStage {
  number: number;
  id: string;
  title: string;
  goal: string;
  lessons: RoadmapLesson[];
}

const brief = (title: string, slug: string): RoadmapLesson => {
  if (!getBrief(slug)) throw new Error(`Unknown brief ${slug}`);
  return { title, kind: "brief", href: briefHref(slug) };
};
const course = (title: string, href: string): RoadmapLesson => ({ title, kind: "course", href });
const design = (slug: string): RoadmapLesson => {
  const d = getDesign(slug);
  if (!d) throw new Error(`Unknown design ${slug}`);
  return { title: designShortTitle(d), kind: "design", href: designHref(slug) };
};
const simulator = (title: string, problem: string): RoadmapLesson => ({ title, kind: "simulator", href: "/simulator", note: problem });
const planned = (title: string): RoadmapLesson => ({ title, kind: "planned" });

export const ROADMAP: RoadmapStage[] = [
  {
    number: 1,
    id: "fundamentals",
    title: "Web and system design fundamentals",
    goal: "Know how a request travels from a browser to a server and back.",
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
    goal: "Understand what happens inside the server and how services are structured.",
    lessons: [
      brief("Backend request lifecycle", "http-request-flow"),
      planned("Web servers and application servers"),
      planned("Monoliths and layered architecture"),
      brief("API design", "api-data-modeling"),
      planned("Authentication and sessions"),
      brief("Stateless vs stateful services", "load-balancing"),
      brief("Error handling, timeouts and retries", "reliability-patterns"),
      planned("Introduction to microservices"),
    ],
  },
  {
    number: 3,
    id: "databases",
    title: "Databases and data modeling",
    goal: "Choose a database from access patterns and make queries fast.",
    lessons: [
      brief("SQL vs NoSQL", "databases"),
      brief("Data modeling and access patterns", "api-data-modeling"),
      planned("Primary and foreign keys, relationships"),
      brief("Indexes and query optimization", "databases"),
      brief("Transactions and ACID", "databases"),
      planned("Connection pooling"),
      planned("Read vs write workload considerations"),
    ],
  },
  {
    number: 4,
    id: "caching",
    title: "Performance and caching",
    goal: "Find bottlenecks and remove repeated work without serving wrong data.",
    lessons: [
      planned("Identifying bottlenecks"),
      brief("Cache-aside, write-through, write-back", "caching"),
      brief("Redis fundamentals", "caching"),
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
    lessons: [
      brief("Vertical vs horizontal scaling", "load-balancing"),
      brief("Load balancers and reverse proxies", "load-balancing"),
      brief("Health checks", "load-balancing"),
      brief("Rate limiting", "reliability-patterns"),
      planned("API gateways"),
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
    lessons: [
      brief("Synchronous vs asynchronous communication", "message-queues"),
      course("Why message queues exist", "/learn/rabbitmq#why-broker"),
      course("Producers, consumers, messages and brokers", "/learn/rabbitmq#architecture"),
      course("Exchanges, queues and bindings", "/learn/rabbitmq#exchanges"),
      course("Acknowledgements, redelivery and idempotency", "/learn/rabbitmq#acks"),
      course("Durability and persistence", "/learn/rabbitmq#durability"),
      course("Retries and dead-letter queues", "/learn/rabbitmq#retries-dlx"),
      course("RabbitMQ vs Kafka", "/learn/rabbitmq#vs-kafka"),
    ],
  },
  {
    number: 7,
    id: "reliability",
    title: "Distributed systems and reliability",
    goal: "Design for partial failure and choose consistency deliberately.",
    lessons: [
      brief("Partial failures", "reliability-patterns"),
      brief("Retries, exponential backoff and jitter", "reliability-patterns"),
      brief("Idempotency", "reliability-patterns"),
      brief("Circuit breakers and graceful degradation", "reliability-patterns"),
      brief("Consistency, availability and CAP", "cap-consistency"),
      brief("Eventual consistency", "cap-consistency"),
      planned("Distributed locks"),
    ],
  },
  {
    number: 8,
    id: "storage",
    title: "Storage and content delivery",
    goal: "Store and serve large files efficiently worldwide.",
    lessons: [
      brief("Object storage", "cdn-object-storage"),
      brief("Upload/download architecture and presigned URLs", "cdn-object-storage"),
      brief("CDN delivery", "cdn-object-storage"),
      design("file-storage"),
    ],
  },
  {
    number: 9,
    id: "observability",
    title: "Observability and production readiness",
    goal: "Know when something is wrong and why.",
    lessons: [planned("Logs, metrics and tracing"), planned("Monitoring and alerts"), planned("Debugging production failures"), planned("SLIs, SLOs and SLAs")],
  },
  {
    number: 10,
    id: "security",
    title: "Security",
    goal: "Protect data in transit, at rest and at the API boundary.",
    lessons: [planned("TLS and secure communication"), planned("Authentication and authorization"), planned("API security and abuse prevention"), planned("Secrets management")],
  },
  {
    number: 11,
    id: "methodology",
    title: "System design interview methodology",
    goal: "Turn knowledge into a structured, well-communicated interview answer.",
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
    lessons: [
      design("url-shortener"),
      design("rate-limiter"),
      design("notification-system"),
      design("file-storage"),
      design("chat-app"),
      design("news-feed"),
      simulator("Video streaming platform", "Netflix / Video Streaming"),
      simulator("E-commerce backend", "Amazon / E-Commerce Platform"),
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
