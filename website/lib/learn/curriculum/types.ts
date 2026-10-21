import type { InterviewQuestion, Rich } from "@/lib/learn/types";

/**
 * Curriculum model shared by the two learning journeys:
 *  - Rapid Interview Prep (lib/learn/curriculum/prep.ts) — time-boxed plans
 *  - Learn In Depth (lib/learn/curriculum/roadmap.ts) — 12 ordered stages
 * Both link to the same canonical pages: concept briefs, design walkthroughs
 * and full interactive courses (e.g. /learn/rabbitmq).
 *
 * Every brief is organised around the learning loop
 *   Understand → Visualize → Practise → Apply → Explain → Recall
 * so students move beyond passive reading.
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

/** A worked example with explicit assumptions and numbers. */
export interface WorkedExample {
  title: string;
  setup: Rich;
  steps: Rich[];
  takeaway: Rich;
}

/** Interactive labs that let students change inputs and observe consequences. */
export type LabId = "cache" | "estimation" | "rate-limiter";

/** A weak interview answer, why it falls short, and a stronger version. */
export interface AnswerContrast {
  weak: Rich;
  why: Rich;
  strong: Rich;
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
  /** "After this you can…" — shown on plans and the roadmap. */
  outcome: string;
  // Understand
  problem: Rich;
  simple: Rich;
  analogy?: Rich;
  // Visualize
  howItWorks: Rich[];
  /** Key into the brief scene registry (components/learn/curriculum/BriefScene). */
  sceneId?: "request-flow" | "cache-aside" | "load-balancer" | "async-messaging";
  // Practise
  example: WorkedExample;
  lab?: LabId;
  // Apply
  whenToUse: Rich[];
  whenNotToUse: Rich[];
  tradeoffs: { pros: Rich[]; cons: Rich[]; decide: Rich };
  /** What happens under higher load or partial failure. */
  failureModes: Rich[];
  // Explain
  /** The learner writes their own explanation, then compares. */
  explain: { prompt: Rich; keyPoints: Rich[] };
  /** A model ~45-second spoken answer. */
  interviewAnswer: Rich;
  mistakes: AnswerContrast[];
  questions: InterviewQuestion[];
  // Recall
  recap: Rich[];
  recall: RecallPrompt;
  // Connections
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
  /** Coaching shown after the reveal. */
  coach: {
    /** What makes the model answer strong. */
    strong: Rich;
    /** How an interviewer might push back — and how to respond. */
    challenge?: Rich;
  };
}

export interface DesignWalkthrough {
  slug: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  minutes: number;
  summary: Rich;
  /** "After this you can…" — shown on plans and the roadmap. */
  outcome: string;
  /** Exact problem name in the simulator's Problems tab, when one exists. */
  simulatorProblem?: string;
  /** Concept brief slugs this design relies on. */
  concepts: string[];
  steps: DesignStep[];
  followUps: InterviewQuestion[];
  /** The 60-second recap you'd give at the end of the interview. */
  wrapUp: Rich[];
}
