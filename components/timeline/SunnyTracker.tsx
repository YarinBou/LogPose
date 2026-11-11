"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { motion, useMotionTemplate, useScroll, useSpring, useTransform } from "framer-motion";
import { ThousandSunnySprite } from "@/components/art/Sprites";

/** Vertical distance covered by one swing of the course, in pixels. */
const SWING = 230;

/**
 * A wavy course down the lane. Each quadratic curve bulges to the opposite side of the one
 * before it, and consecutive curves share a tangent where they meet, so the line is smooth.
 */
function buildCourse(width: number, height: number): string {
  if (width <= 0 || height <= 0) return "";
  const centre = width / 2;
  const reach = Math.max(6, width / 2 - 14);
  const swings = Math.max(1, Math.round(height / SWING));
  const step = height / swings;

  let d = `M${centre} 0`;
  for (let i = 0; i < swings; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const controlX = centre + side * reach * 2;
    d += ` Q${controlX.toFixed(1)} ${(step * (i + 0.5)).toFixed(1)} ${centre} ${(step * (i + 1)).toFixed(1)}`;
  }
  return d;
}

interface SunnyTrackerProps {
  /** The element whose scroll progress the ship follows: the whole timeline track. */
  trackRef: RefObject<HTMLDivElement | null>;
}

/**
 * The spine of the timeline. A dashed course runs the full height of the track; as the page
 * scrolls, a gold wake is drawn along it and a miniature Thousand Sunny sails to the same
 * point. The ship rides the very same SVG path via CSS `offset-path`.
 */
export function SunnyTracker({ trackRef }: SunnyTrackerProps) {
  const laneRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const lane = laneRef.current;
    if (!lane) return;
    const measure = () => setSize({ width: lane.clientWidth, height: lane.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(lane);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start center", "end center"] });
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 22, restDelta: 0.0005 });
  const percent = useTransform(progress, (value) => value * 100);
  const offsetDistance = useMotionTemplate`${percent}%`;

  const course = useMemo(() => buildCourse(size.width, size.height), [size.width, size.height]);

  return (
    <div
      ref={laneRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 w-12 lg:left-[calc(50%-3rem)] lg:w-24"
    >
      {course ? (
        <>
          <svg width={size.width} height={size.height} className="absolute inset-0 overflow-visible">
            <path d={course} fill="none" stroke="rgba(211,238,245,0.3)" strokeWidth="2" strokeDasharray="3 9" strokeLinecap="round" />
            <motion.path
              d={course}
              fill="none"
              stroke="#ecc14f"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ pathLength: progress, filter: "drop-shadow(0 0 5px rgba(236,193,79,0.75))" }}
            />
          </svg>
          <motion.div
            className="absolute left-0 top-0 z-20 h-11 w-11 lg:h-16 lg:w-16"
            style={{ offsetPath: `path("${course}")`, offsetDistance, offsetRotate: "0deg" }}
          >
            <div className="animate-bob h-full w-full drop-shadow-[0_6px_8px_rgba(0,0,0,0.6)]">
              <ThousandSunnySprite className="h-full w-full" />
            </div>
          </motion.div>
        </>
      ) : null}
    </div>
  );
}
