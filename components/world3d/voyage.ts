/**
 * The voyage as a path over the globe.
 *
 * The course is the same one the 2D chart draws (ROUTE_PARADISE, ROUTE_SUMMIT_WAR and
 * ROUTE_NEW_WORLD in data/map.ts), visiting every waypoint in sailing order, and each leg
 * is the same straight line it is on the chart, wrapped onto the sphere. So the ship on the
 * globe passes exactly the islands, and in the same places, as the route on the flat map.
 *
 * The Summit War detour is sailed in story order: Sabaody, Amazon Lily, Impel Down,
 * Marineford, back to Amazon Lily and Rusukaina, then Sabaody again. At Fish-Man Island
 * the course dives under the Red Line and surfaces in the New World, as on the chart, where
 * the right and left edges are the same wall (longitude 180 on the globe).
 *
 * Log stops come from the timeline: one per arc, at the first waypoint (from where the
 * ship is) that belongs to the arc.
 */
import { Vector3 } from "three";
import { chartLatitude, chartLongitude, direction, GLOBE_RADIUS } from "@/components/world3d/globe-math";
import { EDGE, LAUGH_TALE_POINT, mapX, mapY, MAP_WIDTH } from "@/components/map/projection";
import { getLocation, ROUTE_NEW_WORLD, ROUTE_PARADISE, ROUTE_SUMMIT_WAR, type MapLocation } from "@/data/map";
import { ALL_ARCS, type Arc } from "@/data/timeline";

export interface VoyageStop {
  arc: Arc;
  location: MapLocation;
  /** Unit vector from the globe's centre to the stop. */
  normal: Vector3;
  /** Position of the stop along the whole voyage, 0..1. */
  t: number;
}

/** The Reverie happens at Mary Geoise while the crew is in Wano, so the ship does not call there. */
const NOT_ON_THE_COURSE = new Set(["reverie"]);

/** Height of the course above the water. */
export const COURSE_ALTITUDE = 0.035;

/** Angle between samples along a leg, in radians (about 1.2 degrees). */
const SAMPLE_ANGLE = 0.021;

interface Waypoint {
  /** Location id, or null for a turning point that is not a place (the Red Line crossing). */
  id: string | null;
  lon: number;
  lat: number;
  /** This waypoint and the leg leading to it belong to Luffy's Summit War detour. */
  detour: boolean;
}

function waypoint(id: string, detour = false): Waypoint {
  const location = getLocation(id);
  if (!location) throw new Error(`Route refers to an unknown location: ${id}`);
  return { id, lon: chartLongitude(mapX(location.x)), lat: chartLatitude(mapY(location.y)), detour };
}

function courseWaypoints(): Waypoint[] {
  const sabaody = ROUTE_PARADISE.indexOf("sabaody-archipelago");
  const fishMan = getLocation("fish-man-island")!;
  const punk = getLocation("punk-hazard-island")!;
  return [
    ...ROUTE_PARADISE.slice(0, sabaody + 1).map((id) => waypoint(id)),
    ...ROUTE_SUMMIT_WAR.slice(1).map((id) => waypoint(id, true)),
    ...ROUTE_PARADISE.slice(sabaody + 1).map((id) => waypoint(id)),
    // Under the Red Line: off the right edge of the chart, back in from the left edge.
    { id: null, lon: chartLongitude(MAP_WIDTH - EDGE), lat: chartLatitude(mapY(fishMan.y)), detour: false },
    { id: null, lon: chartLongitude(EDGE), lat: chartLatitude(mapY(punk.y)), detour: false },
    ...ROUTE_NEW_WORLD.map((id) => waypoint(id)),
  ];
}

