import type { Chapter } from "@/lib/learn/types";

const COMPOSE = `services:
  rabbitmq:
    image: rabbitmq:4-management
    container_name: rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: \${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: \${RABBITMQ_PASSWORD}
    ports:
      # Bound to localhost only — never expose these publicly.
      - "127.0.0.1:5672:5672"     # AMQP (your apps)
      - "127.0.0.1:15672:15672"   # Management UI (optional)
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq

volumes:
  rabbitmq-data:
`;

const ENV = `# .env — local development only. Use a secret manager in production.
RABBITMQ_USER=app
RABBITMQ_PASSWORD=change-me-locally
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
`;

const TOPOLOGY = `# topology.py — declare exchanges, queues and bindings (safe to run repeatedly)
EXCHANGE = "reports"                 # topic exchange that producers publish to
DLX = "reports.dlx"                  # dead-letter exchange
QUEUE = "reports.pdf-jobs"           # work queue for PDF reports
DLQ = "reports.pdf-jobs.dlq"         # parking lot for jobs that can't be processed
BINDING_KEY = "report.pdf.*"         # matches report.pdf.monthly, report.pdf.weekly, ...


def declare(channel):
    channel.exchange_declare(exchange=EXCHANGE, exchange_type="topic", durable=True)
    channel.exchange_declare(exchange=DLX, exchange_type="fanout", durable=True)

    channel.queue_declare(queue=DLQ, durable=True)
    channel.queue_bind(queue=DLQ, exchange=DLX)

    channel.queue_declare(
        queue=QUEUE,
        durable=True,
        arguments={
            "x-queue-type": "quorum",          # replicated, durable work queue
            "x-dead-letter-exchange": DLX,     # rejected messages go here
            "x-delivery-limit": 5,             # safety net against poison messages
        },
    )
    channel.queue_bind(queue=QUEUE, exchange=EXCHANGE, routing_key=BINDING_KEY)
`;

const CONNECTION = `# connection.py — one place for connection settings (read from the environment)
import os

import pika


def connect():
    credentials = pika.PlainCredentials(
        os.environ["RABBITMQ_USER"], os.environ["RABBITMQ_PASSWORD"]
    )
    params = pika.ConnectionParameters(
        host=os.environ.get("RABBITMQ_HOST", "localhost"),
        port=int(os.environ.get("RABBITMQ_PORT", "5672")),
        credentials=credentials,
        heartbeat=30,
    )
    return pika.BlockingConnection(params)
`;

const PRODUCER = `# producer.py — publish a report job to the topic exchange
#   python producer.py report.pdf.monthly          → routed to the work queue
#   python producer.py invoice.pdf.monthly         → no binding matches (unroutable)
#   python producer.py report.pdf.weekly --poison  → consumer rejects it → DLQ
import json
import sys
import uuid

import pika

import topology
from connection import connect

routing_key = sys.argv[1] if len(sys.argv) > 1 else "report.pdf.monthly"
poison = "--poison" in sys.argv

connection = connect()
channel = connection.channel()
topology.declare(channel)

# Publisher confirms: basic_publish now raises if the broker nacks the
# message or (because mandatory=True) no queue is bound for the routing key.
channel.confirm_delivery()

job = {"report_id": 101, "period": routing_key.split(".")[-1]}
if poison:
    job["poison"] = True  # the consumer treats this as a permanent failure
message_id = str(uuid.uuid4())

try:
    channel.basic_publish(
        exchange=topology.EXCHANGE,
        routing_key=routing_key,
        body=json.dumps(job),
        properties=pika.BasicProperties(
            content_type="application/json",
            delivery_mode=pika.DeliveryMode.Persistent,
            message_id=message_id,  # used by the consumer for idempotency
        ),
        mandatory=True,
    )
    print(f" [x] Confirmed {routing_key} ({message_id})")
except pika.exceptions.UnroutableError:
    print(f" [!] Unroutable: no queue is bound for '{routing_key}'")
except pika.exceptions.NackError:
    print(" [!] Broker nacked the message — retry with backoff")
finally:
    connection.close()
`;

const CONSUMER = `# consumer.py — process report jobs: ack on success, dead-letter permanent failures
import json
import time

import topology
from connection import connect

processed_ids = set()  # demo only — use a DB table with a unique constraint


class PermanentError(Exception):
    """A failure that retrying can never fix (bad input, missing data)."""


def build_report(job):
    if job.get("poison"):
        raise PermanentError("invalid report definition")
    time.sleep(2)  # pretend to build a PDF


def handle(ch, method, properties, body):
    if properties.message_id in processed_ids:
        print(f" [=] Duplicate {properties.message_id}, skipping")
        ch.basic_ack(delivery_tag=method.delivery_tag)
        return

    job = json.loads(body)
    print(f" [>] {method.routing_key}: report {job['report_id']}"
          f" (redelivered={method.redelivered})")
    try:
        build_report(job)
    except PermanentError as exc:
        print(f" [x] Permanent failure ({exc}) -> dead-letter queue")
        # requeue=False → the queue's dead-letter exchange receives it
        ch.basic_reject(delivery_tag=method.delivery_tag, requeue=False)
        return

    processed_ids.add(properties.message_id)
    ch.basic_ack(delivery_tag=method.delivery_tag)  # only after the work is done
    print(f" [✓] Done report {job['report_id']}")


connection = connect()
channel = connection.channel()
topology.declare(channel)
channel.basic_qos(prefetch_count=1)  # fair dispatch: one unacked job at a time
channel.basic_consume(queue=topology.QUEUE, on_message_callback=handle, auto_ack=False)

print(" [*] Waiting for report jobs. CTRL+C to exit")
try:
    channel.start_consuming()
except KeyboardInterrupt:
    channel.stop_consuming()
finally:
    connection.close()
`;

