"use client";
import { Home, Layers, BookOpen, Zap, Map, Target, Clock, FileText } from "lucide-react";
import { motion, type Variants, type Easing } from "framer-motion";
import { Banner } from "@/components/ui/banner";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { HeroSection } from "@/components/ui/3d-hero-section";
import { PulseBeams } from "@/components/ui/pulse-beams";
import { MarqueeTicker } from "@/components/ui/marquee-ticker";
import { SiteFooter } from "@/components/ui/site-footer";
import { COMPONENTS } from "@/lib/simulator/components-data";
import { PROBLEMS } from "@/lib/simulator/problems-data";
import { INTERVIEW_PHASES } from "@/lib/simulator/phases";

// Abbreviates a raw rpsCapacity number (e.g. 100000 -> "100k") the same way
// the stats strip below has always displayed it.
function abbreviateRps(n: number): string {
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return `${n}`;
}

const navItems = [
  { name: "Home", url: "#", icon: Home },
  { name: "Features", url: "#features", icon: Layers },
];

// ─── Animation helpers (matches /features page conventions) ─────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: "easeOut" as Easing },
  }),
};

const features = [
  {
    icon: Map,
    title: "Infinite Canvas",
    description:
      "Drag-and-drop 36 infrastructure components — DNS, CDN, load balancers, databases, caches, queues — onto a pannable canvas and wire them together in seconds.",
  },
  {
    icon: Zap,
    title: "Real-Time Load Simulation",
    description:
      "Trigger load tests with ⌘↵ and watch throughput numbers cascade through your architecture. Spot bottlenecks before your interviewer does.",
  },
  {
    icon: Target,
    title: "Interview Scoring",
    description:
      "Get scored against a rubric that mirrors real system design interviews — coverage of latency SLAs, throughput targets, and architectural best practices.",
  },
  {
    icon: Clock,
    title: "Timed Mock Interviews",
    description:
      "Practice a full 6-phase timed mock: requirements, capacity estimation, high-level design, detailed design, trade-offs, and bottleneck analysis.",
  },
  {
    icon: BookOpen,
    title: "35 Real Problems",
    description:
      "URL shortener, Twitter feed, Netflix CDN, Uber dispatch, WhatsApp, and 30 more real system design interview problems with reference solutions.",
  },
  {
    icon: FileText,
    title: "Reference Solutions",
    description:
      "Load a pre-built sample architecture for any problem to compare your design against an ideal solution and learn what you missed.",
  },
];

