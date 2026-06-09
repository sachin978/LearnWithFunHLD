"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Spline from "@splinetool/react-spline";

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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Beta — Now Live
        </div>
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
        <div className="flex pointer-events-auto flex-col sm:flex-row items-start gap-3">
          <Link
            href="/simulator"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-2xl transition duration-300 hover:scale-105 flex items-center justify-center gap-2 w-full sm:w-auto pointer-events-auto"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4C11.4477 4 11 4.44772 11 5V11H5C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13H11V19C11 19.5523 11.4477 20 12 20C12.5523 20 13 19.5523 13 19V13H19C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11H13V5C13 4.44772 12.5523 4 12 4Z" />
            </svg>
            Start Designing
          </Link>
          <a
            href="#features"
            className="border border-white/20 text-white font-semibold py-3 px-8 rounded-2xl transition duration-300 w-full sm:w-auto hover:bg-white/10 text-center"
          >
            See Features
          </a>
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
