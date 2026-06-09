"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSimulatorStore } from "@/lib/simulator/store";
import { runSimulation } from "@/lib/simulator/simulation";
import { scoreArchitecture } from "@/lib/simulator/scoring";

const PHASES = [
  "Requirements",
  "Capacity Estimation",
  "High-Level Design",
  "Detailed Design",
  "Trade-offs",
  "Bottleneck & Scaling",
];
const PHASE_DURATION = 600; // 10 minutes each

export default function Toolbar() {
  const {
    nodes, edges, activeProblem,
    clearCanvas, setSimulationResult, setScoreResult, setRightTab,
    interviewActive, interviewPhase, interviewTimeLeft,
    setInterviewActive, setInterviewPhase, setInterviewTimeLeft,
  } = useSimulatorStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  // Interview timer
  useEffect(() => {
    if (interviewActive) {
      timerRef.current = setInterval(() => {
        setInterviewTimeLeft(Math.max(0, useSimulatorStore.getState().interviewTimeLeft - 1));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [interviewActive, setInterviewTimeLeft]);

  const startInterview = () => {
    setInterviewActive(true);
    setInterviewPhase(0);
    setInterviewTimeLeft(PHASE_DURATION);
  };

  const nextPhase = () => {
    if (interviewPhase < 5) {
      setInterviewPhase(interviewPhase + 1);
      setInterviewTimeLeft(PHASE_DURATION);
    } else {
      setInterviewActive(false);
      scoreArchitectureAndShow();
    }
  };

  const scoreArchitectureAndShow = () => {
    setScoreResult(scoreArchitecture(nodes, activeProblem));
    setRightTab("score");
  };

  const simulate = () => {
    setSimulationResult(runSimulation(nodes, edges, activeProblem));
    setRightTab("simulate");
  };

  const mins = String(Math.floor(interviewTimeLeft / 60)).padStart(2, "0");
  const secs = String(interviewTimeLeft % 60).padStart(2, "0");

  const addNote = () => {
    if (!noteText.trim()) { setNoteModalOpen(false); return; }
    const { setNodes } = useSimulatorStore.getState();
    setNodes((nds) => [
      ...nds,
      {
        id: `note_${Date.now()}`,
        type: "componentNode",
        position: { x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 },
        data: {
          componentId: "custom",
          label: "📝 Note",
          rpsCapacity: 0,
          instances: 1,
          category: "Compute",
          icon: "📝",
          color: "violet",
          notes: noteText,
        },
      },
    ]);
    setNoteText("");
    setNoteModalOpen(false);
  };

  return (
    <>
      <div className="h-11 flex items-center px-3 gap-2 border-b border-zinc-800 bg-zinc-950 flex-shrink-0">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 mr-2 flex-shrink-0">
          <span className="text-white font-bold text-sm">SystemSim</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">beta</span>
        </Link>

        <div className="h-5 w-px bg-zinc-700 mx-1" />

        {/* Problem name */}
        {activeProblem && (
          <span className="text-zinc-400 text-xs truncate max-w-[120px]">{activeProblem.name}</span>
        )}

        <div className="flex-1" />

        {/* Interview timer */}
        {interviewActive && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-amber-500/40 bg-amber-500/10">
            <span className="text-amber-400 text-xs font-bold">{PHASES[interviewPhase]}</span>
            <span className={`text-xs font-mono font-bold ${interviewTimeLeft < 60 ? "text-rose-400" : "text-amber-300"}`}>
              {mins}:{secs}
            </span>
            <button onClick={nextPhase} className="text-[10px] text-amber-400 hover:text-amber-200 border border-amber-500/30 px-1.5 py-0.5 rounded">
              {interviewPhase < 5 ? "Next →" : "Finish"}
            </button>
          </div>
        )}

        {/* Action buttons */}
        {(["Add Note", "Simulate", "Score", "Practice"] as const).map((label) => {
          const actions: Record<string, () => void> = {
            "Add Note": () => setNoteModalOpen(true),
            "Simulate": simulate,
            "Score": scoreArchitectureAndShow,
            "Practice": startInterview,
          };
          const colors: Record<string, string> = {
            "Add Note": "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white",
            "Simulate": "border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10",
            "Score": "border-violet-500/50 text-violet-300 hover:bg-violet-500/10",
            "Practice": "border-amber-500/50 text-amber-300 hover:bg-amber-500/10",
          };
          return (
            <button
              key={label}
              onClick={actions[label]}
              className={`px-3 py-1 rounded-lg border text-xs font-medium transition ${colors[label]}`}
            >
              {label}
            </button>
          );
        })}

        <button
          onClick={clearCanvas}
          className="px-3 py-1 rounded-lg border border-rose-500/40 text-rose-400 text-xs font-medium hover:bg-rose-500/10 transition"
        >
          Clear
        </button>
      </div>

      {/* Note modal */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 w-80 shadow-2xl">
            <div className="text-white font-semibold mb-3">Add Note</div>
            <textarea
              autoFocus
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 resize-none mb-3"
              placeholder="Write your design note…"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setNoteModalOpen(false)} className="px-4 py-1.5 text-sm text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={addNote} className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">Add</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
