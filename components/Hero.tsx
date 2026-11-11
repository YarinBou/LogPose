"use client";

import { useRef, type MouseEvent } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Anchor, ChevronDown } from "lucide-react";
import { JOLLY_ROGER_SVG } from "@/components/art/Sprites";

const FLAG_WIDTH = 216;
const FLAG_HEIGHT = 144;
const FLAG_STRIPS = 36;
const FLAG_URL = `url("data:image/svg+xml,${encodeURIComponent(JOLLY_ROGER_SVG)}")`;

/**
 * The Jolly Roger, cut into vertical strips. Each strip bobs slightly later and slightly
 * further than the one before it, which reads as cloth rippling away from the pole.
 */
function WavingJollyRoger() {
  const stripWidth = FLAG_WIDTH / FLAG_STRIPS;

  return (
    <div className="flex items-start" role="img" aria-label="The Straw Hat Pirates' Jolly Roger, waving">
      {/* pole */}
      <div className="relative -mr-px h-[190px] w-2 rounded-full bg-gradient-to-r from-wood-500 to-wood-800 shadow-md">
        <span className="absolute -top-2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-gold-400 shadow" />
      </div>
      <div className="flex drop-shadow-[0_10px_14px_rgba(0,0,0,0.55)]" style={{ width: FLAG_WIDTH, height: FLAG_HEIGHT }}>
        {Array.from({ length: FLAG_STRIPS }, (_, i) => (
          <div
            key={i}
            style={{
              width: stripWidth + 0.5,
              marginRight: -0.5,
              height: FLAG_HEIGHT,
              backgroundImage: FLAG_URL,
              backgroundSize: `${FLAG_WIDTH}px ${FLAG_HEIGHT}px`,
              backgroundPosition: `${-i * stripWidth}px 0`,
              ["--amp" as string]: `${(i / FLAG_STRIPS) * 9}px`,
              animation: "flag-wave 1.15s ease-in-out infinite alternate",
              animationDelay: `${-i * 62}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * The entrance to the Grand Line, laid out like the world map: the crimson Red Line runs
 * top to bottom, the Grand Line crosses it between its two Calm Belts, and the four Blues
 * fill the corners. Reverse Mountain sits where the two lines meet. Built from positioned
 * boxes rather than one fixed drawing, so it keeps its shape on any screen.
 */
function GrandLineEntrance() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* the four Blues */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-[70%_30%]">
        <div className="bg-[#0d4263]/55" />
        <div className="bg-[#0f4d72]/55" />
        <div className="bg-[#0a3654]/60" />
        <div className="bg-[#0c3c5c]/60" />
      </div>

      {/* sea names */}
      <div className="absolute inset-0 font-display uppercase tracking-[0.3em] text-ocean-100/45">
        <span className="absolute left-[6%] top-[13%] text-sm sm:text-xl">North Blue</span>
        <span className="absolute right-[6%] top-[13%] text-sm sm:text-xl">East Blue</span>
        <span className="absolute bottom-[6%] left-[6%] text-sm sm:text-xl">West Blue</span>
        <span className="absolute bottom-[6%] right-[6%] text-sm sm:text-xl">South Blue</span>
      </div>

      {/* four currents climbing to the summit */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[
          "M0 34 C22 40 40 56 50 70",
          "M100 34 C78 40 60 56 50 70",
          "M0 98 C22 92 40 82 50 70",
          "M100 98 C78 92 60 82 50 70",
        ].map((d) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke="rgba(211,238,245,0.38)"
            strokeWidth="2"
            strokeDasharray="10 18"
            vectorEffect="non-scaling-stroke"
            className="route-march"
          />
        ))}
      </svg>

      {/* Grand Line between its Calm Belts */}
      <div className="absolute inset-x-0 top-[62%] h-[16%]">
        <div className="absolute inset-x-0 top-0 h-[16%] border-y border-dashed border-ocean-100/30 bg-ocean-100/[0.07]" />
        <div className="absolute inset-x-0 top-[16%] h-[68%] bg-gradient-to-b from-ocean-500/45 via-ocean-300/30 to-ocean-500/45" />
        <div className="absolute inset-x-0 bottom-0 h-[16%] border-y border-dashed border-ocean-100/30 bg-ocean-100/[0.07]" />
        <span className="absolute left-[5%] top-1/2 -translate-y-1/2 font-display text-xs uppercase tracking-[0.35em] text-ocean-100/60 sm:text-base">
          New World
        </span>
        <span className="absolute right-[5%] top-1/2 -translate-y-1/2 font-display text-xs uppercase tracking-[0.35em] text-ocean-100/60 sm:text-base">
          Paradise
        </span>
        <span className="absolute left-[24%] top-0 hidden -translate-y-[130%] text-[10px] uppercase tracking-[0.4em] text-ocean-100/40 md:block">
          Calm Belt
        </span>
        <span className="absolute bottom-0 right-[24%] hidden translate-y-[130%] text-[10px] uppercase tracking-[0.4em] text-ocean-100/40 md:block">
          Calm Belt
        </span>
      </div>

      {/* Red Line */}
      <div
        className="absolute inset-y-0 left-1/2 w-[clamp(46px,7vw,112px)] -translate-x-1/2"
        style={{
          background:
            "linear-gradient(90deg, #4d0c0e 0%, #94191a 18%, #cf4034 46%, #b3261e 58%, #701214 84%, #4d0c0e 100%)",
          boxShadow: "0 0 60px 6px rgba(179,38,30,0.35), inset 0 0 22px rgba(0,0,0,0.55)",
        }}
      >
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "repeating-linear-gradient(176deg, rgba(0,0,0,0.5) 0 2px, transparent 2px 19px), repeating-linear-gradient(8deg, rgba(255,200,180,0.25) 0 1px, transparent 1px 31px)",
          }}
        />
        <span className="absolute left-1/2 top-[22%] -translate-x-1/2 font-display text-[10px] uppercase tracking-[0.5em] text-redline-800/90 [writing-mode:vertical-rl] sm:text-sm">
          Red Line
        </span>
      </div>

      {/* Reverse Mountain, at the crossing */}
      <svg
        viewBox="0 0 200 120"
        className="absolute left-1/2 top-[70%] w-[clamp(150px,22vw,300px)] -translate-x-1/2 -translate-y-[78%]"
      >
        <path d="M6 118 74 26 100 4l26 22 68 92z" fill="#701214" />
        <path d="M100 4 126 26 150 62 118 44 100 62 82 44 50 62 74 26z" fill="#94191a" />
        <path d="M100 4 112 22 100 34 88 22z" fill="#fbf4e1" opacity="0.9" />
        <path d="M100 34V118" stroke="#d3eef5" strokeWidth="5" strokeLinecap="round" strokeDasharray="7 9" className="route-march" opacity="0.85" />
        <path d="M100 34 60 118M100 34 140 118" stroke="#d3eef5" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 9" className="route-march" opacity="0.5" />
      </svg>
    </div>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });

  // As the hero scrolls away, the map sinks slowly and the title lifts and fades.
  const k = reduceMotion ? 0 : 1;
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 140 * k]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -90 * k]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  function setSail(event: MouseEvent<HTMLAnchorElement>) {
    const target = document.getElementById("timeline");
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  return (
    <section ref={sectionRef} id="top" className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
      <motion.div style={{ y: sceneY }} className="absolute inset-0">
        <GrandLineEntrance />
      </motion.div>

      {/* darken behind the title so it reads against the Red Line */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 62% 46% at 50% 36%, rgba(3,21,35,0.86) 0%, rgba(3,21,35,0.6) 55%, rgba(3,21,35,0) 100%), linear-gradient(180deg, rgba(3,21,35,0.55) 0%, rgba(3,21,35,0) 22%, rgba(3,21,35,0) 80%, rgba(3,21,35,0.9) 100%)",
        }}
      />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 flex w-full max-w-4xl flex-col items-center px-6 pb-[26svh] pt-24 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="origin-top scale-[0.7] sm:scale-90 md:scale-100"
        >
          <WavingJollyRoger />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.8 }}
          className="-mt-8 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.26em] text-gold-300 sm:mt-0 sm:text-xs sm:tracking-[0.42em]"
        >
          Sea Circle Calendar 1522 to 1524
        </motion.p>

        <motion.h1
          initial={{ y: 24, scale: 0.96 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ delay: 0.45, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          className="mt-2 flex flex-col items-center"
        >
          <span className="gold-text font-display text-7xl leading-[0.95] drop-shadow-[0_6px_18px_rgba(0,0,0,0.75)] sm:text-8xl md:text-9xl">
            LogPose
          </span>
          <span className="text-shadow-deep mt-2 font-display text-2xl leading-none tracking-wide text-parchment-50 sm:text-3xl">
            The One Piece Timeline &amp; World Map
          </span>
        </motion.h1>

        <motion.p
          initial={{ y: 16 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-shadow-deep mt-4 max-w-xl text-base leading-relaxed text-parchment-50 sm:text-lg"
        >
          Every arc of the Straw Hat Pirates&apos; voyage in order, dated on the Sea Circle Calendar: from a rowing
          boat off Foosha Village to the last island on the chart.
        </motion.p>

        <motion.a
          href="#timeline"
          onClick={setSail}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.7 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.97 }}
          className="wood gold-trim group mt-9 inline-flex items-center gap-3 rounded-full px-8 py-3.5 font-display text-2xl tracking-wide text-gold-200"
        >
          <Anchor className="h-5 w-5 transition-transform duration-500 group-hover:rotate-[20deg]" />
          Set Sail
        </motion.a>
      </motion.div>

      <motion.a
        href="#timeline"
        onClick={setSail}
        aria-label="Scroll to the timeline"
        style={{ opacity: contentOpacity }}
        className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 text-parchment-50/70"
      >
        <ChevronDown className="h-7 w-7 animate-bounce" />
      </motion.a>
    </section>
  );
}
