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
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { Globe, Maximize, Search, ZoomIn, ZoomOut } from "lucide-react";
import { DoskoiPandaMark } from "@/components/art/Sprites";
import {
  hasFoam,
  ISLAND_VIEWBOX,
  IslandDefs,
  IslandFoam,
  IslandLand,
  islandLook,
  VisitedPennant,
  type IslandLook,
} from "@/components/map/islands";
import { LocationPopover, LocationSheet, subjectKey, type PanelSubject } from "@/components/map/LocationPanel";
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
  type Tier,
} from "@/data/map";
import { arcsAtLocation } from "@/data/timeline";
import { FOCUS_LOCATION_EVENT, type FocusLocationDetail } from "@/lib/events";
import { useMediaQuery } from "@/lib/hooks";
import { PLACE_COUNT } from "@/lib/site";
import { cn, seededUnit } from "@/lib/utils";

/*
 * How the chart is put together, and why.
 *
 * The chart is not one big SVG. It is a stack of separate elements inside one wrapper:
 *
 *   wrapper (HTML, 1400 x 900, moved and scaled with a CSS transform)
 *     the base chart      one <svg>, drawn once
 *     the course          one <svg>
 *     every island        its own small element, each with its own little <svg>
 *     Poneglyphs, the selection ring, the hover name
 *
 * Panning and zooming change only the wrapper's transform, which the browser applies to an
 * already-drawn picture on the GPU: nothing is redrawn while the map moves. Each island
 * being an element of its own means its idle bob, its foam, its hover and its selection
 * are transforms and opacity on that element alone, which the GPU also handles without
 * redrawing. With everything in one SVG, every one of those frames redrew the whole chart.
 *
 * Islands are positioned in chart units and then scaled back down by the inverse of the
 * zoom (--u), so inside an island everything is in plain screen pixels.
 */

/* ------------------------------------------------------------------ */
/* View maths                                                           */
/* ------------------------------------------------------------------ */

/** Centre of the viewport in chart units, and zoom relative to "whole map fits". */
interface View {
  cx: number;
  cy: number;
  zoom: number;
}

interface Size {
  width: number;
  height: number;
}

/** Most pixels one chart unit may cover: enough to pull Totto Land's 34 islands apart. */
const MAX_SCALE = 13;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Pixels per chart unit when the whole map just fits the frame. */
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
  /** Outline, colours and drawing for this island, worked out once. */
  look: IslandLook;
  /** The crew calls here on the timeline. */
  visited: boolean;
  /** Where in the idle cycle this island starts, 0..1. Fixed per island. */
  phase: number;
}

const PLACED: Placed[] = LOCATIONS.map((location) => ({
  ...location,
  px: mapX(location.x),
  py: mapY(location.y),
  look: islandLook(location),
  visited: arcsAtLocation(location.id).length > 0,
  phase: Number(seededUnit(location.id, 31).toFixed(3)),
}));

const PLACED_BY_ID = new Map(PLACED.map((location) => [location.id, location]));

const PLACED_PONEGLYPHS = PONEGLYPHS.map((stone) => ({ ...stone, px: mapX(stone.x), py: mapY(stone.y) }));

/** Island radius on screen, in pixels, with the whole world in view. Mirrored in globals.css. */
const ISLE_PX: Record<Tier, number> = { 1: 10, 2: 6.6, 3: 4 };
/** Name size per tier, in pixels. Mirrored in globals.css. */
const LABEL_PX: Record<Tier, number> = { 1: 15.5, 2: 13, 3: 11.5 };

/**
 * Islands grow as the chart is zoomed in, but more slowly than the chart itself: they are
 * symbols, not land to scale, so a close view shows bigger drawings with more sea between.
 */
function zoomBoost(scale: number): number {
  return clamp(Math.sqrt(scale), 1, 2.6);
}

function isleRadius(tier: Tier, scale: number): number {
  return ISLE_PX[tier] * zoomBoost(scale);
}

type LabelSide = "right" | "left";

/**
 * Decide which names fit. Landmarks go first and are always tried; notable places join as
 * the chart is zoomed in, and minor ones only close up. A name is placed to the right of
 * its island, or to the left if that is taken, and dropped if both spots collide with a
 * name already placed. Positions are worked out in screen pixels, which depend on the
 * scale but not on where the map is panned.
 */
