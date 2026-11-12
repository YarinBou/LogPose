/**
 * Island artwork for the 2D chart.
 *
 * Every island is drawn in its own little coordinate space, about one unit in radius and
 * centred on the origin; the map gives each island its own small <svg>, places it, and
 * sizes it. Two things decide what is drawn:
 *
 *  - the silhouette: generated from the island's id, so each island has its own outline
 *    and it never changes between renders, or hand-authored for landmarks;
 *  - the terrain: picks the colours, and for landmarks a small drawing on top
 *    (dunes for Alabasta, peaks for Drum, a cloud for Skypiea, and so on).
 *
 * The drawings are original and deliberately simple: a few strokes each, in the manner of
 * symbols on a sea chart.
 */
import type { ReactNode } from "react";
import type { MapLocation, Terrain, Tier } from "@/data/map";
import { seededUnit } from "@/lib/utils";

export const INK = "#2a1b0d";

/* ------------------------------------------------------------------ */
/* Silhouettes                                                          */
/* ------------------------------------------------------------------ */

type Point = [number, number];

/** A smooth closed curve through the points (Catmull-Rom, written as cubic Béziers). */
function closedCurve(points: Point[]): string {
  const n = points.length;
  const f = (value: number) => value.toFixed(3);
  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}

const POINTS_BY_TIER: Record<Tier, number> = { 1: 11, 2: 9, 3: 7 };

/**
 * An island outline derived from an id: points around a circle, each pushed in or out and
 * nudged along it, then stretched and turned. The same id always gives the same island.
 */
function seededSilhouette(id: string, tier: Tier): string {
  const count = POINTS_BY_TIER[tier];
  const stretch = 0.78 + seededUnit(id, 11) * 0.44;
  const turn = seededUnit(id, 12) * Math.PI;
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const angle = ((i + (seededUnit(id, 100 + i) - 0.5) * 0.6) / count) * Math.PI * 2;
    const radius = 0.7 + seededUnit(id, 200 + i) * 0.34;
    const x = Math.cos(angle) * radius * stretch;
    const y = (Math.sin(angle) * radius) / stretch;
    points.push([x * cos - y * sin, x * sin + y * cos]);
  }
  return closedCurve(points);
}

const CIRCLE = "M-0.95 0A0.95 0.95 0 1 0 0.95 0A0.95 0.95 0 1 0-0.95 0Z";

/** Hand-authored outlines for landmarks whose shape is part of what they are. */
const SILHOUETTE: Record<string, string> = {
  // A bank of cloud.
  "godland-skypiea": "M-0.98 0.3A0.4 0.4 0 0 1-0.86-0.42A0.52 0.52 0 0 1 0.02-0.62A0.46 0.46 0 0 1 0.82-0.3A0.4 0.4 0 0 1 0.9 0.42A0.34 0.34 0 0 1 0.36 0.6A0.46 0.46 0 0 1-0.44 0.6A0.36 0.36 0 0 1-0.98 0.3Z",
  "sky-sea": "M-1 0.2A0.36 0.36 0 0 1-0.8-0.4A0.5 0.5 0 0 1 0.1-0.5A0.42 0.42 0 0 1 0.85-0.15A0.36 0.36 0 0 1 0.8 0.5A0.5 0.5 0 0 1-0.1 0.55A0.44 0.44 0 0 1-1 0.2Z",
  weatheria: "M-0.9 0.25A0.36 0.36 0 0 1-0.7-0.38A0.5 0.5 0 0 1 0.2-0.5A0.4 0.4 0 0 1 0.9 0A0.38 0.38 0 0 1 0.6 0.55A0.5 0.5 0 0 1-0.3 0.56A0.4 0.4 0 0 1-0.9 0.25Z",
  // A bubble, a round city, a ring of fortress.
  "fish-man-island": CIRCLE,
  "water-seven": CIRCLE,
  "enies-lobby": CIRCLE,
  // A crescent bay.
  marineford: "M0.75-0.75A1 1 0 1 0 0.75 0.75A0.72 0.72 0 1 1 0.75-0.75Z",
  // Half an island: the other half is in the sky.
  "jaya-island": "M-0.1-0.95C0.5-0.9 0.95-0.5 0.95 0C0.95 0.5 0.5 0.92-0.1 0.95C0.1 0.6-0.25 0.35-0.05 0.05C0.12-0.25-0.2-0.55-0.1-0.95Z",
  // A ring of long islands.
  "long-ring-long-land": "M-1 0A1 1 0 1 0 1 0A1 1 0 1 0-1 0ZM-0.56 0A0.56 0.56 0 1 1 0.56 0A0.56 0.56 0 1 1-0.56 0Z",
  // A ship shaped like a fish.
  baratie: "M-0.95 0C-0.6-0.55 0.2-0.6 0.55-0.12L0.98-0.5L0.86 0L0.98 0.5L0.55 0.12C0.2 0.6-0.6 0.55-0.95 0Z",
  // An elephant seen from above: body, head and trunk.
  zou: "M-0.9 0.1C-0.95-0.45-0.45-0.75 0.05-0.7C0.45-0.66 0.6-0.4 0.62-0.15C0.85-0.2 1-0.02 0.98 0.25C0.96 0.5 0.8 0.62 0.7 0.5C0.82 0.38 0.8 0.2 0.62 0.2C0.5 0.6 0.1 0.75-0.3 0.7C-0.65 0.66-0.86 0.45-0.9 0.1Z",
};

