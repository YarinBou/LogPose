"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentRef, type RefObject } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Line, OrbitControls, Stars, useGLTF } from "@react-three/drei";
import { Color, Matrix4, Quaternion, Vector3, type Group, type InstancedMesh } from "three";
import { ISLAND_AT, ISLAND_SCALE, MODEL_URLS, SHIP_SCALE } from "@/components/world3d/assets";
import { directionOf, GLOBE_RADIUS, headingAt, uprightAt } from "@/components/world3d/globe-math";
import { Ocean, SUN_DIRECTION } from "@/components/world3d/Ocean";
import { sailedPointCount, shipAt, VOYAGE } from "@/components/world3d/voyage";
import { LAUGH_TALE, LOCATIONS, PONEGLYPHS, type MapLocation, type Poneglyph } from "@/data/map";
import { seededUnit } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Shared types                                                         */
/* ------------------------------------------------------------------ */

export type Selection3D = { kind: "location"; id: string } | { kind: "poneglyph"; id: string } | null;

/** A request to fly the camera so that `normal` faces the viewer. `nonce` makes repeats count. */
export interface FocusRequest {
  normal: Vector3;
  distance: number;
  nonce: number;
}

export interface SceneProps {
  selection: Selection3D;
  onSelect: (selection: Selection3D) => void;
  showCourse: boolean;
  showPoneglyphs: boolean;
  showLabels: boolean;
  autoRotate: boolean;
  followShip: boolean;
  playing: boolean;
  /** Seconds the whole voyage takes when playing. */
  voyageSeconds: number;
  /** Ship progress along the voyage, 0..1. Owned by the page, advanced here while playing. */
  progressRef: RefObject<number>;
  /** Reports progress back to the page a few times a second, for the HUD. */
  onProgress: (t: number) => void;
  onVoyageEnd: () => void;
  focus: FocusRequest | null;
  /** The reader grabbed the globe. */
  onInteract: () => void;
  /** HTML layer over the canvas where place names are drawn. */
  labelLayerRef: RefObject<HTMLDivElement | null>;
}

/* ------------------------------------------------------------------ */
/* Data projected onto the globe                                        */
/* ------------------------------------------------------------------ */

interface Sited<T> {
  item: T;
  normal: Vector3;
}

const SITES: Sited<MapLocation>[] = LOCATIONS.filter((location) => !location.faction).map((item) => ({
  item,
  normal: directionOf(item.x, item.y),
}));

const SITE_BY_ID = new Map(SITES.map((site) => [site.item.id, site]));

/** Landmarks that get a Blender-built island; everything else is a marker. */
const ISLAND_SITES = SITES.filter((site) => ISLAND_AT[site.item.id]);
const MARKER_SITES = SITES.filter((site) => !ISLAND_AT[site.item.id]);
const LABEL_SITES = SITES.filter((site) => site.item.tier === 1);

const STONES: Sited<Poneglyph>[] = PONEGLYPHS.map((item) => ({ item, normal: directionOf(item.x, item.y) }));

const LAUGH_TALE_NORMAL = directionOf(LAUGH_TALE.x, LAUGH_TALE.y);

const MARKER_RADIUS: Record<1 | 2 | 3, number> = { 1: 0.05, 2: 0.034, 3: 0.023 };
const MARKER_COLOR: Record<1 | 2 | 3, string> = { 1: "#ecc14f", 2: "#fbf4e1", 3: "#8fd3e8" };

export function siteNormal(id: string): Vector3 | undefined {
  return SITE_BY_ID.get(id)?.normal;
}

/* ------------------------------------------------------------------ */
/* Labels                                                               */
/* ------------------------------------------------------------------ */

const LABEL_CLASS =
  "absolute left-0 top-0 whitespace-nowrap text-[10.5px] font-semibold text-parchment-50 opacity-0 transition-opacity duration-200 will-change-transform [text-shadow:0_0_3px_#031523,0_0_3px_#031523,0_1px_4px_#031523]";
const LABEL_GOLD_CLASS = `${LABEL_CLASS} !text-gold-300`;
const HOVER_LABEL_CLASS =
  "absolute left-0 top-0 whitespace-nowrap rounded-full border border-gold-300 bg-ocean-950/90 px-2.5 py-0.5 text-[12px] font-bold text-gold-200 opacity-0 transition-opacity duration-150 will-change-transform";

