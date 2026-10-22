import type { SceneActor, SceneDefinition, SceneEdge, SceneStep, SceneToken, TokenState, Tone } from "@/lib/learn/scene/types";
import { route, type Binding, type ExchangeType } from "./routing";

// ─── Small builders ──────────────────────────────────────────────────────────

const at = (id: string, state: TokenState, actor: string, extra: Partial<SceneToken> = {}): SceneToken => ({
  id,
  state,
  at: actor,
  ...extra,
});

const on = (id: string, state: TokenState, edge: string, t = 0.5, extra: Partial<SceneToken> = {}): SceneToken => ({
  id,
  state,
  edge,
  t,
  ...extra,
});

const edge = (from: string, to: string, label?: string, dashed?: boolean, offset?: number): SceneEdge => ({
  id: `${from}-${to}`,
  from,
  to,
  label,
  dashed,
  offset,
});

// ─── Chapter 1 · Why a broker ────────────────────────────────────────────────

export const syncCallsScene: SceneDefinition = {
  id: "sync-calls",
  title: "Scenario A — direct synchronous calls",
  description: "An order API calls payment, inventory, email and invoice services one after another while the user waits.",
  width: 640,
  height: 340,
  actors: [
    { id: "client", kind: "client", label: "User", sub: "POST /orders", x: 70, y: 170, w: 110 },
    { id: "api", kind: "service", label: "Order API", x: 240, y: 170, w: 130 },
    { id: "pay", kind: "service", label: "Payment", x: 500, y: 50, w: 150, h: 50 },
    { id: "inv", kind: "service", label: "Inventory", x: 500, y: 130, w: 150, h: 50 },
    { id: "email", kind: "service", label: "Email", sub: "slow SMTP", x: 500, y: 210, w: 150, h: 50 },
    { id: "invoice", kind: "service", label: "Invoice PDF", x: 500, y: 290, w: 150, h: 50 },
  ],
  edges: [edge("client", "api"), edge("api", "pay"), edge("api", "inv"), edge("api", "email"), edge("api", "invoice")],
  steps: [
    {
      title: "Request arrives",
      caption: "The user submits an order. The API thread now holds the HTTP connection open until every downstream call returns.",
      tokens: [on("req", "transit", "client-api", 0.6, { label: "R" })],
      edges: { "client-api": "active" },
      actors: { client: { status: "busy", badge: "waiting…" } },
    },
    {
      title: "Payment call",
      caption: "Call 1: payment authorisation — 120 ms. The user is still waiting.",
      tokens: [at("req", "processing", "pay", { label: "R" })],
      edges: { "api-pay": "active" },
      actors: { client: { status: "busy", badge: "120 ms" }, api: { status: "busy" }, pay: { status: "active" } },
    },
    {
      title: "Inventory call",
      caption: "Call 2: reserve stock — another 200 ms. Latencies add up because each call waits for the previous one.",
      tokens: [at("req", "processing", "inv", { label: "R" })],
      edges: { "api-inv": "active" },
      actors: { client: { status: "busy", badge: "320 ms" }, api: { status: "busy" }, pay: { status: "ok" }, inv: { status: "active" } },
    },
    {
      title: "Slow email",
      caption: "Call 3: the email provider is slow today. A confirmation email — something the user does not need right now — adds 3 seconds to checkout.",
      tokens: [at("req", "processing", "email", { label: "R" })],
      edges: { "api-email": "active" },
      actors: {
        client: { status: "busy", badge: "3.3 s", badgeTone: "amber" },
        api: { status: "busy" },
        pay: { status: "ok" },
        inv: { status: "ok" },
        email: { status: "busy", badge: "3 s", badgeTone: "amber" },
      },
      durationMs: 2400,
    },
    {
      title: "Email times out",
      caption: "Then the email service times out. The API returns 500 — even though payment and stock were already handled. One non-critical dependency failed the whole request.",
      srText: "The email service fails. The order API returns an error to the user although payment succeeded.",
      tokens: [at("req", "rejected", "client", { label: "R" })],
      edges: { "api-email": "failed", "client-api": "failed" },
      actors: {
        client: { status: "failed", badge: "500 error", badgeTone: "rose" },
        api: { status: "failed" },
        pay: { status: "ok" },
        inv: { status: "ok" },
        email: { status: "failed", badge: "timeout", badgeTone: "rose" },
        invoice: { status: "muted", badge: "never called" },
      },
      durationMs: 2600,
    },
  ],
};

export const asyncMessagingScene: SceneDefinition = {
  id: "async-messaging",
  title: "Scenario B — publish an event, process in the background",
  description: "The order API publishes one event to a broker which routes copies to email, inventory and invoice queues processed by independent workers.",
  width: 720,
  height: 340,
  actors: [
    { id: "client", kind: "client", label: "User", sub: "POST /orders", x: 60, y: 170, w: 100 },
    { id: "api", kind: "producer", label: "Order API", x: 185, y: 170, w: 110 },
    { id: "ex", kind: "exchange", label: "order.events", sub: "exchange", x: 330, y: 170, w: 120 },
    { id: "q-email", kind: "queue", label: "email", x: 500, y: 70, w: 130, h: 54 },
    { id: "q-inv", kind: "queue", label: "inventory", x: 500, y: 170, w: 130, h: 54 },
    { id: "q-invoice", kind: "queue", label: "invoice", x: 500, y: 270, w: 130, h: 54 },
    { id: "w-email", kind: "consumer", label: "Email worker", x: 650, y: 70, w: 120 },
    { id: "w-inv", kind: "consumer", label: "Stock worker", x: 650, y: 170, w: 120 },
    { id: "w-invoice", kind: "consumer", label: "PDF worker", x: 650, y: 270, w: 120 },
  ],
  edges: [
    edge("client", "api"),
    edge("api", "ex"),
    edge("ex", "q-email"),
    edge("ex", "q-inv"),
    edge("ex", "q-invoice"),
    edge("q-email", "w-email"),
    edge("q-inv", "w-inv"),
    edge("q-invoice", "w-invoice"),
  ],
  steps: [
    {
      title: "Request arrives",
      caption: "The user submits an order. The API does only the work that must be synchronous (validate, charge, save the order).",
      tokens: [at("req", "processing", "api", { label: "R" })],
      edges: { "client-api": "active" },
      actors: { client: { status: "busy", badge: "waiting…" }, api: { status: "busy" } },
    },
    {
      title: "Publish + respond",
      caption: "It publishes one order.created event to the broker and immediately answers 202 Accepted. The user waited ~40 ms, not seconds.",
      tokens: [at("evt", "accepted", "ex", { label: "E" })],
      edges: { "api-ex": "active" },
      actors: { client: { status: "ok", badge: "202 in 40 ms", badgeTone: "emerald" }, ex: { status: "active" } },
    },
    {
      title: "Route copies",
      caption: "The exchange routes a copy of the event into each bound queue. Each queue buffers work for one job type.",
      tokens: [at("e1", "queued", "q-email", { label: "E" }), at("e2", "queued", "q-inv", { label: "E" }), at("e3", "queued", "q-invoice", { label: "E" })],
      edges: { "ex-q-email": "active", "ex-q-inv": "active", "ex-q-invoice": "active" },
    },
    {
      title: "Workers consume",
      caption: "Workers pull from their own queue at their own pace. The stock and PDF workers finish quickly; email is slow — but nobody is waiting on it.",
      tokens: [at("e1", "processing", "w-email", { label: "E" }), at("e2", "processing", "w-inv", { label: "E" }), at("e3", "processing", "w-invoice", { label: "E" })],
      edges: { "q-email-w-email": "active", "q-inv-w-inv": "active", "q-invoice-w-invoice": "active" },
      actors: { "w-email": { status: "busy", badge: "slow SMTP", badgeTone: "amber" }, "w-inv": { status: "busy" }, "w-invoice": { status: "busy" } },
    },
    {
      title: "Acknowledged",
      caption: "Stock and PDF workers acknowledge their messages; RabbitMQ deletes them from those queues.",
      tokens: [at("e1", "processing", "w-email", { label: "E" }), at("e2", "acked", "w-inv", { label: "E" }), at("e3", "acked", "w-invoice", { label: "E" })],
      actors: { "w-email": { status: "busy", badge: "slow SMTP", badgeTone: "amber" }, "w-inv": { status: "ok" }, "w-invoice": { status: "ok" } },
    },
    {
      title: "Email worker crashes",
      caption: "The email worker crashes before acknowledging. Because the message was never acked, RabbitMQ puts it back in the email queue — it is not lost.",
      srText: "The email worker crashes. The unacknowledged message returns to the email queue.",
      tokens: [at("e1", "redelivered", "q-email", { label: "E" })],
      actors: { "w-email": { status: "failed", badge: "crashed", badgeTone: "rose" } },
      durationMs: 2400,
    },
    {
      title: "Recovered",
      caption: "When a worker comes back, the email is delivered again and acked. Note what made this safe: acks, a durable queue and an idempotent worker — publishing alone guarantees none of it.",
      tokens: [at("e1", "acked", "w-email", { label: "E" })],
      edges: { "q-email-w-email": "active" },
      actors: { "w-email": { status: "ok", badge: "back online", badgeTone: "emerald" }, "w-inv": { status: "ok" }, "w-invoice": { status: "ok" } },
      durationMs: 2600,
    },
  ],
};

