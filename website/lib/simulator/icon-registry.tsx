import type { LucideIcon } from "lucide-react";
import {
  Globe, Route, Waypoints, DoorOpen, Gauge, ArrowRightLeft, Shield,
  Server, KeyRound, Plug, Clock, Waves, Bell, Wrench,
  Database, Boxes, HardDrive, Search, Share2, TrendingUp, Warehouse,
  Folder, BrainCircuit, MapPin,
  Inbox, Rss,
  Network, Activity, Radar, Lock, ZapOff, GitMerge, Hash, Sigma, Settings2,
  StickyNote, MonitorSmartphone, Box as BoxIcon,
  // Client
  Smartphone, AppWindow,
  // Traffic & Edge
  ShieldAlert, LogIn,
  // Compute
  Cpu, FunctionSquare, BarChart3, CloudCog, FileKey2, Atom, Layers,
  // Storage
  Table2, MemoryStick, Layers3, Blocks, GitBranch, Flame,
  // Messaging
  Radio, Rows3, AudioWaveform,
  // Observability
  LineChart, ScrollText, GitCommitHorizontal, BellRing, HeartPulse, FileSearch2,
  // Network
  Container, Split, Shuffle, ShieldCheck, Signal, ShieldBan,
  // AI & Agents
  Router, Workflow, ClipboardList,
  // External
  ExternalLink, CreditCard, Mail, CalendarClock, Timer, Webhook,
} from "lucide-react";
import {
  siRedis, siFastly, siCloudflare, siNodedotjs, siPython, siGo, siSidekiq,
  siTemporal, siKeycloak, siVault, siApachespark, siMysql, siCockroachlabs,
  siGooglecloudstorage, siOpensearch, siInfluxdb, siNeo4j, siClickhouse,
  siApachecassandra, siScylladb, siVitess, siTimescale, siTidb, siQdrant,
  siMilvus, siApachekafka, siNatsdotio, siJaeger, siKong, siNginx,
  siEnvoyproxy, siLinkerd, siTraefikproxy, siConsul,
} from "simple-icons";

/**
 * Centralized icon registry for the simulator.
 *
 * Two kinds of icons:
 *  - Generic architecture icons (lucide-react) — monochrome, tinted per
 *    category via `className` (inherits `currentColor`), for concepts with
 *    no single "correct" vendor (Database, Load Balancer, Message Queue…).
 *  - Brand icons (simple-icons) — real vendor logos rendered in their
 *    official color, used only when a component IS that specific technology
 *    (e.g. "Cache / Redis"), never as a stand-in for a generic concept.
 *
 * To add a new brand logo: import its `si<Name>` export from "simple-icons"
 * and add one line to BRAND_ICONS. To add a new generic icon: import it from
 * lucide-react and add one line to LUCIDE_ICONS. Then reference the key from
 * a component's `icon` field in components-data.ts.
 */

