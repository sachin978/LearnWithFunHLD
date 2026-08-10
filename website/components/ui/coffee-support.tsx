"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Coffee, X } from "lucide-react";

/**
 * Site-wide "Buy Me a Coffee" widget — a small floating trigger that opens a
 * donation card with the real payment QR.
 *
 * The feedback link is intentionally left out for now (not wired to any
 * address yet) — re-add once there's somewhere for it to go.
 *
 * On /simulator (a full-screen tool with a toolbar, resizable side panels,
 * and its own bottom-left zoom controls + bottom-right traffic legend) the
 * trigger becomes a compact icon docked bottom-center — the one spot none
 * of that existing chrome occupies — instead of the marketing site's
 * bottom-right pill, so it never sits on top of canvas/panel UI.
 *
 * Modal shape/backdrop is the same pattern already used by the simulator's
 * note modal (components/simulator/Toolbar.tsx) — just restyled with the
 * marketing site's design tokens instead of the tool's raw zinc classes.
 */
export function CoffeeSupport() {
  const pathname = usePathname();
  const isSimulator = pathname?.startsWith("/simulator") ?? false;
  const [open, setOpen] = useState(false);
  const [thankYou, setThankYou] = useState(false);

  useEffect(() => {
    if (!thankYou) return;
    const t = setTimeout(() => setThankYou(false), 4500);
    return () => clearTimeout(t);
  }, [thankYou]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setOpen(false);
    setThankYou(true);
  };

  const anchorClass = isSimulator
    ? "fixed bottom-4 left-1/2 -translate-x-1/2 z-40"
    : "fixed bottom-24 right-5 md:right-8 z-40";

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Support this project"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className={`${anchorClass} flex items-center gap-2 ${isSimulator ? "px-3 py-2.5" : "pl-3 pr-4 py-3"} rounded-full border border-border bg-card/90 backdrop-blur-md text-foreground shadow-lg shadow-black/30 hover:border-primary/50 transition-colors`}
      >
        <span className="relative flex items-center justify-center w-6 h-6">
          <motion.span
            className="absolute inset-0 rounded-full bg-primary/25"
            animate={{ scale: [1, 1.7, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="relative text-primary"
          >
            <Coffee size={18} strokeWidth={2} />
          </motion.span>
        </span>
        <span className={`text-xs font-semibold ${isSimulator ? "hidden md:inline" : "hidden sm:inline"}`}>Buy me a coffee</span>
      </motion.button>

      {/* Donation modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl text-center"
            >
              <button
                onClick={close}
                aria-label="Close"
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>

              <div className="w-11 h-11 mx-auto rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
                <Coffee size={20} strokeWidth={2} />
              </div>

              <h3 className="text-foreground text-base font-semibold mb-1.5">
                Support this project
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed mb-5">
                Enjoying the project? You can support its development with a small contribution.
              </p>

              <div className="mx-auto w-56 rounded-2xl border border-border bg-black p-3 mb-3">
                <Image
                  src="/donate-qr.png"
                  alt="Scan to donate via PhonePe"
                  width={600}
                  height={600}
                  className="w-full h-auto rounded-lg"
                  priority
                />
              </div>
              <div className="text-primary text-[11px] font-bold uppercase tracking-widest">
                Scan to Support
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thank-you toast */}
      <AnimatePresence>
        {thankYou && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`${isSimulator ? "fixed bottom-20 left-1/2 -translate-x-1/2 z-40" : "fixed bottom-24 right-5 md:right-8 z-40"} max-w-[15rem] px-4 py-3 rounded-xl border border-primary/30 bg-card/95 backdrop-blur-md shadow-lg shadow-black/30`}
          >
            <p className="text-foreground text-xs leading-relaxed">
              Thank you for supporting the project ❤️ Your contribution and feedback mean a lot!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
