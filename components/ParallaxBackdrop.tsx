"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";

/** One seamless swell: the curve leaves the right edge at the slope it enters the left. */
const WAVE_PATH = "M0 60 Q150 12 300 60 T600 60 T900 60 T1200 60 V140 H0Z";

function WaveBand({
  y,
  color,
  opacity,
  drift,
  className,
}: {
  y: MotionValue<number>;
  color: string;
  opacity: number;
  /** Seconds for one full horizontal loop. */
  drift: number;
  className: string;
}) {
  return (
    <motion.div style={{ y }} className={`absolute inset-x-0 ${className}`}>
      <div className="animate-drift flex w-[200%]" style={{ ["--drift" as string]: `${drift}s` }}>
        {[0, 1].map((i) => (
          <svg key={i} viewBox="0 0 1200 140" preserveAspectRatio="none" className="h-full w-1/2" aria-hidden="true">
            <path d={WAVE_PATH} fill={color} opacity={opacity} />
          </svg>
        ))}
      </div>
    </motion.div>
  );
}

function Cloud({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 220 80" className={className} aria-hidden="true">
      <g fill="#f4f8fb">
        <ellipse cx="60" cy="52" rx="48" ry="20" />
        <ellipse cx="112" cy="38" rx="46" ry="28" />
        <ellipse cx="162" cy="54" rx="44" ry="18" />
        <ellipse cx="96" cy="58" rx="70" ry="16" />
      </g>
    </svg>
  );
}

/**
 * The sea behind everything. It is fixed to the viewport, and each layer slides at its own
 * rate as the page scrolls: far clouds barely move, near waves move the most.
 */
export function ParallaxBackdrop() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  // With reduced motion every layer gets a zero range, so the scene holds still.
  const k = reduceMotion ? 0 : 1;
  const skyY = useTransform(scrollYProgress, [0, 1], [0, -120 * k]);
  const farCloudY = useTransform(scrollYProgress, [0, 1], [0, -260 * k]);
  const nearCloudY = useTransform(scrollYProgress, [0, 1], [0, -620 * k]);
  const farWaveY = useTransform(scrollYProgress, [0, 1], [0, -90 * k]);
  const midWaveY = useTransform(scrollYProgress, [0, 1], [0, -200 * k]);
  const nearWaveY = useTransform(scrollYProgress, [0, 1], [0, -340 * k]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* sky into deep water */}
      <motion.div
        style={{ y: skyY }}
        className="absolute inset-x-0 -top-[10%] h-[130%]"
      >
        <div
          className="h-full w-full"
          style={{
            background:
              "linear-gradient(180deg, #0b2a45 0%, #114a6b 22%, #1a6f92 40%, #0f4b6e 58%, #0a3551 76%, #031523 100%)",
          }}
        />
      </motion.div>

      {/* light on the horizon */}
      <div
        className="absolute inset-x-0 top-[24%] h-[30%]"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(246,220,139,0.20), transparent 62%)" }}
      />

      {/* clouds */}
      <motion.div style={{ y: farCloudY }} className="absolute inset-x-0 top-[6%]">
        <div className="animate-drift flex w-[200%] opacity-25" style={{ ["--drift" as string]: "150s" }}>
          {[0, 1].map((i) => (
            <div key={i} className="flex w-1/2 justify-around">
              <Cloud className="w-40 sm:w-56" />
              <Cloud className="mt-10 w-28 sm:w-44" />
              <Cloud className="hidden w-52 sm:block" />
            </div>
          ))}
        </div>
      </motion.div>
      <motion.div style={{ y: nearCloudY }} className="absolute inset-x-0 top-[20%]">
        <div className="animate-drift flex w-[200%] opacity-[0.16]" style={{ ["--drift" as string]: "95s" }}>
          {[0, 1].map((i) => (
            <div key={i} className="flex w-1/2 justify-around">
              <Cloud className="mt-6 w-56 sm:w-80" />
              <Cloud className="hidden w-64 md:block" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* swells, far to near */}
      <WaveBand y={farWaveY} color="#2089ad" opacity={0.35} drift={70} className="top-[46%] h-24" />
      <WaveBand y={midWaveY} color="#15698d" opacity={0.5} drift={48} className="top-[62%] h-28" />
      <WaveBand y={nearWaveY} color="#0a3551" opacity={0.75} drift={32} className="top-[82%] h-36" />

      {/* vignette, so parchment panels read clearly on top */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(3,21,35,0.55) 100%)" }}
      />
    </div>
  );
}
