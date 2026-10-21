import type { Course, QuizQuestion } from "@/lib/learn/types";
import { CHAPTERS_PART_1 } from "./chapters-part1";
import { CHAPTERS_PART_2 } from "./chapters-part2";

export const RABBITMQ_COURSE: Course = {
  slug: "rabbitmq",
  title: "RabbitMQ, visually",
  tagline: "From \"why do I need a broker?\" to production-grade reliability and interview-ready answers.",
  intro:
    "Twelve short chapters, each built around an animation you can play, pause and step through. Watch messages move from producers through exchanges into queues, see what happens when consumers crash and brokers restart, experiment with routing, then run real code.",
  objectives: [
    "Explain when and why to introduce a message broker",
    "Pick the right exchange type and write correct topic bindings",
    "Design consumers with acks, prefetch and idempotency",
    "Make messages survive restarts with durability, persistence and confirms",
    "Handle failures with delayed retries and dead-letter queues",
    "Choose between classic, quorum queues, streams — and Kafka",
  ],
  chapters: [...CHAPTERS_PART_1, ...CHAPTERS_PART_2],
};

// ─── Chapter 10 · Decision scenarios ─────────────────────────────────────────

export type Tech = "rabbitmq" | "kafka" | "either";

export interface DecisionScenario {
  id: string;
  prompt: string;
  best: Tech;
  explanation: string;
}

export const DECISION_SCENARIOS: DecisionScenario[] = [
  {
    id: "signup-email",
    prompt: "Send a welcome email asynchronously after a user signs up.",
    best: "rabbitmq",
    explanation: "A classic task: one job per event, per-message ack, retries with backoff and a DLQ for bad addresses. Kafka works but adds partitions and offset management for no real benefit.",
  },
  {
    id: "background-jobs",
    prompt: "Process background jobs (image resizing, PDF generation) across a pool of workers.",
    best: "rabbitmq",
    explanation: "Competing consumers on a queue with prefetch give fair dispatch of uneven tasks. Kafka's parallelism is capped by partitions and one slow message blocks its partition.",
  },
  {
    id: "replay",
    prompt: "Retain events so multiple independent consumer groups can replay them later.",
    best: "kafka",
    explanation: "Retention plus per-group offsets is Kafka's core model. (RabbitMQ Streams can also do this — classic queues cannot, since messages are deleted on ack.)",
  },
  {
    id: "analytics",
    prompt: "Stream high-volume application events (clicks, page views) into an analytics pipeline.",
    best: "kafka",
    explanation: "Very high sustained throughput, batching, retention and a rich stream-processing ecosystem make Kafka the usual choice.",
  },
  {
    id: "routing",
    prompt: "Route messages to different services based on complex patterns (region, type, priority).",
    best: "rabbitmq",
    explanation: "Topic and headers exchanges do this in the broker. With Kafka, consumers typically read whole topics and filter themselves, or you build routing services.",
  },
];

// ─── Chapter 12 · Final assessment, mental model, checklist ─────────────────

export const FINAL_ASSESSMENT: QuizQuestion[] = [
  {
    id: "f1",
    question: "Which component stores messages?",
    options: ["Exchange", "Binding", "Queue", "Channel"],
    answer: 2,
    explanation: "Exchanges route, bindings are rules, channels are sessions. Only queues store messages.",
  },
  {
    id: "f2",
    question: "Routing key `payments.eu.failed`. Which binding on a topic exchange matches?",
    options: ["`payments.*`", "`*.failed`", "`payments.#`", "`payments.failed`"],
    answer: 2,
    explanation: "Only `#` can absorb more than one word; `*` matches exactly one.",
  },
  {
    id: "f3",
    question: "A consumer uses manual acks and crashes after processing but before acking. The result is…",
    options: ["Message lost", "Message requeued; possible duplicate processing", "Message dead-lettered automatically", "RabbitMQ detects the work was done"],
    answer: 1,
    explanation: "Unacked messages are requeued on connection close — at-least-once means duplicates are possible.",
  },
  {
    id: "f4",
    question: "What is required for a message to survive a broker restart (classic queue)?",
    options: ["Durable queue only", "Persistent message only", "Durable queue AND persistent message", "Publisher confirms"],
    answer: 2,
    explanation: "The queue definition must survive (durable) and the message must be on disk (persistent).",
  },
  {
    id: "f5",
    question: "A publisher confirm for a message tells you…",
    options: ["A consumer processed it", "The broker accepted responsibility for it", "It was delivered exactly once", "It was routed to a DLQ"],
    answer: 1,
    explanation: "Confirms cover the publisher → broker hop only.",
  },
  {
    id: "f6",
    question: "One slow consumer holds hundreds of unacked messages while others are idle. Best first fix?",
    options: ["Add more consumers", "Lower the prefetch count", "Switch to a fanout exchange", "Enable auto-ack"],
    answer: 1,
    explanation: "A lower prefetch stops the broker from parking messages on the slow consumer.",
  },
  {
    id: "f7",
    question: "Messages that fail permanently should…",
    options: ["Be nacked with requeue=true until they succeed", "Be dead-lettered to a DLQ and alerted on", "Be silently acked and ignored", "Be republished immediately"],
    answer: 1,
    explanation: "Retrying a permanent failure never succeeds; park it, alert, fix and replay.",
  },
  {
    id: "f8",
    question: "A 3-node quorum queue loses 2 nodes. It…",
    options: ["Keeps working on 1 node", "Becomes unavailable until a majority is back", "Loses all committed messages", "Becomes a classic queue"],
    answer: 1,
    explanation: "Raft needs a majority; 1 of 3 isn't one.",
  },
  {
    id: "f9",
    question: "Which requirement points most strongly to Kafka?",
    options: ["Per-message retries with backoff", "Header-based routing", "Replaying last week's events for a new consumer group", "Fair dispatch of slow jobs"],
    answer: 2,
    explanation: "Retention and replay by offset are Kafka's core strengths.",
  },
  {
    id: "f10",
    question: "An unroutable message, published without `mandatory` to an exchange with no alternate exchange, is…",
    options: ["Dead-lettered", "Dropped", "Held in the exchange", "Returned to the publisher"],
    answer: 1,
    explanation: "Exchanges don't store messages; without mandatory or an AE it's discarded.",
  },
];

export const MENTAL_MODEL: { label: string; detail: string }[] = [
  { label: "Producer", detail: "publishes to an exchange with a routing key; waits for a confirm" },
  { label: "Exchange", detail: "routes by type + bindings; never stores" },
  { label: "Queue", detail: "stores (durable/quorum); delivers to one competing consumer at a time" },
  { label: "Consumer", detail: "prefetch-limited; acks after the work is committed; idempotent" },
  { label: "Failure path", detail: "nack → retry queue (TTL) → … → DLX → DLQ → alert → replay" },
];

export const PRODUCTION_CHECKLIST: string[] = [
  "Quorum queues (or durable classic) for important work; odd-sized cluster across zones",
  "Persistent messages + publisher confirms with timeout and retry",
  "Manual acks after the side effect commits; sensible prefetch",
  "Idempotent consumers keyed on a stable message ID",
  "Transactional outbox if a DB write and a publish must both happen",
  "Delayed retries with a cap; DLX/DLQ for poison and permanent failures",
  "Alerts: queue depth growth, publish vs ack rate, unacked, redeliveries, DLQ depth, memory/disk alarms",
  "Queue length limits for back-pressure on unbounded producers",
  "One connection per process, channels per thread; heartbeats and reconnect logic",
  "TLS, per-service users with least privilege, management UI kept private",
];
