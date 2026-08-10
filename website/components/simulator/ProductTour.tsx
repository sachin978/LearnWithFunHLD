"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Blocks, Zap, Timer, Download, Rocket, X } from "lucide-react";
import { useSimulatorStore } from "@/lib/simulator/store";

const TOUR_SEEN_KEY = "wireup-system-tour-seen";

const STEPS: { icon: typeof Rocket; title: string; body: string }[] = [
  {
    icon: Rocket,
    title: "Welcome to WireUp System",
    body: "A quick 30-second tour of how everything fits together — feel free to skip anytime.",
  },
  {
    icon: ClipboardList,
    title: "1. Pick a problem",
    body: "Start in the left panel — choose from 35 real system design interview problems like URL Shortener or Twitter Feed. This loads the requirements you're designing against.",
  },
  {
    icon: Blocks,
    title: "2. Build your architecture",
    body: "Once a problem is active, drag infrastructure components — load balancers, caches, databases — from the sidebar onto the canvas, and connect them to show how traffic flows.",
  },
  {
    icon: Zap,
    title: "3. Simulate & score",
    body: "Use the tabs on the right to run a real load simulation, see capacity estimates, get an interview-style score, and review auto-detected trade-offs.",
  },
  {
    icon: Timer,
    title: "4. Practice under pressure",
    body: "Hit \"Practice\" in the toolbar for a full timed 6-phase mock interview — requirements, capacity, design, trade-offs, and scaling.",
  },
  {
    icon: Download,
    title: "5. Export your work",
    body: "Click \"Download\" anytime to export a complete summary of your design, capacity estimate, simulation results, and score as a shareable file.",
  },
];

export default function ProductTour() {
  const { tourOpen, setTourOpen } = useSimulatorStore();
  const [step, setStep] = useState(0);

  // Auto-open on first-ever visit.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(TOUR_SEEN_KEY)) {
      setTourOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    localStorage.setItem(TOUR_SEEN_KEY, "true");
    setTourOpen(false);
    setStep(0);
  };

  const isLast = step === STEPS.length - 1;
  const Icon = STEPS[step].icon;

  return (
    <AnimatePresence>
      {tourOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl"
          >
            <button
              onClick={close}
              title="Skip tour"
              className="absolute top-3 right-3 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X size={16} />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
                  <Icon size={20} />
                </div>
                <h3 className="text-white font-semibold text-base mb-2">{STEPS[step].title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{STEPS[step].body}</p>
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mt-6 mb-5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  aria-label={`Go to step ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-indigo-500" : "w-1.5 bg-zinc-700 hover:bg-zinc-600"}`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={close}
                className="text-xs text-zinc-500 hover:text-white transition-colors font-medium"
              >
                Skip tour
              </button>
              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
                  >
                    Back
                  </button>
                )}
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => (isLast ? close() : setStep((s) => s + 1))}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  {isLast ? "Get started" : "Next"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
