"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Rocket, Layers } from "lucide-react";
import Spline from "@splinetool/react-spline";

const MotionLink = motion(Link);

function HeroSplineBackground() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        pointerEvents: "auto",
        overflow: "hidden",
      }}
    >
      <Spline
        style={{
          width: "100%",
          height: "100vh",
          pointerEvents: "auto",
        }}
        scene="https://prod.spline.design/dJqTIQ-tE3ULUPMi/scene.splinecode"
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100vh",
          background: `
            linear-gradient(to right, rgba(9,9,11,0.85), transparent 30%, transparent 70%, rgba(9,9,11,0.85)),
            linear-gradient(to bottom, transparent 50%, rgba(9,9,11,0.95))
          `,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function HeroContent() {
  return (
    <div className="text-white px-4 max-w-screen-xl mx-auto w-full flex flex-col lg:flex-row justify-between items-start lg:items-center py-16">
      <div className="w-full lg:w-1/2 pr-0 lg:pr-8 mb-8 lg:mb-0">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight tracking-tight">
          Build an<br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
            architecture
          </span>
          <br />
          that scales
        </h1>
        <div className="text-sm text-gray-400 opacity-90 mt-4 tracking-wider uppercase">
          System Design · Load Testing · Interview Prep
        </div>
      </div>

      <div className="w-full lg:w-1/2 pl-0 lg:pl-8 flex flex-col items-start">
        <p className="text-base sm:text-lg opacity-75 mb-6 max-w-md leading-relaxed text-gray-300">
          Pick a problem, drop infrastructure components onto the canvas, simulate real load, and get scored the way an interviewer would evaluate you.
        </p>
        <div className="flex pointer-events-auto flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-auto pointer-events-auto">
            {/* Pulsing attention glow — kept tight so it never reads as clickable space it isn't */}
            <motion.span
              className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 blur-sm pointer-events-none"
              animate={{ opacity: [0.45, 0.8, 0.45] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <MotionLink
              href="/simulator"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="group relative flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white font-bold py-3 px-8 rounded-full w-full sm:w-auto pointer-events-auto shadow-xl shadow-indigo-950/60 ring-1 ring-white/20"
            >
              <Rocket size={17} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-[20deg]" />
              <span className="text-base">Start Designing</span>
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </MotionLink>
          </div>

          <motion.a
            href="#features"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="group flex items-center justify-center gap-2 border border-white/20 bg-white/5 backdrop-blur-sm text-white font-semibold py-3 px-8 rounded-full transition-colors duration-300 hover:border-indigo-400/70 hover:bg-white/10 w-full sm:w-auto text-center pointer-events-auto"
          >
            <Layers size={16} className="text-indigo-300 transition-transform duration-300 group-hover:rotate-12" />
            <span className="text-base">See Features</span>
          </motion.a>
        </div>
        <p className="mt-4 text-xs text-gray-500">
          35 real interview questions · No login required
        </p>
      </div>
    </div>
  );
}

export function HeroSection() {
  const heroContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroContentRef.current) {
        requestAnimationFrame(() => {
          const scrollPosition = window.pageYOffset;
          const maxScroll = 400;
          const opacity = 1 - Math.min(scrollPosition / maxScroll, 1);
          if (heroContentRef.current) {
            heroContentRef.current.style.opacity = opacity.toString();
          }
        });
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative">
      <div className="relative min-h-screen">
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <HeroSplineBackground />
        </div>

        <div
          ref={heroContentRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <HeroContent />
        </div>
      </div>
    </div>
  );
}