const RUN = `# 1. Start RabbitMQ (reads RABBITMQ_USER / RABBITMQ_PASSWORD from .env)
docker compose up -d

# 2. Create a virtualenv and install the client
python -m venv .venv && source .venv/bin/activate
pip install "pika==1.3.2"

# 3. Load the env vars into your shell
set -a && source .env && set +a

# 4. Terminal 1 — start the worker
python consumer.py

# 5. Terminal 2 — try the three scenarios
python producer.py report.pdf.monthly          # matches report.pdf.* → processed
python producer.py invoice.pdf.monthly         # no binding matches → unroutable
python producer.py report.pdf.weekly --poison  # rejected → dead-letter queue

# 6. Inspect the queues (the DLQ now holds the poison job)
docker exec rabbitmq rabbitmqctl list_queues name messages

# 7. Crash test: publish again and press CTRL+C in terminal 1 within 2 s,
#    then restart the consumer and watch the job come back.

# Optional: management UI at http://localhost:15672
`;

const OUTPUT = `# Terminal 2 (producer)
 [x] Confirmed report.pdf.monthly (5089215f-f68a-4f9d-ac95-200c99b31ac8)
 [!] Unroutable: no queue is bound for 'invoice.pdf.monthly'
 [x] Confirmed report.pdf.weekly (2a57ef68-cd89-4647-b9a7-317b9c1b2dad)

# Terminal 1 (consumer)
 [*] Waiting for report jobs. CTRL+C to exit
 [>] report.pdf.monthly: report 101 (redelivered=False)
 [✓] Done report 101
 [>] report.pdf.weekly: report 101 (redelivered=False)
 [x] Permanent failure (invalid report definition) -> dead-letter queue

# rabbitmqctl list_queues name messages
reports.pdf-jobs.dlq    1
reports.pdf-jobs        0

# Crash test: consumer killed 1 s into a job, then restarted
 [>] report.pdf.monthly: report 101 (redelivered=False)
 ...killed...
 [*] Waiting for report jobs. CTRL+C to exit
 [>] report.pdf.monthly: report 101 (redelivered=True)
 [✓] Done report 101
`;