const beams = [
  {
    path: "M269 220.5H16.5C10.9772 220.5 6.5 224.977 6.5 230.5V398.5",
    gradientConfig: {
      initial: { x1: "0%", x2: "0%", y1: "80%", y2: "100%" },
      animate: {
        x1: ["0%", "0%", "200%"],
        x2: ["0%", "0%", "180%"],
        y1: ["80%", "0%", "0%"],
        y2: ["100%", "20%", "20%"],
      },
      transition: { duration: 2, repeat: Infinity, repeatType: "loop", ease: "linear", repeatDelay: 2, delay: 0.4 },
    },
    connectionPoints: [{ cx: 6.5, cy: 398.5, r: 6 }, { cx: 269, cy: 220.5, r: 6 }],
  },
  {
    path: "M568 200H841C846.523 200 851 195.523 851 190V40",
    gradientConfig: {
      initial: { x1: "0%", x2: "0%", y1: "80%", y2: "100%" },
      animate: {
        x1: ["20%", "100%", "100%"],
        x2: ["0%", "90%", "90%"],
        y1: ["80%", "80%", "-20%"],
        y2: ["100%", "100%", "0%"],
      },
      transition: { duration: 2, repeat: Infinity, repeatType: "loop", ease: "linear", repeatDelay: 2, delay: 1.2 },
    },
    connectionPoints: [{ cx: 851, cy: 34, r: 6.5 }, { cx: 568, cy: 200, r: 6 }],
  },
  {
    path: "M425.5 274V333C425.5 338.523 421.023 343 415.5 343H152C146.477 343 142 347.477 142 353V426.5",
    gradientConfig: {
      initial: { x1: "0%", x2: "0%", y1: "80%", y2: "100%" },
      animate: {
        x1: ["20%", "100%", "100%"],
        x2: ["0%", "90%", "90%"],
        y1: ["80%", "80%", "-20%"],
        y2: ["100%", "100%", "0%"],
      },
      transition: { duration: 2, repeat: Infinity, repeatType: "loop", ease: "linear", repeatDelay: 2, delay: 0.8 },
    },
    connectionPoints: [{ cx: 142, cy: 427, r: 6.5 }, { cx: 425.5, cy: 274, r: 6 }],
  },
  {
    path: "M493 274V333.226C493 338.749 497.477 343.226 503 343.226H760C765.523 343.226 770 347.703 770 353.226V427",
    gradientConfig: {
      initial: { x1: "40%", x2: "50%", y1: "160%", y2: "180%" },
      animate: { x1: "0%", x2: "10%", y1: "-40%", y2: "-20%" },
      transition: { duration: 2, repeat: Infinity, repeatType: "loop", ease: "linear", repeatDelay: 2, delay: 1.6 },
    },
    connectionPoints: [{ cx: 770, cy: 427, r: 6.5 }, { cx: 493, cy: 274, r: 6 }],
  },
  {
    path: "M380 168V17C380 11.4772 384.477 7 390 7H414",
    gradientConfig: {
      initial: { x1: "-40%", x2: "-10%", y1: "0%", y2: "20%" },
      animate: {
        x1: ["40%", "0%", "0%"],
        x2: ["10%", "0%", "0%"],
        y1: ["0%", "0%", "180%"],
        y2: ["20%", "20%", "200%"],
      },
      transition: { duration: 2, repeat: Infinity, repeatType: "loop", ease: "linear", repeatDelay: 2, delay: 0.2 },
    },
    connectionPoints: [{ cx: 420.5, cy: 6.5, r: 6 }, { cx: 380, cy: 168, r: 6 }],
  },
];

export default function LandingPage() {
  return (
    <div className="relative w-full bg-background overflow-x-hidden">
      {/* Scrolling ticker */}
      <MarqueeTicker />

      {/* Announcement banner */}
      <Banner
        id="wireup-system-beta"
        variant="rainbow"
        className="text-white/90"
      >
        🚀 WireUp System Beta is live — 35 real interview problems, load simulation & scoring.{" "}
        <a
          href="/simulator"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 ml-1 font-semibold hover:text-white"
        >
          Try it now →
        </a>
      </Banner>

      {/* Floating tubelight navbar */}
      <NavBar items={navItems} />

      {/* 3D hero section */}
      <HeroSection />

      {/* Stats strip */}
      <section className="relative z-10 bg-card border-y border-border py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: `${COMPONENTS.length}`, label: "Component Types" },
            { value: `${PROBLEMS.length}`, label: "Interview Problems" },
            { value: `${INTERVIEW_PHASES.length}`, label: "Interview Phases" },
            { value: abbreviateRps(Math.max(...COMPONENTS.map((c) => c.rpsCapacity))), label: "Max RPS Simulated" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <div className="text-4xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-muted-foreground text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PulseBeams + features */}
      <section id="features" className="relative z-10 bg-background pb-20">
        <PulseBeams
          beams={beams}
          className="bg-background"
          gradientColors={{ start: "#6366f1", middle: "#8b5cf6", end: "#a78bfa" }}
        >
          <div className="flex flex-col items-center gap-10 px-4 w-full max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    whileHover={{ y: -3 }}
                    className="group flex flex-col items-start gap-3 p-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-indigo-500/40 hover:bg-white/[0.06] transition-colors duration-300 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/15 transition-colors">
                      <Icon size={18} strokeWidth={2} />
                    </div>
                    <div className="text-sm font-semibold text-foreground">{feature.title}</div>
                    <div className="text-muted-foreground text-xs leading-relaxed">{feature.description}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </PulseBeams>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
