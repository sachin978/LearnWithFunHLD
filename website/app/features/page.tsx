"use client";

import Link from "next/link";
import { motion, type Variants, type Easing } from "framer-motion";

// ─── Data ────────────────────────────────────────────────────────────────────

const componentLibrary = [
  {
    category: "Networking",
    color: "indigo",
    icon: "🌐",
    items: [
      { name: "DNS", rps: "100k" },
      { name: "CDN", rps: "500k" },
      { name: "Load Balancer", rps: "1000k" },
      { name: "API Gateway", rps: "50k" },
      { name: "Rate Limiter", rps: "80k" },
      { name: "Reverse Proxy", rps: "100k" },
      { name: "Origin Shield", rps: "200k" },
    ],
  },
  {
    category: "Compute",
    color: "violet",
    icon: "⚙️",
    items: [
      { name: "App Server", rps: "5k" },
      { name: "Auth Service", rps: "10k" },
      { name: "WebSocket Server", rps: "50k" },
      { name: "Task Scheduler", rps: "10k" },
      { name: "Stream Processor", rps: "200k" },
      { name: "Notification Service", rps: "50k" },
      { name: "Custom Component", rps: "50k" },
    ],
  },
  {
    category: "Storage",
    color: "emerald",
    icon: "🗄️",
    items: [
      { name: "SQL Database", rps: "10k" },
      { name: "NoSQL Database", rps: "50k" },
      { name: "Cache / Redis", rps: "100k" },
      { name: "Object Storage", rps: "25k" },
      { name: "Search / ES", rps: "20k" },
      { name: "Graph Database", rps: "8k" },
      { name: "Time-Series DB", rps: "100k" },
      { name: "Data Warehouse", rps: "1k" },
      { name: "File Store", rps: "10k" },
      { name: "Vector Database", rps: "10k" },
      { name: "Geospatial Index", rps: "50k" },
    ],
  },
  {
    category: "Messaging",
    color: "amber",
    icon: "📨",
    items: [
      { name: "Message Queue", rps: "100k" },
      { name: "Pub/Sub", rps: "200k" },
    ],
  },
  {
    category: "Infrastructure",
    color: "rose",
    icon: "🏗️",
    items: [
      { name: "Service Mesh", rps: "80k" },
      { name: "Monitoring", rps: "500k" },
      { name: "Service Discovery", rps: "50k" },
      { name: "Distributed Lock", rps: "10k" },
      { name: "Circuit Breaker", rps: "100k" },
      { name: "Coordination Service", rps: "20k" },
      { name: "ID Generator", rps: "500k" },
      { name: "Sharded Counter", rps: "500k" },
      { name: "Config Service", rps: "50k" },
    ],
  },
];

const rightPanelTabs = [
  {
    name: "Props",
    icon: "🔧",
    description:
      "Edit any node's name, throughput, and config inline. Click a component or edge on the canvas to open its property editor.",
  },
  {
    name: "Simulate",
    icon: "⚡",
    description:
      "View real-time simulation output. See how traffic cascades through your architecture and where throughput bottlenecks form.",
  },
  {
    name: "Score",
    icon: "🎯",
    description:
      "Rubric-based scoring against requirements coverage, latency SLAs, throughput targets, and architectural best practices.",
  },
  {
    name: "Capacity",
    icon: "📊",
    description:
      "Capacity planning view — see how your component choices hold up against the problem's read/write/storage requirements.",
  },
  {
    name: "Trade-offs",
    icon: "⚖️",
    description:
      "Automatic trade-off analysis for your current architecture — consistency vs. availability, latency vs. throughput, and more.",
  },
];

const interviewPhases = [
  { phase: "01", name: "Requirements Clarification", desc: "Identify functional and non-functional requirements, clarify scope and assumptions." },
  { phase: "02", name: "Capacity Estimation", desc: "Estimate reads/sec, writes/sec, storage needs, and bandwidth from the given user scale." },
  { phase: "03", name: "High-Level Design", desc: "Sketch the major components and data flow — the 30,000-ft view of your architecture." },
  { phase: "04", name: "Detailed Design", desc: "Dive deep into the critical components — data models, APIs, algorithms, and edge cases." },
  { phase: "05", name: "Trade-off Discussion", desc: "Defend your choices — consistency vs. availability, SQL vs. NoSQL, push vs. pull." },
  { phase: "06", name: "Bottleneck & Scaling", desc: "Identify single points of failure, propose sharding, caching, and horizontal scaling strategies." },
];

