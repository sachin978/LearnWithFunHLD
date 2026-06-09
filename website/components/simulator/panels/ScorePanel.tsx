"use client";
import { useSimulatorStore } from "@/lib/simulator/store";
import { scoreArchitecture } from "@/lib/simulator/scoring";

export default function ScorePanel() {
  const { nodes, activeProblem, scoreResult, setScoreResult } = useSimulatorStore();

  const run = () => setScoreResult(scoreArchitecture(nodes, activeProblem));

  const gradeColor = (g: string) =>
    g === "A" ? "text-emerald-400" : g === "B" ? "text-indigo-400" : g === "C" ? "text-amber-400" : "text-rose-400";

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      <div>
        <div className="text-sm font-semibold text-white mb-1">Interview Scoring</div>
        <p className="text-zinc-500 text-xs">Evaluates your design against the problem's rubric.</p>
      </div>

      <button
        onClick={run}
        disabled={!activeProblem || nodes.length === 0}
        className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
      >
        🎯 Score Design
      </button>

      {scoreResult && (
        <div className="space-y-3">
          {/* Score ring */}
          <div className="flex items-center gap-4 p-3 rounded-lg border border-zinc-700 bg-zinc-900">
            <div className="text-center">
              <div className={`text-4xl font-black ${gradeColor(scoreResult.grade)}`}>{scoreResult.grade}</div>
              <div className="text-zinc-500 text-[10px]">Grade</div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Score</span>
                <span className="text-white font-bold">{scoreResult.score}/100</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${scoreResult.score >= 80 ? "bg-emerald-500" : scoreResult.score >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                  style={{ width: `${scoreResult.score}%` }}
                />
              </div>
              <p className="text-zinc-400 text-[11px] mt-1">{scoreResult.feedback}</p>
            </div>
          </div>

          {/* Criteria breakdown */}
          <div className="space-y-2">
            {scoreResult.criteria.map((c, i) => (
              <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border ${c.met ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-700 bg-zinc-900/50"}`}>
                <span className={`text-sm flex-shrink-0 mt-0.5 ${c.met ? "text-emerald-400" : "text-zinc-600"}`}>
                  {c.met ? "✓" : "○"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs ${c.met ? "text-white" : "text-zinc-500"}`}>{c.description}</div>
                  <div className="text-[10px] text-zinc-500">{c.points}/{c.maxPoints} pts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
