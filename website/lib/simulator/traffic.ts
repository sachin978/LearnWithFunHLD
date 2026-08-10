// Centralized capacity-based traffic visualization logic — shared by canvas
// nodes, connection lines, and the flow-dot animation, so there's exactly
// one place that defines "how loaded is this, and what color is that."

export type TrafficStatus = "healthy" | "warning" | "critical";

export interface TrafficColor {
  rgb: string;   // "r, g, b" — for composing rgb()/rgba() with any alpha
  hex: string;   // "#rrggbb"
  status: TrafficStatus;
}

/**
 * Utilization = Current Traffic / Component Capacity × 100.
 * Uses each component's own capacity — never a global threshold.
 * A capacity of 0 (or negative/missing) can't safely divide, so it's
 * treated as "no headroom at all": pegged to 100% the moment there's any
 * traffic, 0% if there's none, rather than throwing or showing a
 * misleading 0% for a component that can't actually handle anything.
 */
export function calculateUtilization(currentTraffic: number, capacity: number): number {
  if (!capacity || capacity <= 0) return currentTraffic > 0 ? 100 : 0;
  return (currentTraffic / capacity) * 100;
}

// 0–50%: flat green. 50–100%: smooth green → yellow → orange → red.
// 100%+: clamped to solid red.
const COLOR_STOPS: [number, [number, number, number]][] = [
  [0,   [16, 185, 129]],  // emerald — healthy
  [50,  [16, 185, 129]],  // still healthy right up to 50%
  [70,  [234, 179, 8]],   // yellow — warning
  [90,  [249, 115, 22]],  // orange — nearly at capacity
  [100, [239, 68, 68]],   // red — at/over capacity
];

function toHex(rgb: [number, number, number]): string {
  return "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

/** Maps a utilization percentage (0–100+) to a color and status along the
 * green → yellow → orange → red scale. Values above 100 clamp to solid red. */
export function getTrafficColor(utilizationPercent: number): TrafficColor {
  const u = Math.max(0, Math.min(utilizationPercent, 100));
  let rgb: [number, number, number] = COLOR_STOPS[COLOR_STOPS.length - 1][1];

  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const [u0, c0] = COLOR_STOPS[i];
    const [u1, c1] = COLOR_STOPS[i + 1];
    if (u >= u0 && u <= u1) {
      const t = (u - u0) / (u1 - u0 || 1);
      rgb = [
        c0[0] + (c1[0] - c0[0]) * t,
        c0[1] + (c1[1] - c0[1]) * t,
        c0[2] + (c1[2] - c0[2]) * t,
      ];
      break;
    }
  }

  const status: TrafficStatus = utilizationPercent >= 100 ? "critical" : utilizationPercent >= 50 ? "warning" : "healthy";
  const rounded: [number, number, number] = [Math.round(rgb[0]), Math.round(rgb[1]), Math.round(rgb[2])];
  return { rgb: rounded.join(", "), hex: toHex(rounded), status };
}

export const TRAFFIC_STATUS_LABEL: Record<TrafficStatus, string> = {
  healthy: "Healthy",
  warning: "Warning",
  critical: "Critical",
};

/** Compact swatches for a legend — matches the gradient's real breakpoints. */
export const UTILIZATION_LEGEND: { range: string; hex: string }[] = [
  { range: "0–50%", hex: getTrafficColor(25).hex },
  { range: "50–70%", hex: getTrafficColor(60).hex },
  { range: "70–100%", hex: getTrafficColor(85).hex },
  { range: "100%+", hex: getTrafficColor(100).hex },
];
