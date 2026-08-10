export interface CapacityInputs {
  dau: number;
  reqPerUser: number;
  writeRatio: number; // %
  dataSizeKB: number; // KB per write
}

export const DEFAULT_CAPACITY_INPUTS: CapacityInputs = {
  dau: 10_000_000,
  reqPerUser: 10,
  writeRatio: 10,
  dataSizeKB: 1,
};

export interface CapacityEstimate {
  totalQPS: number;
  peakQPS: number;
  writeQPS: number;
  readQPS: number;
  writesPerDay: number;
  storageYear: number; // GB/year
  bandwidthMBs: number; // MB/s
}

export function computeCapacityEstimate({ dau, reqPerUser, writeRatio, dataSizeKB }: CapacityInputs): CapacityEstimate {
  const totalQPS     = (dau * reqPerUser) / 86_400;
  const peakQPS      = totalQPS * 3;
  const writeQPS     = totalQPS * (writeRatio / 100);
  const readQPS      = totalQPS - writeQPS;
  const writesPerDay = writeQPS * 86_400;
  const storageYear  = (writesPerDay * dataSizeKB * 365) / (1024 * 1024);
  const bandwidthMBs = (peakQPS * dataSizeKB) / 1024;
  return { totalQPS, peakQPS, writeQPS, readQPS, writesPerDay, storageYear, bandwidthMBs };
}

export function fmtQPS(n: number, decimals = 1): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(decimals)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(decimals)}K`;
  return n.toFixed(decimals);
}
