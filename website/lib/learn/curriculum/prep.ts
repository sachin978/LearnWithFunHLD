import { briefHref, designHref, designShortTitle, getBrief, getDesign } from "./index";

/**
 * Rapid Interview Prep — three genuinely different plans. Shorter horizons
 * cut scope (fewer designs, fewer optional deep dives), not just time.
 */

export type PrepHorizon = 1 | 3 | 7;
export type TaskKind = "learn" | "design" | "deep" | "simulate" | "review";

export interface PrepTask {
  id: string;
  kind: TaskKind;
  title: string;
  minutes: number;
  essential: boolean;
  href: string;
  /** "Understand this in depth" target. */
  deepHref?: string;
  deepLabel?: string;
}

export interface PrepDay {
  title: string;
  focus: string;
  tasks: PrepTask[];
}

export interface PrepPlan {
  horizon: PrepHorizon;
  label: string;
  tagline: string;
  dailyLoad: string;
  days: PrepDay[];
}

const learn = (slug: string, essential = true): PrepTask => {
  const b = getBrief(slug);
  if (!b) throw new Error(`Unknown brief ${slug}`);
  const deep = b.deeper.find((d) => d.kind === "course") ?? b.deeper[0];
  return {
    id: `learn-${slug}`,
    kind: "learn",
    title: `${b.shortTitle} in ${b.minutes} min`,
    minutes: b.minutes,
    essential,
    href: briefHref(slug),
    deepHref: deep?.href,
    deepLabel: deep?.label,
  };
};

const designTask = (slug: string, essential = true): PrepTask => {
  const d = getDesign(slug);
  if (!d) throw new Error(`Unknown design ${slug}`);
  return { id: `design-${slug}`, kind: "design", title: `Practice: ${designShortTitle(d)} (try each step before revealing)`, minutes: d.minutes, essential, href: designHref(slug) };
};

const deep = (id: string, title: string, minutes: number, href: string): PrepTask => ({ id, kind: "deep", title, minutes, essential: false, href });

const simulate = (id: string, title: string, minutes: number, essential = true): PrepTask => ({ id, kind: "simulate", title, minutes, essential, href: "/simulator" });

const review = (id: string, title: string, minutes: number, href: string, essential = true): PrepTask => ({ id, kind: "review", title, minutes, essential, href });

