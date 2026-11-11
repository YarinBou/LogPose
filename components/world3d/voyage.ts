/**
 * The voyage as a path over the globe.
 *
 * Stops come straight from the timeline: one per arc, at the arc's first location, in
 * sailing order. Consecutive stops are joined by great-circle arcs, so the leg from
 * Fish-Man Island to Punk Hazard simply crosses the Red Line at Mary Geoise instead of
 * jumping from one edge of a flat map to the other.
 */
import { Vector3 } from "three";
import { directionOf, GLOBE_RADIUS } from "@/components/world3d/globe-math";
import { getLocation, type MapLocation } from "@/data/map";
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

function buildVoyage() {
  const raw = ALL_ARCS.filter((arc) => !NOT_ON_THE_COURSE.has(arc.id)).map((arc) => {
    const location = getLocation(arc.locationIds[0]);
    if (!location) throw new Error(`Arc "${arc.id}" has no map location.`);
    return { arc, location, normal: directionOf(location.x, location.y) };
  });

  // Unit vectors along the course, and the running angle at each stop.
  const samples: Vector3[] = [raw[0].normal.clone()];
  const sampleAngles: number[] = [0];
  const stopAngles: number[] = [0];
  let travelled = 0;

  for (let i = 1; i < raw.length; i++) {
    const from = raw[i - 1].normal;
    const to = raw[i].normal;
    const angle = from.angleTo(to);
    if (angle > 1e-5) {
      const axis = new Vector3().crossVectors(from, to).normalize();
      const steps = Math.max(2, Math.ceil(angle / SAMPLE_ANGLE));
      for (let step = 1; step <= steps; step++) {
        samples.push(from.clone().applyAxisAngle(axis, (angle * step) / steps));
        sampleAngles.push(travelled + (angle * step) / steps);
      }
      travelled += angle;
    }
    stopAngles.push(travelled);
  }

  const stops: VoyageStop[] = raw.map((stop, i) => ({ ...stop, t: stopAngles[i] / travelled }));
  const sampleT = sampleAngles.map((angle) => angle / travelled);
  const points = samples.map((normal) => normal.clone().multiplyScalar(GLOBE_RADIUS + COURSE_ALTITUDE));

  return { stops, samples, sampleT, points };
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
