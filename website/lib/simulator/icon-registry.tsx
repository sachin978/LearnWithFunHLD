import type { LucideIcon } from "lucide-react";
import {
  Globe, Route, Waypoints, DoorOpen, Gauge, ArrowRightLeft, Shield,
  Server, KeyRound, Plug, Clock, Waves, Bell, Wrench,
  Database, Boxes, HardDrive, Search, Share2, TrendingUp, Warehouse,
  Folder, BrainCircuit, MapPin,
  Inbox, Rss,
  Network, Activity, Radar, Lock, ZapOff, GitMerge, Hash, Sigma, Settings2,
  StickyNote, MonitorSmartphone, Box as BoxIcon,
} from "lucide-react";
import { siRedis } from "simple-icons";

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
};

interface BrandIcon {
  path: string;
  hex: string;
  title: string;
}

const BRAND_ICONS: Record<string, BrandIcon> = {
  redis: siRedis,
};

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
    return (
      <svg
        role="img"
        aria-label={brand.title}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={className}
        style={{ flexShrink: 0 }}
        fill={`#${brand.hex}`}
      >
        <path d={brand.path} />
      </svg>
    );
  }

  const Icon = LUCIDE_ICONS[iconKey] ?? BoxIcon;
  return <Icon size={size} className={className} strokeWidth={2} style={{ flexShrink: 0 }} />;
}
