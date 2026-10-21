import { CATEGORY_COLORS, COMPONENTS, type ComponentCategory } from "@/lib/simulator/components-data";
import { ComponentIcon } from "@/lib/simulator/icon-registry";

const NODE_W = 118;
const NODE_H = 50;

/** Real simulator components, laid out like a small design on the canvas. */
const LAYOUT: { id: string; x: number; y: number }[] = [
  { id: "client", x: 4, y: 14 },
  { id: "load-balancer", x: 132, y: 14 },
  { id: "app-server", x: 260, y: 14 },
  { id: "sql-db", x: 388, y: 14 },
  { id: "message-queue", x: 260, y: 104 },
  { id: "worker", x: 388, y: 104 },
];

const LINKS: [string, string][] = [
  ["client", "load-balancer"],
  ["load-balancer", "app-server"],
  ["app-server", "sql-db"],
  ["app-server", "message-queue"],
  ["message-queue", "worker"],
];

function pathBetween(a: { x: number; y: number }, b: { x: number; y: number }) {
  if (a.x === b.x) {
    const x = a.x + NODE_W / 2;
    return `M ${x} ${a.y + NODE_H} L ${x} ${b.y}`;
  }
  const x1 = a.x + NODE_W;
  const y1 = a.y + NODE_H / 2;
  const x2 = b.x;
  const y2 = b.y + NODE_H / 2;
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
}

/**
 * Recognition over recall: a miniature of the actual simulator canvas, built
 * from the simulator's own component data, colors and icons. Static by
 * default; the travelling dots (the simulator's FlowEdge idiom) appear only
 * while the card is hovered or focused, so the hero has a single autoplaying
 * animation. Server-rendered — no client JS.
 */
export function CanvasPreview() {
  const nodes = LAYOUT.map((l) => ({ ...l, def: COMPONENTS.find((c) => c.id === l.id) })).filter(
    (n): n is typeof n & { def: NonNullable<typeof n.def> } => Boolean(n.def),
  );
  const pos = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div
      className="relative rounded-xl border border-indigo-500/15 overflow-hidden"
      style={{
        backgroundColor: "#09090bb3",
        backgroundImage: "radial-gradient(circle, rgba(161,161,170,0.16) 1px, transparent 1px)",
        backgroundSize: "16px 16px",
      }}
    >
      <svg viewBox="0 0 510 168" className="w-full h-auto" role="img" aria-label="Simulator canvas preview: client, load balancer, app server, SQL database, message queue and worker connected together">
        {LINKS.map(([from, to]) => {
          const a = pos.get(from);
          const b = pos.get(to);
          if (!a || !b) return null;
          const d = pathBetween(a, b);
          return (
            <g key={`${from}-${to}`}>
              <path d={d} fill="none" stroke="#6366f1" strokeWidth={1.75} strokeOpacity={0.7} />
              <circle r={3} fill="#818cf8" className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:hidden" style={{ filter: "drop-shadow(0 0 3px #818cf8)" }}>
                <animateMotion dur="1.8s" repeatCount="indefinite" path={d} />
              </circle>
            </g>
          );
        })}
        {nodes.map((n) => {
          const c = CATEGORY_COLORS[n.def.category as ComponentCategory] ?? CATEGORY_COLORS.Compute;
          return (
            <foreignObject key={n.id} x={n.x} y={n.y} width={NODE_W} height={NODE_H}>
              <div className={`h-full rounded-xl border-2 ${c.border} ${c.bg} bg-zinc-900 px-2 py-1.5`}>
                <div className="flex items-center gap-1.5">
                  <ComponentIcon iconKey={n.def.icon} size={13} className={c.text} />
                  <span className="text-white text-[9.5px] font-semibold truncate">{n.def.name}</span>
                </div>
                <span className={`mt-1 inline-block text-[8.5px] font-medium px-1 py-px rounded ${c.badge}`}>{n.def.category}</span>
              </div>
            </foreignObject>
          );
        })}
      </svg>
    </div>
  );
}
