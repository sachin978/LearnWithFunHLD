import { briefHref, designHref, designShortTitle, getBrief, getDesign } from "./index";

/**
 * Rapid Interview Prep — three genuinely different plans. Shorter horizons
 * cut scope (fewer designs, fewer optional deep dives), not just time.
 * Every task says what the learner will be able to do afterwards.
 */

export type PrepHorizon = 1 | 3 | 7;
export type TaskKind = "learn" | "design" | "deep" | "simulate" | "review";

export interface PrepTask {
  id: string;
  kind: TaskKind;
  title: string;
  /** What this task gives you — "after this you can…". */
  why: string;
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
  /** An honest statement of what this plan can and can't do. */
  promise: string;
  dailyLoad: string;
  days: PrepDay[];
  /** What to do once the essentials are done. */
  afterwards: string[];
}

const learn = (slug: string, essential = true): PrepTask => {
  const b = getBrief(slug);
  if (!b) throw new Error(`Unknown brief ${slug}`);
  const deep = b.deeper.find((d) => d.kind === "course") ?? b.deeper[0];
  return {
    id: `learn-${slug}`,
    kind: "learn",
    title: `${b.shortTitle} in ${b.minutes} min`,
    why: b.outcome,
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
  return {
    id: `design-${slug}`,
    kind: "design",
    title: `Practice: ${designShortTitle(d)} (answer each step before revealing)`,
    why: d.outcome,
    minutes: d.minutes,
    essential,
    href: designHref(slug),
  };
};

const deep = (id: string, title: string, why: string, minutes: number, href: string): PrepTask => ({ id, kind: "deep", title, why, minutes, essential: false, href });

const MOCK_WHY = "Rehearse the full 7-step workflow under time pressure and out loud — the closest thing to the real interview.";

const simulate = (id: string, title: string, minutes: number, essential = true): PrepTask => ({ id, kind: "simulate", title, why: MOCK_WHY, minutes, essential, href: "/simulator" });

const review = (id: string, title: string, why: string, minutes: number, href: string, essential = true): PrepTask => ({ id, kind: "review", title, why, minutes, essential, href });

const CHECKLIST_WHY = "Confirm you can explain each core idea out loud; anything you can't, revisit before the interview.";
const RECALL_WHY = "Answering from memory exposes ideas you recognise but can't yet explain — the gaps an interviewer will find.";

export const PREP_PLANS: Record<PrepHorizon, PrepPlan> = {
  1: {
    horizon: 1,
    label: "1 day",
    tagline: "Emergency revision",
    promise:
      "One day won't make you an expert. It will give you a structure for any question, the building blocks interviewers expect, and one rehearsed design — and help you avoid the most common mistakes.",
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
          review("checklist-1d", "Final revision checklist (below)", CHECKLIST_WHY, 15, "#checklist"),
        ],
      },
    ],
    afterwards: [
      "Read the final checklist once more tonight, then rest — sleep helps more than another hour of reading.",
      "In the interview, lead with the framework: requirements, scale, API, then architecture.",
      "If you have spare time, do the optional reliability and CAP briefs — they're common follow-ups.",
    ],
  },
  3: {
    horizon: 3,
    label: "3 days",
    tagline: "Focused preparation",
    promise:
      "Three days covers the interview method, every core building block and several representative designs, finishing with a timed mock — enough to reason about unfamiliar questions, not just recite answers.",
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
          review("followups-3d", "Spaced review: answer interview and follow-up questions from memory", RECALL_WHY, 20, "/learn/review"),
          review("checklist-3d", "Final revision checklist (below)", CHECKLIST_WHY, 15, "#checklist"),
        ],
      },
    ],
    afterwards: [
      "Do one more timed mock on a problem you haven't seen, then stop studying new material.",
      "Re-run any review cards you rated \"missed\", and re-read those briefs' worked examples.",
      "The night before: the final checklist, then rest.",
    ],
  },
  7: {
    horizon: 7,
    label: "7 days",
    tagline: "Structured revision and practice",
    promise:
      "A week leaves room to understand each building block properly, practise six designs, go deeper on messaging, and finish with two timed mocks and targeted review of your weak spots.",
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
          deep("deep-rabbit-1-5", "Go deeper: RabbitMQ chapters 1–5 (brokers, exchanges, acks)", "See routing, acknowledgements and redelivery animated step by step, so follow-up questions on delivery guarantees don't catch you out.", 45, "/learn/rabbitmq"),
          designTask("notification-system"),
        ],
      },
      { title: "Day 5", focus: "Reliability and consistency", tasks: [learn("reliability-patterns"), learn("cap-consistency"), designTask("news-feed"), learn("observability", false)] },
      {
        title: "Day 6",
        focus: "Storage and real-time",
        tasks: [
          learn("cdn-object-storage"),
          designTask("file-storage"),
          designTask("chat-app"),
          learn("security-fundamentals", false),
          deep("deep-rabbit-6-9", "Go deeper: RabbitMQ chapters 6–9 (durability, retries, HA)", "Explain durability, dead-lettering and quorum replication well enough to defend them under follow-ups.", 40, "/learn/rabbitmq#durability"),
        ],
      },
      {
        title: "Day 7",
        focus: "Mock interviews and review",
        tasks: [
          simulate("mock-7d-1", "Timed mock #1 in the simulator (45 min), explained out loud", 45),
          simulate("mock-7d-2", "Timed mock #2 on a different problem (45 min)", 45, false),
          review("weak-7d", "Spaced review: answer due cards from memory, then revisit any you miss", RECALL_WHY, 30, "/learn/review"),
          review("checklist-7d", "Final revision checklist (below)", CHECKLIST_WHY, 15, "#checklist"),
        ],
      },
    ],
    afterwards: [
      "Keep a light daily review (10–15 minutes of due cards) until the interview.",
      "Switch to problems you haven't seen — try the video streaming or e-commerce walkthroughs, or any simulator problem.",
      "Before the interview: the final checklist, a short warm-up design, then rest.",
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
