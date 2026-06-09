import type { Node } from "@xyflow/react";
import type { NodeData } from "./store";
import type { Problem, ScoringCriteria } from "./problems-data";

export interface CriterionResult {
  description: string;
  met: boolean;
  points: number;
  maxPoints: number;
  matchedComponents: string[];
}

export interface ScoreResult {
  score: number;         // 0-100
  maxScore: number;
  grade: string;
  criteria: CriterionResult[];
  feedback: string;
}

export function scoreArchitecture(nodes: Node[], problem: Problem | null): ScoreResult {
  if (!problem) return { score: 0, maxScore: 100, grade: "N/A", criteria: [], feedback: "Select a problem first." };
  if (nodes.length === 0) return { score: 0, maxScore: 100, grade: "F", criteria: [], feedback: "Add components to your design." };

  const presentIds = new Set(nodes.map((n) => (n.data as NodeData).componentId));
  const maxScore = problem.scoringCriteria.reduce((s, c) => s + c.points, 0);

  const criteria: CriterionResult[] = problem.scoringCriteria.map((c: ScoringCriteria) => {
    const matched = c.componentIds.filter((id) => presentIds.has(id));
    const met = matched.length > 0;
    return { description: c.description, met, points: met ? c.points : 0, maxPoints: c.points, matchedComponents: matched };
  });

  const earned = criteria.reduce((s, c) => s + c.points, 0);
  const score = Math.round((earned / maxScore) * 100);

  const grade =
    score >= 90 ? "A" :
    score >= 80 ? "B" :
    score >= 70 ? "C" :
    score >= 60 ? "D" : "F";

  const missed = criteria.filter((c) => !c.met);
  const feedback =
    score === 100 ? "Perfect design! All criteria met." :
    missed.length > 0 ? `Missing: ${missed.map((c) => c.description).join(", ")}.` :
    "Good design. Keep refining.";

  return { score, maxScore, grade, criteria, feedback };
}