export const PREP_PLANS: Record<PrepHorizon, PrepPlan> = {
  1: {
    horizon: 1,
    label: "1 day",
    tagline: "Emergency revision",
    dailyLoad: "Work through the essentials in order; add optional tasks only if time allows — and rest before the interview.",
    days: [
      {
        title: "Morning",
        focus: "The framework and the building blocks every design uses",
        tasks: [
          learn("interview-framework"),
          learn("estimation"),
          learn("databases"),
          learn("caching"),
          learn("load-balancing"),
          learn("replication-sharding"),
          learn("message-queues"),
          learn("reliability-patterns", false),
          learn("cap-consistency", false),
        ],
      },
      {
        title: "Afternoon",
        focus: "Apply it once, under time pressure, then revise out loud",
        tasks: [
          designTask("url-shortener"),
          designTask("rate-limiter", false),
          simulate("mock-1d", "Timed mock: solve URL Shortener in the simulator's Practice Interview mode (45 min) and explain each choice out loud", 45),
          review("checklist-1d", "Final revision checklist (below)", 15, "#checklist"),
        ],
      },
    ],
  },
  3: {
    horizon: 3,
    label: "3 days",
    tagline: "Focused preparation",
    dailyLoad: "About 1.5–2 hours of essentials a day, plus optional extras.",
    days: [
      {
        title: "Day 1",
        focus: "Interview method + data fundamentals",
        tasks: [learn("interview-framework"), learn("estimation"), learn("api-data-modeling"), learn("databases"), learn("caching"), designTask("url-shortener")],
      },
      {
        title: "Day 2",
        focus: "Scaling, async processing and reliability",
        tasks: [
          learn("load-balancing"),
          learn("replication-sharding"),
          learn("message-queues"),
          learn("reliability-patterns"),
          learn("cap-consistency"),
          designTask("rate-limiter"),
          designTask("notification-system"),
        ],
      },
      {
        title: "Day 3",
        focus: "A harder design, a timed mock and revision",
        tasks: [
          learn("cdn-object-storage", false),
          designTask("news-feed"),
          designTask("chat-app", false),
          simulate("mock-3d", "Timed mock in the simulator: pick a problem you haven't seen (45 min), explain out loud", 45),
          review("followups-3d", "Re-answer the follow-up questions from the designs you did, without looking", 20, "/learn/designs/news-feed#follow-ups"),
          review("checklist-3d", "Final revision checklist (below)", 15, "#checklist"),
        ],
      },
    ],
  },
  7: {
    horizon: 7,
    label: "7 days",
    tagline: "Structured revision and practice",
    dailyLoad: "About an hour of essentials a day, with optional deep dives.",
    days: [
      { title: "Day 1", focus: "The interview method", tasks: [learn("interview-framework"), learn("estimation"), learn("api-data-modeling"), learn("http-request-flow")] },
      { title: "Day 2", focus: "Data", tasks: [learn("databases"), learn("caching"), designTask("url-shortener")] },
      { title: "Day 3", focus: "Scaling", tasks: [learn("load-balancing"), learn("replication-sharding"), designTask("rate-limiter")] },
      {
        title: "Day 4",
        focus: "Asynchronous systems",
        tasks: [
          learn("message-queues"),
          deep("deep-rabbit-1-5", "Go deeper: RabbitMQ chapters 1–5 (brokers, exchanges, acks)", 45, "/learn/rabbitmq"),
          designTask("notification-system"),
        ],
      },
      { title: "Day 5", focus: "Reliability and consistency", tasks: [learn("reliability-patterns"), learn("cap-consistency"), designTask("news-feed")] },
      {
        title: "Day 6",
        focus: "Storage and real-time",
        tasks: [learn("cdn-object-storage"), designTask("file-storage"), designTask("chat-app"), deep("deep-rabbit-6-9", "Go deeper: RabbitMQ chapters 6–9 (durability, retries, HA)", 40, "/learn/rabbitmq#durability")],
      },
      {
        title: "Day 7",
        focus: "Mock interviews and review",
        tasks: [
          simulate("mock-7d-1", "Timed mock #1 in the simulator (45 min), explained out loud", 45),
          simulate("mock-7d-2", "Timed mock #2 on a different problem (45 min)", 45, false),
          review("weak-7d", "Revisit the briefs where your recall answers were weakest", 30, "/learn/roadmap"),
          review("checklist-7d", "Final revision checklist (below)", 15, "#checklist"),
        ],
      },
    ],
  },
};

export const FINAL_CHECKLIST: string[] = [
  "I can walk through the 7 steps without notes and keep each early step to ~5 minutes",
  "I can estimate QPS and storage from DAU in under 3 minutes",
  "I can explain when to add a cache, and how I'd invalidate it",
  "I can explain replicas vs shards, and pick a shard key",
  "I can justify a queue and explain at-least-once delivery + idempotency",
  "I can describe timeouts, retries with backoff + jitter, and circuit breakers",
  "I can say which features need strong vs eventual consistency, and why",
  "I've practised at least one full design out loud, within 45 minutes",
  "For every component I draw, I can name one alternative and why I didn't pick it",
];

export const PREP_HORIZONS: PrepHorizon[] = [1, 3, 7];

export function planMinutes(plan: PrepPlan, essentialOnly = false) {
  return plan.days.flatMap((d) => d.tasks).filter((t) => !essentialOnly || t.essential).reduce((s, t) => s + t.minutes, 0);
}