const LUCIDE_ICONS: Record<string, LucideIcon> = {
  // Client
  "monitor-smartphone": MonitorSmartphone,
  // Networking
  globe: Globe,
  route: Route,
  waypoints: Waypoints,
  "door-open": DoorOpen,
  gauge: Gauge,
  "arrow-right-left": ArrowRightLeft,
  shield: Shield,
  // Compute
  server: Server,
  "key-round": KeyRound,
  plug: Plug,
  clock: Clock,
  waves: Waves,
  bell: Bell,
  wrench: Wrench,
  // Storage
  database: Database,
  boxes: Boxes,
  "hard-drive": HardDrive,
  search: Search,
  "share-2": Share2,
  "trending-up": TrendingUp,
  warehouse: Warehouse,
  folder: Folder,
  "brain-circuit": BrainCircuit,
  "map-pin": MapPin,
  // Messaging
  inbox: Inbox,
  rss: Rss,
  // Infrastructure
  network: Network,
  activity: Activity,
  radar: Radar,
  lock: Lock,
  "zap-off": ZapOff,
  "git-merge": GitMerge,
  hash: Hash,
  sigma: Sigma,
  "settings-2": Settings2,
  // Misc
  "sticky-note": StickyNote,
  // Client
  smartphone: Smartphone,
  "app-window": AppWindow,
  // Traffic & Edge
  "shield-alert": ShieldAlert,
  "log-in": LogIn,
  // Compute
  cpu: Cpu,
  "function-square": FunctionSquare,
  "bar-chart-3": BarChart3,
  "cloud-cog": CloudCog,
  "file-key-2": FileKey2,
  atom: Atom,
  layers: Layers,
  // Storage
  "table-2": Table2,
  "memory-stick": MemoryStick,
  "layers-3": Layers3,
  blocks: Blocks,
  "git-branch": GitBranch,
  flame: Flame,
  // Messaging
  radio: Radio,
  "rows-3": Rows3,
  "audio-waveform": AudioWaveform,
  // Observability
  "line-chart": LineChart,
  "scroll-text": ScrollText,
  "git-commit-horizontal": GitCommitHorizontal,
  "bell-ring": BellRing,
  "heart-pulse": HeartPulse,
  "file-search-2": FileSearch2,
  // Network
  container: Container,
  split: Split,
  shuffle: Shuffle,
  "shield-check": ShieldCheck,
  signal: Signal,
  "shield-ban": ShieldBan,
  // AI & Agents
  router: Router,
  workflow: Workflow,
  "clipboard-list": ClipboardList,
  // External
  "external-link": ExternalLink,
  "credit-card": CreditCard,
  mail: Mail,
  "calendar-clock": CalendarClock,
  timer: Timer,
  webhook: Webhook,
};

interface BrandIcon {
  path: string;
  hex: string;
  title: string;
}

const BRAND_ICONS: Record<string, BrandIcon> = {
  redis: siRedis,
  fastly: siFastly,
  cloudflare: siCloudflare,
  nodejs: siNodedotjs,
  python: siPython,
  go: siGo,
  sidekiq: siSidekiq,
  temporal: siTemporal,
  keycloak: siKeycloak,
  vault: siVault,
  apachespark: siApachespark,
  mysql: siMysql,
  cockroachdb: siCockroachlabs,
  gcs: siGooglecloudstorage,
  opensearch: siOpensearch,
  influxdb: siInfluxdb,
  neo4j: siNeo4j,
  clickhouse: siClickhouse,
  cassandra: siApachecassandra,
  scylladb: siScylladb,
  vitess: siVitess,
  timescaledb: siTimescale,
  tidb: siTidb,
  qdrant: siQdrant,
  milvus: siMilvus,
  kafka: siApachekafka,
  nats: siNatsdotio,
  jaeger: siJaeger,
  kong: siKong,
  nginx: siNginx,
  envoy: siEnvoyproxy,
  linkerd: siLinkerd,
  traefik: siTraefikproxy,
  consul: siConsul,
};

/** Relative luminance (WCAG) of a brand hex, 0 (black) – 1 (white). */
function relativeLuminance(hex: string): number {
  const rgb = (hex.match(/.{1,2}/g) ?? []).map((h) => parseInt(h, 16) / 255);
  const [r, g, b] = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

export type IconKey = string;

export function ComponentIcon({
  iconKey,
  size = 18,
  className = "",
}: {
  iconKey: IconKey;
  size?: number;
  className?: string;
}) {
  const brand = BRAND_ICONS[iconKey];
  if (brand) {
    // Some official marks (e.g. Temporal, Kafka) are near-black — invisible
    // against the dark canvas. Give those a small light backing chip so the
    // real logo stays legible without changing its actual color.
    const needsBacking = relativeLuminance(brand.hex) < 0.25;
    return (
      <svg
        role="img"
        aria-label={brand.title}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={className}
        style={{ flexShrink: 0 }}
      >
        {needsBacking && <rect x="1" y="1" width="22" height="22" rx="5" fill="#fff" />}
        <path d={brand.path} fill={`#${brand.hex}`} />
      </svg>
    );
  }

  const Icon = LUCIDE_ICONS[iconKey] ?? BoxIcon;
  return <Icon size={size} className={className} strokeWidth={2} style={{ flexShrink: 0 }} />;
}