/* ------------------------------------------------------------------ */
/* Terrain colours                                                      */
/* ------------------------------------------------------------------ */

interface Palette {
  /** Main land colour. */
  fill: string;
  /** Darker tone for relief and detail. */
  shade: string;
  /** Outline. Ink for land; softer for cloud and bubble. */
  line: string;
}

const PALETTE: Record<Terrain | "uncharted", Palette> = {
  temperate: { fill: "#a3c680", shade: "#7da760", line: INK },
  tropical: { fill: "#8cc472", shade: "#5f9f52", line: INK },
  jungle: { fill: "#69a657", shade: "#3f7f3c", line: INK },
  desert: { fill: "#e6cd8f", shade: "#c5a25c", line: INK },
  snow: { fill: "#f3f7f9", shade: "#c7d8e3", line: INK },
  rock: { fill: "#a2a4ab", shade: "#7a7d87", line: INK },
  urban: { fill: "#dccba4", shade: "#b49b6e", line: INK },
  city: { fill: "#e4d7ba", shade: "#b7a077", line: INK },
  fortress: { fill: "#cbced4", shade: "#989da7", line: INK },
  walled: { fill: "#aec98f", shade: "#7f9c63", line: INK },
  haunted: { fill: "#7a7592", shade: "#4d4866", line: INK },
  mangrove: { fill: "#86c495", shade: "#4f9a6a", line: INK },
  tree: { fill: "#86ba70", shade: "#4c8a44", line: INK },
  candy: { fill: "#f6bcd3", shade: "#df86ac", line: INK },
  tech: { fill: "#eff3f5", shade: "#8fd3df", line: INK },
  elephant: { fill: "#adb2ba", shade: "#7d838d", line: INK },
  "fire-ice": { fill: "#e8743c", shade: "#cfe8f4", line: INK },
  sky: { fill: "#ffffff", shade: "#d5e4ef", line: "#5f7f99" },
  bubble: { fill: "#9fe0dc", shade: "#58b3b3", line: "#256a72" },
  redline: { fill: "#c8463a", shade: "#8f231b", line: INK },
  // No terrain on record: plain chart paper, as an island nobody has described.
  uncharted: { fill: "#d6c79c", shade: "#b5a377", line: INK },
};

const RUIN: Palette = { fill: "#97948c", shade: "#6f6c66", line: INK };

/* ------------------------------------------------------------------ */
/* Landmark drawings                                                    */
/* ------------------------------------------------------------------ */

/**
 * Stroke settings for the drawings. Widths are in screen pixels: "non-scaling-stroke" stops
 * the map's zoom from thickening them. That property is not inherited, so it has to be set
 * on every shape, never on a group: hence these objects, spread onto each element.
 */
const detail = { fill: "none", strokeWidth: 0.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, vectorEffect: "non-scaling-stroke" as const };
/** Ink edge for a filled shape. */
const edge = { stroke: INK, strokeWidth: 0.7, strokeLinejoin: "round" as const, vectorEffect: "non-scaling-stroke" as const };

