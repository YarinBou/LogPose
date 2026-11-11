"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import { Globe, Maximize, Search, X, ZoomIn, ZoomOut } from "lucide-react";
import { DoskoiPandaMark } from "@/components/art/Sprites";
import { LocationDetails, PoneglyphDetails } from "@/components/map/LocationDetails";
import { MapBase } from "@/components/map/MapBase";
import {
  LAUGH_TALE_POINT,
  MAP_HEIGHT,
  MAP_WIDTH,
  mapX,
  mapY,
  REGION_BOXES,
  ROUTES,
} from "@/components/map/projection";
import { SectionHeading } from "@/components/SectionHeading";
import {
  LOCATIONS,
  PONEGLYPHS,
  regionName,
  REGIONS,
  type MapLocation,
  type RegionId,
} from "@/data/map";
import { FOCUS_LOCATION_EVENT, type FocusLocationDetail } from "@/lib/events";
import { PLACE_COUNT } from "@/lib/site";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* View maths                                                           */
/* ------------------------------------------------------------------ */

/** Centre of the viewport in drawing units, and zoom relative to "whole map fits". */
interface View {
  cx: number;
  cy: number;
  zoom: number;
}

interface Size {
  width: number;
  height: number;
}

/** Most pixels one drawing unit may cover: enough to pull Totto Land's 34 islands apart. */
const MAX_SCALE = 13;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Pixels per drawing unit when the whole map just fits the frame. */
function fitScale(size: Size): number {
  return Math.min(size.width / MAP_WIDTH, size.height / MAP_HEIGHT);
}

/** Zoom at which the map fills the frame with no empty margin. */
function coverZoom(size: Size): number {
  return Math.max(size.width / MAP_WIDTH, size.height / MAP_HEIGHT) / fitScale(size);
}

/** Keep zoom in range and stop the viewport from sliding off the map. */
function clampView(view: View, size: Size): View {
  const fit = fitScale(size);
  const zoom = clamp(view.zoom, 1, MAX_SCALE / fit);
  const scale = fit * zoom;
  const halfW = size.width / (2 * scale);
  const halfH = size.height / (2 * scale);
  return {
    zoom,
    cx: halfW * 2 >= MAP_WIDTH ? MAP_WIDTH / 2 : clamp(view.cx, halfW, MAP_WIDTH - halfW),
    cy: halfH * 2 >= MAP_HEIGHT ? MAP_HEIGHT / 2 : clamp(view.cy, halfH, MAP_HEIGHT - halfH),
  };
}

/* ------------------------------------------------------------------ */
/* Static projections of the data                                       */
/* ------------------------------------------------------------------ */

interface Placed extends MapLocation {
  px: number;
  py: number;
}

const PLACED: Placed[] = LOCATIONS.map((location) => ({
  ...location,
  px: mapX(location.x),
  py: mapY(location.y),
}));

const PLACED_BY_ID = new Map(PLACED.map((location) => [location.id, location]));

const PLACED_PONEGLYPHS = PONEGLYPHS.map((stone) => ({ ...stone, px: mapX(stone.x), py: mapY(stone.y) }));

const LABEL_PX: Record<1 | 2 | 3, number> = { 1: 12.5, 2: 11, 3: 10 };
const DOT_PX: Record<1 | 2 | 3, number> = { 1: 4.6, 2: 3.3, 3: 2.5 };

type LabelSide = "right" | "left";

/**
 * Decide which names fit. Landmarks go first, then notable places, then minor ones as the
 * zoom allows. A name is placed to the right of its dot, or to the left if that is taken,
 * and dropped if both spots collide with a name already placed. Positions are worked out in
 * screen pixels, which depend on the scale but not on where the map is panned.
 */