// ─── Chapter 2 · Anatomy ─────────────────────────────────────────────────────

export const anatomyScene: SceneDefinition = {
  id: "anatomy",
  title: "One message, end to end",
  description: "A producer publishes a message to an exchange which matches it against a binding, stores it in a queue and delivers it to a consumer that acknowledges it.",
  width: 770,
  height: 250,
  actors: [
    { id: "producer", kind: "producer", label: "Producer", sub: "order-service", x: 75, y: 140, w: 120 },
    { id: "exchange", kind: "exchange", label: "orders", sub: "topic exchange", x: 270, y: 140, w: 130 },
    { id: "queue", kind: "queue", label: "order-processing", x: 500, y: 140, w: 150, h: 58 },
    { id: "consumer", kind: "consumer", label: "Consumer", sub: "fulfilment-worker", x: 695, y: 140, w: 120 },
  ],
  edges: [edge("producer", "exchange", "publish"), edge("exchange", "queue", "binding: orders.*"), edge("queue", "consumer", "deliver")],
  steps: [
    {
      title: "Connect",
      caption: "The producer opens one TCP connection to the broker and a lightweight channel inside it. All publishing happens on the channel.",
      tokens: [],
      actors: { producer: { status: "active", badge: "connection → channel", badgeTone: "indigo" } },
    },
    {
      title: "Publish",
      caption: "It publishes to the exchange — not to a queue — with routing key orders.created. The JSON payload is opaque to RabbitMQ; routing only looks at the key (or headers).",
      tokens: [on("m", "transit", "producer-exchange", 0.55, { label: "M" })],
      edges: { "producer-exchange": "active" },
    },
    {
      title: "Match bindings",
      caption: "The exchange compares the routing key with each binding. orders.created matches the binding pattern orders.* (one word after orders).",
      tokens: [at("m", "accepted", "exchange", { label: "M" })],
      actors: { exchange: { status: "active", badge: "orders.created ~ orders.* ✓", badgeTone: "emerald" } },
    },
    {
      title: "Enqueue",
      caption: "The message is stored in the bound queue. Queues are where messages actually wait; exchanges never store anything.",
      tokens: [at("m", "queued", "queue", { label: "M" })],
      edges: { "exchange-queue": "active" },
    },
    {
      title: "Deliver",
      caption: "RabbitMQ pushes the message to a subscribed consumer. It is now unacknowledged: delivered, but not yet removed.",
      tokens: [at("m", "delivered", "consumer", { label: "M" })],
      edges: { "queue-consumer": "active" },
      actors: { consumer: { status: "busy" }, queue: { badge: "unacked: 1", badgeTone: "sky" } },
    },
    {
      title: "Acknowledge",
      caption: "After processing, the consumer sends basic.ack. Only now does RabbitMQ delete the message from the queue.",
      tokens: [at("m", "acked", "consumer", { label: "M" })],
      actors: { consumer: { status: "ok", badge: "basic.ack", badgeTone: "emerald" }, queue: { badge: "empty" } },
    },
  ],
};

// ─── Chapter 3 · Exchange routing (generated from the routing model) ─────────

export interface RoutingMessage {
  key: string;
  headers?: Record<string, string>;
  tone: Tone;
  /** Optional caption override for the "routed" step. */
  note?: string;
}

/**
 * Builds a two-steps-per-message routing scene straight from lib/learn/rabbitmq/routing,
 * so what the animation shows is exactly what the matcher computes.
 */