type Glyph = (palette: Palette) => ReactNode;

const dunes: Glyph = (p) => (
  <>
    <path d="M-0.62 0.12q0.2-0.26 0.46 0M-0.12 0.42q0.22-0.26 0.52 0M-0.34-0.3q0.18-0.22 0.42 0" stroke={p.shade} {...detail} />
    <path d="M0.14-0.02l0.24-0.42l0.24 0.42z" fill={p.shade} stroke={INK} strokeWidth={0.7} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
  </>
);

const peaks: Glyph = (p) => (
  <>
    {/* three sheer drum-shaped peaks, each with a cap of snow */}
    <path d="M-0.62 0.36l0.06-0.6h0.26l0.06 0.6z" fill={p.shade} {...edge} />
    <path d="M-0.16 0.4l0.07-0.95h0.3l0.07 0.95z" fill={p.shade} {...edge} />
    <path d="M0.3 0.36l0.06-0.52h0.24l0.06 0.52z" fill={p.shade} {...edge} />
    <path d="M-0.6-0.3h0.34v0.1h-0.34zM-0.13-0.61h0.38v0.1h-0.38zM0.32-0.22h0.32v0.1h-0.32z" fill="#ffffff" {...edge} strokeWidth={0.5} />
  </>
);

const GLYPHS: Record<string, Glyph> = {
  "alabasta-kingdom": dunes,
  "sandy-island": dunes,
  "drum-island": peaks,

  "godland-skypiea": () => (
    <>
      <ellipse cx="-0.1" cy="0.02" rx="0.42" ry="0.26" fill="#69a657" stroke={INK} strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
      <circle cx="0.36" cy="-0.12" r="0.11" fill="#ecc14f" stroke={INK} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
    </>
  ),

  "fish-man-island": (p) => (
    <>
      <path d="M-0.42 0.22C-0.4-0.12-0.1-0.3 0.2-0.2C0.45-0.1 0.48 0.2 0.3 0.34C0.05 0.5-0.4 0.48-0.42 0.22Z" fill="#f2a9b8" stroke={p.line} strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
      <path d="M-0.62-0.42A0.76 0.76 0 0 1-0.1-0.74" stroke="#ffffff" {...detail} strokeWidth={1.3} opacity={0.9} />
    </>
  ),

  "water-seven": (p) => (
    <>
      <circle r="0.62" stroke={p.shade} {...detail} strokeWidth={1.4} />
      <circle r="0.34" stroke={p.shade} {...detail} strokeWidth={1.2} />
      <path d="M0-0.95V-0.34M0 0.34V0.95M-0.95 0H-0.34M0.34 0H0.95" stroke="#4fb6d6" {...detail} strokeWidth={1.2} />
      <circle r="0.15" fill="#4fb6d6" stroke={INK} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
    </>
  ),

  "wano-country": (p) => (
    <>
      {/* the wall of cliffs, then a Fuji-shaped peak */}
      <path d="M-0.56-0.3L-0.2-0.56L0.3-0.5L0.58-0.1L0.44 0.4L-0.05 0.56L-0.5 0.3Z" stroke="#5a4630" {...detail} strokeWidth={1.5} strokeDasharray="2.4 1.6" />
      <path d="M-0.3 0.26L0-0.3L0.3 0.26Z" fill={p.shade} stroke={INK} strokeWidth={0.7} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <path d="M-0.1-0.11L0-0.3L0.1-0.11Z" fill="#ffffff" />
    </>
  ),

  "punk-hazard-island": () => (
    <path d="M0.02-0.8L-0.12-0.4L0.1-0.1L-0.1 0.3L0.06 0.8" stroke={INK} {...detail} strokeWidth={1.1} />
  ),

  "reverse-mountain": (p) => (
    <>
      <path d="M-0.6 0.5L0-0.62L0.6 0.5Z" fill={p.shade} stroke={INK} strokeWidth={0.8} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <path d="M-0.17-0.3L0-0.62L0.17-0.3Z" fill="#ffffff" />
      <path d="M0-0.3V0.5" stroke="#bfe6f2" {...detail} strokeWidth={1.3} />
    </>
  ),

  "thriller-bark": () => <path d="M0-0.52V0.46M-0.26-0.2H0.26" stroke="#e9e4f2" {...detail} strokeWidth={1.5} />,

  "sabaody-archipelago": (p) => (
    <>
      <circle cx="-0.34" cy="0.14" r="0.24" fill={p.shade} />
      <circle cx="0.12" cy="-0.22" r="0.27" fill={p.shade} />
      <circle cx="0.4" cy="0.26" r="0.2" fill={p.shade} />
      <circle cx="-0.52" cy="-0.36" r="0.11" stroke="#ffffff" {...detail} />
      <circle cx="0.56" cy="-0.5" r="0.08" stroke="#ffffff" {...detail} />
      <circle cx="-0.05" cy="0.52" r="0.09" stroke="#ffffff" {...detail} />
    </>
  ),

  marineford: () => <path d="M-0.5-0.16h0.3v0.32h-0.3z" fill="#ffffff" stroke={INK} strokeWidth={0.7} vectorEffect="non-scaling-stroke" />,

  "impel-down": (p) => (
    <>
      <path d="M-0.5-0.5h1v1h-1z" stroke={p.shade} {...detail} strokeWidth={1.4} />
      <path d="M-0.24-0.24h0.48v0.48h-0.48z" fill={p.shade} stroke={INK} strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
    </>
  ),

  "enies-lobby": () => (
    <>
      {/* the bottomless waterfall, with the courthouse island in the middle */}
      <circle r="0.56" fill="#0a3551" stroke={INK} strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
      <circle r="0.2" fill="#ffffff" stroke={INK} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
    </>
  ),

  "whole-cake-island": () => (
    <>
      <circle r="0.56" fill="#fbe3ec" stroke={INK} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
      <circle r="0.32" fill="#f29abb" stroke={INK} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
      <circle r="0.12" fill="#d02a3a" />
    </>
  ),

  zou: () => <ellipse cx="-0.16" cy="0" rx="0.42" ry="0.3" fill="#69a657" stroke={INK} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />,

  "future-island-egghead": (p) => (
    <>
      <ellipse rx="0.36" ry="0.48" fill="#ffffff" stroke={INK} strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
      <path d="M-0.36 0.02H0.36" stroke={p.shade} {...detail} strokeWidth={1.6} />
    </>
  ),

  "elbaph-island": (p) => (
    <>
      <path d="M-0.07 0.1h0.14v0.5h-0.14z" fill="#7a4f2a" />
      <circle cy="-0.12" r="0.46" fill={p.shade} stroke={INK} strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
    </>
  ),

  "giant-island-little-garden": () => (
    <>
      {/* the two volcanoes that time the giants' duel */}
      <path d="M-0.5 0.2L-0.3-0.22L-0.1 0.2Z" fill="#8f3a2a" {...edge} />
      <path d="M0.1 0.3L0.32-0.14L0.54 0.3Z" fill="#8f3a2a" {...edge} />
    </>
  ),

  baratie: () => <circle cx="-0.5" cy="-0.06" r="0.07" fill={INK} />,

  "holyland-mary-geoise": () => (
    <>
      <path d="M-0.4-0.1h0.8v0.5h-0.8z" fill="#ffffff" {...edge} />
      <path d="M-0.5 0.4v-0.62l0.14-0.24l0.14 0.24v0.62zM0.22 0.4v-0.62l0.14-0.24l0.14 0.24v0.62z" fill="#ffffff" {...edge} />
      <path d="M-0.5-0.22l0.14-0.24l0.14 0.24zM0.22-0.22l0.14-0.24l0.14 0.24z" fill="#3a6ea8" {...edge} />
    </>
  ),

  onigashima: () => (
    <>
      {/* a horned skull */}
      <path d="M-0.42-0.2L-0.62-0.72L-0.22-0.42ZM0.42-0.2L0.62-0.72L0.22-0.42Z" fill="#e9e4f2" {...edge} />
      <circle cy="0.08" r="0.4" fill="#e9e4f2" {...edge} />
      <circle cx="-0.15" cy="0.04" r="0.08" fill={INK} />
      <circle cx="0.15" cy="0.04" r="0.08" fill={INK} />
    </>
  ),

  "foosha-village": () => (
    <>
      {/* a windmill: Foosha means windmill */}
      <path d="M-0.1 0.5L-0.05 0.02H0.05L0.1 0.5Z" fill="#f3e7c9" {...edge} />
      <path d="M-0.36-0.34L0.36 0.38M0.36-0.34L-0.36 0.38" stroke={INK} {...detail} strokeWidth={1.2} />
    </>
  ),

  "arlong-park": () => <path d="M-0.28 0.34C-0.2-0.1 0.05-0.46 0.36-0.56C0.24-0.2 0.3 0.1 0.44 0.34Z" fill="#2f6f86" stroke={INK} strokeWidth={0.7} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />,

  loguetown: () => <path d="M-0.3 0.42V-0.36H0.34M0.2-0.36V-0.06" stroke={INK} {...detail} strokeWidth={1.2} />,

  "dress-rosa": () => (
    <>
      {[0, 72, 144, 216, 288].map((angle) => (
        <circle key={angle} cx="0" cy="-0.3" r="0.2" fill="#e8607f" transform={`rotate(${angle})`} />
      ))}
      <circle r="0.14" fill="#ecc14f" stroke={INK} strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
    </>
  ),

  "island-of-women": () => <path d="M-0.4 0.34C-0.5-0.1 0.1 0.1 0-0.2C-0.08-0.44 0.3-0.5 0.4-0.3" stroke="#8a2a50" {...detail} strokeWidth={1.4} />,

  "jaya-island": (p) => <path d="M0.3-0.3h0.02M0.5 0.1h0.02M0.28 0.4h0.02" stroke={p.shade} {...detail} strokeWidth={2.4} />,

  "long-ring-long-land": (p) => <circle r="0.78" stroke={p.shade} {...detail} strokeWidth={1} strokeDasharray="3 2.4" />,
};

