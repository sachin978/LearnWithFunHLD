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

// Scenario-based questions: each tests reasoning about a real situation, and
// every wrong option explains why it fails so mistakes teach something.
export const FINAL_ASSESSMENT: QuizQuestion[] = [
  {
    id: "f1",
    question:
      "Billing and analytics must both receive every `order.placed` event, and billing runs 5 worker processes that should share billing's work. Which topology?",
    options: [
      "One queue bound to a fanout exchange; all 6 processes consume from it",
      "A fanout (or topic) exchange with one queue per service: billing's 5 workers share the billing queue, analytics consumes its own queue",
      "Two exchanges, one per service, and the producer publishes every event twice",
      "A direct exchange with 6 queues, one per process",
    ],
    answer: 1,
    explanation: "Copies are made per queue; competition happens per consumer. One queue per service, and a service's workers share its queue.",
    optionWhy: [
      "Consumers on one queue compete: each event would reach only one of the six processes, so billing or analytics would miss events.",
      "",
      "It works, but the producer now knows every consumer — exactly the coupling exchanges and bindings exist to remove.",
      "Each billing worker would get its own copy, so every event would be billed five times.",
    ],
  },
  {
    id: "f2",
    question: "Routing key `payments.eu.failed`. Which binding on a topic exchange matches it?",
    options: ["`payments.*`", "`*.failed`", "`payments.#`", "`payments.failed`"],
    answer: 2,
    explanation: "Only `#` can absorb more than one word; `*` matches exactly one.",
    optionWhy: [
      "`*` matches exactly one word, so this matches `payments.failed` but not a three-word key.",
      "Also exactly two words — `*` can't absorb `eu`.",
      "",
      "Without wildcards a topic binding behaves like an exact match, and the keys differ.",
    ],
  },
  {
    id: "f3",
    question: "A consumer uses manual acks. It charges the customer, then crashes before acking. What happens?",
    options: ["The message is lost", "The message is requeued and may be processed again — so the charge must be idempotent", "The message is dead-lettered automatically", "RabbitMQ detects that the charge happened"],
    answer: 1,
    explanation: "Unacked messages are requeued when the connection closes. At-least-once delivery means duplicates are possible, so consumers must be idempotent.",
    optionWhy: [
      "With manual acks the broker keeps the message until it's acked; it isn't lost.",
      "",
      "Dead-lettering needs a reject/nack with requeue=false, an expiry or a delivery limit — a closed connection requeues instead.",
      "The broker only sees acks; it can't know your database write or charge happened.",
    ],
  },
  {
    id: "f4",
    question: "Which combination makes a message survive a broker restart (classic queue)?",
    options: ["A durable queue only", "A persistent message only", "A durable queue AND a persistent message", "Publisher confirms"],
    answer: 2,
    explanation: "The queue definition must survive (durable) and the message must be written to disk (persistent).",
    optionWhy: [
      "The queue definition survives, but transient messages in it are lost on restart.",
      "If the queue itself is transient, it's deleted on restart — along with its messages.",
      "",
      "Confirms tell the publisher the broker accepted a message; they don't make a transient queue or message durable.",
    ],
  },
  {
    id: "f5",
    question: "Your producer receives a publisher confirm for message #9. What do you now know?",
    options: ["A consumer processed it", "The broker accepted responsibility for it", "It will be delivered exactly once", "It was routed to a dead-letter queue"],
    answer: 1,
    explanation: "Confirms cover only the publisher → broker hop.",
    optionWhy: [
      "Confirms say nothing about consumption — that's what consumer acks track.",
      "",
      "RabbitMQ doesn't guarantee exactly-once; a lost confirm followed by a retry can even create a duplicate.",
      "Confirms say nothing about dead-lettering; even unroutable messages are confirmed (after being returned, if mandatory is set).",
    ],
  },
  {
    id: "f6",
    question: "One slow consumer holds hundreds of unacked messages while the other consumers sit idle. Best first fix?",
    options: ["Add more consumers", "Lower the prefetch count", "Switch to a fanout exchange", "Enable auto-ack"],
    answer: 1,
    explanation: "A lower prefetch stops the broker from parking messages on the slow consumer, so free consumers pick them up.",
    optionWhy: [
      "The slow consumer keeps the messages it was already sent; new consumers would sit idle too.",
      "",
      "Fanout copies messages to queues; it doesn't change how one queue distributes to its consumers.",
      "Auto-ack removes the prefetch limit's effect and loses messages whenever a consumer crashes.",
    ],
  },
  {
    id: "f7",
    question: "A message fails because its JSON is malformed. The consumer calls `basic.nack(requeue=true)` on every failure. What happens?",
    options: [
      "It's retried a few times with growing delays, then dropped",
      "It's redelivered immediately, over and over — a hot loop that wastes CPU and delays other work (until a quorum queue's delivery limit, if any, dead-letters it)",
      "RabbitMQ moves it to the dead-letter queue after the first failure",
      "It's delivered to a different consumer, which parses it correctly",
    ],
    answer: 1,
    explanation: "Permanent failures should be rejected with requeue=false so a DLX parks them; transient failures should retry with a delay via retry queues.",
    optionWhy: [
      "Requeueing has no built-in delay, and only quorum queues enforce a delivery limit.",
      "",
      "That happens only with requeue=false and a configured dead-letter exchange.",
      "The message itself is malformed — every consumer will fail on it.",
    ],
  },
  {
    id: "f8",
    question: "A 3-replica quorum queue loses 2 nodes. What does it do?",
    options: ["Keeps working on the remaining node", "Becomes unavailable until a majority is back", "Loses all committed messages", "Converts into a classic queue"],
    answer: 1,
    explanation: "Raft needs a majority to commit; 1 of 3 isn't one, so it stops serving rather than risk diverging data.",
    optionWhy: [
      "A single replica can't form a majority, so it refuses to serve to avoid diverging data.",
      "",
      "Committed entries remain on the surviving replica and the failed nodes' disks; the queue is unavailable, not erased.",
      "Queue types never change automatically.",
    ],
  },
  {
    id: "f9",
    question: "Which requirement points most strongly towards Kafka (or a RabbitMQ Stream) rather than a classic queue?",
    options: ["Per-message retries with backoff", "Routing on message headers", "A new consumer group must replay last week's events", "Fair dispatch of slow jobs across workers"],
    answer: 2,
    explanation: "Retention and replay by offset are what logs provide; queues delete messages once they're acked.",
    optionWhy: [
      "A natural fit for RabbitMQ: retry queues, dead-letter exchanges and delivery limits.",
      "Rich routing (headers and topic exchanges) is a RabbitMQ strength.",
      "",
      "Competing consumers with prefetch on one queue is a classic RabbitMQ pattern.",
    ],
  },
  {
    id: "f10",
    question: "A message is published without `mandatory` to an exchange with no matching binding and no alternate exchange. What happens to it?",
    options: ["It's dead-lettered", "It's dropped", "It waits in the exchange", "It's returned to the publisher"],
    answer: 1,
    explanation: "Exchanges don't store messages; without mandatory or an alternate exchange, an unroutable message is discarded.",
    optionWhy: [
      "Dead-lettering applies to messages rejected or expired in a queue; this one never reached a queue.",
      "",
      "Exchanges never store messages.",
      "Only if the publisher set mandatory (and handles basic.return).",
    ],
  },
  {
    id: "f11",
    question: "Events for one order (created → paid → shipped) must be processed in order, but you need many consumers for throughput. What works?",
    options: [
      "One queue with 10 consumers and prefetch 1",
      "Route by order_id to N queues (e.g. a consistent-hash exchange), each processed by a single active consumer",
      "A fanout exchange so every consumer sees every event",
      "Add timestamps and sort inside each consumer",
    ],
    answer: 1,
    explanation: "Partition by key: all events for one order land in one queue that's processed sequentially, while different orders proceed in parallel.",
    optionWhy: [
      "Consumers work concurrently, so two events for the same order can finish out of order.",
      "",
      "Every consumer would process every event — duplicates, not ordering.",
      "Each consumer sees messages one at a time; sorting can't fix order across concurrent consumers, and clocks drift.",
    ],
  },
  {
    id: "f12",
    question: "Your order service saves an order in its database and then publishes `order.placed`, but it crashes between the two. What prevents the event from being lost?",
    options: [
      "Publisher confirms",
      "A transactional outbox: write the event to an outbox table in the same database transaction, and a relay publishes it",
      "Durable queues",
      "Auto-ack on the consumer",
    ],
    answer: 1,
    explanation: "The outbox makes \"save the order\" and \"record the event\" atomic. The relay publishes with confirms and may publish twice, so consumers stay idempotent.",
    optionWhy: [
      "Confirms only help once you publish — the crash happened before publishing.",
      "",
      "Durability protects messages already in the broker; this one never got there.",
      "The consumer's ack mode is irrelevant to a message that was never published.",
    ],
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