export function buildRoutingScene(opts: {
  id: string;
  title: string;
  type: ExchangeType;
  exchangeName: string;
  bindings: Binding[];
  messages: RoutingMessage[];
}): SceneDefinition {
  const { type, bindings, messages } = opts;
  const queueIds = bindings.map((b) => b.queue);
  // Leave headroom above the first queue for its status badge.
  const spacing = 250 / Math.max(1, queueIds.length - 1);
  const height = 350;

  const actors: SceneActor[] = [
    { id: "producer", kind: "producer", label: "Producer", x: 70, y: height / 2, w: 110 },
    { id: "exchange", kind: "exchange", label: opts.exchangeName, sub: `${type} exchange`, x: 245, y: height / 2, w: 140 },
    ...bindings.map<SceneActor>((b, i) => ({
      id: b.queue,
      kind: "queue",
      label: b.queue,
      sub:
        type === "fanout"
          ? "bound (no key)"
          : type === "headers"
            ? `x-match=${b.xMatch ?? "all"} · ${Object.entries(b.headers ?? {}).map(([k, v]) => `${k}=${v}`).join(", ")}`
            : `binding: ${b.key}`,
      x: 500,
      y: queueIds.length === 1 ? height / 2 : 55 + i * spacing,
      w: 220,
      h: 56,
    })),
  ];
  const edges: SceneEdge[] = [edge("producer", "exchange"), ...queueIds.map((q) => edge("exchange", q))];

  const steps: SceneStep[] = [];
  const resting: SceneToken[] = [];
  const describe = (m: RoutingMessage) =>
    type === "headers" ? Object.entries(m.headers ?? {}).map(([k, v]) => `${k}=${v}`).join(", ") : m.key;

  messages.forEach((m, mi) => {
    const label = String(mi + 1);
    const results = route(type, bindings, m.key, m.headers);
    const hits = results.filter((r) => r.matched);

    steps.push({
      title: `Publish ${describe(m)}`,
      caption:
        type === "headers"
          ? `Message ${label} is published with headers ${describe(m)}. A headers exchange ignores the routing key.`
          : type === "fanout"
            ? `Message ${label} is published with routing key "${m.key}". A fanout exchange will ignore it.`
            : `Message ${label} is published with routing key "${m.key}".`,
      tokens: [...resting, at(`m${mi}`, "accepted", "exchange", { label, tone: m.tone })],
      edges: { "producer-exchange": "active" },
      actors: { exchange: { status: "active", badge: describe(m), badgeTone: m.tone } },
    });

    const copies = hits.map((h) => at(`m${mi}-${h.queue}`, "queued", h.queue, { label, tone: m.tone }));
    const edgeStates: Record<string, "active" | "muted"> = {};
    results.forEach((r) => (edgeStates[`exchange-${r.queue}`] = r.matched ? "active" : "muted"));
    const actorStates: SceneStep["actors"] = {};
    results.forEach((r) => {
      actorStates[r.queue] = r.matched ? { status: "active", badge: "match ✓", badgeTone: "emerald" } : { status: "muted", badge: "no match" };
    });

    const auto =
      hits.length === 0
        ? `No binding matches, so the message is unroutable. By default RabbitMQ silently drops it — unless the publisher set mandatory (it gets returned) or the exchange has an alternate exchange. It does NOT go to a dead-letter queue.`
        : `Routed to ${hits.map((h) => h.queue).join(" and ")}. ${hits.length > 1 ? "One publish, multiple independent copies. " : ""}${results.find((r) => r.matched)?.reason ?? ""}`;

    steps.push({
      title: hits.length ? `Routed to ${hits.length} queue${hits.length > 1 ? "s" : ""}` : "Unroutable",
      caption: m.note ?? auto,
      srText: results.map((r) => `${r.queue}: ${r.matched ? "receives a copy" : "no copy"} — ${r.reason}`).join(" "),
      tokens: [...resting, ...(hits.length ? copies : [at(`m${mi}`, "lost", "exchange", { label, tone: m.tone })])],
      edges: edgeStates,
      actors: hits.length ? actorStates : { ...actorStates, exchange: { status: "failed", badge: "unroutable → dropped", badgeTone: "rose" } },
      durationMs: hits.length === 0 ? 3200 : 2400,
    });

    resting.push(...copies);
  });

  return {
    id: opts.id,
    title: opts.title,
    description: `${type} exchange "${opts.exchangeName}" routing ${messages.length} messages to ${bindings.length} queues.`,
    width: 640,
    height,
    actors,
    edges,
    steps,
  };
}

export const directScene = buildRoutingScene({
  id: "direct-exchange",
  title: "Direct exchange — exact key match",
  type: "direct",
  exchangeName: "events",
  bindings: [
    { queue: "order-processing", key: "orders.created" },
    { queue: "payment-failures", key: "payments.failed" },
    { queue: "audit-log", key: "orders.created" },
  ],
  messages: [
    { key: "orders.created", tone: "amber" },
    { key: "payments.failed", tone: "sky" },
    { key: "users.signup", tone: "violet" },
  ],
});

export const fanoutScene = buildRoutingScene({
  id: "fanout-exchange",
  title: "Fanout exchange — broadcast to every bound queue",
  type: "fanout",
  exchangeName: "user.signed_up",
  bindings: [
    { queue: "welcome-email", key: "" },
    { queue: "crm-sync", key: "" },
    { queue: "analytics", key: "" },
  ],
  messages: [
    { key: "anything", tone: "amber", note: "Every bound queue gets its own copy — welcome email, CRM sync and analytics each consume it independently, at their own speed. The routing key was ignored." },
  ],
});

export const topicScene = buildRoutingScene({
  id: "topic-exchange",
  title: "Topic exchange — wildcard patterns",
  type: "topic",
  exchangeName: "events",
  bindings: [
    { queue: "orders-simple", key: "orders.*" },
    { queue: "orders-all", key: "orders.#" },
    { queue: "failures", key: "*.failed" },
  ],
  messages: [
    { key: "orders.created", tone: "amber" },
    { key: "orders.eu.created", tone: "sky", note: "orders.eu.created has three words. orders.* needs exactly two, so orders-simple gets nothing. orders.# matches because # absorbs \"eu.created\"." },
    { key: "payments.failed", tone: "rose" },
    { key: "orders", tone: "violet", note: "Just \"orders\" (one word): orders.# still matches because # can match zero words. orders.* does not — * needs exactly one word." },
  ],
});

export const headersScene = buildRoutingScene({
  id: "headers-exchange",
  title: "Headers exchange — match on message headers",
  type: "headers",
  exchangeName: "reports",
  bindings: [
    { queue: "pdf-eu", key: "", headers: { format: "pdf", region: "eu" }, xMatch: "all" },
    { queue: "any-pdf-or-eu", key: "", headers: { format: "pdf", region: "eu" }, xMatch: "any" },
  ],
  messages: [
    { key: "", headers: { format: "pdf", region: "eu" }, tone: "amber" },
    { key: "", headers: { format: "pdf", region: "us" }, tone: "sky" },
    { key: "", headers: { format: "csv", region: "us" }, tone: "violet" },
  ],
});

// ─── Chapter 4 · Competing consumers + prefetch (simulated) ─────────────────

/**
 * Simulates one queue with a fast and a slow consumer under a given prefetch.
 * RabbitMQ keeps delivering to a consumer while its unacked count is below
 * the prefetch limit; each consumer works through its buffer one message at a
 * time and acks on completion. One step = one tick.
 */
