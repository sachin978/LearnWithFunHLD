"use client";
import { Home, Layers, BookOpen, Zap } from "lucide-react";
import { Banner } from "@/components/ui/banner";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { HeroSection } from "@/components/ui/3d-hero-section";
import { PulseBeams } from "@/components/ui/pulse-beams";
import { CinematicFooter } from "@/components/ui/motion-footer";

const navItems = [
  { name: "Home", url: "#", icon: Home },
  { name: "Features", url: "#features", icon: Layers },
];

const features = [
  {
    icon: "🗺️",
    title: "Infinite Canvas",
    description:
      "Drag-and-drop 36 infrastructure components — DNS, CDN, load balancers, databases, caches, queues — onto a pannable canvas and wire them together in seconds.",
  },
  {
    icon: "⚡",
    title: "Real-Time Load Simulation",
    description:
      "Trigger load tests with ⌘↵ and watch throughput numbers cascade through your architecture. Spot bottlenecks before your interviewer does.",
  },
  {
    icon: "🎯",
    title: "Interview Scoring",
    description:
      "Get scored against a rubric that mirrors real system design interviews — coverage of latency SLAs, throughput targets, and architectural best practices.",
  },
  {
    icon: "🕐",
    title: "Timed Mock Interviews",
    description:
      "Practice a full 6-phase timed mock: requirements, capacity estimation, high-level design, detailed design, trade-offs, and bottleneck analysis.",
  },
  {
    icon: "📚",
    title: "35 Real Problems",
    description:
      "URL shortener, Twitter feed, Netflix CDN, Uber dispatch, WhatsApp, and 30 more real system design interview problems with reference solutions.",
  },
  {
    icon: "📝",
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
      {/* Announcement banner */}
      <Banner
        id="systemsim-beta"
        variant="rainbow"
        className="text-white/90"
      >
        🚀 SystemSim Beta is live — 35 real interview problems, load simulation & scoring.{" "}
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

      {/* Features grid */}
      <section id="features" className="relative z-10 bg-background py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-medium mb-4">
              Everything you need
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Built for engineers,<br />
              <span className="text-muted-foreground font-normal">by engineers</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              SystemSim gives you all the tools to practice, learn, and nail your system design interview.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border bg-card p-6 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all duration-300"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="relative z-10 bg-card border-y border-border py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "36", label: "Component Types" },
            { value: "35", label: "Interview Problems" },
            { value: "6", label: "Interview Phases" },
            { value: "100k", label: "Max RPS Simulated" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-muted-foreground text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PulseBeams CTA section */}
      <section className="relative z-10 bg-background">
        <PulseBeams
          beams={beams}
          className="bg-background"
          gradientColors={{ start: "#6366f1", middle: "#8b5cf6", end: "#a78bfa" }}
        >
          <div className="flex flex-col items-center gap-6 text-center px-4">
            <h2 className="text-3xl md:text-5xl font-bold text-white max-w-lg tracking-tight">
              Stop guessing.<br />Start designing.
            </h2>
            <p className="text-muted-foreground max-w-md">
              Open the canvas, pick a problem, and build your architecture — no sign-up required.
            </p>
            <a
              href=""
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800 z-40 no-underline group cursor-pointer relative shadow-2xl shadow-zinc-900 rounded-full p-px text-xs font-semibold leading-6 text-white inline-block"
            >
              <span className="absolute inset-0 overflow-hidden rounded-full">
                <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(99,102,241,0.6)_0%,rgba(99,102,241,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </span>
              <div className="relative flex items-center space-x-2 z-10 rounded-full bg-zinc-950 py-3 px-8 ring-1 ring-white/10">
                <span className="text-base">Open SystemSim →</span>
              </div>
            </a>
          </div>
        </PulseBeams>
      </section>

      {/* Cinematic footer */}
      <CinematicFooter />
    </div>
  );
}
