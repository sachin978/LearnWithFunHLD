"use client";

import { useEffect } from "react";
import { markBriefOpened, markDesignOpened } from "@/lib/learn/learning-state";

/** Records that the learner opened a brief or design (an action, not mastery). Renders nothing. */
export function TrackVisit({ kind, slug }: { kind: "brief" | "design"; slug: string }) {
  useEffect(() => {
    if (kind === "brief") markBriefOpened(slug);
    else markDesignOpened(slug);
  }, [kind, slug]);
  return null;
}