export function buildPrefetchScene(prefetch: number, total = 8): SceneDefinition {
  const consumers = [
    { id: "fast", label: "Consumer A", sub: "fast · 1 tick/msg", cost: 1 },
    { id: "slow", label: "Consumer B", sub: "slow · 3 ticks/msg", cost: 3 },
  ];
  type C = { id: string; buffer: number[]; progress: number; done: number[]; justAcked: number | null };
  const state: C[] = consumers.map((c) => ({ id: c.id, buffer: [], progress: 0, done: [], justAcked: null }));
  const queue = Array.from({ length: total }, (_, i) => i + 1);
  let rr = 0;
  const steps: SceneStep[] = [];

  const snapshot = (title: string, caption: string, deliveries: string[]) => {
    const tokens: SceneToken[] = queue.map((n, i) => at(`m${n}`, "queued", "queue", { label: String(n), slot: i }));
    state.forEach((c) => {
      c.buffer.forEach((n, i) => tokens.push(at(`m${n}`, i === 0 && c.progress > 0 ? "processing" : "delivered", c.id, { label: String(n) })));
      if (c.justAcked !== null) tokens.push(at(`m${c.justAcked}`, "acked", c.id, { label: String(c.justAcked) }));
    });
    const actors: SceneStep["actors"] = { queue: { badge: `${queue.length} ready`, badgeTone: "amber" } };
    state.forEach((c) => {
      actors[c.id] = {
        status: c.buffer.length ? "busy" : "idle",
        badge: `unacked ${c.buffer.length}/${prefetch} · done ${c.done.length}`,
        badgeTone: c.buffer.length >= prefetch ? "amber" : "zinc",
      };
    });
    const edges: SceneStep["edges"] = {};
    deliveries.forEach((d) => (edges[`queue-${d}`] = "active"));
    steps.push({ title, caption, tokens, actors, edges, durationMs: 1500 });
  };

  const deliver = (): string[] => {
    const to: string[] = [];
    let guard = 0;
    while (queue.length && state.some((c) => c.buffer.length < prefetch) && guard < 50) {
      const c = state[rr % state.length];
      rr++;
      guard++;
      if (c.buffer.length < prefetch) {
        c.buffer.push(queue.shift()!);
        if (!to.includes(c.id)) to.push(c.id);
      }
    }
    return to;
  };

  snapshot("Ready", `${total} messages wait in the queue. Both consumers subscribe with prefetch = ${prefetch}: each may hold at most ${prefetch} unacknowledged message${prefetch === 1 ? "" : "s"}.`, []);
  let tick = 0;
  let firstDelivery = true;
  while ((queue.length || state.some((c) => c.buffer.length)) && tick < 40) {
    tick++;
    state.forEach((c) => (c.justAcked = null));
    // Work on the head of each buffer.
    state.forEach((c, i) => {
      if (!c.buffer.length) return;
      c.progress++;
      if (c.progress >= consumers[i].cost) {
        const n = c.buffer.shift()!;
        c.done.push(n);
        c.justAcked = n;
        c.progress = 0;
      }
    });
    const delivered = deliver();
    const acks = state.filter((c) => c.justAcked !== null).map((c) => `${consumers[state.indexOf(c)].label} acks #${c.justAcked}`);
    let caption: string;
    if (firstDelivery) {
      caption =
        prefetch === 1
          ? "RabbitMQ delivers round-robin, but only one unacked message per consumer. The rest stay in the queue, available to whoever frees up first."
          : `RabbitMQ pushes up to ${prefetch} messages to each consumer immediately — the slow consumer's buffer fills up just like the fast one's.`;
      firstDelivery = false;
    } else if (!queue.length && state.some((c) => c.buffer.length)) {
      const idle = state.filter((c) => !c.buffer.length).map((c) => consumers[state.indexOf(c)].label);
      caption = `${acks.join(", ") || "Processing…"}. Queue is empty${idle.length ? `, ${idle.join(" & ")} sits idle while messages are stuck in another consumer's buffer` : ""}.`;
    } else {
      caption = `${acks.join(", ") || "Both consumers are still processing"}.${delivered.length ? ` Each ack frees a prefetch slot, so the next message goes to ${delivered.map((d) => consumers[state.findIndex((c) => c.id === d)].label).join(" and ")}.` : ""}`;
    }
    snapshot(`Tick ${tick}`, caption, delivered);
  }
  const [a, b] = state;
  steps.push({
    ...steps[steps.length - 1],
    title: "Result",
    caption: `Finished after ${tick} ticks. Consumer A processed ${a.done.length}, Consumer B processed ${b.done.length}. ${
      prefetch === 1
        ? "With prefetch 1 the fast consumer naturally takes more work — this is fair dispatch."
        : "A large prefetch improves throughput for fast, uniform work, but here it parked messages behind the slow consumer."
    }`,
    durationMs: 3500,
  });

  return {
    id: `prefetch-${prefetch}`,
    title: `Competing consumers · prefetch = ${prefetch}`,
    description: `One queue of ${total} messages consumed by a fast and a slow consumer with prefetch ${prefetch}.`,
    width: 640,
    height: 300,
    actors: [
      { id: "queue", kind: "queue", label: "report-jobs", x: 160, y: 150, w: 210, h: 60 },
      ...consumers.map<SceneActor>((c, i) => ({ id: c.id, kind: "consumer", label: c.label, sub: c.sub, x: 500, y: i === 0 ? 75 : 225, w: 170, h: 62 })),
    ],
    edges: consumers.map((c) => edge("queue", c.id)),
    steps,
  };
}

// ─── Chapter 5 · Acks, crashes, idempotency ──────────────────────────────────

export const crashRedeliveryScene: SceneDefinition = {
  id: "ack-crash",
  title: "Consumer crashes before acking",
  description: "A consumer charges a payment, crashes before acknowledging, and the message is redelivered to another consumer which charges again.",
  width: 700,
  height: 300,
  actors: [
    { id: "queue", kind: "queue", label: "payments", x: 120, y: 150, w: 170, h: 58 },
    { id: "c1", kind: "consumer", label: "Consumer 1", x: 390, y: 70, w: 140 },
    { id: "c2", kind: "consumer", label: "Consumer 2", x: 390, y: 230, w: 140 },
    { id: "db", kind: "store", label: "Payments DB", x: 610, y: 150, w: 130, h: 66 },
  ],
  edges: [edge("queue", "c1"), edge("queue", "c2"), edge("c1", "db", undefined, true), edge("c2", "db", undefined, true)],
  steps: [
    { title: "Queued", caption: "Message #42 — \"charge order 42\" — waits in the queue. Consumers use manual acknowledgments.", tokens: [at("m", "queued", "queue", { label: "42" })] },
    {
      title: "Delivered",
      caption: "RabbitMQ delivers it to Consumer 1. The message is now unacked: still owned by the queue, reserved for this consumer.",
      tokens: [at("m", "delivered", "c1", { label: "42" })],
      edges: { "queue-c1": "active" },
      actors: { queue: { badge: "unacked: 1", badgeTone: "sky" }, c1: { status: "busy" } },
    },
    {
      title: "Side effect",
      caption: "Consumer 1 charges the card. The business effect has happened…",
      tokens: [at("m", "processing", "c1", { label: "42" })],
      edges: { "c1-db": "active" },
      actors: { queue: { badge: "unacked: 1", badgeTone: "sky" }, c1: { status: "busy" }, db: { status: "ok", badge: "charged ×1", badgeTone: "emerald" } },
    },
    {
      title: "Crash before ack",
      caption: "…and then the process dies before sending basic.ack. RabbitMQ cannot know the charge happened — it only knows it never got an ack.",
      srText: "Consumer 1 crashes after charging the card but before acknowledging the message.",
      tokens: [at("m", "processing", "c1", { label: "42" })],
      actors: { queue: { badge: "unacked: 1", badgeTone: "sky" }, c1: { status: "failed", badge: "crashed", badgeTone: "rose" }, db: { badge: "charged ×1", badgeTone: "emerald" } },
      durationMs: 2400,
    },
    {
      title: "Requeued",
      caption: "The TCP connection (and its channel) closes, so RabbitMQ requeues every message that channel had unacked. It is marked redelivered=true.",
      tokens: [at("m", "redelivered", "queue", { label: "42" })],
      actors: { queue: { badge: "redelivered", badgeTone: "violet" }, c1: { status: "down", badge: "offline" }, db: { badge: "charged ×1", badgeTone: "emerald" } },
    },
    {
      title: "Redelivered",
      caption: "Consumer 2 receives the same message. Without protection, it will repeat the work.",
      tokens: [at("m", "redelivered", "c2", { label: "42" })],
      edges: { "queue-c2": "active" },
      actors: { c1: { status: "down", badge: "offline" }, c2: { status: "busy" }, db: { badge: "charged ×1", badgeTone: "emerald" } },
    },
    {
      title: "Duplicate effect",
      caption: "The customer is charged twice. This is at-least-once delivery working as designed — duplicates are the price of not losing messages.",
      tokens: [at("m", "processing", "c2", { label: "42" })],
      edges: { "c2-db": "failed" },
      actors: { c1: { status: "down", badge: "offline" }, c2: { status: "busy" }, db: { status: "failed", badge: "charged ×2 !", badgeTone: "rose" } },
      durationMs: 2600,
    },
    {
      title: "Acked",
      caption: "Consumer 2 acks and the message is removed. The fix is not in RabbitMQ — it is an idempotent consumer (see the next tab).",
      tokens: [at("m", "acked", "c2", { label: "42" })],
      actors: { c1: { status: "down", badge: "offline" }, c2: { status: "ok", badge: "basic.ack", badgeTone: "emerald" }, db: { status: "failed", badge: "charged ×2 !", badgeTone: "rose" } },
    },
  ],
};

