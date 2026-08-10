"use client";

const STYLES = `
@keyframes ticker-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.animate-ticker-scroll-marquee {
  animation: ticker-scroll-marquee 40s linear infinite;
}
`;

const MarqueeItem = () => (
  <div className="flex items-center space-x-12 px-6">
    <span>System Design Simplified</span> <span className="text-primary/60">✦</span>
    <span>Real Load Testing</span> <span className="text-secondary/60">✦</span>
    <span>35 Interview Problems</span> <span className="text-primary/60">✦</span>
    <span>AI-Powered Scoring</span> <span className="text-secondary/60">✦</span>
    <span>Practice Interviews</span> <span className="text-primary/60">✦</span>
  </div>
);

export function MarqueeTicker() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="relative z-40 w-full overflow-hidden border-b border-border/50 bg-background/60 backdrop-blur-md py-3">
        <div className="flex w-max animate-ticker-scroll-marquee text-xs md:text-sm font-bold tracking-[0.3em] text-muted-foreground uppercase">
          <MarqueeItem />
          <MarqueeItem />
        </div>
      </div>
    </>
  );
}
