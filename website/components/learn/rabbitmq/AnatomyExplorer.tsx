"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScenePlayer } from "@/components/learn/scene/ScenePlayer";
import { anatomyScene } from "@/lib/learn/rabbitmq/scenes";

const TERMS: Record<string, { term: string; definition: string; responsibility: string }> = {
  producer: { term: "Producer", definition: "Any application that publishes messages.", responsibility: "Chooses the exchange and routing key, sets message properties, and (ideally) waits for publisher confirms." },
  exchange: { term: "Exchange", definition: "A named router inside the broker. It has a type: direct, fanout, topic or headers.", responsibility: "Receives every published message and copies it into zero or more queues according to its bindings. Never stores messages." },
  queue: { term: "Queue", definition: "An ordered buffer of messages inside the broker.", responsibility: "Stores messages until a consumer acknowledges them; distributes them across competing consumers." },
  consumer: { term: "Consumer", definition: "An application subscribed to a queue.", responsibility: "Processes delivered messages and acknowledges (or rejects) each one." },
  message: { term: "Message", definition: "Properties (content_type, message_id, delivery_mode…), optional headers, and an opaque body.", responsibility: "Carries the payload. RabbitMQ never inspects the body." },
  broker: { term: "Broker", definition: "The RabbitMQ server (or cluster) itself.", responsibility: "Hosts vhosts, exchanges, queues and connections; enforces durability, acks and flow control." },
  binding: { term: "Binding", definition: "A link from an exchange to a queue, with an optional binding key or header arguments.", responsibility: "Defines the rule the exchange uses to decide whether a queue gets a copy." },
  "routing-key": { term: "Routing key", definition: "A string the producer attaches to each message, e.g. orders.created.", responsibility: "The value exchanges compare with binding keys. It's metadata, not payload." },
  vhost: { term: "Virtual host", definition: "An isolated namespace on a broker with its own exchanges, queues and permissions.", responsibility: "Separates environments or tenants on shared infrastructure." },
  connection: { term: "Connection", definition: "A long-lived TCP (often TLS) connection from an app to the broker.", responsibility: "Expensive to open — share one per process." },
  channel: { term: "Channel", definition: "A lightweight virtual connection multiplexed over a connection.", responsibility: "Where publishing, consuming and acking happen. Use separate channels per thread/concern." },
  ack: { term: "Acknowledgment", definition: "basic.ack sent by a consumer for a delivery tag.", responsibility: "Tells the broker the message was processed so it can be deleted." },
  confirm: { term: "Publisher confirm", definition: "basic.ack sent by the broker to a publisher in confirm mode.", responsibility: "Tells the publisher the broker has taken responsibility for the message." },
};

const EXTRA = ["message", "broker", "binding", "routing-key", "vhost", "connection", "channel", "ack", "confirm"];

export function AnatomyExplorer() {
  const [selected, setSelected] = useState<string>("exchange");
  const info = TERMS[selected];

  return (
    <div className="space-y-4">
      <ScenePlayer scene={anatomyScene} selectedActorId={selected} onActorSelect={setSelected} />

      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-zinc-500 mb-2">Click a box in the diagram or a term below.</p>
          <div className="flex flex-wrap gap-1.5 mb-4" role="group" aria-label="Glossary terms">
            {["producer", "exchange", "queue", "consumer", ...EXTRA].map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={selected === k}
                onClick={() => setSelected(k)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                  selected === k ? "border-amber-500/50 bg-amber-500/15 text-amber-300" : "border-border text-zinc-400 hover:text-white",
                )}
              >
                {TERMS[k].term}
              </button>
            ))}
          </div>
          <div aria-live="polite">
            <h4 className="text-white font-semibold mb-1">{info.term}</h4>
            <p className="text-sm text-zinc-300 mb-2">{info.definition}</p>
            <p className="text-sm text-zinc-400">
              <span className="text-indigo-300 font-medium">Responsibility: </span>
              {info.responsibility}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-zinc-950 p-4 font-mono text-xs">
          <div className="text-zinc-500 mb-2 font-sans text-xs">The message in this scene</div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
            <dt className="text-indigo-300">exchange</dt>
            <dd className="text-zinc-200">orders</dd>
            <dt className="text-amber-300">routing_key</dt>
            <dd className="text-zinc-200">orders.created</dd>
            <dt className="text-zinc-400">content_type</dt>
            <dd className="text-zinc-200">application/json</dd>
            <dt className="text-zinc-400">message_id</dt>
            <dd className="text-zinc-200 break-all">c1f9e0a2-7b4d-4c8e</dd>
            <dt className="text-zinc-400">delivery_mode</dt>
            <dd className="text-zinc-200">2 (persistent)</dd>
            <dt className="text-emerald-300">body</dt>
            <dd className="text-zinc-200 break-all">{`{"order_id": 101, "status": "created"}`}</dd>
          </dl>
          <p className="font-sans text-zinc-500 mt-3 leading-relaxed">
            The exchange routes on <span className="text-amber-300">routing_key</span> only. The <span className="text-emerald-300">body</span> is opaque bytes to RabbitMQ.
          </p>
        </div>
      </div>
    </div>
  );
}
