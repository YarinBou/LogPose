/**
 * Projection from Ohara map units to the drawing space of the abstract world map.
 *
 * The drawing is 1400 x 900. The Red Line sits exactly in the middle and again as a strip
 * down each edge (the world wraps), and the Grand Line gets a taller band than its true
 * share of the globe so its crowded islands have room.
 */
import {
  getLocation,
  LAUGH_TALE,
  ROUTE_NEW_WORLD,
  ROUTE_PARADISE,
  ROUTE_SUMMIT_WAR,
  WORLD,
  type RegionId,
} from "@/data/map";

export const MAP_WIDTH = 1400;
export const MAP_HEIGHT = 900;

/** Width of the Red Line strip on the left and right edges. */
export const EDGE = 34;
/** Half-width of the central Red Line. */
export const RED_HALF = 17;

export const NORTH_TOP = 34;
export const BAND_TOP = 330;
export const BAND_BOTTOM = 570;
export const SOUTH_BOTTOM = MAP_HEIGHT - 34;

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function mapX(x: number): number {
  const cx = clamp(x, WORLD.minX, WORLD.maxX);
  if (cx <= WORLD.redLineX) {
    return lerp(EDGE, MAP_WIDTH / 2, (cx - WORLD.minX) / (WORLD.redLineX - WORLD.minX));
  }
  return lerp(MAP_WIDTH / 2, MAP_WIDTH - EDGE, (cx - WORLD.redLineX) / (WORLD.maxX - WORLD.redLineX));
}

export function mapY(y: number): number {
  const cy = clamp(y, WORLD.minY, WORLD.maxY);
  if (cy >= WORLD.grandLineNorth) {
    return lerp(BAND_TOP, NORTH_TOP, (cy - WORLD.grandLineNorth) / (WORLD.maxY - WORLD.grandLineNorth));
  }
  if (cy >= WORLD.grandLineSouth) {
    return lerp(BAND_BOTTOM, BAND_TOP, (cy - WORLD.grandLineSouth) / (WORLD.grandLineNorth - WORLD.grandLineSouth));
  }
  return lerp(SOUTH_BOTTOM, BAND_BOTTOM, (cy - WORLD.minY) / (WORLD.grandLineSouth - WORLD.minY));
}

/** Inner edges of the two Calm Belts, in drawing units. */
export const CALM_NORTH_INNER = mapY(27300);
export const CALM_SOUTH_INNER = mapY(23300);

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

const HALF = MAP_WIDTH / 2;

/** Drawing-space box to zoom to for each sea. Regions without one keep the whole-world view. */
export const REGION_BOXES: Partial<Record<RegionId, Box>> = {
  "north-blue": { x: EDGE, y: NORTH_TOP, width: HALF - EDGE, height: BAND_TOP - NORTH_TOP },
  "east-blue": { x: HALF, y: NORTH_TOP, width: HALF - EDGE, height: BAND_TOP - NORTH_TOP },
  "west-blue": { x: EDGE, y: BAND_BOTTOM, width: HALF - EDGE, height: SOUTH_BOTTOM - BAND_BOTTOM },
  "south-blue": { x: HALF, y: BAND_BOTTOM, width: HALF - EDGE, height: SOUTH_BOTTOM - BAND_BOTTOM },
  "new-world": { x: 0, y: BAND_TOP - 16, width: HALF, height: BAND_BOTTOM - BAND_TOP + 32 },
  paradise: { x: HALF, y: BAND_TOP - 16, width: HALF, height: BAND_BOTTOM - BAND_TOP + 32 },
};

function point(id: string): [number, number] {
  const location = getLocation(id);
  if (!location) throw new Error(`Route refers to an unknown location: ${id}`);
  return [mapX(location.x), mapY(location.y)];
}

function polyline(ids: string[]): string {
  return ids
    .map(point)
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
}

const [fishManX, fishManY] = point("fish-man-island");
const [punkX, punkY] = point("punk-hazard-island");
const [elbaphX, elbaphY] = point("elbaph-island");

export const LAUGH_TALE_POINT: [number, number] = [mapX(LAUGH_TALE.x), mapY(LAUGH_TALE.y)];

export const ROUTES = {
  /** Foosha Village to Fish-Man Island, then off the right edge under the Red Line. */
  paradise: `${polyline(ROUTE_PARADISE)} L${MAP_WIDTH} ${fishManY.toFixed(1)}`,
  /** In from the left edge, Punk Hazard to Elbaph. */
  newWorld: `M0 ${punkY.toFixed(1)} L${punkX.toFixed(1)} ${punkY.toFixed(1)} ${polyline(ROUTE_NEW_WORLD).replace(/^M[^L]+/, "")}`,
  /** Luffy's solo loop during the Summit War. */
  summitWar: polyline(ROUTE_SUMMIT_WAR),
  /** The stretch nobody has charted. */
  toLaughTale: `M${elbaphX.toFixed(1)} ${elbaphY.toFixed(1)} L${LAUGH_TALE_POINT[0].toFixed(1)} ${LAUGH_TALE_POINT[1].toFixed(1)}`,
} as const;

export const FISH_MAN_EXIT: [number, number] = [fishManX, fishManY];