export const idempotentScene: SceneDefinition = {
  id: "idempotent-consumer",
  title: "Idempotent consumer absorbs the duplicate",
  description: "A redelivered message is checked against a processed-messages table; the duplicate is skipped and acknowledged.",
  width: 680,
  height: 280,
  actors: [
    { id: "queue", kind: "queue", label: "payments", x: 110, y: 140, w: 160, h: 58 },
    { id: "c", kind: "consumer", label: "Consumer", x: 340, y: 140, w: 140 },
    { id: "keys", kind: "store", label: "processed_messages", sub: "unique(message_id)", x: 570, y: 65, w: 190, h: 64 },
    { id: "db", kind: "store", label: "Payments DB", x: 570, y: 215, w: 190, h: 64 },
  ],
  edges: [edge("queue", "c"), edge("c", "keys", undefined, true), edge("c", "db", undefined, true)],
  steps: [
    { title: "Redelivered", caption: "Message 42 arrives again (redelivered=true). It carries a stable message_id / idempotency key set by the producer.", tokens: [at("m", "redelivered", "c", { label: "42" })], edges: { "queue-c": "active" }, actors: { db: { badge: "charged ×1", badgeTone: "emerald" } } },
    {
      title: "Check key",
      caption: "In the same database transaction as the side effect, the consumer tries to insert the message_id into processed_messages.",
      tokens: [at("m", "processing", "c", { label: "42" })],
      edges: { "c-keys": "active" },
      actors: { c: { status: "busy" }, keys: { status: "active", badge: "42 already exists", badgeTone: "amber" }, db: { badge: "charged ×1", badgeTone: "emerald" } },
    },
    {
      title: "Skip",
      caption: "The unique constraint fails → this message was already processed. Skip the charge.",
      tokens: [at("m", "processing", "c", { label: "42" })],
      edges: { "c-db": "muted" },
      actors: { c: { status: "busy", badge: "duplicate → skip", badgeTone: "amber" }, db: { status: "ok", badge: "charged ×1", badgeTone: "emerald" } },
    },
    {
      title: "Ack",
      caption: "Ack the duplicate so it leaves the queue. Delivery was at-least-once, but the business effect happened exactly once — effectively-once processing by design.",
      tokens: [at("m", "acked", "c", { label: "42" })],
      actors: { c: { status: "ok", badge: "basic.ack", badgeTone: "emerald" }, db: { status: "ok", badge: "charged ×1", badgeTone: "emerald" } },
      durationMs: 2800,
    },
  ],
};

export const autoAckScene: SceneDefinition = {
  id: "auto-ack",
  title: "Auto-ack: fast, but a crash loses the message",
  description: "With automatic acknowledgment the message is removed as soon as it is sent, so a consumer crash loses it.",
  width: 600,
  height: 220,
  actors: [
    { id: "queue", kind: "queue", label: "emails", x: 130, y: 115, w: 170, h: 58 },
    { id: "c", kind: "consumer", label: "Consumer", sub: "auto_ack=True", x: 440, y: 115, w: 160 },
  ],
  edges: [edge("queue", "c")],
  steps: [
    { title: "Queued", caption: "A message waits in the queue. The consumer subscribed with auto-ack.", tokens: [at("m", "queued", "queue", { label: "7" })] },
    {
      title: "Sent = done",
      caption: "With auto-ack, RabbitMQ considers the message handled the moment it is written to the socket and deletes it from the queue.",
      tokens: [at("m", "delivered", "c", { label: "7" })],
      edges: { "queue-c": "active" },
      actors: { queue: { badge: "empty", badgeTone: "zinc" }, c: { status: "busy" } },
    },
    {
      title: "Crash",
      caption: "The consumer crashes mid-processing. There is no copy left anywhere — the message is lost. That is at-most-once delivery.",
      tokens: [at("m", "lost", "c", { label: "7" })],
      actors: { queue: { badge: "empty", badgeTone: "zinc" }, c: { status: "failed", badge: "crashed", badgeTone: "rose" } },
      durationMs: 2800,
    },
  ],
};

// ─── Chapter 6 · Durability ──────────────────────────────────────────────────

export type RestartVariant = "transient-queue" | "durable-transient-msgs" | "durable-persistent";

export function buildRestartScene(variant: RestartVariant): SceneDefinition {
  const durable = variant !== "transient-queue";
  const persistent = variant === "durable-persistent";
  const queueSub = `${durable ? "durable" : "transient"} queue · ${persistent ? "persistent" : "transient"} msgs`;
  const actors: SceneActor[] = [
    { id: "broker", kind: "broker", label: "RabbitMQ node", x: 400, y: 175, w: 340, h: 290 },
    { id: "producer", kind: "producer", label: "Producer", sub: persistent ? "delivery_mode=2" : "delivery_mode=1", x: 90, y: 115, w: 140 },
    { id: "queue", kind: "queue", label: "invoices", sub: queueSub, x: 400, y: 115, w: 230, h: 64 },
    { id: "disk", kind: "store", label: "Disk", sub: "message store", x: 400, y: 250, w: 180, h: 66 },
  ];
  const msgs = (state: TokenState, actor = "queue") => ["1", "2", "3"].map((n, i) => at(`m${n}`, state, actor, { label: n, slot: i }));
  const final: SceneStep = persistent
    ? {
        title: "Recovered",
        caption: "The durable queue is re-declared on boot and its persistent messages are reloaded from disk. Nothing was lost.",
        tokens: [...msgs("queued"), ...["1", "2", "3"].map((n, i) => at(`d${n}`, "stored", "disk", { label: n, slot: i }))],
        actors: { broker: { status: "ok", badge: "back online", badgeTone: "emerald" }, queue: { status: "ok", badge: "3 recovered", badgeTone: "emerald" } },
        durationMs: 3000,
      }
    : durable
      ? {
          title: "Queue survives, messages don't",
          caption: "The durable queue definition survives the restart — but its messages were transient (delivery_mode=1), so the queue comes back empty.",
          tokens: msgs("lost"),
          actors: { broker: { status: "ok", badge: "back online", badgeTone: "emerald" }, queue: { status: "ok", badge: "recovered · empty", badgeTone: "amber" } },
          durationMs: 3200,
        }
      : {
          title: "Queue gone",
          caption: "A non-durable queue is not re-created on boot. The queue and everything in it are gone — even messages marked persistent couldn't save it.",
          tokens: msgs("lost"),
          actors: { broker: { status: "ok", badge: "back online", badgeTone: "emerald" }, queue: { status: "muted", badge: "queue deleted", badgeTone: "rose" } },
          durationMs: 3200,
        };

  return {
    id: `restart-${variant}`,
    title: { "transient-queue": "Transient queue", "durable-transient-msgs": "Durable queue, transient messages", "durable-persistent": "Durable queue + persistent messages" }[variant],
    description: `A broker restart with a ${queueSub}.`,
    width: 620,
    height: 340,
    actors,
    edges: [edge("producer", "queue", "publish"), edge("queue", "disk", "fsync", true)],
    steps: [
      {
        title: "Publish",
        caption: `The producer publishes three invoice jobs into a ${queueSub}.`,
        tokens: msgs("queued"),
        edges: { "producer-queue": "active" },
        actors: { queue: { badge: "3 ready", badgeTone: "amber" } },
      },
      {
        title: persistent ? "Written to disk" : "In memory only",
        caption: persistent
          ? "Persistent messages in a durable queue are written to the node's message store on disk."
          : "These messages are kept in memory (classic queues may page them to disk under memory pressure, but that's not a durability guarantee).",
        tokens: [...msgs("queued"), ...(persistent ? ["1", "2", "3"].map((n, i) => at(`d${n}`, "stored", "disk", { label: n, slot: i })) : [])],
        edges: persistent ? { "queue-disk": "active" } : { "queue-disk": "muted" },
        actors: { disk: persistent ? { status: "ok", badge: "3 persisted", badgeTone: "indigo" } : { status: "muted", badge: "nothing durable" } },
      },
      {
        title: "Broker restarts",
        caption: "The node restarts (deploy, crash, OOM kill). Everything in memory disappears.",
        srText: "The RabbitMQ node goes down and restarts.",
        tokens: [...msgs("queued"), ...(persistent ? ["1", "2", "3"].map((n, i) => at(`d${n}`, "stored", "disk", { label: n, slot: i })) : [])],
        actors: { broker: { status: "down", badge: "restarting…", badgeTone: "rose" }, queue: { status: "down" }, producer: { status: "muted" } },
        durationMs: 2200,
      },
      final,
    ],
  };
}