function chooseLabels(scale: number, visible: Placed[]): Map<string, LabelSide> {
  const chosen = new Map<string, LabelSide>();
  const boxes: [number, number, number, number][] = [];

  const candidates = visible
    .filter((l) => l.tier === 1 || (l.tier === 2 && scale >= 1) || (l.tier === 3 && scale >= 2.2))
    .sort((a, b) => a.tier - b.tier);

  for (const location of candidates) {
    const font = LABEL_PX[location.tier];
    const width = location.name.length * font * 0.56 + 6;
    const height = font + 3;
    const sx = location.px * scale;
    const top = location.py * scale - height / 2;
    const gap = DOT_PX[location.tier] + 4;

    for (const side of ["right", "left"] as const) {
      const left = side === "right" ? sx + gap : sx - gap - width;
      const hit = boxes.some(([bx, by, bw, bh]) => left < bx + bw && left + width > bx && top < by + bh && top + height > by);
      if (!hit) {
        boxes.push([left, top, width, height]);
        chosen.set(location.id, side);
        break;
      }
    }
  }
  return chosen;
}

/* ------------------------------------------------------------------ */
/* Marker layer                                                         */
/* ------------------------------------------------------------------ */

interface HoverInfo {
  name: string;
  px: number;
  py: number;
}

type Selection = { kind: "location"; id: string } | { kind: "poneglyph"; id: string } | null;

interface MapLayersProps {
  scale: number;
  region: RegionId | "all";
  showRoute: boolean;
  showPoneglyphs: boolean;
  showFactions: boolean;
  onHover: (info: HoverInfo | null) => void;
  onSelect: (selection: Selection) => void;
}

/**
 * Routes, markers and names. Everything is sized in screen pixels divided by the scale, so
 * dots and text stay the same size on screen while the chart underneath grows. Memoised:
 * panning only moves the parent group and never re-renders this layer.
 */