interface LabelSpec {
  text: string;
  normal: Vector3;
  altitude: number;
  gold?: boolean;
}

const LABELS: LabelSpec[] = [
  ...LABEL_SITES.map((site) => ({
    text: site.item.name,
    normal: site.normal,
    altitude: ISLAND_AT[site.item.id] ? 0.36 : 0.16,
  })),
  { text: "Laugh Tale ?", normal: LAUGH_TALE_NORMAL, altitude: 0.12, gold: true },
];

const labelView = new Vector3();
const labelPoint = new Vector3();

interface LabelsProps {
  /** The HTML element laid over the canvas that the names are drawn into. */
  layerRef: RefObject<HTMLDivElement | null>;
  show: boolean;
  hovered: Sited<MapLocation> | Sited<Poneglyph> | null;
}

/**
 * Names pinned to the globe. They are plain HTML elements in a layer over the canvas,
 * moved every frame to where their place projects on screen, so the text stays crisp at
 * any zoom. A name is hidden once its place passes behind the horizon.
 */
function Labels({ layerRef, show, hovered }: LabelsProps) {
  const pinned = useRef<{ element: HTMLDivElement; spec: LabelSpec }[]>([]);
  const hoverElement = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const created = LABELS.map((spec) => {
      const element = document.createElement("div");
      element.className = spec.gold ? LABEL_GOLD_CLASS : LABEL_CLASS;
      element.textContent = spec.text;
      layer.appendChild(element);
      return { element, spec };
    });
    const hover = document.createElement("div");
    hover.className = HOVER_LABEL_CLASS;
    layer.appendChild(hover);
    pinned.current = created;
    hoverElement.current = hover;
    return () => {
      for (const { element } of created) element.remove();
      hover.remove();
      pinned.current = [];
      hoverElement.current = null;
    };
  }, [layerRef]);

  useFrame(({ camera, size }) => {
    const distance = camera.position.length();
    labelView.copy(camera.position).divideScalar(distance);
    // GLOBE_RADIUS / distance is the cosine of the angle from the viewer to the horizon.
    const horizon = GLOBE_RADIUS / distance + 0.07;

    const place = (element: HTMLDivElement, normal: Vector3, altitude: number, wanted: boolean) => {
      if (!wanted || labelView.dot(normal) < horizon) {
        element.style.opacity = "0";
        return;
      }
      labelPoint.copy(normal).multiplyScalar(GLOBE_RADIUS + altitude).project(camera);
      const x = (labelPoint.x * 0.5 + 0.5) * size.width;
      const y = (0.5 - labelPoint.y * 0.5) * size.height;
      element.style.opacity = "1";
      element.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
    };

    for (const { element, spec } of pinned.current) place(element, spec.normal, spec.altitude, show);

    const hover = hoverElement.current;
    if (!hover) return;
    // A landmark that already carries its name does not need a second copy on hover.
    const alreadyNamed = show && hovered !== null && "tier" in hovered.item && hovered.item.tier === 1;
    if (hovered && !alreadyNamed) {
      if (hover.textContent !== hovered.item.name) hover.textContent = hovered.item.name;
      place(hover, hovered.normal, 0.22, true);
    } else {
      hover.style.opacity = "0";
    }
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Blender-built models                                                 */
/* ------------------------------------------------------------------ */

/** The Red Line ring, with Reverse Mountain and Mary Geoise standing on it. */
function RedLine() {
  const { scene } = useGLTF(MODEL_URLS.redLine);
  return <primitive object={scene} />;
}

interface PickHandlers {
  onSelect: (selection: Selection3D) => void;
  onHover: (site: Sited<MapLocation> | Sited<Poneglyph> | null) => void;
}

/** One modelled island per story landmark, stood upright on the surface. */
function Islands({ onSelect, onHover }: PickHandlers) {
  const { scene } = useGLTF(MODEL_URLS.islands);

  const islands = useMemo(
    () =>
      ISLAND_SITES.flatMap((site) => {
        const source = scene.getObjectByName(ISLAND_AT[site.item.id]);
        if (!source) return [];
        const object = source.clone(true);
        object.position.set(0, 0, 0);
        // Turn each island a different way round so repeats of a variant do not look stamped.
        const spin = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), seededUnit(site.item.id, 7) * Math.PI * 2);
        return [
          {
            site,
            object,
            position: site.normal.clone().multiplyScalar(GLOBE_RADIUS - 0.004),
            quaternion: uprightAt(site.normal).multiply(spin),
          },
        ];
      }),
    [scene],
  );

  return (
    <group>
      {islands.map(({ site, object, position, quaternion }) => (
        <group
          key={site.item.id}
          position={position}
          quaternion={quaternion}
          scale={ISLAND_SCALE}
          onPointerOver={(event) => {
            event.stopPropagation();
            onHover(site);
          }}
          onPointerOut={() => onHover(null)}
          onClick={(event) => {
            event.stopPropagation();
            if (event.delta < 4) onSelect({ kind: "location", id: site.item.id });
          }}
        >
          <primitive object={object} />
        </group>
      ))}
    </group>
  );
}