export const confirmsScene: SceneDefinition = {
  id: "publisher-confirms",
  title: "Publisher confirms",
  description: "The broker confirms a publication back to the producer after it has taken responsibility for the message.",
  width: 690,
  height: 250,
  actors: [
    { id: "producer", kind: "producer", label: "Producer", sub: "confirm.select", x: 80, y: 90, w: 140 },
    { id: "exchange", kind: "exchange", label: "invoices", x: 340, y: 90, w: 120 },
    { id: "queue", kind: "queue", label: "invoices", sub: "durable", x: 575, y: 90, w: 180, h: 58 },
    { id: "disk", kind: "store", label: "Disk", x: 575, y: 205, w: 150, h: 56 },
  ],
  edges: [edge("producer", "exchange", undefined, false, -9), edge("exchange", "queue"), edge("queue", "disk", undefined, true), edge("exchange", "producer", "basic.ack (confirm)", true, -9)],
  steps: [
    {
      title: "Publish #1",
      caption: "The channel is in confirm mode. The producer publishes message #1 and keeps it in an \"outstanding\" map until it is confirmed.",
      tokens: [on("m1", "transit", "producer-exchange", 0.6, { label: "1" })],
      edges: { "producer-exchange": "active" },
      actors: { producer: { badge: "outstanding: 1", badgeTone: "amber" } },
    },
    {
      title: "Routed + persisted",
      caption: "The message is routed to the durable queue and, being persistent, written to disk.",
      tokens: [at("m1", "queued", "queue", { label: "1" }), at("d1", "stored", "disk", { label: "1" })],
      edges: { "exchange-queue": "active", "queue-disk": "active" },
      actors: { producer: { badge: "outstanding: 1", badgeTone: "amber" } },
    },
    {
      title: "Confirm",
      caption: "Now the broker sends basic.ack for #1. The producer can forget it. This says nothing about consumers — nobody has processed it yet.",
      tokens: [at("m1", "queued", "queue", { label: "1" }), at("d1", "stored", "disk", { label: "1" }), on("ack1", "acked", "exchange-producer", 0.5, { label: "✓" })],
      edges: { "exchange-producer": "active" },
      actors: { producer: { status: "ok", badge: "outstanding: 0", badgeTone: "emerald" } },
    },
    {
      title: "No confirm",
      caption: "If a nack arrives — or no confirm arrives before a timeout because the connection dropped — the producer re-publishes. That can create duplicates, which is why consumers must be idempotent.",
      tokens: [at("m1", "queued", "queue", { label: "1" }), at("d1", "stored", "disk", { label: "1" }), on("m2", "returned", "exchange-producer", 0.5, { label: "2" })],
      edges: { "exchange-producer": "failed" },
      actors: { producer: { status: "busy", badge: "#2 nacked → retry", badgeTone: "rose" } },
      durationMs: 3200,
    },
  ],
};

// ─── Chapter 7 · Retries + DLX ───────────────────────────────────────────────

export const retryDlxScene: SceneDefinition = {
  id: "retry-dlx",
  title: "Delayed retries, then dead-lettering",
  description: "A failing message is retried through a TTL retry queue twice, then routed to a dead-letter queue.",
  width: 680,
  height: 320,
  actors: [
    { id: "queue", kind: "queue", label: "orders", x: 130, y: 80, w: 180, h: 58 },
    { id: "c", kind: "consumer", label: "Consumer", x: 420, y: 80, w: 150 },
    { id: "retry", kind: "queue", label: "orders.retry", sub: "TTL 5s · DLX → orders", x: 240, y: 250, w: 210, h: 60 },
    { id: "dlq", kind: "queue", label: "orders.dlq", sub: "parking lot", x: 550, y: 250, w: 190, h: 60 },
  ],
  edges: [edge("queue", "c"), edge("c", "retry", "attempt < 3"), edge("retry", "queue", "TTL expired"), edge("c", "dlq", "attempt = 3")],
  steps: [
    { title: "Queued", caption: "An order message is waiting. The consumer depends on a flaky downstream API.", tokens: [at("m", "queued", "queue", { label: "A" })], actors: { queue: { badge: "attempt 1", badgeTone: "zinc" } } },
    {
      title: "Attempt 1 fails",
      caption: "Attempt 1: the downstream API times out — a transient error. Requeueing instantly would just hammer it again in a tight loop.",
      tokens: [at("m", "rejected", "c", { label: "A" })],
      edges: { "queue-c": "active" },
      actors: { c: { status: "failed", badge: "timeout", badgeTone: "rose" } },
    },
    {
      title: "Delay",
      caption: "Instead, the consumer publishes a copy to orders.retry with an attempt header and acks the original. The retry queue has a TTL and a dead-letter exchange pointing back at orders.",
      tokens: [at("m", "queued", "retry", { label: "A" })],
      edges: { "c-retry": "active" },
      actors: { retry: { status: "active", badge: "waiting 5s", badgeTone: "amber" } },
      durationMs: 2400,
    },
    {
      title: "Back for attempt 2",
      caption: "When the TTL expires, RabbitMQ dead-letters the message back to the orders queue. It also records an x-death header with the reason (expired).",
      tokens: [at("m", "redelivered", "queue", { label: "A" })],
      edges: { "retry-queue": "active" },
      actors: { queue: { badge: "attempt 2", badgeTone: "violet" } },
    },
    {
      title: "Attempt 2 fails",
      caption: "Attempt 2 fails too. Same path: back into the retry queue for another delay (many teams use growing delays: 5s, 30s, 5 min).",
      tokens: [at("m", "queued", "retry", { label: "A" })],
      edges: { "queue-c": "active", "c-retry": "active" },
      actors: { c: { status: "failed", badge: "timeout", badgeTone: "rose" }, retry: { status: "active", badge: "waiting", badgeTone: "amber" } },
    },
    {
      title: "Attempt 3",
      caption: "Attempt 3 is delivered…",
      tokens: [at("m", "redelivered", "c", { label: "A" })],
      edges: { "retry-queue": "active", "queue-c": "active" },
      actors: { queue: { badge: "attempt 3", badgeTone: "violet" }, c: { status: "busy" } },
    },
    {
      title: "Dead-lettered",
      caption: "…and fails again. The limit is reached, so the message is rejected with requeue=false and the queue's DLX routes it to orders.dlq. The rest of the queue keeps flowing.",
      tokens: [at("m", "dead", "dlq", { label: "A" })],
      edges: { "c-dlq": "failed" },
      actors: { c: { status: "failed", badge: "gave up", badgeTone: "rose" }, dlq: { status: "failed", badge: "alert on depth > 0", badgeTone: "rose" } },
      durationMs: 3000,
    },
    {
      title: "Inspect & replay",
      caption: "An engineer inspects the DLQ, fixes the bug or waits for the dependency, then replays messages to orders. Poison messages never block healthy ones.",
      tokens: [at("m", "dead", "dlq", { label: "A" })],
      actors: { dlq: { status: "active", badge: "inspect → fix → replay", badgeTone: "indigo" } },
      durationMs: 3000,
    },
  ],
};

