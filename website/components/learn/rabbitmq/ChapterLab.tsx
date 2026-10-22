"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ScenePlayer } from "@/components/learn/scene/ScenePlayer";
import { SceneTabs } from "@/components/learn/scene/SceneTabs";
import { KnowledgeCheck } from "@/components/learn/KnowledgeCheck";
import {
  asyncMessagingScene,
  autoAckScene,
  buildRestartScene,
  confirmsScene,
  crashRedeliveryScene,
  directScene,
  fanoutScene,
  headersScene,
  idempotentScene,
  queueVsLogScene,
  quorumScene,
  retryDlxScene,
  syncCallsScene,
  topicScene,
} from "@/lib/learn/rabbitmq/scenes";
import { FINAL_ASSESSMENT, MENTAL_MODEL, PRODUCTION_CHECKLIST } from "@/lib/learn/rabbitmq/chapters";
import { chapterQuizKey } from "@/lib/learn/completion";
import { AnatomyExplorer } from "./AnatomyExplorer";
import { RoutingPlayground } from "./RoutingPlayground";
import { BacklogLab, DecisionScenarios, PrefetchLab } from "./Labs";

const restartTransient = buildRestartScene("transient-queue");
const restartDurableTransient = buildRestartScene("durable-transient-msgs");
const restartDurable = buildRestartScene("durable-persistent");

function SimulatorLink({ children }: { children: React.ReactNode }) {
  return (
    <Link
      href="/simulator"
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-xl border border-indigo-500/25 bg-indigo-500/[0.06] px-4 py-3 text-sm text-zinc-300 hover:border-indigo-500/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <span className="flex-1">{children}</span>
      <ArrowUpRight size={16} className="text-indigo-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
    </Link>
  );
}

/** The interactive part of each chapter, keyed by chapter id. */
export function ChapterLab({ chapterId }: { chapterId: string }) {
  switch (chapterId) {
    case "why-broker":
      return (
        <div className="space-y-4">
          <SceneTabs
            label="Synchronous vs asynchronous scenarios"
            tabs={[
              { id: "sync", label: "A · Direct calls", content: <ScenePlayer scene={syncCallsScene} /> },
              { id: "async", label: "B · Async messaging", content: <ScenePlayer scene={asyncMessagingScene} /> },
            ]}
          />
          <SimulatorLink>
            Try it yourself: in the simulator, put a <strong className="text-white">Message Queue</strong> between an API server and a slow worker, then run a load simulation.
          </SimulatorLink>
        </div>
      );
    case "architecture":
      return <AnatomyExplorer />;
    case "exchanges":
      return (
        <div className="space-y-6">
          <SceneTabs
            label="Exchange types"
            tabs={[
              { id: "direct", label: "Direct", content: <ScenePlayer scene={directScene} /> },
              { id: "fanout", label: "Fanout", content: <ScenePlayer scene={fanoutScene} /> },
              { id: "topic", label: "Topic", content: <ScenePlayer scene={topicScene} /> },
              { id: "headers", label: "Headers", content: <ScenePlayer scene={headersScene} /> },
            ]}
          />
          <RoutingPlayground />
        </div>
      );
    case "consumers-prefetch":
      return <PrefetchLab />;
    case "acks":
      return (
        <SceneTabs
          label="Acknowledgment scenarios"
          tabs={[
            { id: "crash", label: "Crash before ack", content: <ScenePlayer scene={crashRedeliveryScene} /> },
            { id: "idem", label: "Idempotent consumer", content: <ScenePlayer scene={idempotentScene} /> },
            { id: "auto", label: "Auto-ack", content: <ScenePlayer scene={autoAckScene} /> },
          ]}
        />
      );
    case "durability":
      return (
        <SceneTabs
          label="Durability scenarios"
          tabs={[
            { id: "a", label: "Transient queue", content: <ScenePlayer scene={restartTransient} /> },
            { id: "b", label: "Durable queue, transient msgs", content: <ScenePlayer scene={restartDurableTransient} /> },
            { id: "c", label: "Durable + persistent", content: <ScenePlayer scene={restartDurable} /> },
            { id: "d", label: "Publisher confirms", content: <ScenePlayer scene={confirmsScene} /> },
          ]}
        />
      );
    case "retries-dlx":
      return <ScenePlayer scene={retryDlxScene} />;
    case "scaling":
      return (
        <div className="space-y-4">
          <BacklogLab />
          <SimulatorLink>
            See capacity limits on a whole architecture: the simulator&apos;s load test shows which component saturates first when traffic exceeds a queue&apos;s consumers.
          </SimulatorLink>
        </div>
      );
    case "queue-types":
      return <ScenePlayer scene={quorumScene} />;
    case "vs-kafka":
      return (
        <div className="space-y-4">
          <ScenePlayer scene={queueVsLogScene} />
          <DecisionScenarios />
        </div>
      );
    case "cheat-sheet":
      return (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-4">
              <h4 className="text-white font-semibold mb-3">One-page mental model</h4>
              <ol className="space-y-2">
                {MENTAL_MODEL.map((m, i) => (
                  <li key={m.label} className="flex gap-3 text-sm">
                    <span className="font-mono text-amber-400 text-xs mt-0.5">{i + 1}</span>
                    <span>
                      <span className="font-semibold text-white">{m.label}</span> <span className="text-zinc-400">— {m.detail}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <h4 className="text-white font-semibold mb-3">Production checklist</h4>
              <ul className="space-y-1.5">
                {PRODUCTION_CHECKLIST.map((c) => (
                  <li key={c} className="relative pl-4 text-sm text-zinc-300 before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-emerald-400/70">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <KnowledgeCheck questions={FINAL_ASSESSMENT} title="Final assessment" trackAs={chapterQuizKey("rabbitmq", "cheat-sheet")} id="final-assessment" />
          <SimulatorLink>
            Ready to apply it? Open the simulator, pick a problem like a notification system, and design it with a <strong className="text-white">Message Queue</strong>.
          </SimulatorLink>
        </div>
      );
    default:
      return null;
  }
}
