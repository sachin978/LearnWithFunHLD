/** Compact number formatting for estimates: 12,345 → "12.3k", 4.2e9 → "4.2B". */
export function formatCount(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${trim(n / 1e12)}T`;
  if (abs >= 1e9) return `${trim(n / 1e9)}B`;
  if (abs >= 1e6) return `${trim(n / 1e6)}M`;
  if (abs >= 1e4) return `${trim(n / 1e3)}k`;
  if (abs >= 100) return Math.round(n).toLocaleString("en-US");
  return trim(n);
}

/** Decimal byte units (powers of ten, as used in estimates). */
export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
  let v = bytes;
  let i = 0;
  while (Math.abs(v) >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  return `${trim(v)} ${units[i]}`;
}

function trim(v: number): string {
  if (v >= 100) return Math.round(v).toLocaleString("en-US");
  if (v >= 10) return (Math.round(v * 10) / 10).toString();
  return (Math.round(v * 100) / 100).toString();
}
