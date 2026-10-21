import type { InterviewQuestion, Rich } from "@/lib/learn/types";

/**
 * Curriculum model shared by the two learning journeys:
 *  - Rapid Interview Prep (lib/learn/curriculum/prep.ts) — time-boxed plans
 *  - Learn In Depth (lib/learn/curriculum/roadmap.ts) — 12 ordered stages
 * Both link to the same canonical pages: concept briefs, design walkthroughs
 * and full interactive courses (e.g. /learn/rabbitmq).
 */

export interface RecallOption {
  text: Rich;
  verdict: "best" | "valid" | "weak";
  why: Rich;
}

/** Active recall: commit to an answer, then see reasoning for every option. */
export interface RecallPrompt {
  prompt: Rich;
  options: RecallOption[];
}

export interface DeeperLink {
  label: string;
  href: string;
  kind: "course" | "brief" | "design" | "simulator";
}

/** A concise, interview-oriented lesson. One canonical page per concept. */
export interface ConceptBrief {
  slug: string;
  title: string;
  /** Used in plans: "Caching in 10 min". */
  shortTitle: string;
  stage: number;
  minutes: number;
  summary: Rich;
  problem: Rich;
  simple: Rich;
  analogy?: Rich;
  howItWorks: Rich[];
  /** Key into the brief scene registry (components/learn/curriculum/BriefScene). */
  sceneId?: "request-flow" | "cache-aside" | "load-balancer" | "async-messaging";
  whenToUse: Rich[];
  whenNotToUse: Rich[];
  tradeoffs: { pros: Rich[]; cons: Rich[]; decide: Rich };
  questions: InterviewQuestion[];
  /** A weak interview answer next to a stronger one. */
  mistakes: { weak: Rich; strong: Rich }[];
  recap: Rich[];
  recall: RecallPrompt;
  prerequisites: string[];
  deeper: DeeperLink[];
}

export const WORKFLOW = [
  { id: "requirements", label: "Clarify requirements" },
  { id: "scale", label: "Define scale & constraints" },
  { id: "api", label: "APIs & data model" },
  { id: "architecture", label: "High-level architecture" },
  { id: "deep-dive", label: "Deep-dive critical components" },
  { id: "failures", label: "Bottlenecks & failure handling" },
  { id: "tradeoffs", label: "Trade-offs & alternatives" },
] as const;

export type WorkflowStepId = (typeof WORKFLOW)[number]["id"];

export interface DesignStep {
  id: WorkflowStepId;
  /** "Your turn" prompt shown before the answer is revealed. */
  prompt: Rich;
  answer: Rich[];
}

export interface DesignWalkthrough {
  slug: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  minutes: number;
  summary: Rich;
  /** Exact problem name in the simulator's Problems tab, when one exists. */
  simulatorProblem?: string;
  /** Concept brief slugs this design relies on. */
  concepts: string[];
  steps: DesignStep[];
  followUps: InterviewQuestion[];
}