/* ------------------------------------------------------------------ */
/* The island                                                           */
/* ------------------------------------------------------------------ */

export interface IslandLook {
  /** Outline path, in the island's own unit space. */
  d: string;
  palette: Palette;
  /** Small drawing on top, for landmarks. */
  glyph?: Glyph;
  /** Cloud and bubble are not land: no ink edge, no foam. */
  soft: boolean;
  /** Halves filled differently (Punk Hazard: fire and ice). */
  split: boolean;
  /** An outline with a hole in it (the ring of Long Ring Long Land). */
  ring: boolean;
}

/** Everything needed to draw an island, worked out once per location. */
export function islandLook(location: MapLocation): IslandLook {
  const terrain = location.terrain;
  const palette = location.destroyed ? RUIN : PALETTE[terrain ?? (location.region === "red-line" ? "redline" : location.region === "sky" ? "sky" : "uncharted")];
  return {
    d: SILHOUETTE[location.id] ?? seededSilhouette(location.id, location.tier),
    palette,
    glyph: location.destroyed ? undefined : GLYPHS[location.id],
    soft: !location.destroyed && (terrain === "sky" || terrain === "bubble" || (!terrain && location.region === "sky")),
    split: !location.destroyed && terrain === "fire-ice",
    ring: location.id === "long-ring-long-land",
  };
}

