/**
 * Geometry for the 3D globe.
 *
 * The globe is the 2D chart (components/map/projection.ts) wrapped onto a sphere, so every
 * place sits exactly where it does on the flat map, in the same proportions:
 *   - chart x becomes longitude: the central Red Line (Reverse Mountain) is longitude 0 and
 *     the strips on both edges (Mary Geoise) meet at longitude 180,
 *   - chart y becomes latitude: the Grand Line band becomes the equator, with a Calm Belt
 *     on each side, and the four Blues fill the quarters left over.
 *
 * Because both maps share one projection, the Grand Line band keeps the extra room the 2D
 * chart gives its crowded islands.
 *
 * Axes follow three.js: +Y is north, longitude 0 faces +Z, east is +X.
 */
import { Matrix4, Quaternion, Vector3 } from "three";
import {
  BAND_TOP,
  CALM_NORTH_INNER,
  EDGE,
  MAP_WIDTH,
  mapX,
  mapY,
  NORTH_TOP,
  SOUTH_BOTTOM,
} from "@/components/map/projection";

export const GLOBE_RADIUS = 5;

/** Latitude of the top and bottom edges of the 2D chart (the last charted places). */
const POLAR_LATITUDE = 80;

const DEG = Math.PI / 180;

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/** 2D chart x -> longitude in degrees, -180..180. West of Reverse Mountain is negative. */
export function chartLongitude(px: number): number {
  return lerp(-180, 180, (px - EDGE) / (MAP_WIDTH - 2 * EDGE));
}

/** 2D chart y -> latitude in degrees. North is positive. */
export function chartLatitude(py: number): number {
  return lerp(POLAR_LATITUDE, -POLAR_LATITUDE, (py - NORTH_TOP) / (SOUTH_BOTTOM - NORTH_TOP));
}

/** Ohara x -> longitude in degrees, through the 2D chart. */
export function longitude(x: number): number {
  return chartLongitude(mapX(x));
}

/** Ohara y -> latitude in degrees, through the 2D chart. */
export function latitude(y: number): number {
  return chartLatitude(mapY(y));
}

/** Latitude, in degrees, of the outer edge of each Calm Belt (the 2D chart's band edge). */
export const BAND_LATITUDE = chartLatitude(BAND_TOP);

/** Latitude of the inner edge of each Calm Belt (where the Grand Line proper begins). */
export const CALM_INNER_LATITUDE = chartLatitude(CALM_NORTH_INNER);

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