function chooseLabels(scale: number, visible: Placed[]): Map<string, LabelSide> {
  const chosen = new Map<string, LabelSide>();
  const boxes: [number, number, number, number][] = [];

  const candidates = visible
    .filter((l) => l.tier === 1 || (l.tier === 2 && scale >= 1) || (l.tier === 3 && scale >= 2.2))
    .sort((a, b) => a.tier - b.tier);

  for (const location of candidates) {
    const font = LABEL_PX[location.tier];
    // The display face is narrow: about 0.47 of its size per character.
    const width = location.name.length * font * 0.47 + 8;
    const height = font + 2;
    const sx = location.px * scale;
    const top = location.py * scale - height / 2;
    const gap = isleRadius(location.tier, scale) + 5;

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
  /** Tier of the island under the pointer, or undefined for a Poneglyph. */
  tier?: Tier;
}

type Selection = { kind: "location"; id: string } | { kind: "poneglyph"; id: string } | null;

interface IslandProps {
  site: Placed;
  /** Which side the name goes on, or undefined when there is no room for it. */
  side: LabelSide | undefined;
  dimmed: boolean;
  selected: boolean;
  onHover: (info: HoverInfo | null) => void;
  onSelect: (selection: Selection) => void;
}

/**
 * One island on the chart: a hit area, the drawing, and its name.
 *
 * It takes no zoom: its size comes from CSS variables on the chart wrapper, so zooming
 * re-renders an island only if its name appears or disappears. And it is memoised, so
 * selecting an island re-renders that island and the one let go, not the other 277.
 */
const Island = memo(function Island({ site, side, dimmed, selected, onHover, onSelect }: IslandProps) {
  return (
    <div
      data-marker=""
      data-tier={site.tier}
      className={cn("isle", site.tier === 1 && "isle-landmark", selected && "is-selected", dimmed && "is-dimmed")}
      // Each island idles at its own point in the cycle, so no two move in step.
      style={{ left: site.px, top: site.py, ["--phase" as string]: site.phase }}
      onPointerEnter={() => onHover({ name: site.name, px: site.px, py: site.py, tier: site.tier })}
      onPointerLeave={() => onHover(null)}
      onClick={() => onSelect({ kind: "location", id: site.id })}
    >
      {/* generous hit area: never smaller than a fingertip-sized target */}
      <span className="isle-hit" />

      {site.faction ? (
        <span className="isle-faction" />
      ) : (
        // One wrapper carries the idle bob and another the hover and selection movement,
        // so the two never fight over `transform`.
        <span className="isle-bob">
          <span className="isle-body">
            {hasFoam(site.look, site.unplaced) ? (
              <svg className="isle-art isle-foam" viewBox={ISLAND_VIEWBOX} aria-hidden="true">
                <IslandFoam look={site.look} />
              </svg>
            ) : null}
            <svg className="isle-art" viewBox={ISLAND_VIEWBOX} aria-hidden="true">
              <IslandLand look={site.look} tier={site.tier} destroyed={site.destroyed} unplaced={site.unplaced} />
              {site.visited ? <VisitedPennant /> : null}
            </svg>
          </span>
        </span>
      )}

      {side ? <span className={cn("isle-label", side === "left" && "isle-label-left", site.destroyed && "is-ruin")}>{site.name}</span> : null}
    </div>
  );
});

interface MapLayersProps {
  scale: number;
  region: RegionId | "all";
  showRoute: boolean;
  showPoneglyphs: boolean;
  showFactions: boolean;
  /** Id of the selected location, if a location is selected. */
  selectedId: string | null;
  onHover: (info: HoverInfo | null) => void;
  onSelect: (selection: Selection) => void;
}

/**
 * The course, the islands and the Poneglyphs. Memoised: panning changes none of its props,
 * so it is not re-rendered while the map is dragged. Zooming re-renders it to decide
 * which names fit, but the islands inside are memoised in turn.
 */
const MapLayers = memo(function MapLayers({
  scale,
  region,
  showRoute,
  showPoneglyphs,
  showFactions,
  selectedId,
  onHover,
  onSelect,
}: MapLayersProps) {
  // Small islands come first in the document, so landmarks and their names sit on top.
  const visible = useMemo(
    () => PLACED.filter((l) => showFactions || !l.faction).sort((a, b) => b.tier - a.tier),
    [showFactions],
  );
  const labelPool = useMemo(
    () => (region === "all" ? visible : visible.filter((l) => l.region === region)),
    [visible, region],
  );
  const labels = useMemo(() => chooseLabels(scale, labelPool), [scale, labelPool]);

  return (
    <>
      {showRoute ? (
        <>
          <svg className="map-layer" width={MAP_WIDTH} height={MAP_HEIGHT} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} aria-hidden="true">
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d={ROUTES.summitWar} className="route-detour" stroke="#f29ad0" opacity={0.85} />
              <path d={ROUTES.toLaughTale} className="route-uncharted" stroke="#f6dc8b" opacity={0.7} />
              {[ROUTES.paradise, ROUTES.newWorld].map((d) => (
                <g key={d}>
                  <path d={d} className="route-shadow" stroke="rgba(3,21,35,0.7)" />
                  <path d={d} className="route-line" stroke="#ecc14f" />
                </g>
              ))}
            </g>
          </svg>
          <div className="map-pin" style={{ left: LAUGH_TALE_POINT[0], top: LAUGH_TALE_POINT[1] }} aria-hidden="true">
            <span className="map-unknown">?</span>
          </div>
        </>
      ) : null}

      {visible.map((site) => (
        <Island
          key={site.id}
          site={site}
          side={labels.get(site.id)}
          dimmed={region !== "all" && site.region !== region}
          selected={site.id === selectedId}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}

      {showPoneglyphs
        ? PLACED_PONEGLYPHS.map((stone) => (
            <div
              key={stone.id}
              data-marker=""
              className="map-pin cursor-pointer"
              style={{ left: stone.px, top: stone.py }}
              onPointerEnter={() => onHover({ name: stone.name, px: stone.px, py: stone.py })}
              onPointerLeave={() => onHover(null)}
              onClick={() => onSelect({ kind: "poneglyph", id: stone.id })}
            >
              <span className="map-stone-hit" />
              <span className={cn("map-stone", stone.road && "is-road")} />
            </div>
          ))
        : null}
    </>
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

/** How the map moves when it is sent somewhere (as opposed to dragged): 600ms, ease-in-out. */
const GLIDE_MS = 600;
const GLIDE = `transform ${GLIDE_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`;

/**
 * Where in the frame a selected island should come to rest, as fractions of its width and
 * height. On a wide screen the popover opens to the island's right, so the island sits
 * left of centre. On a phone the sheet covers the lower part of the screen, so it sits high.
 */
const REST_DESKTOP = { x: 0.3, y: 0.5 };
const REST_MOBILE = { x: 0.5, y: 0.27 };

/** Smallest scale (pixels per chart unit) to bring the map to when an island is picked. */
const PICK_SCALE = 2.4;

export function WorldMap() {
  const frameRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isDesktopRef = useRef(isDesktop);
  isDesktopRef.current = isDesktop;
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const reduceMotion = useReducedMotion() ?? false;

  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [view, setView] = useState<View>(INITIAL_VIEW);
  const [gliding, setGliding] = useState(true);
  const [dragging, setDragging] = useState(false);
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
  /** Fingers currently on the chart, by pointer id. */
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ view: View; distance: number; midX: number; midY: number } | null>(null);
  const suppressClick = useRef(false);
  const initialised = useRef(false);
  /** True while a requested glide is under way: see "settled scale" below. */
  const settleLater = useRef(false);

  // Idle motion runs only while someone can see it.
  useEffect(() => {
    const onVisibility = () => setPageVisible(document.visibilityState === "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  /* -- measure the frame; open on a view that fills it -- */
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      const next = { width: frame.clientWidth, height: frame.clientHeight };
      if (next.width === 0 || next.height === 0) return;
      settleLater.current = false;
      setSize(next);
      // Decide outside the updater: React may run an updater again when it re-renders,
      // and by then the flag would say "already opened" and the first view would be lost
      // (the map then opened fully zoomed out, a thin strip on a phone).
      const first = !initialised.current;
      initialised.current = true;
      setView((current) => clampView(first ? { ...INITIAL_VIEW, zoom: coverZoom(next) } : current, next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  /* -- the phone sheet, and the idle motion, step aside while the map is scrolled away -- */
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const ready = size.width > 0;
  const fit = ready ? fitScale(size) : 1;
  const scale = fit * view.zoom;
  const translateX = size.width / 2 - view.cx * scale;
  const translateY = size.height / 2 - view.cy * scale;

  /*
   * The settled scale: the zoom the islands and their names are currently laid out for.
   *
   * Resizing every island and re-deciding which names fit is the one expensive thing the
   * chart does. If it ran when a glide started, the glide would open with a stall. So a
   * glide runs first, entirely on the GPU, with the islands simply growing or shrinking
   * along with the chart; they are laid out for the new zoom once it has arrived. Direct
   * manipulation (wheel, pinch) has no glide to protect and settles at once.
   */
  const [settledScale, setSettledScale] = useState(1);
  useEffect(() => {
    if (!settleLater.current || reduceMotion) {
      settleLater.current = false;
      setSettledScale(scale);
      return;
    }
    const timer = window.setTimeout(() => {
      settleLater.current = false;
      setSettledScale(scale);
    }, GLIDE_MS + 30);
    return () => window.clearTimeout(timer);
  }, [scale, reduceMotion]);

  /*
   * While a glide is under way the chart is marked as travelling, which tells the browser
   * to keep moving the picture it already has rather than redraw it sharper at each new
   * zoom along the way. The redraw happens once, when the mark comes off at the end.
   */
  const [travelling, setTravelling] = useState(false);
  useEffect(() => {
    if (!travelling) return;
    const timer = window.setTimeout(() => setTravelling(false), GLIDE_MS + 30);
    return () => window.clearTimeout(timer);
  }, [travelling, view]);

  /* -- moving the view -- */
  const glideTo = useCallback((next: View) => {
    const clamped = clampView(next, sizeRef.current);
    // Only a glide that changes the zoom has anything to settle afterwards.
    settleLater.current = Math.abs(clamped.zoom - viewRef.current.zoom) > 1e-6;
    setGliding(true);
    setTravelling(true);
    setView(clamped);
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

  /**
   * Bring a chart point to its resting place in the frame (see REST_DESKTOP / REST_MOBILE),
   * at no less than `minScale` pixels per chart unit. Never zooms out.
   */
  const bringIntoView = useCallback(
    (px: number, py: number, minScale: number) => {
      const current = sizeRef.current;
      const base = fitScale(current);
      const zoom = clamp(Math.max(viewRef.current.zoom, minScale / base), 1, MAX_SCALE / base);
      const scaleAfter = base * zoom;
      const rest = isDesktopRef.current ? REST_DESKTOP : REST_MOBILE;
      glideTo({
        cx: px - ((rest.x - 0.5) * current.width) / scaleAfter,
        cy: py - ((rest.y - 0.5) * current.height) / scaleAfter,
        zoom,
      });
      // On a phone the sheet covers the lower screen, so the map itself has to be on screen first.
      if (!isDesktopRef.current) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        frameRef.current?.scrollIntoView({ behavior: reduce ? "instant" : "smooth", block: "start" });
      }
    },
    [glideTo],
  );

  /** Select a place and travel to it. Used by search, the list, timeline cards and links. */
  const focusLocation = useCallback(
    (id: string) => {
      const location = PLACED_BY_ID.get(id);
      if (!location) return;
      setSelection({ kind: "location", id });
      setRegion("all");
      // Close enough to read the neighbours.
      bringIntoView(location.px, location.py, location.tier === 3 ? 6.5 : 4.2);
    },
    [bringIntoView],
  );

  const closePanel = useCallback(() => setSelection(null), []);

  /* -- a link can open the map on a place: /?place=water-seven -- */
  const openedFromLink = useRef(false);
  useEffect(() => {
    if (!ready || openedFromLink.current) return;
    openedFromLink.current = true;
    const place = new URLSearchParams(window.location.search).get("place");
    if (!place || !PLACED_BY_ID.has(place)) return;
    focusLocation(place);
    // The reader arrived by link, so bring the map itself on screen (without animation:
    // there is nothing on screen yet to travel from).
    frameRef.current?.scrollIntoView({ behavior: "instant", block: isDesktopRef.current ? "center" : "start" });
  }, [ready, focusLocation]);

  // Keep the address in step with the selection, so the current island can be shared.
  const selectedId = selection?.kind === "location" ? selection.id : null;
  useEffect(() => {
    if (!openedFromLink.current) return;
    const url = new URL(window.location.href);
    if (selectedId) url.searchParams.set("place", selectedId);
    else url.searchParams.delete("place");
    window.history.replaceState(window.history.state, "", url);
  }, [selectedId]);

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
    const surface = surfaceRef.current;
    if (!surface) return;
    let settle = 0;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const currentSize = sizeRef.current;
      const current = viewRef.current;
      const box = surface.getBoundingClientRect();
      const base = fitScale(currentSize);
      const oldScale = base * current.zoom;
      const zoom = clamp(current.zoom * Math.exp(-event.deltaY * 0.012), 1, MAX_SCALE / base);
      const newScale = base * zoom;
      // Keep the chart point under the pointer where it is.
      const offsetX = event.clientX - box.left - currentSize.width / 2;
      const offsetY = event.clientY - box.top - currentSize.height / 2;
      const cx = current.cx + offsetX / oldScale - offsetX / newScale;
      const cy = current.cy + offsetY / oldScale - offsetY / newScale;
      settleLater.current = false;
      setGliding(false);
      setView(clampView({ cx, cy, zoom }, currentSize));
      window.clearTimeout(settle);
      settle = window.setTimeout(() => setGliding(true), 180);
    };
    surface.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      surface.removeEventListener("wheel", onWheel);
      window.clearTimeout(settle);
    };
  }, [ready]);

  /* -- drag to pan; two fingers pinch to zoom -- */
  function suppressNextClick() {
    // The click that follows a drag or a pinch must not select whatever is under the pointer.
    suppressClick.current = true;
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 0);
  }

  /** Pinch state: the view and the two fingers' midpoint and spread when it began. */
  function startPinch(surface: HTMLDivElement) {
    const [a, b] = [...touches.current.values()];
    const box = surface.getBoundingClientRect();
    pinch.current = {
      view: viewRef.current,
      distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      midX: (a.x + b.x) / 2 - box.left,
      midY: (a.y + b.y) / 2 - box.top,
    };
    drag.current = null;
    setGliding(false);
    setDragging(true);
    setHover(null);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    if (event.pointerType === "touch") {
      touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touches.current.size === 2) {
        for (const pointerId of touches.current.keys()) {
          try {
            event.currentTarget.setPointerCapture(pointerId);
          } catch {
            // The finger may already have lifted.
          }
        }
        startPinch(event.currentTarget);
        return;
      }
      if (touches.current.size > 2) return;
    }
    drag.current = { x: event.clientX, y: event.clientY, view: viewRef.current, moved: false };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch" && touches.current.has(event.pointerId)) {
      touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const start = pinch.current;
      if (start && touches.current.size === 2) {
        const [a, b] = [...touches.current.values()];
        const box = event.currentTarget.getBoundingClientRect();
        const currentSize = sizeRef.current;
        const base = fitScale(currentSize);
        const oldScale = base * start.view.zoom;
        const zoom = clamp(start.view.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / start.distance), 1, MAX_SCALE / base);
        const newScale = base * zoom;
        // The chart point that was under the fingers' midpoint follows the midpoint.
        const midX = (a.x + b.x) / 2 - box.left;
        const midY = (a.y + b.y) / 2 - box.top;
        const pointX = start.view.cx + (start.midX - currentSize.width / 2) / oldScale;
        const pointY = start.view.cy + (start.midY - currentSize.height / 2) / oldScale;
        // Islands are laid out for the new zoom once the fingers have rested a moment.
        settleLater.current = true;
        setView(
          clampView(
            {
              zoom,
              cx: pointX - (midX - currentSize.width / 2) / newScale,
              cy: pointY - (midY - currentSize.height / 2) / newScale,
            },
            currentSize,
          ),
        );
        return;
      }
    }
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.moved) {
      if (Math.hypot(dx, dy) < 5) return;
      start.moved = true;
      setGliding(false);
      setDragging(true);
      setHover(null);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const currentScale = fitScale(sizeRef.current) * start.view.zoom;
    setView(clampView({ ...start.view, cx: start.view.cx - dx / currentScale, cy: start.view.cy - dy / currentScale }, sizeRef.current));
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    touches.current.delete(event.pointerId);
    if (pinch.current) {
      // A pinch ends when either finger lifts; the other one does not turn into a drag.
      if (touches.current.size < 2) {
        pinch.current = null;
        suppressNextClick();
        setGliding(true);
        setDragging(false);
      }
      drag.current = null;
      return;
    }
    if (drag.current?.moved) {
      suppressNextClick();
      setGliding(true);
      setDragging(false);
    }
    drag.current = null;
  }

  /** A marker was clicked or tapped: select it and travel to it. */
  const handleSelect = useCallback(
    (next: Selection) => {
      if (suppressClick.current) return;
      setSelection(next);
      if (next?.kind === "location") {
        const location = PLACED_BY_ID.get(next.id);
        if (location) bringIntoView(location.px, location.py, PICK_SCALE);
      } else if (next?.kind === "poneglyph") {
        const stone = PLACED_PONEGLYPHS.find((entry) => entry.id === next.id);
        if (stone) bringIntoView(stone.px, stone.py, PICK_SCALE);
      }
    },
    [bringIntoView],
  );

  const handleHover = useCallback((info: HoverInfo | null) => {
    if (drag.current?.moved) return;
    setHover(info);
  }, []);

  /* -- derived -- */
  const selectedLocation = selection?.kind === "location" ? PLACED_BY_ID.get(selection.id) : undefined;
  const selectedStone = selection?.kind === "poneglyph" ? PLACED_PONEGLYPHS.find((s) => s.id === selection.id) : undefined;
  const selectedPoint = selectedLocation ?? selectedStone;
  // With reduced motion the map jumps instead of gliding.
  const glide = gliding && !reduceMotion ? GLIDE : "none";
  /** Radius of the ring drawn round the selection, in pixels: just outside the island's foam. */
  const selectedRadius = selectedLocation && !selectedLocation.faction ? isleRadius(selectedLocation.tier, settledScale) * 1.3 + 6 : 13;
  const subject: PanelSubject | null = selectedLocation
    ? { kind: "location", location: selectedLocation }
    : selectedStone
      ? { kind: "poneglyph", stone: selectedStone }
      : null;

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
            {/* one row that swipes sideways on a phone; wraps on wide screens */}
            <div
              className="-mx-2.5 flex gap-1.5 overflow-x-auto px-2.5 pb-1 [scrollbar-width:none] sm:-mx-4 sm:px-4 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
              role="group"
              aria-label="Sea"
            >
              {REGION_CHIPS.map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={region === id}
                  onClick={(event) => {
                    focusRegion(id);
                    event.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                  }}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors",
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
                <ul className="parchment absolute inset-x-0 top-full z-40 mt-1.5 overflow-hidden rounded-md">
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
              className="relative h-[58vh] max-h-[680px] min-h-[360px] scroll-mt-16 overflow-hidden rounded-md bg-ocean-900 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.5)]"
            >
              {ready ? (
                <div
                  ref={surfaceRef}
                  role="img"
                  aria-label="Chart of the One Piece world. Use the search box or the list of places to explore it without a pointer."
                  className={cn(
                    "map-surface absolute inset-0 select-none overflow-hidden",
                    dragging ? "cursor-grabbing" : "cursor-grab",
                    // The idle shimmer and bob are switched off, not just hidden, whenever the map
                    // is scrolled away, the tab is in the background, or less motion is asked for.
                    inView && pageVisible && !reduceMotion && "map-idle",
                  )}
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
                  <div
                    className={cn("map-world", travelling && !reduceMotion && "is-travelling")}
                    style={{
                      // translate3d gives the chart a layer of its own, so moving it is the GPU's job.
                      transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
                      transition: glide,
                      // One screen pixel in chart units, and how much islands have grown at this zoom.
                      // Both follow the settled scale, so they change after a glide, not during it.
                      ["--u" as string]: 1 / settledScale,
                      ["--boost" as string]: zoomBoost(settledScale),
                    }}
                  >
                    <IslandDefs />
                    <svg className="map-layer" width={MAP_WIDTH} height={MAP_HEIGHT} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} aria-hidden="true">
                      <MapBase />
                    </svg>
                    {/* chart paper: a tiled background image, which costs nothing to redraw */}
                    <div className="map-paper" aria-hidden="true" />

                    <MapLayers
                      scale={settledScale}
                      region={region}
                      showRoute={showRoute}
                      showPoneglyphs={showPoneglyphs}
                      showFactions={showFactions}
                      selectedId={selectedId}
                      onHover={handleHover}
                      onSelect={handleSelect}
                    />

                    {/* the selected place: a ripple spreading out from it once, then a glowing ring.
                        Keyed by the selection so both play again each time a new place is picked. */}
                    {selectedPoint && subject ? (
                      <div
                        key={subjectKey(subject)}
                        className="map-pin pointer-events-none"
                        style={{ left: selectedPoint.px, top: selectedPoint.py, ["--ring" as string]: `${selectedRadius.toFixed(1)}px` }}
                      >
                        <span className="isle-ripple" />
                        <span className="isle-glow" />
                      </div>
                    ) : null}

                    {/* the name of whatever is under the pointer, for places too crowded to label */}
                    {hover ? (
                      <div className="map-pin pointer-events-none" data-tier={hover.tier ?? 3} style={{ left: hover.px, top: hover.py }}>
                        <span className="map-hover-name">{hover.name}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="grid h-full place-items-center">
                  <div className="flex flex-col items-center gap-3 text-parchment-100">
                    <DoskoiPandaMark className="animate-spin-slow h-14 w-14" />
                    <p className="font-display text-xl">Unrolling the chart</p>
                  </div>
                </div>
              )}

              {/* details for the selected place: beside the island on wide screens */}
              <AnimatePresence>
                {ready && subject && selectedPoint && isDesktop ? (
                  // One key for every island: picking another one changes the popover's
                  // content and position, but never unmounts and remounts the popover.
                  <LocationPopover
                    key="popover"
                    subject={subject}
                    anchor={{ x: translateX + selectedPoint.px * scale, y: translateY + selectedPoint.py * scale }}
                    frame={size}
                    transition={glide}
                    onClose={closePanel}
                  />
                ) : null}
              </AnimatePresence>

              {/* layer switches */}
              <div className="absolute left-2 top-2 flex max-w-[calc(100%-3.75rem)] flex-wrap gap-1.5">
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
                      "rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] backdrop-blur-sm transition-colors sm:px-2.5 sm:text-[11px] sm:tracking-[0.1em]",
                      layer.on
                        ? "border-gold-300 bg-ocean-950/80 text-gold-300"
                        : "border-parchment-100/30 bg-ocean-950/60 text-parchment-100/60",
                    )}
                  >
                    {layer.label}
                  </button>
                ))}
              </div>

              {/* zoom: top corner on a phone, clear of the sheet that rises from the bottom */}
              <div className="absolute right-2 top-2 flex flex-col overflow-hidden rounded-md border border-gold-600/70 bg-ocean-950/85 text-parchment-100 backdrop-blur-sm lg:bottom-2 lg:top-auto">
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
                  <svg viewBox="-0.2 -1.4 1.4 1.7" className="h-3 w-3" aria-hidden="true">
                    <path d="M0 0.2V-1.2" stroke="#fbf4e1" strokeWidth="0.16" strokeLinecap="round" />
                    <path d="M0-1.2L1-0.82L0-0.44Z" fill="#ecc14f" />
                  </svg>
                  Visited by the crew
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border border-dashed border-parchment-100 bg-parchment-100/30" />
                  Position unconfirmed
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border border-ink-900 bg-[#97948c]" />
                  Destroyed
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

            {/* the list of places: always here, whether or not one is selected */}
            <aside className="parchment flex max-h-[420px] min-h-[220px] flex-col rounded-md p-4 lg:h-[58vh] lg:max-h-[680px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">
                {regionInfo ? `${regionPlaces.length} places` : "Ports of call"}
              </p>
              <h3 className="mt-0.5 font-display text-3xl leading-none text-ink-900">{regionInfo ? regionInfo.name : "The voyage"}</h3>
              <p className="mt-1.5 text-sm leading-snug text-ink-700">
                {regionInfo
                  ? regionInfo.blurb
                  : "Pick an island, or one of the landmarks below. Choose a sea above to zoom in and list every place in it."}
              </p>
              <ul className="mt-3 min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
                {regionPlaces.map((place) => (
                  <li key={place.id}>
                    <button
                      type="button"
                      onClick={() => focusLocation(place.id)}
                      aria-current={place.id === selectedId ? "true" : undefined}
                      className={cn(
                        "flex w-full items-baseline justify-between gap-2 rounded-sm px-1.5 py-1 text-left hover:bg-gold-400/30",
                        place.id === selectedId && "bg-gold-400/40",
                      )}
                    >
                      <span className={cn("text-sm text-ink-900", place.tier === 1 && "font-semibold")}>{place.name}</span>
                      {place.pois.length > 0 ? <span className="shrink-0 text-[11px] text-ink-500">{place.pois.length} sites</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>

        {/* details for the selected place: a bottom sheet on narrow screens */}
        <AnimatePresence>
          {ready && subject && !isDesktop ? <LocationSheet key="sheet" subject={subject} onClose={closePanel} visible={inView} /> : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