const shipNormal = new Vector3();
const shipHeading = new Vector3();
const shipTurn = new Quaternion();
const shipRoll = new Quaternion();
const FORWARD = new Vector3(0, 0, 1);

/** The Thousand Sunny, placed on the course at the current progress and rocked a little. */
function Ship({ progressRef }: { progressRef: RefObject<number> }) {
  const { scene } = useGLTF(MODEL_URLS.ship);
  const group = useRef<Group>(null);

  useFrame(({ clock }) => {
    const ship = group.current;
    if (!ship) return;
    shipAt(progressRef.current, shipNormal, shipHeading);
    const time = clock.elapsedTime;
    ship.position.copy(shipNormal).multiplyScalar(GLOBE_RADIUS + 0.012 + Math.sin(time * 2.1) * 0.004);
    headingAt(shipNormal, shipHeading, shipTurn);
    shipRoll.setFromAxisAngle(FORWARD, Math.sin(time * 1.7) * 0.07);
    ship.quaternion.copy(shipTurn).multiply(shipRoll);
  });

  return (
    <group ref={group} scale={SHIP_SCALE}>
      <primitive object={scene} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Markers                                                              */
/* ------------------------------------------------------------------ */

const markerMatrix = new Matrix4();
const markerScale = new Vector3();
const markerColor = new Color();
const IDENTITY = new Quaternion();

/** Every place without its own model, drawn as one instanced mesh of small beads. */
function Markers({ onSelect, onHover }: PickHandlers) {
  const mesh = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const instanced = mesh.current;
    if (!instanced) return;
    MARKER_SITES.forEach((site, i) => {
      const radius = MARKER_RADIUS[site.item.tier];
      markerScale.setScalar(radius);
      markerMatrix.compose(site.normal.clone().multiplyScalar(GLOBE_RADIUS + radius * 0.4), IDENTITY, markerScale);
      instanced.setMatrixAt(i, markerMatrix);
      markerColor.set(site.item.destroyed ? "#cf4034" : MARKER_COLOR[site.item.tier]);
      if (site.item.unplaced) markerColor.multiplyScalar(0.55);
      instanced.setColorAt(i, markerColor);
    });
    instanced.instanceMatrix.needsUpdate = true;
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
    instanced.computeBoundingSphere();
  }, []);

  const siteOf = (event: ThreeEvent<PointerEvent | MouseEvent>) =>
    event.instanceId === undefined ? undefined : MARKER_SITES[event.instanceId];

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, MARKER_SITES.length]}
      onPointerMove={(event) => {
        event.stopPropagation();
        const site = siteOf(event);
        if (site) onHover(site);
      }}
      onPointerOut={() => onHover(null)}
      onClick={(event) => {
        event.stopPropagation();
        const site = siteOf(event);
        if (site && event.delta < 4) onSelect({ kind: "location", id: site.item.id });
      }}
    >
      <sphereGeometry args={[1, 12, 10]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/** Poneglyphs as small upright blocks: red for the four Road Poneglyphs. */
function Stones({ onSelect, onHover }: PickHandlers) {
  return (
    <group>
      {STONES.map((stone) => (
        <mesh
          key={stone.item.id}
          position={stone.normal.clone().multiplyScalar(GLOBE_RADIUS + 0.035)}
          quaternion={uprightAt(stone.normal)}
          onPointerOver={(event) => {
            event.stopPropagation();
            onHover(stone);
          }}
          onPointerOut={() => onHover(null)}
          onClick={(event) => {
            event.stopPropagation();
            if (event.delta < 4) onSelect({ kind: "poneglyph", id: stone.item.id });
          }}
        >
          <boxGeometry args={[0.05, 0.07, 0.05]} />
          <meshStandardMaterial
            color={stone.item.road ? "#c8372d" : "#39424f"}
            emissive={stone.item.road ? "#7a1410" : "#10151c"}
            emissiveIntensity={0.6}
            roughness={0.55}
          />
        </mesh>
      ))}
    </group>
  );
}

/** A slow gold ring around whatever is selected. */
function SelectionRing({ normal }: { normal: Vector3 }) {
  const ring = useRef<Group>(null);
  const quaternion = useMemo(() => uprightAt(normal), [normal]);
  const position = useMemo(() => normal.clone().multiplyScalar(GLOBE_RADIUS + 0.02), [normal]);

  useFrame(({ clock }) => {
    if (ring.current) ring.current.scale.setScalar(1 + 0.18 * Math.sin(clock.elapsedTime * 3.2));
  });

  return (
    <group position={position} quaternion={quaternion}>
      <group ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <mesh raycast={() => null}>
          <torusGeometry args={[0.2, 0.012, 8, 48]} />
          <meshBasicMaterial color="#fbeab0" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* The course                                                           */
/* ------------------------------------------------------------------ */

/** The whole course as a faint dashed line, and the part already sailed as a bright one. */
function Course({ progressRef }: { progressRef: RefObject<number> }) {
  const [sailed, setSailed] = useState(() => sailedPointCount(progressRef.current));

  useFrame(() => {
    const count = sailedPointCount(progressRef.current);
    if (count !== sailed) setSailed(count);
  });

  const wake = useMemo(() => VOYAGE.points.slice(0, Math.max(2, sailed)), [sailed]);

  return (
    <group>
      <Line points={VOYAGE.points} color="#f6dc8b" lineWidth={1.4} dashed dashSize={0.07} gapSize={0.06} transparent opacity={0.55} />
      <Line points={wake} color="#ecc14f" lineWidth={3.2} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Camera                                                               */
/* ------------------------------------------------------------------ */

const cameraDirection = new Vector3();
const followNormal = new Vector3();
const followHeading = new Vector3();
const NUDGE_AXIS = new Vector3(0, 1, 0);

interface CameraRigProps {
  focus: FocusRequest | null;
  followShip: boolean;
  autoRotate: boolean;
  progressRef: RefObject<number>;
  onInteract: () => void;
}

/**
 * Orbit controls, plus two ways of steering for the reader: flying to a requested place,
 * and keeping the ship in view. Both turn the camera around the globe's centre toward a
 * target direction, easing a little each frame. Grabbing the globe cancels a flight.
 */
function CameraRig({ focus, followShip, autoRotate, progressRef, onInteract }: CameraRigProps) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const flight = useRef<{ normal: Vector3; distance: number } | null>(null);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const fitted = useRef(false);

  // On a tall, narrow screen the globe is limited by width, so everything is viewed from
  // further back: 1 on landscape screens, up to 1.6 on a phone held upright.
  const portrait = size.width > 0 ? Math.min(1.6, Math.max(1, size.height / size.width)) : 1;

  // Open far enough back that the whole globe fits the frame, whatever its shape.
  useEffect(() => {
    if (fitted.current || size.width === 0 || !("fov" in camera)) return;
    fitted.current = true;
    const halfVertical = (camera.fov * Math.PI) / 360;
    const halfHorizontal = Math.atan(Math.tan(halfVertical) * (size.width / size.height));
    const needed = (GLOBE_RADIUS * 1.2) / Math.sin(Math.min(halfVertical, halfHorizontal));
    if (needed > camera.position.length()) camera.position.setLength(needed);
  }, [camera, size]);

  useEffect(() => {
    if (focus) flight.current = { normal: focus.normal.clone(), distance: focus.distance * portrait };
    // Only a new request starts a flight; turning the screen should not restart the last one.
  }, [focus]);

  useFrame((_, delta) => {
    let target: Vector3 | null = null;
    let wantDistance: number | null = null;

    if (flight.current) {
      target = flight.current.normal;
      wantDistance = flight.current.distance;
    } else if (followShip) {
      shipAt(progressRef.current, followNormal, followHeading);
      target = followNormal;
    }

    if (target) {
      const distance = camera.position.length();
      cameraDirection.copy(camera.position).divideScalar(distance);
      // Straight across the globe there is no single shortest way round, so pick one.
      if (cameraDirection.dot(target) < -0.97) cameraDirection.applyAxisAngle(NUDGE_AXIS, 0.2);

      const ease = 1 - Math.exp(-delta * 3.4);
      cameraDirection.lerp(target, ease).normalize();
      const nextDistance = wantDistance === null ? distance : distance + (wantDistance - distance) * ease;
      camera.position.copy(cameraDirection).multiplyScalar(nextDistance);

      if (flight.current && cameraDirection.angleTo(target) < 0.006 && Math.abs(nextDistance - flight.current.distance) < 0.04) {
        flight.current = null;
      }
    }

    controls.current?.update();
  });

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.55}
      zoomSpeed={0.8}
      minDistance={GLOBE_RADIUS + 1.15}
      maxDistance={40}
      autoRotate={autoRotate}
      autoRotateSpeed={0.4}
      onStart={() => {
        flight.current = null;
        onInteract();
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Voyage clock                                                         */
/* ------------------------------------------------------------------ */

/** Advances the ship while playing, and tells the page where it is a few times a second. */
function VoyageClock({ playing, voyageSeconds, progressRef, onProgress, onVoyageEnd }: Pick<SceneProps, "playing" | "voyageSeconds" | "progressRef" | "onProgress" | "onVoyageEnd">) {
  const sinceReport = useRef(0);

  useFrame((_, delta) => {
    if (!playing) return;
    const next = Math.min(1, progressRef.current + Math.min(delta, 0.1) / voyageSeconds);
    progressRef.current = next;
    sinceReport.current += delta;
    if (sinceReport.current > 0.12 || next >= 1) {
      sinceReport.current = 0;
      onProgress(next);
    }
    if (next >= 1) onVoyageEnd();
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

function World(props: SceneProps) {
  const { selection, onSelect, showCourse, showPoneglyphs, showLabels, progressRef } = props;
  const [hovered, setHovered] = useState<Sited<MapLocation> | Sited<Poneglyph> | null>(null);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    gl.domElement.style.cursor = hovered ? "pointer" : "grab";
  }, [gl, hovered]);

  const handlers: PickHandlers = useMemo(() => ({ onSelect, onHover: setHovered }), [onSelect]);

  const selected =
    selection?.kind === "location"
      ? SITE_BY_ID.get(selection.id)
      : selection?.kind === "poneglyph"
        ? STONES.find((stone) => stone.item.id === selection.id)
        : undefined;

  return (
    <>
      <color attach="background" args={["#020a13"]} />
      <ambientLight intensity={0.85} />
      <hemisphereLight args={["#cfe9ff", "#0a2238", 0.7]} />
      <directionalLight position={SUN_DIRECTION.clone().multiplyScalar(30)} intensity={2.6} />
      <Stars radius={110} depth={50} count={3500} factor={3.2} saturation={0.2} fade speed={0.5} />

      <Ocean onClickSea={() => onSelect(null)} />

      <Suspense fallback={null}>
        <RedLine />
        <Islands {...handlers} />
        <Ship progressRef={progressRef} />
      </Suspense>

      <Markers {...handlers} />
      {showPoneglyphs ? <Stones {...handlers} /> : null}
      {showCourse ? <Course progressRef={progressRef} /> : null}

      <Labels layerRef={props.labelLayerRef} show={showLabels} hovered={hovered} />

      {selected ? <SelectionRing normal={selected.normal} /> : null}

      <VoyageClock
        playing={props.playing}
        voyageSeconds={props.voyageSeconds}
        progressRef={progressRef}
        onProgress={props.onProgress}
        onVoyageEnd={props.onVoyageEnd}
      />
      <CameraRig
        focus={props.focus}
        followShip={props.followShip}
        autoRotate={props.autoRotate}
        progressRef={progressRef}
        onInteract={props.onInteract}
      />
    </>
  );
}

/** The WebGL canvas for the 3D World Map. Loaded only in the browser. */
export default function World3DCanvas(props: SceneProps) {
  return (
    <Canvas
      camera={{ position: [4.6, 5.2, 18.4], fov: 38, near: 0.1, far: 400 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      className="!absolute inset-0 touch-none"
    >
      <World {...props} />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URLS.redLine);
useGLTF.preload(MODEL_URLS.islands);
useGLTF.preload(MODEL_URLS.ship);