/** A crack across a ruined island. */
const CRACK = "M-0.5-0.62L-0.12-0.2L-0.34 0.02L0.08 0.3L-0.06 0.62";

/** Ids of the shared definitions the island drawings refer to. Rendered once by <IslandDefs />. */
const GRAIN_ID = "isle-grain";
const LEFT_ID = "isle-left-half";
const RIGHT_ID = "isle-right-half";

/**
 * Shared definitions for all islands: paper grain, and the two halves used by split
 * islands. Each island is its own <svg>, but ids are document-wide, so one copy of these,
 * in an empty <svg> of its own, serves them all.
 */
export function IslandDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
    <defs>
      {/* Specks of paper grain: plain shapes rather than a filter, so they cost nothing to pan. */}
      <pattern id={GRAIN_ID} width="0.5" height="0.5" patternUnits="userSpaceOnUse" patternTransform="rotate(17)">
        <circle cx="0.08" cy="0.1" r="0.022" fill="#3b2a12" opacity="0.2" />
        <circle cx="0.33" cy="0.06" r="0.016" fill="#ffffff" opacity="0.35" />
        <circle cx="0.22" cy="0.3" r="0.02" fill="#3b2a12" opacity="0.16" />
        <circle cx="0.42" cy="0.38" r="0.018" fill="#ffffff" opacity="0.3" />
        <circle cx="0.06" cy="0.42" r="0.014" fill="#3b2a12" opacity="0.18" />
      </pattern>
      <clipPath id={LEFT_ID}>
        <rect x="-3" y="-3" width="3" height="6" />
      </clipPath>
      <clipPath id={RIGHT_ID}>
        <rect x="0" y="-3" width="3" height="6" />
      </clipPath>
    </defs>
    </svg>
  );
}