const MapLayers = memo(function MapLayers({
  scale,
  region,
  showRoute,
  showPoneglyphs,
  showFactions,
  onHover,
  onSelect,
}: MapLayersProps) {
  const visible = useMemo(() => PLACED.filter((l) => showFactions || !l.faction), [showFactions]);
  const labelPool = useMemo(
    () => (region === "all" ? visible : visible.filter((l) => l.region === region)),
    [visible, region],
  );
  const labels = useMemo(() => chooseLabels(scale, labelPool), [scale, labelPool]);
  const u = 1 / scale;

  return (
    <g>
      {showRoute ? (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={ROUTES.summitWar} stroke="#f29ad0" strokeWidth={1.4} strokeDasharray="2 5" vectorEffect="non-scaling-stroke" opacity={0.85} />
          <path d={ROUTES.toLaughTale} stroke="#f6dc8b" strokeWidth={1.4} strokeDasharray="1 7" vectorEffect="non-scaling-stroke" opacity={0.7} />
          {[ROUTES.paradise, ROUTES.newWorld].map((d) => (
            <g key={d}>
              <path d={d} stroke="rgba(3,21,35,0.7)" strokeWidth={4.5} vectorEffect="non-scaling-stroke" />
              <path d={d} stroke="#ecc14f" strokeWidth={2} strokeDasharray="8 6" vectorEffect="non-scaling-stroke" className="route-march" />
            </g>
          ))}
          <g transform={`translate(${LAUGH_TALE_POINT[0]} ${LAUGH_TALE_POINT[1]})`}>
            <circle r={8 * u} fill="rgba(3,21,35,0.75)" stroke="#f6dc8b" strokeWidth={1.2 * u} strokeDasharray={`${2 * u} ${2 * u}`} />
            <text textAnchor="middle" y={4 * u} fontSize={11 * u} fontFamily="var(--font-display)" fill="#f6dc8b">
              ?
            </text>
          </g>
        </g>
      ) : null}

      {showPoneglyphs
        ? PLACED_PONEGLYPHS.map((stone) => (
            <g
              key={stone.id}
              transform={`translate(${stone.px} ${stone.py})`}
              data-marker=""
              className="cursor-pointer"
              onPointerEnter={() => onHover({ name: stone.name, px: stone.px, py: stone.py })}
              onPointerLeave={() => onHover(null)}
              onClick={() => onSelect({ kind: "poneglyph", id: stone.id })}
            >
              <rect x={-8 * u} y={-8 * u} width={16 * u} height={16 * u} fill="transparent" />
              <rect
                x={-3.6 * u}
                y={-3.6 * u}
                width={7.2 * u}
                height={7.2 * u}
                fill={stone.road ? "#cf4034" : "#3f4a5c"}
                stroke="#fbf4e1"
                strokeWidth={0.9 * u}
              />
            </g>
          ))
        : null}

      {visible.map((location) => {
        const dimmed = region !== "all" && location.region !== region;
        const r = DOT_PX[location.tier] * u;
        const side = labels.get(location.id);
        const font = LABEL_PX[location.tier] * u;
        const fill = location.tier === 1 ? "#ecc14f" : location.tier === 2 ? "#fbf4e1" : "#a9dcea";

        return (
          <g
            key={location.id}
            transform={`translate(${location.px} ${location.py})`}
            data-marker=""
            opacity={dimmed ? 0.2 : 1}
            className="cursor-pointer"
            onPointerEnter={() => onHover({ name: location.name, px: location.px, py: location.py })}
            onPointerLeave={() => onHover(null)}
            onClick={() => onSelect({ kind: "location", id: location.id })}
          >
            <circle r={9 * u} fill="transparent" />
            {location.faction ? (
              <rect x={-r} y={-r} width={r * 2} height={r * 2} transform="rotate(45)" fill="#cf4034" stroke="#fbf4e1" strokeWidth={0.8 * u} />
            ) : (
              <circle
                r={r}
                fill={location.unplaced ? "rgba(3,21,35,0.55)" : fill}
                stroke={location.unplaced ? fill : "#031523"}
                strokeWidth={(location.unplaced ? 1.1 : 0.9) * u}
                strokeDasharray={location.unplaced ? `${1.6 * u} ${1.2 * u}` : undefined}
              />
            )}
            {location.destroyed ? (
              <path
                d={`M${-r * 1.5} ${-r * 1.5}L${r * 1.5} ${r * 1.5}M${r * 1.5} ${-r * 1.5}L${-r * 1.5} ${r * 1.5}`}
                stroke="#cf4034"
                strokeWidth={1.3 * u}
                strokeLinecap="round"
              />
            ) : null}
            {side ? (
              <text
                x={(side === "right" ? 1 : -1) * (DOT_PX[location.tier] + 4) * u}
                y={font * 0.34}
                textAnchor={side === "right" ? "start" : "end"}
                fontSize={font}
                fontFamily="var(--font-sans)"
                fontWeight={location.tier === 1 ? 700 : 500}
                fill={location.tier === 1 ? "#fbeab0" : "#f4e6c3"}
                stroke="#031523"
                strokeWidth={3 * u}
                strokeLinejoin="round"
                paintOrder="stroke"
                className="pointer-events-none select-none"
              >
                {location.name}
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
});

/* ------------------------------------------------------------------ */
/* The map                                                              */
/* ------------------------------------------------------------------ */

const REGION_CHIPS: (RegionId | "all")[] = [
  "all",
  "east-blue",
  "north-blue",
  "west-blue",
  "south-blue",
  "paradise",
  "new-world",
  "red-line",
  "calm-belt",
  "sky",
];

const INITIAL_VIEW: View = { cx: MAP_WIDTH / 2, cy: MAP_HEIGHT / 2, zoom: 1 };

export function WorldMap() {
  const frameRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [view, setView] = useState<View>(INITIAL_VIEW);
  const [gliding, setGliding] = useState(true);
  const [region, setRegion] = useState<RegionId | "all">("all");
  const [selection, setSelection] = useState<Selection>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [showRoute, setShowRoute] = useState(true);
  const [showPoneglyphs, setShowPoneglyphs] = useState(true);
  const [showFactions, setShowFactions] = useState(false);
  const [query, setQuery] = useState("");

  // Mirrors of state for handlers that are attached once (wheel, window events).
  const sizeRef = useRef(size);
  const viewRef = useRef(view);
  sizeRef.current = size;
  viewRef.current = view;

  const drag = useRef<{ x: number; y: number; view: View; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const initialised = useRef(false);

  /* -- measure the frame; open on a view that fills it -- */
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      const next = { width: frame.clientWidth, height: frame.clientHeight };
      if (next.width === 0 || next.height === 0) return;
      setSize(next);
      setView((current) => {
        if (!initialised.current) {
          initialised.current = true;
          return clampView({ ...INITIAL_VIEW, zoom: coverZoom(next) }, next);
        }
        return clampView(current, next);
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const ready = size.width > 0;
  const fit = ready ? fitScale(size) : 1;
  const scale = fit * view.zoom;
  const translateX = size.width / 2 - view.cx * scale;
  const translateY = size.height / 2 - view.cy * scale;

  /* -- moving the view -- */
  const glideTo = useCallback((next: View) => {
    setGliding(true);
    setView(clampView(next, sizeRef.current));
  }, []);

  const zoomBy = useCallback(
    (factor: number) => {
      const current = viewRef.current;
      glideTo({ ...current, zoom: current.zoom * factor });
    },
    [glideTo],
  );

  const showWholeWorld = useCallback(() => {
    setRegion("all");
    glideTo({ ...INITIAL_VIEW, zoom: coverZoom(sizeRef.current) });
  }, [glideTo]);

  const focusRegion = useCallback(
    (next: RegionId | "all") => {
      setRegion(next);
      const box = next === "all" ? undefined : REGION_BOXES[next];
      const current = sizeRef.current;
      if (!box) {
        glideTo({ ...INITIAL_VIEW, zoom: coverZoom(current) });
        return;
      }
      const base = fitScale(current);
      const zoom = Math.min(current.width / (box.width * base), current.height / (box.height * base)) * 0.94;
      glideTo({ cx: box.x + box.width / 2, cy: box.y + box.height / 2, zoom });
    },
    [glideTo],
  );

  const focusLocation = useCallback(
    (id: string) => {
      const location = PLACED_BY_ID.get(id);
      if (!location) return;
      setSelection({ kind: "location", id });
      setRegion("all");
      const base = fitScale(sizeRef.current);
      // Close enough to read the neighbours, and never zoom out from where the reader already is.
      const zoom = Math.max(viewRef.current.zoom, (location.tier === 3 ? 6.5 : 4.2) / base);
      glideTo({ cx: location.px, cy: location.py, zoom });
    },
    [glideTo],
  );

  /* -- timeline cards can ask for a location -- */
  useEffect(() => {
    const onFocus = (event: Event) => {
      const detail = (event as CustomEvent<FocusLocationDetail>).detail;
      if (detail?.locationId) focusLocation(detail.locationId);
    };
    window.addEventListener(FOCUS_LOCATION_EVENT, onFocus);
    return () => window.removeEventListener(FOCUS_LOCATION_EVENT, onFocus);
  }, [focusLocation]);

  /* -- Ctrl + wheel (and trackpad pinch) zooms about the pointer -- */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let settle = 0;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const currentSize = sizeRef.current;
      const current = viewRef.current;
      const box = svg.getBoundingClientRect();
      const base = fitScale(currentSize);
      const oldScale = base * current.zoom;
      const zoom = clamp(current.zoom * Math.exp(-event.deltaY * 0.012), 1, MAX_SCALE / base);
      const newScale = base * zoom;
      // Keep the chart point under the pointer where it is.
      const offsetX = event.clientX - box.left - currentSize.width / 2;
      const offsetY = event.clientY - box.top - currentSize.height / 2;
      const cx = current.cx + offsetX / oldScale - offsetX / newScale;
      const cy = current.cy + offsetY / oldScale - offsetY / newScale;
      setGliding(false);
      setView(clampView({ cx, cy, zoom }, currentSize));
      window.clearTimeout(settle);
      settle = window.setTimeout(() => setGliding(true), 180);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      svg.removeEventListener("wheel", onWheel);
      window.clearTimeout(settle);
    };
  }, [ready]);

  /* -- drag to pan -- */
  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY, view: viewRef.current, moved: false };
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.moved) {
      if (Math.hypot(dx, dy) < 5) return;
      start.moved = true;
      setGliding(false);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const currentScale = fitScale(sizeRef.current) * start.view.zoom;
    setView(clampView({ ...start.view, cx: start.view.cx - dx / currentScale, cy: start.view.cy - dy / currentScale }, sizeRef.current));
  }

  function handlePointerUp() {
    if (drag.current?.moved) {
      // The click that follows a drag must not select whatever is under the pointer.
      suppressClick.current = true;
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 0);
      setGliding(true);
    }
    drag.current = null;
  }

  const handleSelect = useCallback((next: Selection) => {
    if (suppressClick.current) return;
    setSelection(next);
  }, []);

  const handleHover = useCallback((info: HoverInfo | null) => {
    if (drag.current?.moved) return;
    setHover(info);
  }, []);

  /* -- derived -- */
  const selectedLocation = selection?.kind === "location" ? PLACED_BY_ID.get(selection.id) : undefined;
  const selectedStone = selection?.kind === "poneglyph" ? PLACED_PONEGLYPHS.find((s) => s.id === selection.id) : undefined;
  const selectedPoint = selectedLocation ?? selectedStone;

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];
    return LOCATIONS.filter((l) => l.name.toLowerCase().includes(needle) || l.pois.some((p) => p.toLowerCase().includes(needle)))
      .sort((a, b) => a.tier - b.tier)
      .slice(0, 8);
  }, [query]);

  const regionPlaces = useMemo(() => {
    const pool = region === "all" ? LOCATIONS.filter((l) => l.tier === 1) : LOCATIONS.filter((l) => l.region === region && !l.faction);
    return [...pool].sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
  }, [region]);

  const regionInfo = region === "all" ? undefined : REGIONS.find((r) => r.id === region);
  const u = 1 / scale;
  const canPanVertically = ready && view.zoom > coverZoom(size) + 0.02;

  return (
    <section id="map" className="relative z-10 scroll-mt-14 px-3 pb-28 pt-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeading kicker="Cartography" title="The World Map">
          The Red Line and the Grand Line cut the world into four Blues. {PLACE_COUNT} places from the Library of
          Ohara&apos;s map are charted here, with the Straw Hats&apos; course drawn across them.
        </SectionHeading>

        <p className="mt-5 text-center">
          <Link
            href="/3d-world-map"
            className="inline-flex items-center gap-2 rounded-full border border-gold-500/60 bg-ocean-950/60 px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-parchment-100 backdrop-blur-sm transition-colors hover:border-gold-300 hover:text-gold-300"
          >
            <Globe className="h-4 w-4" />
            See it as a globe: 3D World Map
          </Link>{" "}
          <Link
            href="/locations"
            className="inline-flex items-center gap-2 rounded-full border border-gold-500/60 bg-ocean-950/60 px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-parchment-100 backdrop-blur-sm transition-colors hover:border-gold-300 hover:text-gold-300"
          >
            All locations as a list
          </Link>
        </p>

        <div className="wood gold-trim mt-10 rounded-xl p-2.5 sm:p-4">
          {/* toolbar */}
          <div className="flex flex-col gap-3 pb-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Sea">
              {REGION_CHIPS.map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={region === id}
                  onClick={() => focusRegion(id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors",
                    region === id
                      ? "border-gold-300 bg-gold-400 text-ink-900"
                      : "border-gold-600/50 bg-black/25 text-parchment-100 hover:border-gold-300 hover:text-gold-300",
                  )}
                >
                  {id === "all" ? "Whole world" : regionName(id)}
                </button>
              ))}
            </div>

            <div className="relative w-full shrink-0 lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find an island or town"
                aria-label="Find a place on the map"
                className="w-full rounded-full border border-gold-600/60 bg-parchment-100 py-1.5 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-300"
              />
              {results.length > 0 ? (
                <ul className="parchment absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-md">
                  {results.map((result) => (
                    <li key={result.id}>
                      <button
                        type="button"
                        onClick={() => {
                          focusLocation(result.id);
                          setQuery("");
                        }}
                        className="flex w-full items-baseline justify-between gap-3 px-3 py-1.5 text-left text-sm hover:bg-gold-400/30"
                      >
                        <span className="font-semibold text-ink-900">{result.name}</span>
                        <span className="shrink-0 text-[11px] uppercase tracking-[0.1em] text-ink-500">{regionName(result.region)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
            {/* chart */}
            <div
              ref={frameRef}
              className="relative h-[58vh] max-h-[680px] min-h-[360px] overflow-hidden rounded-md bg-ocean-900 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.5)]"
            >
              {ready ? (
                <svg
                  ref={svgRef}
                  width={size.width}
                  height={size.height}
                  viewBox={`0 0 ${size.width} ${size.height}`}
                  role="img"
                  aria-label="Abstract map of the One Piece world. Use the search box or the list of places to explore it without a pointer."
                  className={cn("block select-none", drag.current?.moved ? "cursor-grabbing" : "cursor-grab")}
                  style={{ touchAction: canPanVertically ? "none" : "pan-y" }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onDoubleClick={() => zoomBy(1.8)}
                  onClick={(event) => {
                    // A click on open sea clears the selection; a click that ends a drag does not.
                    if (suppressClick.current) return;
                    if (!(event.target as Element).closest("[data-marker]")) setSelection(null);
                  }}
                >
                  <g
                    style={{
                      transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                      transformOrigin: "0 0",
                      transition: gliding ? "transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1)" : "none",
                    }}
                  >
                    <MapBase />
                    <MapLayers
                      scale={scale}
                      region={region}
                      showRoute={showRoute}
                      showPoneglyphs={showPoneglyphs}
                      showFactions={showFactions}
                      onHover={handleHover}
                      onSelect={handleSelect}
                    />

                    {selectedPoint ? (
                      <g transform={`translate(${selectedPoint.px} ${selectedPoint.py})`} className="pointer-events-none">
                        <circle r={11 * u} fill="none" stroke="#fbeab0" strokeWidth={2 * u} />
                        <circle r={11 * u} fill="none" stroke="#fbeab0" strokeWidth={1.5 * u} opacity="0.7">
                          <animate attributeName="r" from={11 * u} to={24 * u} dur="1.6s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.7" to="0" dur="1.6s" repeatCount="indefinite" />
                        </circle>
                      </g>
                    ) : null}

                    {hover ? (
                      <text
                        x={hover.px}
                        y={hover.py - 12 * u}
                        textAnchor="middle"
                        fontSize={13 * u}
                        fontFamily="var(--font-sans)"
                        fontWeight={700}
                        fill="#ffffff"
                        stroke="#031523"
                        strokeWidth={4 * u}
                        strokeLinejoin="round"
                        paintOrder="stroke"
                        className="pointer-events-none select-none"
                      >
                        {hover.name}
                      </text>
                    ) : null}
                  </g>
                </svg>
              ) : (
                <div className="grid h-full place-items-center">
                  <div className="flex flex-col items-center gap-3 text-parchment-100">
                    <DoskoiPandaMark className="animate-spin-slow h-14 w-14" />
                    <p className="font-display text-xl">Unrolling the chart</p>
                  </div>
                </div>
              )}

              {/* layer switches */}
              <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
                {[
                  { label: "Course", on: showRoute, set: setShowRoute },
                  { label: "Poneglyphs", on: showPoneglyphs, set: setShowPoneglyphs },
                  { label: "Crews", on: showFactions, set: setShowFactions },
                ].map((layer) => (
                  <button
                    key={layer.label}
                    type="button"
                    aria-pressed={layer.on}
                    onClick={() => layer.set((value) => !value)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] backdrop-blur-sm transition-colors",
                      layer.on
                        ? "border-gold-300 bg-ocean-950/80 text-gold-300"
                        : "border-parchment-100/30 bg-ocean-950/60 text-parchment-100/60",
                    )}
                  >
                    {layer.label}
                  </button>
                ))}
              </div>

              {/* zoom */}
              <div className="absolute bottom-2 right-2 flex flex-col overflow-hidden rounded-md border border-gold-600/70 bg-ocean-950/85 text-parchment-100 backdrop-blur-sm">
                <button type="button" onClick={() => zoomBy(1.7)} aria-label="Zoom in" className="p-2 hover:bg-gold-400 hover:text-ink-900">
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => zoomBy(1 / 1.7)} aria-label="Zoom out" className="border-y border-gold-600/50 p-2 hover:bg-gold-400 hover:text-ink-900">
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button type="button" onClick={showWholeWorld} aria-label="Show the whole world" className="p-2 hover:bg-gold-400 hover:text-ink-900">
                  <Maximize className="h-4 w-4" />
                </button>
              </div>

              {/* legend */}
              <ul className="absolute bottom-2 left-2 hidden max-w-[70%] flex-wrap gap-x-3 gap-y-1 rounded-md bg-ocean-950/75 px-2.5 py-1.5 text-[10.5px] text-parchment-100 backdrop-blur-sm sm:flex">
                <li className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-gold-400" />
                  Story landmark
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full border border-dashed border-parchment-100" />
                  Position unconfirmed
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-redline-400 ring-1 ring-parchment-100" />
                  Road Poneglyph
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-0 w-5 border-t-2 border-dashed border-gold-400" />
                  Straw Hats&apos; course
                </li>
                <li className="text-parchment-100/60">Drag to pan · Ctrl + scroll to zoom</li>
              </ul>
            </div>

            {/* side panel */}
            <aside className="parchment flex max-h-[680px] min-h-[220px] flex-col rounded-md p-4 lg:h-[58vh]" aria-live="polite">
              {selectedLocation || selectedStone ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  <button
                    type="button"
                    onClick={() => setSelection(null)}
                    className="mb-2 inline-flex items-center gap-1 self-end text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500 hover:text-ink-900"
                  >
                    <X className="h-3.5 w-3.5" />
                    Close
                  </button>
                  <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                    {selectedLocation ? <LocationDetails location={selectedLocation} /> : null}
                    {selectedStone ? <PoneglyphDetails stone={selectedStone} /> : null}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">
                    {regionInfo ? `${regionPlaces.length} places` : "Ports of call"}
                  </p>
                  <h3 className="mt-0.5 font-display text-3xl leading-none text-ink-900">{regionInfo ? regionInfo.name : "The voyage"}</h3>
                  <p className="mt-1.5 text-sm leading-snug text-ink-700">
                    {regionInfo
                      ? regionInfo.blurb
                      : "Pick a marker, or one of the landmarks below. Choose a sea above to zoom in and list every place in it."}
                  </p>
                  <ul className="mt-3 min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
                    {regionPlaces.map((place) => (
                      <li key={place.id}>
                        <button
                          type="button"
                          onClick={() => focusLocation(place.id)}
                          className="flex w-full items-baseline justify-between gap-2 rounded-sm px-1.5 py-1 text-left hover:bg-gold-400/30"
                        >
                          <span className={cn("text-sm text-ink-900", place.tier === 1 && "font-semibold")}>{place.name}</span>
                          {place.pois.length > 0 ? (
                            <span className="shrink-0 text-[11px] text-ink-500">{place.pois.length} sites</span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