const shortcuts = [
  { keys: ["⌘", "↵"], action: "Trigger load simulation" },
  { keys: ["⌘", "E"], action: "Export diagram (PNG/SVG/JSON)" },
  { keys: ["Space / Enter"], action: "Select focused node or edge" },
  { keys: ["Arrow keys"], action: "Move selected node" },
  { keys: ["Delete"], action: "Remove selected node or edge" },
  { keys: ["Escape"], action: "Cancel selection / deselect" },
];

const headerActions = [
  { name: "URL Shortener", desc: "Sets the active problem — loads requirements panel", icon: "🔗" },
  { name: "Reference", desc: "Loads a pre-built sample solution onto the canvas", icon: "📋" },
  { name: "Add Note", desc: "Adds a free-text annotation node to the canvas", icon: "📝" },
  { name: "Practice Interview", desc: "Launches timed 6-phase mock interview mode", icon: "🎤" },
  { name: "Save", desc: "Persists current canvas state", icon: "💾" },
  { name: "Load", desc: "Restores a previously saved canvas state", icon: "📂" },
  { name: "Simulate", desc: "Triggers real-time load testing on your architecture", icon: "⚡" },
  { name: "Score", desc: "Scores your design against the interview rubric", icon: "🎯" },
];

// ─── Animation helpers ────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: "easeOut" as Easing },
  }),
};

const colorMap: Record<string, string> = {
  indigo: "border-indigo-500/30 bg-indigo-500/5 text-indigo-400",
  violet: "border-violet-500/30 bg-violet-500/5 text-violet-400",
  emerald: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
  amber: "border-amber-500/30 bg-amber-500/5 text-amber-400",
  rose: "border-rose-500/30 bg-rose-500/5 text-rose-400",
};