interface IslandArtProps {
  look: IslandLook;
  tier: Tier;
  destroyed: boolean;
  unplaced: boolean;
}

/**
 * The box every island is drawn in: about one unit of land around the origin, with room
 * above for a pennant and around the edge for the foam. An <svg> with this viewBox, sized
 * 2.8 by 3.2 island radii, draws the island at the right size.
 */
export const ISLAND_VIEWBOX = "-1.4 -1.8 2.8 3.2";

/** Cloud, bubble and unconfirmed islands have no shoreline to break against. */
export function hasFoam(look: IslandLook, unplaced: boolean): boolean {
  return !look.soft && !unplaced;
}

/**
 * Shoreline foam: the island's outline again, a little larger and nearly transparent.
 * It is drawn in an <svg> of its own, under the land, so that it can fade in and out
 * without the land having to be redrawn.
 */
export function IslandFoam({ look }: { look: IslandLook }) {
  return (
    <path
      d={look.d}
      transform="scale(1.3)"
      fill="#ffffff"
      fillOpacity={0.2}
      fillRule={look.ring ? "evenodd" : undefined}
      stroke="#ffffff"
      strokeOpacity={0.5}
      strokeWidth={0.7}
      vectorEffect="non-scaling-stroke"
    />
  );
}

/**
 * The island itself, drawn about the origin at roughly unit radius: the land with an ink
 * outline, paper grain and a touch of relief on the larger ones, and the landmark's own
 * drawing if it has one. Smaller tiers get fewer layers.
 */
export function IslandLand({ look, tier, destroyed, unplaced }: IslandArtProps) {
  const { d, palette, glyph, soft, split, ring } = look;
  const lineWidth = tier === 1 ? 1.25 : tier === 2 ? 1 : 0.8;
  const fillRule = ring ? "evenodd" : undefined;

  return (
    <>
      <g>
        {split ? (
          <>
            <path d={d} fill={palette.fill} clipPath={`url(#${LEFT_ID})`} />
            <path d={d} fill={palette.shade} clipPath={`url(#${RIGHT_ID})`} />
            <path className="isle-ink" d={d} fill="none" stroke={palette.line} strokeWidth={lineWidth} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </>
        ) : (
          <path
            className="isle-ink"
            d={d}
            fill={palette.fill}
            fillOpacity={unplaced ? 0.4 : soft && palette === PALETTE.bubble ? 0.72 : 1}
            fillRule={fillRule}
            stroke={palette.line}
            strokeWidth={lineWidth}
            strokeLinejoin="round"
            strokeDasharray={unplaced ? "3 2.2" : undefined}
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* relief: a smaller, darker echo of the outline, set toward the lower right */}
        {tier < 3 && !soft && !split && !ring && !unplaced && !glyph ? (
          <path d={d} transform="translate(0.1 0.12) scale(0.5)" fill={palette.shade} opacity={0.55} />
        ) : null}

        {/* paper grain, on landmarks only: a pattern fill is the slowest thing an island draws */}
        {tier === 1 && !unplaced ? <path d={d} fill={`url(#${GRAIN_ID})`} fillRule={fillRule} pointerEvents="none" /> : null}

        {glyph ? glyph(palette) : null}

        {destroyed ? <path d={CRACK} fill="none" stroke={INK} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /> : null}
      </g>
    </>
  );
}

/** A small pennant, planted on islands the crew visits on the timeline. */
export function VisitedPennant() {
  return (
    <g className="isle-pennant" transform="translate(0.5 -0.5)">
      <path d="M0 0.1V-0.78" stroke={INK} strokeWidth={0.9} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d="M0-0.78L0.52-0.58L0-0.38Z" fill="#ecc14f" stroke={INK} strokeWidth={0.7} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </g>
  );
}
