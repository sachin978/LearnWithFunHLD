import { Fragment } from "react";

/**
 * Renders the tiny inline markup used by lesson data: `code` and **bold**.
 * Server-safe — no client JS.
 */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("`") && p.endsWith("`") && p.length > 1)
          return (
            <code key={i} className="px-1.5 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-amber-300 text-[0.85em] font-mono break-words">
              {p.slice(1, -1)}
            </code>
          );
        if (p.startsWith("**") && p.endsWith("**") && p.length > 3)
          return (
            <strong key={i} className="font-semibold text-white">
              {p.slice(2, -2)}
            </strong>
          );
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}