export const CHAPTERS_PART_2: Chapter[] = [
  // ─── 7 ─────────────────────────────────────────────────────────────────────
  {
    id: "retries-dlx",
    number: 7,
    title: "Retries, dead-letter exchanges and poison messages",
    navTitle: "Retries & DLX",
    minutes: 9,
    problem:
      "Some failures fix themselves (a timeout, a deadlock, a 503). Others never will (malformed JSON, a deleted customer). Requeueing everything instantly creates a hot loop that burns CPU, floods logs and can block the queue. You need delayed retries for the first kind and a parking lot for the second.",
    simple:
      "Retry a few times **with a delay**, then move the message to a **dead-letter queue** where a human or tool can inspect it. Never retry forever.",
    analogy:
      "A courier who finds nobody home tries again tomorrow, and the day after. After three attempts the parcel goes to the depot's \"undeliverable\" shelf — it doesn't keep circling the block every ten seconds.",
    walkthrough: [
      "Attempt 1 fails with a transient timeout.",
      "The consumer republishes the message to a retry queue (with an attempt counter) and acks the original.",
      "The retry queue's TTL expires; its dead-letter exchange routes the message back to the main queue.",
      "After the final attempt, the message is rejected with `requeue=false` and dead-lettered to `orders.dlq`.",
      "An alert fires on DLQ depth; an engineer fixes the issue and replays.",
    ],
    technical: [
      "A **dead-letter exchange (DLX)** is set on a queue (`x-dead-letter-exchange`, optionally `x-dead-letter-routing-key`) or via policy. Messages are dead-lettered when they are **rejected/nacked with requeue=false**, when their **TTL expires**, or when the queue **exceeds its length limit** (with `overflow=reject-publish-dlx` or the default drop-head). Quorum queues also dead-letter when the **delivery limit** is exceeded.",
      "Dead-lettered messages get an **`x-death`** header recording queue, reason (`rejected`, `expired`, `maxlen`, `delivery_limit`) and count — useful for debugging and for counting retries in TTL-based loops.",
      "RabbitMQ does **not** give every queue type a configurable \"retry N times\" setting. **Classic queues** have no delivery limit — `nack(requeue=true)` can loop forever. **Quorum queues** track `x-delivery-count` and support a **delivery limit** (default 20 since RabbitMQ 4.0; unlimited in 3.x unless set), after which the message is dead-lettered or dropped.",
      "**Delayed retry patterns:** (1) retry queues with a message/queue TTL whose DLX points back to the work exchange — optionally one queue per delay tier (5s, 30s, 5m); (2) the community *delayed message exchange* plugin; (3) application-level retry counters in headers. Pick one and make attempts visible in logs.",
      "Avoid **per-message TTL on a shared retry queue** with mixed delays: classic queues only expire messages from the head, so a 5-minute message can block a 5-second one behind it. Use one queue per delay tier.",
      "**Poison message:** one that fails every time. Immediate requeue makes it bounce back to the head, repeatedly — burning resources and, with low prefetch, starving other messages. The cure is a delivery limit plus a DLQ.",
      "**Recommendation:** classify errors. Transient (timeouts, 5xx, lock contention) → delayed retry with backoff and a cap. Permanent (validation, 4xx, deserialization) → dead-letter immediately. Alert on DLQ depth and build a replay tool.",
    ],
    mistakes: [
      { myth: "`nack(requeue=true)` is a retry strategy.", reality: "It's an immediate retry with no delay or limit (on classic queues) — a recipe for hot loops." },
      { myth: "RabbitMQ retries failed messages automatically N times.", reality: "Only quorum queues have a delivery limit. Delays and attempt counters are a pattern you build." },
      { myth: "A DLQ is a trash can.", reality: "It's a parking lot. Monitor it, alert on it and have a way to replay messages." },
    ],
    interview: [
      {
        q: "How would you handle messages that keep failing?",
        short: "Classify errors; retry transient ones with exponential backoff via TTL retry queues up to a cap; dead-letter permanent failures and alert on DLQ depth.",
        detailed: ["Use quorum queue delivery limits as a safety net against poison messages, keep consumers idempotent because retries cause duplicates, and provide a replay path once fixed."],
      },
    ],
    takeaways: [
      "Never requeue forever; add delay and a cap.",
      "DLX triggers: rejected (requeue=false), expired, length limit, delivery limit.",
      "Classic queues have no delivery limit; quorum queues do.",
      "Alert on the DLQ and plan for replay.",
    ],
    quiz: [
      {
        id: "q7-1",
        question: "Which event does NOT cause a message to be dead-lettered (assuming a DLX is configured)?",
        options: ["Consumer nacks with requeue=false", "Message TTL expires in the queue", "Published to an exchange with no matching binding", "Quorum queue delivery limit exceeded"],
        answer: 2,
        explanation: "Unroutable messages never entered a queue. They're dropped, returned (mandatory) or sent to an alternate exchange.",
      },
      {
        id: "q7-2",
        question: "Why is a separate retry queue with a TTL better than nack(requeue=true)?",
        options: ["It's faster", "It adds a delay so transient issues can recover and avoids hot loops", "It guarantees exactly-once processing", "It removes the need for a DLQ"],
        answer: 1,
        explanation: "Immediate requeue redelivers right away, often repeatedly. A TTL-based retry adds backoff.",
      },
    ],
  },

  // ─── 8 ─────────────────────────────────────────────────────────────────────
  {
    id: "scaling",
    number: 8,
    title: "Scaling, ordering and queue backpressure",
    navTitle: "Scaling & backlog",
    minutes: 8,
    problem:
      "Queues hide overload — until they don't. If messages arrive faster than you process them, the backlog grows without limit, latency climbs, memory fills and eventually the broker throttles publishers.",
    simple:
      "Watch two numbers: **arrival rate** and **processing rate**. If arrivals win, the queue grows. Add consumers until processing wins — as long as whatever they call can keep up too.",
    analogy:
      "A highway toll plaza: open more booths and the line shrinks — until the road after the plaza is the bottleneck. Then extra booths just move the jam downstream.",
    walkthrough: [
      "Set the producer rate, the number of workers and their speed.",
      "Each tick, `rate` messages arrive and up to `workers × speed` finish.",
      "If arrivals exceed capacity, depth rises by the difference every tick; otherwise it drains.",
      "This is a conceptual model — not a benchmark.",
    ],
    technical: [
      "**Little's law** intuition: wait time ≈ queue depth ÷ processing rate. Depth 1,000 at 50 msg/s ≈ 20 s extra latency.",
      "**Scale consumers horizontally** — more processes on the same queue. It works until a shared dependency saturates: database connections/locks, external API rate limits, CPU-heavy work, or very large messages (consider storing payloads in object storage and sending a reference).",
      "**Ack latency** matters: with prefetch 1, each message costs a network round-trip. Raising prefetch (or acking with `multiple=True`) improves throughput for fast tasks.",
      "**Ordering:** a single queue is FIFO, but with **multiple consumers or redeliveries, processing order is not guaranteed** — message 2 can finish before message 1, and a requeued message comes back later. If per-entity order matters, use a single active consumer (`x-single-active-consumer`) or shard by key across queues (e.g. the consistent-hash exchange plugin) so each entity maps to one consumer.",
      "**Hot queues:** a single queue lives on one node (its leader for quorum queues). One huge queue can't use the whole cluster — split by tenant/type to spread load.",
      "**Backpressure:** set queue length limits (`x-max-length`, with `overflow=reject-publish` so publishers get nacks), and rely on memory/disk alarms as a last line of defence — when they trigger, RabbitMQ blocks publishing connections.",
      "**Monitor:** messages ready, messages unacked, publish vs deliver/ack rates, consumer count and utilisation, redelivery rate, DLQ depth, and memory/disk alarms. Alert on *sustained* growth, not single spikes.",
    ],
    mistakes: [
      { myth: "More consumers always means more throughput.", reality: "Throughput caps at the slowest shared dependency. Past that, more consumers add contention." },
      { myth: "RabbitMQ queues guarantee processing order.", reality: "Delivery is FIFO per queue, but concurrent consumers and redeliveries reorder processing." },
      { myth: "A big backlog is fine — it's a queue.", reality: "Backlog is latency. Large backlogs also use memory/disk and slow recovery." },
    ],
    interview: [
      {
        q: "Your queue backlog keeps growing. What do you check?",
        short: "Compare publish vs ack rate, check consumer count/health, unacked counts, redelivery/error rates, and the downstream dependency's latency.",
        detailed: [
          "If consumers are healthy but saturated → scale them (autoscale on queue depth). If they're blocked on a DB or API → fix or rate-limit that first.",
          "High redelivery → poison messages; check the DLQ. High unacked with idle CPU → prefetch or ack bugs.",
        ],
      },
    ],
    takeaways: [
      "Depth grows by (arrival − processing) per unit time.",
      "Scale consumers until a shared dependency becomes the bottleneck.",
      "Concurrent consumers break processing order; partition by key if order matters.",
    ],
    quiz: [
      {
        id: "q8-1",
        question: "Messages arrive at 120/s. You have 4 consumers each processing 25/s. What happens to queue depth?",
        options: ["Stays flat", "Grows by 20/s", "Shrinks by 20/s", "Grows by 100/s"],
        answer: 1,
        explanation: "Capacity is 4 × 25 = 100/s; 120 − 100 = 20 more messages per second.",
      },
      {
        id: "q8-2",
        question: "You need all events for the same order processed in order. Which is a valid approach?",
        options: ["Add more consumers to one queue", "Set prefetch to 500", "Route by order ID to one of N queues, each with a single active consumer", "Use a fanout exchange"],
        answer: 2,
        explanation: "Partitioning by key keeps each order on one sequential consumer while still scaling across N queues.",
      },
    ],
  },

  // ─── 9 ─────────────────────────────────────────────────────────────────────
  {
    id: "queue-types",
    number: 9,
    title: "Queue types, quorum queues and high availability",
    navTitle: "Quorum queues & HA",
    minutes: 8,
    problem:
      "A queue's contents normally live on one node. If that node dies, the queue is unavailable — and if its disk is lost, so are the messages. Production systems need replicated queues and to understand what replication can and can't promise.",
    simple:
      "**Classic queues** are simple and fast but live on one node. **Quorum queues** keep copies on several nodes and keep working as long as a **majority** of them are up. **Streams** are append-only logs you can re-read.",
    analogy:
      "A quorum queue is a committee that only makes decisions when most members are in the room. Lose one of three and it carries on; lose two and it stops — rather than let one member make decisions alone and contradict the others later.",
    walkthrough: [
      "A 3-replica quorum queue: one leader, two followers.",
      "A publish is appended by the leader and replicated.",
      "Once a majority (2/3) has it, it's committed and confirmed.",
      "The leader fails; the remaining majority elects a new leader.",
      "A second failure leaves no majority: the queue becomes unavailable.",
    ],
    technical: [
      "**Classic queues** store data on a single node. Their replication options depend on version: classic *mirrored* queues were deprecated in 3.9 and **removed in RabbitMQ 4.0**. Don't assume a classic queue is replicated.",
      "**Quorum queues** use the Raft consensus algorithm. Writes go through a leader and are committed once a majority of replicas have persisted them. A cluster of *N* replicas tolerates ⌊(N−1)/2⌋ failures: 3 tolerates 1, 5 tolerates 2.",
      "When a majority is unavailable, a quorum queue **stops serving** publishes and deliveries — favouring consistency over availability (CP in CAP terms).",
      "Quorum queues are always durable, persist every message, support delivery limits and poison-message handling, but don't support some classic features (e.g. non-durable/exclusive queues, global QoS) and use more disk and network.",
      "**Streams** (3.9+) are replicated, append-only logs. Consumers read from an offset and messages are retained by size/time rather than deleted on ack — useful for replay and large fan-out, and similar in spirit to Kafka.",
      "A three-node diagram is illustrative. Real HA also needs nodes in separate failure domains, enough disk, monitoring, client reconnection logic and tested upgrades. Quorum queues reduce, but do not eliminate, data loss and operational risk (e.g. losing a majority of disks).",
    ],
    table: {
      caption: "Choosing a queue type",
      headers: ["Need", "Classic", "Quorum", "Stream"],
      rows: [
        ["Survive node loss", "No (single node)", "Yes, with a majority up", "Yes, with a majority up"],
        ["Replay old messages", "No", "No", "Yes (by offset)"],
        ["Poison-message limit", "No", "Yes (delivery limit)", "N/A"],
        ["Typical use", "Transient/temporary data, low latency", "Default for important work queues", "Event history, large fan-out, replay"],
      ],
    },
    mistakes: [
      { myth: "Classic queues are replicated across the cluster.", reality: "Only definitions are cluster-wide. Classic queue contents live on one node (mirroring is gone in 4.0)." },
      { myth: "Quorum queues can't lose data.", reality: "They tolerate a minority of failures. Lose a majority of replicas' disks and data can be lost." },
      { myth: "A 2-node cluster gives high availability.", reality: "2 replicas need both up for a majority. Use an odd number — 3 or 5." },
    ],
    interview: [
      {
        q: "How do you handle a RabbitMQ node failure?",
        short: "Use quorum queues on a 3+ node cluster across failure domains; clients reconnect to surviving nodes and a new leader is elected.",
        detailed: ["Combine with publisher confirms (retry on timeout), idempotent consumers (for redelivery after failover) and alerting on cluster partitions and quorum status."],
      },
    ],
    takeaways: [
      "Classic = single node. Quorum = Raft replication, majority required.",
      "3 replicas tolerate 1 failure; 5 tolerate 2.",
      "Streams = replicated log with replay.",
    ],
    quiz: [
      {
        id: "q9-1",
        question: "A quorum queue has 5 replicas. How many can fail while it stays available?",
        options: ["1", "2", "3", "4"],
        answer: 1,
        explanation: "A majority of 5 is 3, so up to 2 can fail.",
      },
      {
        id: "q9-2",
        question: "What does a quorum queue do when only 1 of 3 replicas is up?",
        options: ["Keeps accepting writes on the survivor", "Becomes unavailable until a majority returns", "Converts to a classic queue", "Drops all messages"],
        answer: 1,
        explanation: "Without a majority it can't commit safely, so it stops serving rather than diverge.",
      },
    ],
  },

  // ─── 10 ────────────────────────────────────────────────────────────────────
  {
    id: "vs-kafka",
    number: 10,
    title: "RabbitMQ vs Kafka",
    navTitle: "RabbitMQ vs Kafka",
    minutes: 8,
    problem:
      "\"Should we use RabbitMQ or Kafka?\" comes up in nearly every system design interview involving async work. The honest answer depends on whether you need a smart router that hands out tasks, or a durable log that many consumers read at their own pace.",
    simple:
      "**RabbitMQ** is a message broker: it routes messages to queues and deletes them once processed. **Kafka** is a distributed log: it appends events and keeps them for a set time; consumers track their own position and can re-read.",
    analogy:
      "RabbitMQ is a post office: letters are sorted, delivered and then they're gone from the post office. Kafka is a newspaper archive: each edition is kept, and every reader keeps their own bookmark.",
    walkthrough: [
      "Both systems hold the same four events.",
      "RabbitMQ deletes messages on ack; Kafka only advances a consumer group's offset.",
      "A second Kafka consumer group reads everything independently.",
      "Kafka can replay by resetting an offset; a classic RabbitMQ queue can't.",
    ],
    technical: [
      "These are tendencies, not hard limits: RabbitMQ Streams add log-style retention and replay, and Kafka can implement work-queue patterns via consumer groups (and newer share-group features).",
      "Neither is universally \"faster\". Kafka is optimised for very high sustained throughput with batching and sequential disk I/O. RabbitMQ is optimised for flexible routing and per-message delivery/acknowledgment with low latency at moderate throughput.",
    ],
    table: {
      caption: "RabbitMQ vs Kafka at a glance",
      headers: ["Dimension", "RabbitMQ", "Kafka"],
      rows: [
        ["Core model", "Broker with exchanges → queues", "Distributed, partitioned, append-only log"],
        ["Primary use", "Task distribution, RPC-ish workflows, flexible routing", "Event streaming, event sourcing, analytics pipelines"],
        ["Routing", "Rich: direct, topic, fanout, headers", "By topic + partition key; filtering is in consumers"],
        ["Retention", "Deleted after ack (Streams retain)", "Retained by time/size, independent of consumption"],
        ["Replay", "Not for queues; yes for Streams", "Yes — reset the consumer offset"],
        ["Consumer model", "Broker pushes; per-message acks", "Consumers pull; commit offsets"],
        ["Work distribution", "Competing consumers on a queue", "Partitions assigned within a consumer group"],
        ["Ordering", "FIFO per queue; concurrency reorders processing", "Ordered per partition"],
        ["Scaling", "More consumers; split queues; quorum queues", "More partitions (max parallelism = partitions per group)"],
        ["Delivery semantics", "At-most/at-least-once; idempotent consumers", "At-least-once; exactly-once within Kafka via transactions"],
        ["Ops complexity", "Simpler to start; per-message features", "More moving parts; tuning partitions and retention"],
      ],
    },
    mistakes: [
      { myth: "Kafka is always better because it's faster.", reality: "For per-task routing, retries and per-message acks, RabbitMQ is often simpler and a better fit." },
      { myth: "RabbitMQ can't retain messages.", reality: "Classic queues delete on ack, but RabbitMQ Streams provide retention and replay." },
      { myth: "Kafka gives global ordering.", reality: "Ordering is per partition only." },
    ],
    interview: [
      {
        q: "When would you choose Kafka over RabbitMQ?",
        short: "When you need retained, replayable event history consumed by many independent groups at high throughput.",
        detailed: ["E.g. clickstream analytics, event sourcing, CDC pipelines. For background jobs with retries and routing, I'd default to RabbitMQ (or a managed queue)."],
      },
    ],
    takeaways: [
      "RabbitMQ: route and distribute tasks; delete on ack.",
      "Kafka: retain an ordered log per partition; consumers own offsets.",
      "Choose by consumption model, not by benchmark headlines.",
    ],
    quiz: [
      {
        id: "q10-1",
        question: "Three independent teams must each process every event, and a new team may need last week's events. Best fit?",
        options: ["RabbitMQ classic queue with competing consumers", "Kafka topic (or RabbitMQ Stream) with separate consumer groups", "A single RabbitMQ queue with prefetch 1", "Direct HTTP webhooks"],
        answer: 1,
        explanation: "Retention + independent offsets let each group read everything, including history.",
      },
    ],
  },

  // ─── 11 ────────────────────────────────────────────────────────────────────
  {
    id: "hands-on",
    number: 11,
    title: "Hands-on: Python producer and consumer",
    navTitle: "Hands-on with Python",
    minutes: 12,
    problem:
      "Concepts click once you see them happen on your own machine. This chapter runs RabbitMQ locally and builds the report-generation flow from earlier chapters with `pika`, the most widely used Python client — including routing keys, an unroutable message, a dead-letter queue and a consumer crash.",
    simple:
      "Start RabbitMQ in Docker, declare an exchange and queues, run a worker, publish jobs with different routing keys, send one that can never succeed, then kill the worker mid-job and watch the job come back.",
    analogy:
      "Same post office as before — now you're the clerk and the courier, and you can pull the plug on the courier to see what happens.",
    walkthrough: [
      "`docker compose up -d` starts RabbitMQ with the management plugin, bound to localhost.",
      "`topology.py` declares a topic exchange `reports`, a quorum work queue bound with `report.pdf.*`, and a dead-letter exchange + queue. Both scripts call it, because declarations are idempotent.",
      "The producer enables publisher confirms and publishes a persistent JSON job with a routing key and `mandatory=True`.",
      "`report.pdf.monthly` matches the binding and is processed; `invoice.pdf.monthly` matches nothing and is returned as unroutable.",
      "A poison job raises a permanent error; the consumer rejects it with `requeue=False`, and the queue's dead-letter exchange routes it to the DLQ.",
      "Kill the consumer mid-job — the unacked message comes back with `redelivered=True` when a consumer reconnects.",
    ],
    technical: [
      "**Ports:** 5672 is AMQP (what apps connect to). 15672 is the optional management UI/HTTP API. The compose file binds both to `127.0.0.1` — in production never publish the management port to the internet; use a VPN/bastion and TLS (AMQPS on 5671).",
      "**Credentials** come from environment variables, not code. RabbitMQ's built-in `guest` user can only connect from localhost by design; create a dedicated user per application.",
      "**Tested:** these scripts were run against the `rabbitmq:4-management` image with **pika 1.3.2**; the expected output below is from that run (message IDs will differ). The compose file mirrors the tested container settings but was not itself run. `pika.DeliveryMode.Persistent` requires pika ≥ 1.3.",
      "**Topology as code:** declaring exchanges, queues and bindings from both producer and consumer means either can start first. Arguments must match everywhere — changing `x-queue-type` or the DLX on an existing queue fails with `PRECONDITION_FAILED`, so you'd delete or migrate the queue instead.",
      "**Failure handling:** permanent errors are rejected with `requeue=False` (→ DLQ immediately). Unexpected exceptions crash the worker; the unacked message is redelivered, and the quorum queue's `x-delivery-limit` of 5 dead-letters it if it keeps failing — a safety net against poison messages.",
      "`BlockingConnection` is the simplest adapter for scripts. For long-running services consider `SelectConnection` or an asyncio client (e.g. `aio-pika`) and add reconnect logic.",
      "**Common errors:** `AMQPConnectionError` — broker not running, wrong host/port, or still starting (wait a few seconds after `docker compose up`). `ProbableAuthenticationError`/`ACCESS_REFUSED` — wrong credentials, or using `guest` from another host. `ChannelClosedByBroker: (406, 'PRECONDITION_FAILED …')` — the queue already exists with different arguments (e.g. durable vs non-durable); delete it or declare it identically. `StreamLostError` — missed heartbeats (often a blocked callback in BlockingConnection).",
      "**Mapping to the animations:** the topic exchange and `report.pdf.*` binding are Chapter 3's routing; the unroutable invoice is Chapter 3's \"no binding matches\" step; `confirm_delivery()` is Chapter 6's publisher-confirm scene; `basic_qos(prefetch_count=1)` is Chapter 4's fair dispatch; ack-after-work and `redelivered=True` are Chapter 5's crash scene; the reject → DLX → DLQ path is Chapter 7.",
    ],
    code: [
      { filename: "docker-compose.yml", language: "yaml", code: COMPOSE, notes: ["`rabbitmq:4-management` includes the management UI.", "Ports are bound to 127.0.0.1 so nothing is exposed beyond your machine.", "A named volume keeps durable queues across container restarts."] },
      { filename: ".env", language: "dotenv", code: ENV, notes: ["Read by Docker Compose and loaded into your shell for the Python scripts.", "Don't commit real secrets — add `.env` to `.gitignore`."] },
      {
        filename: "topology.py",
        language: "python",
        code: TOPOLOGY,
        notes: [
          "A **topic exchange** decouples producers from queues: producers only know `reports` and a routing key.",
          "The work queue is a **quorum queue** (replicated and always durable) with a dead-letter exchange and a delivery limit.",
          "The DLX is a fanout exchange bound to the DLQ, so every dead-lettered message lands there regardless of routing key.",
        ],
      },
      { filename: "connection.py", language: "python", code: CONNECTION, notes: ["Credentials come from environment variables, never from code.", "A 30 s heartbeat lets both sides notice a dead connection."] },
      {
        filename: "producer.py",
        language: "python",
        code: PRODUCER,
        notes: [
          "`confirm_delivery()` puts the channel in confirm mode; `basic_publish` then blocks until the broker acks or nacks.",
          "`mandatory=True` turns \"no queue matched\" into an `UnroutableError` instead of a silent drop — try `invoice.pdf.monthly`.",
          "`delivery_mode=Persistent` asks the broker to write the message to disk; quorum queues persist every message anyway.",
          "`message_id` gives the consumer a stable key for idempotency.",
        ],
      },
      {
        filename: "consumer.py",
        language: "python",
        code: CONSUMER,
        notes: [
          "`basic_qos(prefetch_count=1)` → at most one unacked message for this consumer (fair dispatch).",
          "`basic_ack` only after the work succeeds = at-least-once delivery.",
          "`basic_reject(requeue=False)` sends permanent failures to the dead-letter queue instead of looping forever.",
          "The in-memory `processed_ids` set only demonstrates idempotency; it's lost on restart — use a database unique constraint in real code.",
        ],
      },
      { filename: "terminal", language: "bash", code: RUN },
      { filename: "expected output (from a real run)", language: "text", code: OUTPUT },
    ],
    mistakes: [
      { myth: "It's fine to open a new connection for every publish.", reality: "Connections are expensive. Reuse one per process (the demo opens one per run for simplicity)." },
      { myth: "The `guest/guest` user is fine for apps.", reality: "It only works from localhost and is a security risk. Create per-app users with minimal permissions." },
      { myth: "Expose 15672 so the team can reach the UI.", reality: "Keep the management API private (VPN, SSO proxy) — it can read and delete messages." },
    ],
    interview: [
      { q: "What would you change before running this consumer in production?", short: "DB-backed idempotency, reconnect/backoff logic, a DLX + retry queues, structured logging, metrics, TLS and per-service credentials." },
    ],
    takeaways: [
      "Declare topology as code, identically in every service.",
      "Confirms + mandatory on the producer; manual acks + prefetch on the consumer.",
      "Reject permanent failures to a DLQ; let the delivery limit catch the rest.",
      "Kill the consumer mid-job to see redelivery for yourself.",
    ],
    quiz: [
      {
        id: "q11-1",
        question: "You get `PRECONDITION_FAILED - inequivalent arg 'durable'` when starting the consumer. Most likely cause?",
        options: ["Wrong password", "The queue already exists with a different durable setting", "The broker is down", "Prefetch is too high"],
        answer: 1,
        explanation: "Re-declaring an existing queue with different arguments fails with 406 PRECONDITION_FAILED.",
      },
      {
        id: "q11-2",
        question: "The consumer calls `basic_reject(requeue=False)` on the poison job. Where does the message end up?",
        options: [
          "It's deleted — rejected messages are always discarded",
          "In `reports.pdf-jobs.dlq`, because the work queue's dead-letter exchange `reports.dlx` routes it there",
          "Back at the head of `reports.pdf-jobs` for another attempt",
          "Returned to the producer as unroutable",
        ],
        answer: 1,
        explanation: "With requeue=False, a queue that has `x-dead-letter-exchange` set publishes the message to that exchange; the fanout DLX delivers it to the bound DLQ. Without a DLX it would be discarded.",
        optionWhy: [
          "Only true when the queue has no dead-letter exchange configured.",
          "",
          "That's what requeue=True does — which would loop forever on a poison message.",
          "\"Unroutable\" refers to publishing with no matching binding; this message was routed and delivered fine.",
        ],
      },
    ],
  },

  // ─── 12 ────────────────────────────────────────────────────────────────────
  {
    id: "cheat-sheet",
    number: 12,
    title: "System design interview cheat sheet",
    navTitle: "Interview cheat sheet",
    minutes: 10,
    problem:
      "In an interview you have about five minutes to justify a queue, pick an exchange, and handle failure. This chapter compresses the course into revision cards, scenario answers and a final assessment.",
    simple:
      "Know the pipeline (producer → exchange → queue → consumer), the reliability chain (durable + persistent + confirms + manual acks + idempotency), the failure path (retry with backoff → DLQ), and when Kafka fits better.",
    analogy: "This is the one page you'd photocopy before the exam.",
    walkthrough: [
      "Review the core concept pairs.",
      "Practise the 10 scenario questions — read the short answer first, then expand the detailed version.",
      "Take the final assessment. Your score is computed from your answers.",
    ],
    technical: [
      "**Producer vs consumer:** publishes to an exchange / reads from a queue and acks.",
      "**Exchange vs queue:** routes, never stores / stores and delivers.",
      "**Direct vs fanout vs topic vs headers:** exact key / all queues / word patterns (`*` one, `#` zero-or-more) / header values with `x-match`.",
      "**Routing key vs binding key:** set by the publisher on each message / set on the binding as the rule (or pattern).",
      "**Connection vs channel:** TCP socket, expensive / lightweight multiplexed session.",
      "**Publisher confirm vs consumer ack:** broker → publisher \"I have it\" / consumer → broker \"I processed it\".",
      "**Durable queue vs persistent message:** queue definition survives restart / message is written to disk. You need both.",
      "**Requeue vs dead-letter:** put back for redelivery (immediately) / route to the DLX when rejected with requeue=false, expired, over length or over the delivery limit.",
      "**RabbitMQ vs Kafka:** route and distribute tasks, delete on ack / retained, replayable log per partition.",
    ],
    mistakes: [
      { myth: "\"I'll just add a queue\" is a complete answer.", reality: "Say which exchange, how messages survive failures, how duplicates are handled, and how you monitor backlog." },
      { myth: "Exactly-once is a broker setting.", reality: "Say at-least-once delivery + idempotent consumers." },
    ],
    interview: [
      {
        q: "How would you design asynchronous email delivery?",
        short: "API publishes `user.signed_up` to a topic exchange; an email queue (quorum, durable) feeds stateless workers that call the provider with an idempotency key.",
        detailed: ["Persistent messages + publisher confirms; manual acks; retry 5xx/timeouts via TTL retry queues; dead-letter invalid addresses; alert on DLQ and queue depth; rate-limit to the provider's quota."],
      },
      {
        q: "How would you process orders reliably?",
        short: "Transactional outbox → publisher with confirms → durable quorum queue → idempotent consumers with manual acks → DLQ.",
        detailed: ["Writing the order and the outbox row in one DB transaction removes the \"saved but never published\" gap. Consumers dedupe on order/event ID."],
      },
      {
        q: "What happens if a consumer crashes?",
        short: "Its unacked messages are requeued when the connection closes and redelivered (redelivered=true) to another consumer.",
        detailed: ["Anything acked is gone; anything unacked comes back — possibly after the side effect already happened, hence idempotency."],
      },
      {
        q: "How would you prevent duplicate payments?",
        short: "Stable idempotency key per payment; unique constraint in the same transaction as the effect; pass the key to the payment provider.",
        detailed: ["Duplicates come from producer retries (missing confirm) and consumer redelivery (missing ack). Both are expected under at-least-once."],
      },
      {
        q: "How would you handle repeated message failures?",
        short: "Classify errors, retry transient ones with exponential backoff and a cap, dead-letter permanent ones, alert and replay.",
        detailed: ["Use quorum-queue delivery limits as a backstop against poison messages; never `nack(requeue=true)` in a tight loop."],
      },
      {
        q: "How would you scale workers during a traffic spike?",
        short: "The queue absorbs the burst; autoscale stateless consumers on queue depth / consumer utilisation, within downstream limits.",
        detailed: ["Tune prefetch, ensure the DB/API can take the extra load (or rate-limit), and set a queue length limit with reject-publish for back-pressure."],
      },
      {
        q: "How would you detect and resolve a growing backlog?",
        short: "Alert on sustained growth of messages ready and publish rate > ack rate; then check consumer health, errors/redeliveries and downstream latency.",
        detailed: ["Fix by scaling consumers, fixing a slow dependency, draining poison messages to the DLQ or shedding/deferring low-priority work."],
      },
      {
        q: "How would you design a reliable event notification system?",
        short: "Topic exchange per domain (`orders.*`, `payments.*`); one durable queue per subscriber service; confirms, acks, idempotency, DLQs.",
        detailed: ["Subscribers own their queues and bindings so new consumers don't affect producers. Use an alternate exchange or mandatory flag to catch unroutable events."],
      },
      {
        q: "How would you handle a broker node failure?",
        short: "Quorum queues on an odd-sized (3/5) cluster across zones; clients reconnect and resume; a new leader is elected.",
        detailed: ["Publishers retry unconfirmed messages; consumers handle redeliveries. Monitor quorum status and partitions."],
      },
      {
        q: "When would you use Kafka instead of RabbitMQ?",
        short: "For a retained, replayable event log consumed by many independent groups at high throughput — analytics, event sourcing, CDC.",
        detailed: ["For task queues with routing, per-message acks, retries and priorities, RabbitMQ is usually simpler."],
      },
    ],
    takeaways: [
      "Pipeline: producer → exchange → binding → queue → consumer.",
      "Reliability: durable + persistent + confirms + manual acks + idempotency (+ quorum).",
      "Failures: backoff retries → DLQ → alert → replay.",
      "Scale: watch arrival vs ack rate; partition by key for ordering.",
    ],
    quiz: [],
  },
];
