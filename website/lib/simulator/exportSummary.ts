import type { Node, Edge } from "@xyflow/react";
import type { NodeData } from "./store";
import type { Problem } from "./problems-data";
import type { ScoreResult } from "./scoring";
import type { SimulationResult } from "./simulation";
import { TRADEOFFS } from "./tradeoffs";
import { computeCapacityEstimate, fmtQPS, type CapacityInputs } from "./capacity";

export interface SummaryInput {
  problem: Problem | null;
  nodes: Node[];
  edges: Edge[];
  scoreResult: ScoreResult | null;
  simulationResult: SimulationResult | null;
  capacityInputs: CapacityInputs;
}

/** Builds a self-contained Markdown summary of the current design — architecture,
 * capacity estimation, simulation results, interview score, and detected trade-offs. */
export function generateDesignSummary({
  problem,
  nodes,
  edges,
  scoreResult,
  simulationResult,
  capacityInputs,
}: SummaryInput): string {
  const lines: string[] = [];
  const push = (line = "") => lines.push(line);

  push("# WireUp System — Design Summary");
  push(`_Generated ${new Date().toLocaleString()}_`);
  push();

  // ── Problem ──────────────────────────────────────────────────────────────
  if (problem) {
    push(`## Problem: ${problem.name}`);
    push(`**${problem.category}** · Difficulty: **${problem.difficulty}**`);
    push();
    push(problem.description);
    push();
    push("| Metric | Value |");
    push("|---|---|");
    push(`| Reads/sec | ${problem.requirements.readsPerSec}k |`);
    push(`| Writes/sec | ${problem.requirements.writesPerSec}k |`);
    push(`| Storage | ${problem.requirements.storage} |`);
    push(`| Latency SLA | ${problem.requirements.latencySLA} |`);
    push(`| Users | ${problem.requirements.users} |`);
  } else {
    push("## Problem");
    push("_No problem selected._");
  }
  push();

  // ── Architecture ─────────────────────────────────────────────────────────
  push(`## Architecture (${nodes.length} components, ${edges.length} connections)`);
  push();
  if (nodes.length === 0) {
    push("_No components placed on the canvas yet._");
  } else {
    push("### Components");
    for (const n of nodes) {
      const d = n.data as NodeData;
      const total = d.rpsCapacity * (d.instances ?? 1);
      const notes = d.notes ? ` — _${d.notes}_` : "";
      push(`- **${d.label}** (${d.category}) — ${d.rpsCapacity}k RPS × ${d.instances ?? 1} = ${total}k RPS${notes}`);
    }
    if (edges.length > 0) {
      push();
      push("### Connections");
      const labelOf = (id: string) => {
        const n = nodes.find((n) => n.id === id);
        return n ? (n.data as NodeData).label : id;
      };
      for (const e of edges) push(`- ${labelOf(e.source)} → ${labelOf(e.target)}`);
    }
  }
  push();

  // ── Capacity estimation ──────────────────────────────────────────────────
  const cap = computeCapacityEstimate(capacityInputs);
  push("## Capacity Estimation");
  push(`Inputs: DAU=${capacityInputs.dau.toLocaleString()}, Requests/User=${capacityInputs.reqPerUser}, Write ratio=${capacityInputs.writeRatio}%, Data size=${capacityInputs.dataSizeKB}KB`);
  push();
  push("| Metric | Value |");
  push("|---|---|");
  push(`| Avg QPS | ${fmtQPS(cap.totalQPS)}/s |`);
  push(`| Peak QPS (3×) | ${fmtQPS(cap.peakQPS)}/s |`);
  push(`| Read QPS | ${fmtQPS(cap.readQPS)}/s |`);
  push(`| Write QPS | ${fmtQPS(cap.writeQPS)}/s |`);
  push(`| Storage / year | ${cap.storageYear.toFixed(1)} GB |`);
  push(`| Bandwidth peak | ${cap.bandwidthMBs.toFixed(1)} MB/s |`);
  push();

  // ── Load simulation ──────────────────────────────────────────────────────
  push("## Load Simulation");
  if (simulationResult) {
    push(simulationResult.summary);
    push();
    push("| Metric | Value |");
    push("|---|---|");
    push(`| Total RPS | ${simulationResult.totalRps}k |`);
    push(`| Throughput | ${simulationResult.throughput.toFixed(1)}k |`);
    push(`| Path Latency | ${simulationResult.totalLatencyMs.toFixed(0)}ms |`);
    push();
    push("### Per-component results");
    for (const r of simulationResult.allNodes) {
      const statusLabel = r.status === "critical" ? "BOTTLENECK" : r.status === "warning" ? "WARN" : r.status === "idle" ? "IDLE" : "OK";
      push(`- **${r.label}**: ${statusLabel} — ${Math.round(r.utilisation * 100)}% utilisation (${r.incomingRps.toFixed(1)}k / ${r.capacity}k RPS)`);
    }
    if (simulationResult.warnings.length > 0) {
      push();
      push("### Warnings");
      for (const w of simulationResult.warnings) push(`- ⚠ ${w}`);
    }
  } else {
    push('_Simulation not yet run — open the Simulate tab and click "Run Simulation" to include results here._');
  }
  push();

  // ── Interview score ──────────────────────────────────────────────────────
  push("## Interview Score");
  if (scoreResult) {
    push(`**${scoreResult.total}/100 — ${scoreResult.verdict}**`);
    push();
    push(scoreResult.summary);
    for (const cat of scoreResult.categories) {
      push();
      push(`### ${cat.category} — ${cat.score}/${cat.maxScore}`);
      for (const p of cat.passed) push(`- ✓ ${p}`);
      for (const f of cat.feedback) push(`- ○ ${f}`);
    }
  } else {
    push('_Score not yet computed — open the Score tab and click "Score Design" to include results here._');
  }
  push();

  // ── Trade-offs ───────────────────────────────────────────────────────────
  const presentIds = new Set(nodes.map((n) => (n.data as NodeData).componentId));
  const applicable = TRADEOFFS.filter((t) => t.check(presentIds));
  push("## Trade-offs Detected");
  if (applicable.length === 0) {
    push("_No notable trade-offs detected yet._");
  } else {
    for (const t of applicable) {
      push();
      push(`### ${t.title} (${t.category})`);
      push(`- **Pro:** ${t.pro}`);
      push(`- **Con:** ${t.con}`);
    }
  }
  push();
  push("---");
  push("_Generated by WireUp System._");

  return lines.join("\n");
}

/** Triggers a browser download of the given text content as a file. */
export function downloadTextFile(filename: string, content: string, mimeType = "text/markdown;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
