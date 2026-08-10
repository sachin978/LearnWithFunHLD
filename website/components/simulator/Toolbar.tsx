"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Maximize2, Minimize2 } from "lucide-react";
import { useSimulatorStore } from "@/lib/simulator/store";
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
    clearCanvas, setScoreResult, setRightTab,
    interviewActive, interviewPhase, interviewTimeLeft,
    setInterviewActive, setInterviewPhase, setInterviewTimeLeft,
    simTheme, setSimTheme,
    leftPanelCollapsed, rightPanelCollapsed, setLeftPanelCollapsed, setRightPanelCollapsed,
  } = useSimulatorStore();

  const isFocusMode = leftPanelCollapsed && rightPanelCollapsed;
  const toggleFocusMode = () => {
    setLeftPanelCollapsed(!isFocusMode);
    setRightPanelCollapsed(!isFocusMode);
  };

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
    setScoreResult(scoreArchitecture(nodes, edges));
    setRightTab("score");
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
          <span className="text-white font-bold text-sm">WireUp System</span>
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
        {(["Add Note", "Practice"] as const).map((label) => {
          const actions: Record<string, () => void> = {
            "Add Note": () => setNoteModalOpen(true),
            "Practice": startInterview,
          };
          const colors: Record<string, string> = {
            "Add Note": "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white",
            "Practice": "border-amber-500/50 text-amber-300 hover:bg-amber-500/10",
          };
          return (
            <motion.button
              key={label}
              onClick={actions[label]}
              whileHover={{ scale: 1.045 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${colors[label]}`}
            >
              {label}
            </motion.button>
          );
        })}

        <motion.button
          onClick={toggleFocusMode}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ duration: 0.15 }}
          title={isFocusMode ? "Restore sidebars" : "Focus mode: hide both sidebars"}
          className="p-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
        >
          {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </motion.button>

        <motion.button
          onClick={() => setSimTheme(simTheme === "dark" ? "light" : "dark")}
          whileHover={{ scale: 1.08, rotate: 15 }}
          whileTap={{ scale: 0.92 }}
          transition={{ duration: 0.15 }}
          title={simTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="p-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
        >
          {simTheme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </motion.button>

        <motion.button
          onClick={clearCanvas}
          whileHover={{ scale: 1.045 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="px-3 py-1 rounded-lg border border-rose-500/40 text-rose-400 text-xs font-medium hover:bg-rose-500/10 transition-colors"
        >
          Clear
        </motion.button>
      </div>

      {/* Note modal */}
      <AnimatePresence>
        {noteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 w-80 shadow-2xl"
            >
              <div className="text-white font-semibold mb-3">Add Note</div>
              <textarea
                autoFocus
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 resize-none mb-3"
                placeholder="Write your design note…"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setNoteModalOpen(false)} className="px-4 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
                <motion.button
                  onClick={addNote}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  Add
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
