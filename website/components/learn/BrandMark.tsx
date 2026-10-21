import { siRabbitmq, siApachekafka, siRedis } from "simple-icons";

const BRANDS = { rabbitmq: siRabbitmq, kafka: siApachekafka, redis: siRedis } as const;

export type BrandKey = keyof typeof BRANDS;

/** Official brand marks from simple-icons, with a light chip for near-black logos (Kafka). */
export function BrandMark({ brand, size = 24, className }: { brand: BrandKey; size?: number; className?: string }) {
  const icon = BRANDS[brand];
  const dark = icon.hex === "231F20" || icon.hex === "000000";
  return (
    <svg role="img" aria-label={icon.title} viewBox="0 0 24 24" width={size} height={size} className={className} style={{ flexShrink: 0 }}>
      {dark && <rect x="0" y="0" width="24" height="24" rx="5" fill="#fafafa" />}
      <path d={icon.path} fill={`#${icon.hex}`} transform={dark ? "translate(3 3) scale(0.75)" : undefined} />
    </svg>
  );
}