// ─── Chapter 8 · Backlog (simulated) ─────────────────────────────────────────

export interface BacklogParams {
  /** Messages arriving per tick. */
  rate: number;
  consumers: number;
  /** Messages each consumer finishes per tick. */
  perConsumer: number;
  ticks?: number;
}

export function simulateBacklog({ rate, consumers, perConsumer, ticks = 12 }: BacklogParams): number[] {
  const depths: number[] = [];
  let depth = 4;
  for (let t = 0; t < ticks; t++) {
    depth = Math.max(0, depth + rate - consumers * perConsumer);
    depths.push(depth);
  }
  return depths;
}

export function buildBacklogScene(p: BacklogParams): SceneDefinition {
  const depths = simulateBacklog(p);
  const capacity = p.consumers * p.perConsumer;
  const maxVisible = 9;
  const consumerActors: SceneActor[] = Array.from({ length: p.consumers }, (_, i) => ({
    id: `c${i}`,
    kind: "consumer",
    label: `Worker ${i + 1}`,
    x: 560,
    y: p.consumers === 1 ? 150 : 60 + (i * 205) / Math.max(1, p.consumers - 1),
    w: 120,
    h: 46,
  }));

  const steps: SceneStep[] = depths.map((depth, t) => {
    const visible = Math.min(depth, maxVisible);
    const tokens: SceneToken[] = Array.from({ length: visible }, (_, i) => at(`q${i}`, "queued", "queue", { slot: i }));
    tokens.push(on(`in${t % 2}`, "transit", "producer-queue", 0.5, { label: String(p.rate) }));
    const edges: SceneStep["edges"] = { "producer-queue": "active" };
    const actors: SceneStep["actors"] = {
      queue: {
        status: depth > 20 ? "failed" : depth > 0 ? "busy" : "ok",
        badge: `depth ${depth}${depth > maxVisible ? ` (+${depth - maxVisible} not shown)` : ""}`,
        badgeTone: depth > 20 ? "rose" : depth > 0 ? "amber" : "emerald",
      },
    };
    consumerActors.forEach((c) => {
      const busy = depth > 0 || p.rate > 0;
      actors[c.id] = { status: busy ? "busy" : "idle", badge: depth > 0 ? "100% busy" : "has spare time", badgeTone: depth > 0 ? "amber" : "emerald" };
      if (busy) edges[`queue-${c.id}`] = "active";
    });
    const delta = p.rate - capacity;
    const caption =
      delta > 0
        ? `Tick ${t + 1}: ${p.rate} arrive, ${capacity} finish → backlog grows by ${delta} every tick. Depth is ${depth}; a new message now waits ~${Math.ceil(depth / capacity)} ticks.`
        : delta < 0
          ? `Tick ${t + 1}: ${p.rate} arrive, up to ${capacity} can finish → the backlog drains${depth === 0 ? " — the queue is empty and workers have headroom" : `, depth ${depth}`}.`
          : `Tick ${t + 1}: arrivals exactly equal capacity (${capacity}). Depth holds at ${depth} — any spike will not drain on its own.`;
    return { title: `Tick ${t + 1}`, caption, tokens, edges, actors, durationMs: 1200 };
  });

  return {
    id: `backlog-${p.rate}-${p.consumers}-${p.perConsumer}`,
    title: "Arrival rate vs processing rate",
    description: `Producer sends ${p.rate} messages per tick to a queue drained by ${p.consumers} workers at ${p.perConsumer} per tick each.`,
    width: 640,
    height: 300,
    actors: [
      { id: "producer", kind: "producer", label: "Producers", sub: `${p.rate} msg / tick`, x: 75, y: 150, w: 120 },
      { id: "queue", kind: "queue", label: "jobs", sub: `capacity out: ${capacity} / tick`, x: 300, y: 150, w: 220, h: 64 },
      ...consumerActors,
    ],
    edges: [edge("producer", "queue"), ...consumerActors.map((c) => edge("queue", c.id))],
    steps,
  };
}

// ─── Chapter 9 · Quorum queues ───────────────────────────────────────────────

