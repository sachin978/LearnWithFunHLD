"use client";

import { useId, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/components/learn/scene/usePrefersReducedMotion";
import { route, type Binding, type ExchangeType, type RouteResult, type XMatch } from "@/lib/learn/rabbitmq/routing";

const PRESETS: Record<ExchangeType, { key: string; headers: string; bindings: Binding[] }> = {
  direct: {
    key: "orders.created",
    headers: "",
    bindings: [
      { queue: "order-processing", key: "orders.created" },
      { queue: "payment-failures", key: "payments.failed" },
      { queue: "audit-log", key: "orders.created" },
    ],
  },
  fanout: {
    key: "anything",
    headers: "",
    bindings: [
      { queue: "welcome-email", key: "" },
      { queue: "crm-sync", key: "" },
      { queue: "analytics", key: "" },
    ],
  },
  topic: {
    key: "orders.eu.created",
    headers: "",
    bindings: [
      { queue: "orders-simple", key: "orders.*" },
      { queue: "orders-all", key: "orders.#" },
      { queue: "failures", key: "*.failed" },
      { queue: "eu-created", key: "*.eu.created" },
    ],
  },
  headers: {
    key: "",
    headers: "format=pdf, region=eu",
    bindings: [
      { queue: "pdf-eu", key: "", headers: { format: "pdf", region: "eu" }, xMatch: "all" },
      { queue: "pdf-or-eu", key: "", headers: { format: "pdf", region: "eu" }, xMatch: "any" },
      { queue: "csv-only", key: "", headers: { format: "csv" }, xMatch: "all" },
    ],
  },
};

function parseHeaders(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  s.split(",").forEach((pair) => {
    const [k, ...rest] = pair.split("=");
    const key = k?.trim();
    const value = rest.join("=").trim();
    if (key && value) out[key] = value;
  });
  return out;
}

function formatHeaders(h?: Record<string, string>) {
  return Object.entries(h ?? {})
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
}

const input =
  "w-full rounded-lg border border-border bg-zinc-950 px-3 py-2 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 focus-visible:ring-2 focus-visible:ring-indigo-500/40";

/**
 * Client-side routing sandbox powered by lib/learn/rabbitmq/routing — the same
 * matcher that drives the Chapter 3 animations. It does not contact a broker.
 */
export function RoutingPlayground() {
  const reduced = usePrefersReducedMotion();
  const ids = useId();
  const [type, setType] = useState<ExchangeType>("topic");
  const [routingKey, setRoutingKey] = useState(PRESETS.topic.key);
  const [headerText, setHeaderText] = useState(PRESETS.topic.headers);
  const [bindings, setBindings] = useState<Binding[]>(PRESETS.topic.bindings);
  const [sent, setSent] = useState<{ n: number; results: RouteResult[]; key: string; headers: string } | null>(null);

  const switchType = (t: ExchangeType) => {
    setType(t);
    setRoutingKey(PRESETS[t].key);
    setHeaderText(PRESETS[t].headers);
    setBindings(PRESETS[t].bindings);
    setSent(null);
  };

  const preview = useMemo(() => route(type, bindings, routingKey.trim(), parseHeaders(headerText)), [type, bindings, routingKey, headerText]);

  const send = () => setSent((s) => ({ n: (s?.n ?? 0) + 1, results: preview, key: routingKey.trim(), headers: headerText }));

  const updateBinding = (i: number, patch: Partial<Binding>) => {
    setBindings((bs) => bs.map((b, bi) => (bi === i ? { ...b, ...patch } : b)));
    setSent(null);
  };

  const addBinding = () => {
    setBindings((bs) => [...bs, { queue: `queue-${bs.length + 1}`, key: type === "topic" ? "#" : "", headers: type === "headers" ? { format: "pdf" } : undefined, xMatch: "all" }]);
    setSent(null);
  };

  const hits = sent?.results.filter((r) => r.matched) ?? [];

  return (
    <div className="rounded-2xl border border-indigo-500/25 bg-card p-4 sm:p-5 space-y-5">
      <div>
        <h4 className="text-white font-semibold">Routing playground</h4>
        <p className="text-xs text-zinc-400 mt-1">A deterministic in-browser simulation of RabbitMQ routing rules — it is not connected to a real broker.</p>
      </div>

      <div role="radiogroup" aria-label="Exchange type" className="flex flex-wrap gap-1.5">
        {(["direct", "fanout", "topic", "headers"] as ExchangeType[]).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => switchType(t)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              type === t ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-300" : "border-border text-zinc-400 hover:text-white",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          {type === "headers" ? (
            <div>
              <label htmlFor={`${ids}-headers`} className="block text-xs text-zinc-400 mb-1">
                Message headers <span className="text-zinc-600">(key=value, comma separated)</span>
              </label>
              <input id={`${ids}-headers`} className={input} value={headerText} onChange={(e) => (setHeaderText(e.target.value), setSent(null))} placeholder="format=pdf, region=eu" />
            </div>
          ) : (
            <div>
              <label htmlFor={`${ids}-key`} className="block text-xs text-zinc-400 mb-1">
                Routing key {type === "fanout" && <span className="text-zinc-600">(ignored by fanout)</span>}
              </label>
              <input id={`${ids}-key`} className={input} value={routingKey} onChange={(e) => (setRoutingKey(e.target.value), setSent(null))} placeholder="orders.created" />
            </div>
          )}
          <button
            type="button"
            onClick={send}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold px-4 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <Send size={15} /> Publish test message
          </button>
          {type === "topic" && (
            <p className="text-xs text-zinc-500 leading-relaxed">
              <code className="text-amber-300">*</code> matches exactly one word, <code className="text-amber-300">#</code> matches zero or more. Words are separated by dots.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-zinc-400">Bindings</span>
            <button type="button" onClick={addBinding} disabled={bindings.length >= 6} className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1">
              <Plus size={13} /> Add
            </button>
          </div>
          <ul className="space-y-2">
            {bindings.map((b, i) => (
              <li key={i} className="flex items-center gap-2">
                <input aria-label={`Queue name for binding ${i + 1}`} className={cn(input, "flex-1 min-w-0 py-1.5 text-xs")} value={b.queue} onChange={(e) => updateBinding(i, { queue: e.target.value })} />
                {type === "headers" ? (
                  <>
                    <input
                      aria-label={`Header arguments for ${b.queue}`}
                      className={cn(input, "flex-[1.4] min-w-0 py-1.5 text-xs")}
                      value={formatHeaders(b.headers)}
                      onChange={(e) => updateBinding(i, { headers: parseHeaders(e.target.value) })}
                    />
                    <select aria-label={`x-match for ${b.queue}`} className={cn(input, "w-auto py-1.5 text-xs")} value={b.xMatch ?? "all"} onChange={(e) => updateBinding(i, { xMatch: e.target.value as XMatch })}>
                      <option value="all">all</option>
                      <option value="any">any</option>
                    </select>
                  </>
                ) : type === "fanout" ? (
                  <span className="flex-1 text-xs text-zinc-500">no key needed</span>
                ) : (
                  <input aria-label={`Binding key for ${b.queue}`} className={cn(input, "flex-1 min-w-0 py-1.5 text-xs text-amber-200")} value={b.key} onChange={(e) => updateBinding(i, { key: e.target.value })} />
                )}
                <button
                  type="button"
                  aria-label={`Remove binding for ${b.queue}`}
                  onClick={() => (setBindings((bs) => bs.filter((_, bi) => bi !== i)), setSent(null))}
                  disabled={bindings.length <= 1}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 disabled:opacity-30 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div aria-live="polite" className="space-y-2">
        {!sent ? (
          <p className="text-xs text-zinc-500">Publish a message to see where it goes.</p>
        ) : (
          <>
            <p className={cn("text-sm font-medium", hits.length ? "text-emerald-300" : "text-rose-300")}>
              {hits.length
                ? `Routed to ${hits.length} queue${hits.length > 1 ? "s" : ""}: ${hits.map((h) => h.queue).join(", ")}.`
                : "Unroutable — no binding matched. RabbitMQ drops it by default (or returns it if mandatory is set, or sends it to an alternate exchange). It is not dead-lettered."}
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {sent.results.map((r, i) => (
                <motion.li
                  key={`${sent.n}-${i}`}
                  initial={reduced ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reduced ? 0 : i * 0.08, duration: 0.3 }}
                  className={cn("rounded-xl border p-3 text-xs", r.matched ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-zinc-950/60")}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("font-bold", r.matched ? "text-emerald-400" : "text-zinc-500")} aria-hidden>
                      {r.matched ? "✓" : "✕"}
                    </span>
                    <span className="font-mono text-zinc-100">{r.queue}</span>
                    <span className={cn("ml-auto", r.matched ? "text-emerald-300" : "text-zinc-500")}>{r.matched ? "gets a copy" : "no copy"}</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">{r.reason}</p>
                </motion.li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
