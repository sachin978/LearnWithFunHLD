/**
 * Deterministic, client-side model of RabbitMQ exchange routing. Used by both
 * the routing playground and the scripted topic-exchange scene so the two can
 * never disagree. This is an educational model — it does not talk to a broker.
 */

export type ExchangeType = "direct" | "fanout" | "topic" | "headers";
export type XMatch = "all" | "any";

export interface Binding {
  queue: string;
  /** Binding key (direct/topic). Ignored by fanout and headers exchanges. */
  key: string;
  /** Header arguments for headers exchanges. */
  headers?: Record<string, string>;
  xMatch?: XMatch;
}

export interface RouteResult {
  queue: string;
  matched: boolean;
  reason: string;
}

/** Split a routing key into dot-separated words. The empty key has zero words. */
function words(s: string): string[] {
  return s === "" ? [] : s.split(".");
}

/**
 * Topic matching: `*` matches exactly one word, `#` matches zero or more
 * words. Implemented as a small memoized recursive matcher so patterns like
 * `#.created.#` behave exactly like RabbitMQ's.
 */
export function matchTopic(pattern: string, routingKey: string): boolean {
  const p = words(pattern);
  const k = words(routingKey);
  const memo = new Map<string, boolean>();

  const m = (i: number, j: number): boolean => {
    const key = `${i}:${j}`;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;
    let result: boolean;
    if (i === p.length) result = j === k.length;
    else if (p[i] === "#") result = m(i + 1, j) || (j < k.length && m(i, j + 1));
    else if (j === k.length) result = false;
    else if (p[i] === "*" || p[i] === k[j]) result = m(i + 1, j + 1);
    else result = false;
    memo.set(key, result);
    return result;
  };

  return m(0, 0);
}

export function matchHeaders(
  bindingHeaders: Record<string, string>,
  messageHeaders: Record<string, string>,
  xMatch: XMatch,
): { matched: boolean; hits: string[]; misses: string[] } {
  const entries = Object.entries(bindingHeaders);
  const hits = entries.filter(([k, v]) => messageHeaders[k] === v).map(([k, v]) => `${k}=${v}`);
  const misses = entries.filter(([k, v]) => messageHeaders[k] !== v).map(([k, v]) => `${k}=${v}`);
  const matched = entries.length > 0 && (xMatch === "all" ? misses.length === 0 : hits.length > 0);
  return { matched, hits, misses };
}

export function route(
  type: ExchangeType,
  bindings: Binding[],
  routingKey: string,
  headers: Record<string, string> = {},
): RouteResult[] {
  return bindings.map((b) => {
    switch (type) {
      case "fanout":
        return { queue: b.queue, matched: true, reason: "Fanout ignores the routing key — every bound queue gets a copy." };
      case "direct": {
        const matched = b.key === routingKey;
        return {
          queue: b.queue,
          matched,
          reason: matched
            ? `Binding key "${b.key}" equals the routing key exactly.`
            : `Binding key "${b.key}" ≠ "${routingKey}". Direct needs an exact match.`,
        };
      }
      case "topic": {
        const matched = matchTopic(b.key, routingKey);
        return { queue: b.queue, matched, reason: explainTopic(b.key, routingKey, matched) };
      }
      case "headers": {
        const xMatch = b.xMatch ?? "all";
        const r = matchHeaders(b.headers ?? {}, headers, xMatch);
        const reason = r.matched
          ? xMatch === "all"
            ? `x-match=all and every header matched (${r.hits.join(", ")}).`
            : `x-match=any and at least one header matched (${r.hits.join(", ")}).`
          : xMatch === "all"
            ? `x-match=all but ${r.misses.join(", ") || "no headers"} did not match.`
            : `x-match=any and none of ${r.misses.join(", ") || "the headers"} matched.`;
        return { queue: b.queue, matched: r.matched, reason };
      }
    }
  });
}

function explainTopic(pattern: string, key: string, matched: boolean): string {
  const pw = words(pattern).length;
  const kw = words(key).length;
  const hasHash = pattern.split(".").includes("#");
  if (matched) {
    if (hasHash) return `"${pattern}" matches — # absorbs zero or more words.`;
    return `"${pattern}" matches — each word or * lines up one-to-one with "${key}".`;
  }
  if (!hasHash && pw !== kw)
    return `"${pattern}" has ${pw} word${pw === 1 ? "" : "s"} but "${key}" has ${kw}. Without #, the counts must match (* is exactly one word).`;
  return `"${pattern}" does not match "${key}" — at least one literal word differs.`;
}