export const quorumScene: SceneDefinition = {
  id: "quorum-queue",
  title: "Quorum queue replication and leader failover",
  description: "A three-replica quorum queue replicates a message to a majority, survives a leader failure, and becomes unavailable when a majority is lost.",
  width: 640,
  height: 340,
  actors: [
    { id: "producer", kind: "producer", label: "Producer", x: 80, y: 180, w: 120 },
    { id: "n1", kind: "node", label: "rabbit-1", sub: "replica", x: 320, y: 180, w: 150, h: 64 },
    { id: "n2", kind: "node", label: "rabbit-2", sub: "replica", x: 545, y: 70, w: 150, h: 64 },
    { id: "n3", kind: "node", label: "rabbit-3", sub: "replica", x: 545, y: 285, w: 150, h: 64 },
  ],
  edges: [edge("producer", "n1"), edge("producer", "n2", undefined, true), edge("n1", "n2", "replicate"), edge("n1", "n3", "replicate"), edge("n2", "n3", undefined, true)],
  steps: [
    {
      title: "Leader + followers",
      caption: "The quorum queue \"orders\" has three replicas on three nodes. One is the leader; it handles publishes and deliveries. The other two are followers.",
      tokens: [],
      actors: { n1: { status: "leader", badge: "leader", badgeTone: "indigo" }, n2: { badge: "follower" }, n3: { badge: "follower" } },
    },
    {
      title: "Publish",
      caption: "The producer publishes to the queue; the leader appends it to its log.",
      tokens: [at("m", "accepted", "n1", { label: "M" })],
      edges: { "producer-n1": "active" },
      actors: { n1: { status: "leader", badge: "leader", badgeTone: "indigo" }, n2: { badge: "follower" }, n3: { badge: "follower" } },
    },
    {
      title: "Replicate",
      caption: "The leader replicates the entry to the followers (Raft). rabbit-2 has written it; rabbit-3 is a little behind.",
      tokens: [at("m", "stored", "n1", { label: "M" }), at("m2", "stored", "n2", { label: "M" }), on("m3", "transit", "n1-n3", 0.55, { label: "M" })],
      edges: { "n1-n2": "active", "n1-n3": "active" },
      actors: { n1: { status: "leader", badge: "leader", badgeTone: "indigo" }, n2: { badge: "follower" }, n3: { badge: "follower" } },
    },
    {
      title: "Majority → confirm",
      caption: "2 of 3 replicas have the entry — a majority — so it is committed and the publisher receives its confirm.",
      tokens: [at("m", "stored", "n1", { label: "M" }), at("m2", "stored", "n2", { label: "M" }), at("m3", "stored", "n3", { label: "M" })],
      actors: { n1: { status: "leader", badge: "leader · committed", badgeTone: "emerald" }, n2: { badge: "follower" }, n3: { badge: "follower" }, producer: { status: "ok", badge: "confirmed", badgeTone: "emerald" } },
    },
    {
      title: "Leader fails",
      caption: "rabbit-1 crashes. The committed message is still safe on rabbit-2 and rabbit-3.",
      tokens: [at("m2", "stored", "n2", { label: "M" }), at("m3", "stored", "n3", { label: "M" })],
      actors: { n1: { status: "down", badge: "down", badgeTone: "rose" }, n2: { badge: "follower" }, n3: { badge: "follower" } },
      durationMs: 2200,
    },
    {
      title: "New leader",
      caption: "The two surviving replicas still form a majority, so they elect rabbit-2 as the new leader. Clients reconnect and carry on.",
      tokens: [at("m2", "stored", "n2", { label: "M" }), at("m3", "stored", "n3", { label: "M" })],
      edges: { "producer-n2": "active", "n2-n3": "active" },
      actors: { n1: { status: "down", badge: "down", badgeTone: "rose" }, n2: { status: "leader", badge: "new leader", badgeTone: "indigo" }, n3: { badge: "follower" } },
    },
    {
      title: "Majority lost",
      caption: "Now rabbit-3 also fails. One replica out of three is not a majority: the queue stops accepting publishes and deliveries rather than risk diverging data.",
      srText: "Two of three nodes are down. The quorum queue becomes unavailable.",
      tokens: [at("m2", "stored", "n2", { label: "M" }), on("x", "rejected", "producer-n2", 0.5, { label: "!" })],
      edges: { "producer-n2": "failed" },
      actors: { n1: { status: "down", badge: "down", badgeTone: "rose" }, n2: { status: "failed", badge: "no quorum · unavailable", badgeTone: "rose" }, n3: { status: "down", badge: "down", badgeTone: "rose" } },
      durationMs: 3000,
    },
    {
      title: "Recovered",
      caption: "rabbit-1 comes back. With 2 of 3 replicas online the queue is available again, and rabbit-1 catches up from the leader's log.",
      tokens: [at("m2", "stored", "n2", { label: "M" }), on("m1", "transit", "n1-n2", 0.5, { label: "M" })],
      edges: { "producer-n2": "active", "n1-n2": "active" },
      actors: { n1: { status: "ok", badge: "catching up", badgeTone: "amber" }, n2: { status: "leader", badge: "leader", badgeTone: "indigo" }, n3: { status: "down", badge: "down", badgeTone: "rose" } },
      durationMs: 2800,
    },
  ],
};

// ─── Chapter 10 · Queue vs log ───────────────────────────────────────────────

export const queueVsLogScene: SceneDefinition = {
  id: "queue-vs-log",
  title: "Queue (RabbitMQ) vs log (Kafka)",
  description: "A RabbitMQ queue deletes messages once acknowledged, while a Kafka log retains them and each consumer group tracks its own offset.",
  width: 680,
  height: 300,
  actors: [
    { id: "q", kind: "queue", label: "RabbitMQ queue", sub: "message deleted after ack", x: 150, y: 80, w: 230, h: 64 },
    { id: "w", kind: "consumer", label: "Worker", x: 150, y: 230, w: 130 },
    { id: "log", kind: "queue", label: "Kafka partition", sub: "retained for 7 days", x: 500, y: 80, w: 230, h: 64 },
    { id: "ga", kind: "consumer", label: "Group A", sub: "billing", x: 420, y: 230, w: 120 },
    { id: "gb", kind: "consumer", label: "Group B", sub: "analytics", x: 590, y: 230, w: 120 },
  ],
  edges: [edge("q", "w"), edge("log", "ga"), edge("log", "gb")],
  steps: [
    {
      title: "Same 4 events",
      caption: "Both systems hold the same four events.",
      tokens: [...["1", "2", "3", "4"].map((n, i) => at(`q${n}`, "queued", "q", { label: n, slot: i })), ...["1", "2", "3", "4"].map((n, i) => at(`l${n}`, "stored", "log", { label: n, slot: i }))],
      actors: { ga: { badge: "offset 0" }, gb: { badge: "offset 0" } },
    },
    {
      title: "Consume two",
      caption: "The worker acks 1 and 2 → RabbitMQ deletes them. Group A reads 1 and 2 → Kafka only moves Group A's offset; the events stay in the log.",
      tokens: [at("q1", "acked", "w", { label: "1" }), ...["3", "4"].map((n, i) => at(`q${n}`, "queued", "q", { label: n, slot: i })), ...["1", "2", "3", "4"].map((n, i) => at(`l${n}`, "stored", "log", { label: n, slot: i }))],
      edges: { "q-w": "active", "log-ga": "active" },
      actors: { w: { status: "ok", badge: "acked 1, 2", badgeTone: "emerald" }, ga: { status: "active", badge: "offset 2", badgeTone: "indigo" }, gb: { badge: "offset 0" } },
    },
    {
      title: "Independent readers",
      caption: "Group B (analytics) starts later and reads from offset 0 — it sees all four events, independently of Group A.",
      tokens: [...["3", "4"].map((n, i) => at(`q${n}`, "queued", "q", { label: n, slot: i })), ...["1", "2", "3", "4"].map((n, i) => at(`l${n}`, "stored", "log", { label: n, slot: i }))],
      edges: { "log-gb": "active" },
      actors: { ga: { badge: "offset 2", badgeTone: "indigo" }, gb: { status: "active", badge: "offset 4", badgeTone: "indigo" } },
    },
    {
      title: "Replay",
      caption: "Group A found a bug and resets its offset to 0 to replay history. In a classic RabbitMQ queue, acked messages are gone — replay is not a queue feature (RabbitMQ Streams add log semantics).",
      tokens: [at("q3", "acked", "w", { label: "3" }), at("q4", "queued", "q", { label: "4", slot: 0 }), ...["1", "2", "3", "4"].map((n, i) => at(`l${n}`, "stored", "log", { label: n, slot: i }))],
      edges: { "q-w": "active", "log-ga": "active" },
      actors: { w: { status: "ok", badge: "acked 3", badgeTone: "emerald" }, ga: { status: "active", badge: "offset 0 → replay", badgeTone: "amber" }, gb: { badge: "offset 4", badgeTone: "indigo" } },
      durationMs: 3400,
    },
  ],
};

// ─── Home page · compact Learn preview ───────────────────────────────────────
