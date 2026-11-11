"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play, Search, X } from "lucide-react";
import { Vector3 } from "three";
import { DoskoiPandaMark } from "@/components/art/Sprites";
import { LocationDetails, PoneglyphDetails } from "@/components/map/LocationDetails";
import { directionOf } from "@/components/world3d/globe-math";
import type { FocusRequest, SceneProps, Selection3D } from "@/components/world3d/Scene";
import { currentStopIndex, shipAt, VOYAGE } from "@/components/world3d/voyage";
import { getLocation, LOCATIONS, PONEGLYPHS, regionName } from "@/data/map";
import { cn } from "@/lib/utils";

function ChartLoader({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex flex-col items-center gap-3 text-parchment-100">
        <DoskoiPandaMark className="animate-spin-slow h-16 w-16" />
        <p className="font-display text-2xl">{message}</p>
      </div>
    </div>
  );
}

// three.js needs a browser, so the canvas is never rendered on the server.
const World3DCanvas = dynamic<SceneProps>(() => import("@/components/world3d/Scene"), {
  ssr: false,
  loading: () => <ChartLoader message="Raising the globe" />,
});

/** How long the whole voyage takes when it plays on its own. */
const VOYAGE_SECONDS = 95;
/** Camera distance when flying to a place. */
const CLOSE_UP = 8.2;
/** Camera distance while the voyage plays: close enough to see the ship. */
const SHIP_VIEW = 8.6;

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function World3D() {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [selection, setSelection] = useState<Selection3D>(null);
  const [showCourse, setShowCourse] = useState(true);
  const [showPoneglyphs, setShowPoneglyphs] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [followShip, setFollowShip] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [focus, setFocus] = useState<FocusRequest | null>(null);
  const [query, setQuery] = useState("");

  const progressRef = useRef(0);
  const focusNonce = useRef(0);
  const labelLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWebgl(supportsWebGL());
    // Leave the globe still for readers who ask for less motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setAutoRotate(false);
  }, []);

  const flyTo = useCallback((x: number, y: number, distance = CLOSE_UP) => {
    focusNonce.current += 1;
    setAutoRotate(false);
    setFocus({ normal: directionOf(x, y), distance, nonce: focusNonce.current });
  }, []);

  const selectLocation = useCallback(
    (id: string) => {
      const location = getLocation(id);
      if (!location) return;
      setSelection({ kind: "location", id });
      setFollowShip(false);
      flyTo(location.x, location.y);
    },
    [flyTo],
  );

  const stopIndex = currentStopIndex(progress);
  const stop = VOYAGE.stops[stopIndex];

  const sailTo = useCallback(
    (index: number) => {
      const target = VOYAGE.stops[Math.min(VOYAGE.stops.length - 1, Math.max(0, index))];
      progressRef.current = target.t;
      setProgress(target.t);
      setPlaying(false);
      flyTo(target.location.x, target.location.y);
    },
    [flyTo],
  );

  const togglePlay = useCallback(() => {
    if (playing) {
      setPlaying(false);
      return;
    }
    // Starting again from the end begins a new voyage.
    if (progressRef.current >= 1) {
      progressRef.current = 0;
      setProgress(0);
    }
    setAutoRotate(false);
    setFollowShip(true);
    // Come in close over the ship; after that the camera just keeps it centred.
    const normal = new Vector3();
    shipAt(progressRef.current, normal, new Vector3());
    focusNonce.current += 1;
    setFocus({ normal, distance: SHIP_VIEW, nonce: focusNonce.current });
    setPlaying(true);
  }, [playing]);

  const handleInteract = useCallback(() => {
    setAutoRotate(false);
    setFollowShip(false);
  }, []);

  const handleVoyageEnd = useCallback(() => setPlaying(false), []);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];
    return LOCATIONS.filter((l) => !l.faction && (l.name.toLowerCase().includes(needle) || l.pois.some((p) => p.toLowerCase().includes(needle))))
      .sort((a, b) => a.tier - b.tier)
      .slice(0, 7);
  }, [query]);

  const selectedLocation = selection?.kind === "location" ? getLocation(selection.id) : undefined;
  const selectedStone = selection?.kind === "poneglyph" ? PONEGLYPHS.find((s) => s.id === selection.id) : undefined;

  const layers = [
    { label: "Course", on: showCourse, set: setShowCourse },
    { label: "Poneglyphs", on: showPoneglyphs, set: setShowPoneglyphs },
    { label: "Names", on: showLabels, set: setShowLabels },
    { label: "Spin", on: autoRotate, set: setAutoRotate },
  ];

  return (
    <div className="relative h-[100svh] min-h-[600px] w-full overflow-hidden bg-[#020a13]">
      {webgl === null ? <ChartLoader message="Raising the globe" /> : null}

      {webgl === false ? (
        <div className="absolute inset-0 grid place-items-center px-4">
          <div className="parchment gold-trim max-w-md rounded-xl p-6 text-center">
            <h1 className="font-display text-4xl leading-none text-ink-900">No 3D on this device</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-700">
              This browser cannot draw WebGL, which the globe needs. The flat chart has every place and the same course.
            </p>
            <Link href="/#map" className="wood gold-trim mt-5 inline-flex rounded-full px-6 py-2.5 font-display text-xl text-gold-200">
              Open the 2D World Map
            </Link>
          </div>
        </div>
      ) : null}

      {webgl ? (
        <World3DCanvas
          selection={selection}
          onSelect={setSelection}
          showCourse={showCourse}
          showPoneglyphs={showPoneglyphs}
          showLabels={showLabels}
          autoRotate={autoRotate}
          followShip={followShip}
          playing={playing}
          voyageSeconds={VOYAGE_SECONDS}
          progressRef={progressRef}
          onProgress={setProgress}
          onVoyageEnd={handleVoyageEnd}
          focus={focus}
          onInteract={handleInteract}
          labelLayerRef={labelLayerRef}
        />
      ) : null}

      {/* place names, positioned every frame by the scene */}
      <div ref={labelLayerRef} className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true" />

      {/* title, search and layer switches */}
      <div className="pointer-events-none absolute inset-x-0 top-14 z-20 flex flex-col gap-2 p-3 sm:max-w-sm sm:p-4">
        <div className="pointer-events-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-gold-300">Three.js and Blender</p>
          <h1 className="gold-text font-display text-4xl leading-none drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)] sm:text-5xl">3D World Map</h1>
          <p className="text-shadow-deep mt-1 hidden text-[13px] leading-snug text-parchment-100 sm:block">
            The Red Line rings the globe through both poles; the Grand Line is the equator. Drag to turn, scroll to zoom,
            pick a place.
          </p>
        </div>

        <div className="pointer-events-auto relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find an island or town"
            aria-label="Find a place on the globe"
            className="w-full rounded-full border border-gold-600/60 bg-parchment-100 py-1.5 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-300"
          />
          {results.length > 0 ? (
            <ul className="parchment absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-md">
              {results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => {
                      selectLocation(result.id);
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

        <div className="pointer-events-auto flex flex-wrap gap-1.5" role="group" aria-label="Layers">
          {layers.map((layer) => (
            <button
              key={layer.label}
              type="button"
              aria-pressed={layer.on}
              onClick={() => layer.set((value) => !value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] backdrop-blur-sm transition-colors",
                layer.on ? "border-gold-300 bg-ocean-950/80 text-gold-300" : "border-parchment-100/30 bg-ocean-950/60 text-parchment-100/60",
              )}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      {/* details of the selected place */}
      {selectedLocation || selectedStone ? (
        <aside
          aria-live="polite"
          className="parchment absolute inset-x-3 bottom-[5.75rem] z-20 flex max-h-[30svh] flex-col rounded-md p-3 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-[4.5rem] sm:max-h-[calc(100svh-15rem)] sm:w-80 sm:p-4"
        >
          <button
            type="button"
            onClick={() => setSelection(null)}
            className="mb-1 inline-flex items-center gap-1 self-end text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500 hover:text-ink-900"
          >
            <X className="h-3.5 w-3.5" />
            Close
          </button>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {selectedLocation ? <LocationDetails location={selectedLocation} arcHrefBase="/" /> : null}
            {selectedStone ? <PoneglyphDetails stone={selectedStone} /> : null}
          </div>
        </aside>
      ) : null}

      {/* voyage controls */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-2 sm:p-4">
        <div className="wood gold-trim mx-auto max-w-4xl rounded-lg px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Pause the voyage" : "Play the voyage"}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-400 text-ink-900 shadow transition-transform hover:scale-105"
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
            </button>

            <button
              type="button"
              onClick={() => sailTo(stopIndex - 1)}
              disabled={stopIndex === 0}
              aria-label="Previous arc"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-gold-600/60 text-parchment-100 hover:border-gold-300 hover:text-gold-300 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-300/90">
                Log {String(stopIndex + 1).padStart(2, "0")} of {VOYAGE.stops.length} · {stop.arc.dateLabel}
              </p>
              <p className="truncate font-display text-2xl leading-tight text-parchment-50">
                {stop.arc.name}
                <span className="font-sans text-xs font-normal text-parchment-100/70"> · {stop.location.name}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => sailTo(stopIndex + 1)}
              disabled={stopIndex === VOYAGE.stops.length - 1}
              aria-label="Next arc"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-gold-600/60 text-parchment-100 hover:border-gold-300 hover:text-gold-300 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              aria-pressed={followShip}
              onClick={() => setFollowShip((value) => !value)}
              className={cn(
                "hidden shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] sm:block",
                followShip ? "border-gold-300 bg-gold-400 text-ink-900" : "border-gold-600/60 text-parchment-100 hover:border-gold-300",
              )}
            >
              Follow the Sunny
            </button>
          </div>

          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(progress * 1000)}
            onChange={(event) => {
              const next = Number(event.target.value) / 1000;
              progressRef.current = next;
              setProgress(next);
            }}
            aria-label="Position along the voyage"
            aria-valuetext={`${stop.arc.name}, ${stop.arc.dateLabel}`}
            className="mt-2 block h-1.5 w-full cursor-pointer accent-gold-400"
          />
        </div>
      </div>
    </div>
  );
}