/** Longitude step from `from` to `to`, the short way round the globe. */
function lonDelta(from: number, to: number): number {
  let delta = to - from;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

/** Points along a straight chart line from `a` to `b`, excluding `a`, including `b`. */
function sampleLeg(a: Waypoint, b: Waypoint): Vector3[] {
  const dLon = lonDelta(a.lon, b.lon);
  const dLat = b.lat - a.lat;
  const angle = direction(a.lon, a.lat).angleTo(direction(b.lon, b.lat));
  if (angle < 1e-5 && Math.abs(dLon) < 1e-5) return [];
  const steps = Math.max(1, Math.ceil(Math.max(angle, (Math.hypot(dLon, dLat) * Math.PI) / 180) / SAMPLE_ANGLE));
  const out: Vector3[] = [];
  for (let step = 1; step <= steps; step++) {
    const f = step / steps;
    out.push(direction(a.lon + dLon * f, a.lat + dLat * f));
  }
  return out;
}

function buildVoyage() {
  const waypoints = courseWaypoints();

  const samples: Vector3[] = [direction(waypoints[0].lon, waypoints[0].lat)];
  const sampleAngles: number[] = [0];
  /** Sample index of each waypoint. */
  const waypointSample: number[] = [0];
  /** Sample ranges [from, to] of the Summit War detour. */
  const detourRanges: [number, number][] = [];
  let travelled = 0;

  for (let i = 1; i < waypoints.length; i++) {
    const startSample = samples.length - 1;
    for (const point of sampleLeg(waypoints[i - 1], waypoints[i])) {
      travelled += samples[samples.length - 1].angleTo(point);
      samples.push(point);
      sampleAngles.push(travelled);
    }
    waypointSample.push(samples.length - 1);
    if (waypoints[i].detour) {
      const last = detourRanges[detourRanges.length - 1];
      if (last && last[1] === startSample) last[1] = samples.length - 1;
      else detourRanges.push([startSample, samples.length - 1]);
    }
  }

  // One log stop per arc, at the next waypoint that belongs to it.
  const stops: VoyageStop[] = [];
  let cursor = 0;
  for (const arc of ALL_ARCS) {
    if (NOT_ON_THE_COURSE.has(arc.id)) continue;
    let index = cursor;
    while (index < waypoints.length && !(waypoints[index].id && arc.locationIds.includes(waypoints[index].id!))) index++;
    if (index >= waypoints.length) throw new Error(`Arc "${arc.id}" has no waypoint on the course.`);
    const location = getLocation(waypoints[index].id!)!;
    const sample = waypointSample[index];
    stops.push({ arc, location, normal: samples[sample].clone(), t: sampleAngles[sample] / travelled });
    cursor = index;
  }

  const sampleT = sampleAngles.map((angle) => angle / travelled);
  const points = samples.map((normal) => normal.clone().multiplyScalar(GLOBE_RADIUS + COURSE_ALTITUDE));
  const detours = detourRanges.map(([from, to]) => points.slice(from, to + 1));

  // The uncharted last leg, Elbaph to Laugh Tale, drawn as on the chart but never sailed.
  const last = waypoints[waypoints.length - 1];
  const laughTale: Waypoint = {
    id: null,
    lon: chartLongitude(LAUGH_TALE_POINT[0]),
    lat: chartLatitude(LAUGH_TALE_POINT[1]),
    detour: false,
  };
  const toLaughTale = [direction(last.lon, last.lat), ...sampleLeg(last, laughTale)].map((normal) =>
    normal.multiplyScalar(GLOBE_RADIUS + COURSE_ALTITUDE),
  );

  return { stops, samples, sampleT, points, detours, toLaughTale };
}

export const VOYAGE = buildVoyage();

/** Index of the last sample at or before `t`. */
function sampleIndexAt(t: number): number {
  const { sampleT } = VOYAGE;
  let low = 0;
  let high = sampleT.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (sampleT[mid] <= t) low = mid;
    else high = mid - 1;
  }
  return low;
}

const scratch = new Vector3();

/**
 * Where the ship is at progress `t` (0..1): the surface normal there, and the direction it
 * is heading. Both are written into the vectors passed in.
 */
export function shipAt(t: number, normal: Vector3, heading: Vector3): void {
  const { samples, sampleT } = VOYAGE;
  const clamped = Math.min(1, Math.max(0, t));
  const i = Math.min(sampleIndexAt(clamped), samples.length - 2);
  const span = sampleT[i + 1] - sampleT[i];
  const local = span > 0 ? (clamped - sampleT[i]) / span : 0;
  normal.copy(samples[i]).lerp(samples[i + 1], local).normalize();
  heading.copy(samples[i + 1]).sub(samples[i]);
  if (heading.lengthSq() < 1e-10) {
    // Two samples on the same spot: borrow the next leg's direction.
    const next = Math.min(i + 2, samples.length - 1);
    heading.copy(samples[next]).sub(samples[i]);
  }
  // Remove any component along the normal so the bow stays level with the sea.
  heading.sub(scratch.copy(normal).multiplyScalar(heading.dot(normal))).normalize();
}

/** Number of course points already sailed at progress `t`, for drawing the wake. */
export function sailedPointCount(t: number): number {
  return sampleIndexAt(Math.min(1, Math.max(0, t))) + 1;
}

/** The stop the ship is at or has most recently left. */
export function currentStopIndex(t: number): number {
  const { stops } = VOYAGE;
  let index = 0;
  for (let i = 0; i < stops.length; i++) {
    if (stops[i].t <= t + 1e-4) index = i;
  }
  return index;
}
