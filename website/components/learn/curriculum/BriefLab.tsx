"use client";

import type { LabId } from "@/lib/learn/curriculum/types";
import { CacheLab } from "./labs/CacheLab";
import { EstimationLab } from "./labs/EstimationLab";
import { RateLimiterLab } from "./labs/RateLimiterLab";

/** Looks labs up by id so brief data stays plain and serializable. */
export function BriefLab({ lab }: { lab: LabId }) {
  if (lab === "cache") return <CacheLab />;
  if (lab === "estimation") return <EstimationLab />;
  return <RateLimiterLab />;
}
