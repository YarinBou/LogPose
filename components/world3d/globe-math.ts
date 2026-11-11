/**
 * Geometry for the 3D globe.
 *
 * The Ohara map is a flat sheet whose left and right edges are the same wall, so it wraps
 * onto a sphere naturally:
 *   - the Red Line becomes a ring through both poles (longitude 0 at Reverse Mountain,
 *     longitude 180 at Mary Geoise),
 *   - the Grand Line becomes the equator, with a Calm Belt on each side,
 *   - the four Blues are the four quarters left over.
 *
 * As on the 2D chart, the Grand Line band is drawn taller than its true share so its
 * crowded islands have room.
 *
 * Axes follow three.js: +Y is north, longitude 0 faces +Z, east is +X.
 */
import { Matrix4, Quaternion, Vector3 } from "three";
import { WORLD } from "@/data/map";

export const GLOBE_RADIUS = 5;

/** Latitude, in degrees, of the outer edge of each Calm Belt. */
export const BAND_LATITUDE = 17;
/** Latitude of the last charted places near the poles. */
const POLAR_LATITUDE = 80;

const DEG = Math.PI / 180;

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Ohara x -> longitude in degrees, -180..180. West of Reverse Mountain is negative. */
export function longitude(x: number): number {
  const cx = clamp(x, WORLD.minX, WORLD.maxX);
  if (cx <= WORLD.redLineX) {
    return lerp(-180, 0, (cx - WORLD.minX) / (WORLD.redLineX - WORLD.minX));
  }
  return lerp(0, 180, (cx - WORLD.redLineX) / (WORLD.maxX - WORLD.redLineX));
}

/** Ohara y -> latitude in degrees. North is positive. */
export function latitude(y: number): number {
  const cy = clamp(y, WORLD.minY, WORLD.maxY);
  if (cy >= WORLD.grandLineNorth) {
    return lerp(BAND_LATITUDE, POLAR_LATITUDE, (cy - WORLD.grandLineNorth) / (WORLD.maxY - WORLD.grandLineNorth));
  }
  if (cy >= WORLD.grandLineSouth) {
    return lerp(-BAND_LATITUDE, BAND_LATITUDE, (cy - WORLD.grandLineSouth) / (WORLD.grandLineNorth - WORLD.grandLineSouth));
  }
  return lerp(-POLAR_LATITUDE, -BAND_LATITUDE, (cy - WORLD.minY) / (WORLD.grandLineSouth - WORLD.minY));
}

/** Latitude of the inner edge of each Calm Belt (where the Grand Line proper begins). */
export const CALM_INNER_LATITUDE = latitude(27300);

/** Unit vector pointing from the centre of the globe to a longitude and latitude. */
export function direction(lonDeg: number, latDeg: number, target = new Vector3()): Vector3 {
  const lon = lonDeg * DEG;
  const lat = latDeg * DEG;
  return target.set(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
}

/** Unit vector for a place given in Ohara map units. */
export function directionOf(x: number, y: number, target = new Vector3()): Vector3 {
  return direction(longitude(x), latitude(y), target);
}

/** Point on (or `altitude` above) the surface for a place given in Ohara map units. */
export function surfacePoint(x: number, y: number, altitude = 0, target = new Vector3()): Vector3 {
  return directionOf(x, y, target).multiplyScalar(GLOBE_RADIUS + altitude);
}

const UP = new Vector3(0, 1, 0);

/** Rotation that stands a model (built with +Y up) upright on the surface at `normal`. */
export function uprightAt(normal: Vector3, target = new Quaternion()): Quaternion {
  return target.setFromUnitVectors(UP, normal);
}

const basisRight = new Vector3();
const basisForward = new Vector3();
const basisMatrix = new Matrix4();

/**
 * Rotation for something travelling over the surface: +Y along `normal`, +Z along `heading`
 * (the direction of travel, which need not be exactly tangent).
 */
export function headingAt(normal: Vector3, heading: Vector3, target = new Quaternion()): Quaternion {
  basisRight.crossVectors(normal, heading).normalize();
  basisForward.crossVectors(basisRight, normal).normalize();
  basisMatrix.makeBasis(basisRight, normal, basisForward);
  return target.setFromRotationMatrix(basisMatrix);
}
