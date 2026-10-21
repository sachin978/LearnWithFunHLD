import { BRIEFS_CORE } from "./briefs-core";
import { BRIEFS_SCALE } from "./briefs-scale";
import { BRIEFS_ADVANCED } from "./briefs-advanced";
import { DESIGNS } from "./designs";
import type { ConceptBrief, DesignWalkthrough } from "./types";

export const BRIEFS: ConceptBrief[] = [...BRIEFS_CORE, ...BRIEFS_SCALE, ...BRIEFS_ADVANCED];
export { DESIGNS };

/** "Design a URL shortener" → "URL shortener" — for lists, chips and breadcrumbs. */
export function designShortTitle(d: DesignWalkthrough): string {
  const t = d.title.replace(/^Design an? /, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export const briefHref = (slug: string) => `/learn/concepts/${slug}`;
export const designHref = (slug: string) => `/learn/designs/${slug}`;

export function getBrief(slug: string): ConceptBrief | undefined {
  return BRIEFS.find((b) => b.slug === slug);
}

export function getDesign(slug: string): DesignWalkthrough | undefined {
  return DESIGNS.find((d) => d.slug === slug);
}

/** Designs that use a concept — "apply it" links from a brief. */
export function designsUsing(slug: string): DesignWalkthrough[] {
  return DESIGNS.filter((d) => d.concepts.includes(slug));
}

/** Reading order for "next concept" links — mirrors the roadmap's stage order. */
export const CONCEPT_ORDER = [
  "http-request-flow",
  "api-data-modeling",
  "monolith-microservices",
  "databases",
  "caching",
  "load-balancing",
  "api-gateway",
  "replication-sharding",
  "message-queues",
  "reliability-patterns",
  "cap-consistency",
  "distributed-locks",
  "cdn-object-storage",
  "observability",
  "security-fundamentals",
  "interview-framework",
  "estimation",
];

export function nextBrief(slug: string): ConceptBrief | undefined {
  const i = CONCEPT_ORDER.indexOf(slug);
  return i >= 0 && i < CONCEPT_ORDER.length - 1 ? getBrief(CONCEPT_ORDER[i + 1]) : undefined;
}

export function nextDesign(slug: string): DesignWalkthrough | undefined {
  const i = DESIGNS.findIndex((d) => d.slug === slug);
  return i >= 0 && i < DESIGNS.length - 1 ? DESIGNS[i + 1] : undefined;
}