const badgeMap: Record<string, string> = {
  indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  id,
  label,
  title,
  subtitle,
  children,
}: {
  id?: string;
  label: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="py-24 px-4 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-medium mb-4">
            {label}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
            {title}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground max-w-xl mx-auto">{subtitle}</p>
          )}
        </motion.div>
        {children}
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Top nav ── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg">
            SystemSim
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              beta
            </span>
          </Link>
          <a
            href="/simulator"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-indigo-600 hover:bg-indigo-500 transition text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            Launch App →
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="relative py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none" />
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Full Feature Reference
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-5">
            Everything inside<br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
              SystemSim
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            An interactive system design interview simulator with 36 infrastructure components,
            real-time load testing, AI scoring, and 35 real problems.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="/simulator"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-xl transition hover:scale-105"
            >
              Open the Simulator
            </a>
            <Link
              href="/"
              className="border border-border text-muted-foreground hover:text-white hover:border-white/30 font-semibold py-3 px-8 rounded-xl transition"
            >
              ← Back to Home
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ── Canvas ── */}
      <Section
        id="canvas"
        label="The Canvas"
        title="An infinite canvas built for system design"
        subtitle="Pan, zoom, and wire up any architecture. Every interaction is keyboard-accessible."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: "🖱️", title: "Drag & Drop", desc: "Drag any component from the left sidebar directly onto the canvas to place it." },
            { icon: "🔗", title: "Connect Components", desc: "Draw edges between nodes to represent data flow and service dependencies." },
            { icon: "🗺️", title: "Mini Map", desc: "A bird's-eye overlay lets you navigate large diagrams without losing context." },
            { icon: "✏️", title: "Add Notes", desc: "Drop free-text annotation nodes anywhere to document decisions and trade-offs inline." },
            { icon: "💾", title: "Save & Load", desc: "Persist your canvas state and restore it anytime — pick up exactly where you left off." },
            { icon: "📤", title: "Export", desc: "Export your diagram with ⌘E — share it or include it in a write-up." },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="flex gap-4 p-5 rounded-2xl border border-border bg-card hover:border-indigo-500/30 transition"
            >
              <div className="text-2xl mt-0.5">{item.icon}</div>
              <div>
                <div className="text-white font-semibold mb-1">{item.title}</div>
                <div className="text-muted-foreground text-sm leading-relaxed">{item.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── Component Library ── */}
      <Section
        id="components"
        label="Component Library"
        title="36 infrastructure components across 5 categories"
        subtitle="Every component shows its default throughput capacity (RPS) — used in simulation calculations."
      >
        <div className="space-y-8">
          {componentLibrary.map((group, gi) => (
            <motion.div
              key={group.category}
              custom={gi}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl">{group.icon}</span>
                <h3 className="text-white font-semibold text-lg">{group.category}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${badgeMap[group.color]}`}>
                  {group.items.length} components
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {group.items.map((item) => (
                  <div
                    key={item.name}
                    className={`rounded-xl border p-3 flex flex-col gap-1 ${colorMap[group.color]}`}
                  >
                    <div className="text-sm font-medium text-foreground">{item.name}</div>
                    <div className="text-xs opacity-70">{item.rps} RPS</div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mt-8 p-5 rounded-2xl border border-dashed border-border bg-card/50 flex items-center gap-4"
        >
          <span className="text-2xl">🔩</span>
          <div>
            <div className="text-white font-semibold mb-1">Custom Component</div>
            <div className="text-muted-foreground text-sm">
              Can't find what you need? Create a custom component with any name and throughput capacity from the top of the sidebar.
            </div>
          </div>
        </motion.div>
      </Section>

      {/* ── Header Actions ── */}
      <Section
        id="toolbar"
        label="Toolbar"
        title="8 quick-action buttons in the header"
        subtitle="Every major workflow is one click away from the top bar."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {headerActions.map((action, i) => (
            <motion.div
              key={action.name}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="p-4 rounded-2xl border border-border bg-card hover:border-indigo-500/30 transition"
            >
              <div className="text-2xl mb-2">{action.icon}</div>
              <div className="text-white font-semibold text-sm mb-1">{action.name}</div>
              <div className="text-muted-foreground text-xs leading-relaxed">{action.desc}</div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── Right Panel ── */}
      <Section
        id="inspector"
        label="Right Panel"
        title="5-tab inspector panel"
        subtitle="Context-aware panel that updates based on what's selected on the canvas."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rightPanelTabs.map((tab, i) => (
            <motion.div
              key={tab.name}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="p-5 rounded-2xl border border-border bg-card hover:border-indigo-500/30 transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{tab.icon}</span>
                <span className="text-white font-semibold">{tab.name}</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{tab.description}</p>
            </motion.div>
          ))}

          {/* Requirements panel callout */}
          <motion.div
            custom={5}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 md:col-span-2 lg:col-span-2"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📋</span>
              <span className="text-white font-semibold">Requirements Panel (example: URL Shortener)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
              {[
                { label: "Reads/sec", value: "100,000" },
                { label: "Writes/sec", value: "1,000" },
                { label: "Storage", value: "500 GB" },
                { label: "Latency SLA", value: "< 100ms" },
                { label: "Users", value: "100M DAU" },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-indigo-500/10 p-3 text-center">
                  <div className="text-indigo-300 font-bold">{m.value}</div>
                  <div className="text-indigo-400/70 text-xs mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ── Practice Interview ── */}
      <Section
        id="interview"
        label="Practice Interview"
        title="Timed 6-phase mock interview"
        subtitle="Mirrors the structure of a real system design interview, phase by phase."
      >
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden md:block" />
          <div className="space-y-6">
            {interviewPhases.map((phase, i) => (
              <motion.div
                key={phase.phase}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex gap-6 items-start"
              >
                <div className="w-12 h-12 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-400 font-bold text-sm flex items-center justify-center flex-shrink-0 z-10">
                  {phase.phase}
                </div>
                <div className="pt-2 pb-6 border-b border-border flex-1">
                  <div className="text-white font-semibold mb-1">{phase.name}</div>
                  <div className="text-muted-foreground text-sm leading-relaxed">{phase.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Simulation + Scoring ── */}
      <Section
        id="simulation"
        label="Simulation & Scoring"
        title="Real-time load testing and interview scoring"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="p-6 rounded-2xl border border-border bg-card"
          >
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-white font-bold text-lg mb-3">Load Simulation</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="text-indigo-400">→</span> Trigger with the Simulate button or <kbd className="px-1.5 py-0.5 rounded bg-border text-xs text-white">⌘↵</kbd></li>
              <li className="flex gap-2"><span className="text-indigo-400">→</span> Traffic flows through your architecture graph in real time</li>
              <li className="flex gap-2"><span className="text-indigo-400">→</span> Each component's throughput capacity (RPS) is used to model bottlenecks</li>
              <li className="flex gap-2"><span className="text-indigo-400">→</span> Results appear in the Simulate tab of the right panel</li>
            </ul>
          </motion.div>

          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="p-6 rounded-2xl border border-border bg-card"
          >
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-white font-bold text-lg mb-3">Interview Scoring</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="text-violet-400">→</span> Score button or the Score tab in the right panel</li>
              <li className="flex gap-2"><span className="text-violet-400">→</span> Evaluated against: requirements coverage, latency SLAs, throughput targets</li>
              <li className="flex gap-2"><span className="text-violet-400">→</span> Checks for architectural best practices (use of appropriate components)</li>
              <li className="flex gap-2"><span className="text-violet-400">→</span> Rubric-based — mirrors how a real interviewer evaluates your design</li>
            </ul>
          </motion.div>
        </div>
      </Section>

      {/* ── Reference Solutions ── */}
      <Section
        id="reference"
        label="Reference Solutions"
        title="Compare against expert-built architectures"
        subtitle='Click "Reference" in the header to load a pre-built sample solution for the active problem onto the canvas.'
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: "📚", title: "35 Problems", desc: "URL Shortener, Twitter Feed, Netflix CDN, Uber Dispatch, WhatsApp, and 30 more real interview problems." },
            { icon: "🔍", title: "Side-by-Side Comparison", desc: "Load the reference solution and compare it directly against your own design on the same canvas." },
            { icon: "💡", title: "Progressive Hints", desc: "Collapsible hints in the Requirements panel — reveal them one by one to guide your thinking without spoilers." },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="p-5 rounded-2xl border border-border bg-card hover:border-indigo-500/30 transition"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <div className="text-white font-semibold mb-2">{item.title}</div>
              <div className="text-muted-foreground text-sm leading-relaxed">{item.desc}</div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── Keyboard Shortcuts ── */}
      <Section
        id="shortcuts"
        label="Keyboard Shortcuts"
        title="Full keyboard support"
        subtitle="Every canvas action is accessible without a mouse."
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card/80">
                <th className="text-left text-muted-foreground font-medium px-6 py-3">Shortcut</th>
                <th className="text-left text-muted-foreground font-medium px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {shortcuts.map((s, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-white/5 transition">
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                      {s.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-2 py-1 rounded bg-border text-xs text-white font-mono font-semibold"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{s.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </Section>

      {/* ── Navigation Tabs ── */}
      <Section
        id="nav"
        label="Navigation"
        title="Three tabs, three modes"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { name: "Components", icon: "🧩", desc: "The default view. Left sidebar shows all 36 draggable component types organised by category." },
            { name: "Problems", icon: "📋", desc: "Browse all 35 real interview problems. Click one to load its requirements into the inspector panel." },
            { name: "Learn", icon: "🎓", desc: "Educational content — concept explanations, architectural patterns, and interview tips for system design." },
          ].map((tab, i) => (
            <motion.div
              key={tab.name}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="p-5 rounded-2xl border border-border bg-card hover:border-indigo-500/30 transition"
            >
              <div className="text-3xl mb-3">{tab.icon}</div>
              <div className="text-white font-semibold mb-2">{tab.name}</div>
              <div className="text-muted-foreground text-sm leading-relaxed">{tab.desc}</div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 text-center border-t border-border">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Ready to start designing?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            No login. No setup. Open the canvas and start building in seconds.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/simulator"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-10 rounded-xl transition hover:scale-105 text-lg"
            >
              Launch SystemSim →
            </a>
            <Link
              href="/"
              className="border border-border text-muted-foreground hover:text-white hover:border-white/30 font-semibold py-3 px-10 rounded-xl transition text-lg"
            >
              ← Back to Home
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
