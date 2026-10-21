"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { CodeSample } from "@/lib/learn/types";
import { RichText } from "./RichText";

export function CodeBlock({ sample }: { sample: CodeSample }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sample.code);
      setCopied(true);
    } catch {
      // Clipboard can be unavailable (insecure context); the code stays selectable.
    }
  };

  return (
    <div className="rounded-xl border border-border bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-zinc-900/70">
        <span className="font-mono text-xs text-zinc-300">{sample.filename}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${sample.filename}`}
          className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white rounded px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[12.5px] leading-relaxed text-zinc-200 font-mono" tabIndex={0} aria-label={`${sample.filename} source`}>
        <code>{sample.code}</code>
      </pre>
      {sample.notes && (
        <ul className="border-t border-border px-4 py-3 space-y-1.5 text-xs text-zinc-400 list-disc pl-8">
          {sample.notes.map((n, i) => (
            <li key={i}>
              <RichText text={n} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
