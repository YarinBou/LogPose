import { memo } from "react";
import {
  BAND_BOTTOM,
  BAND_TOP,
  CALM_NORTH_INNER,
  CALM_SOUTH_INNER,
  EDGE,
  MAP_HEIGHT,
  MAP_WIDTH,
  RED_HALF,
} from "@/components/map/projection";

const HALF = MAP_WIDTH / 2;

const SEA_NAMES: { label: string; x: number; y: number; size: number }[] = [
  { label: "North Blue", x: HALF / 2 + 10, y: 205, size: 58 },
  { label: "East Blue", x: HALF + HALF / 2 - 10, y: 205, size: 58 },
  { label: "West Blue", x: HALF / 2 + 10, y: 745, size: 58 },
  { label: "South Blue", x: HALF + HALF / 2 - 10, y: 745, size: 58 },
  { label: "New World", x: HALF / 2 + 10, y: 466, size: 46 },
  { label: "Paradise", x: HALF + HALF / 2 - 10, y: 466, size: 46 },
];

/**
 * The fixed chart under the markers: four Blues, the Grand Line between its Calm Belts,
 * and the Red Line down the middle and along both edges. It takes no props, so it renders once.
 */
export const MapBase = memo(function MapBase() {
  return (
    <g>
      <defs>
        <radialGradient id="map-sea" cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor="#15698d" />
          <stop offset="60%" stopColor="#0f4b6e" />
          <stop offset="100%" stopColor="#0a3551" />
        </radialGradient>
        <linearGradient id="map-redline" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#4d0c0e" />
          <stop offset="22%" stopColor="#94191a" />
          <stop offset="48%" stopColor="#cf4034" />
          <stop offset="62%" stopColor="#b3261e" />
          <stop offset="100%" stopColor="#4d0c0e" />
        </linearGradient>
        <linearGradient id="map-grandline" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2089ad" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#7cc6dc" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#2089ad" stopOpacity="0.55" />
        </linearGradient>
        {/* The only pattern left on the chart, and it covers three narrow strips. Patterns are
            slow to draw, and the chart is redrawn at every zoom level: the paper texture is a
            CSS background on the wrapper instead (.map-paper), and the Calm Belts are flat. */}
        <pattern id="map-rock" width="26" height="40" patternUnits="userSpaceOnUse">
          <path d="M0 9 9 5 17 11 26 7M0 29 8 33 18 27 26 31" fill="none" stroke="rgba(0,0,0,0.38)" strokeWidth="1.2" />
        </pattern>
      </defs>

      {/* sea */}
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#map-sea)" />
      <rect x={0} y={0} width={HALF} height={BAND_TOP} fill="#0b2a45" opacity="0.28" />
      <rect x={HALF} y={BAND_BOTTOM} width={HALF} height={MAP_HEIGHT - BAND_BOTTOM} fill="#0b2a45" opacity="0.22" />
      <rect x={0} y={BAND_BOTTOM} width={HALF} height={MAP_HEIGHT - BAND_BOTTOM} fill="#06243a" opacity="0.34" />

      {/* chart grid */}
      <g stroke="rgba(211,238,245,0.07)" strokeWidth="1">
        {Array.from({ length: 13 }, (_, i) => (
          <line key={`v${i}`} x1={(i + 1) * 100} x2={(i + 1) * 100} y1={0} y2={MAP_HEIGHT} />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <line key={`h${i}`} x1={0} x2={MAP_WIDTH} y1={(i + 1) * 100} y2={(i + 1) * 100} />
        ))}
      </g>

      {/* sea names */}
      <g fontFamily="var(--font-display)" textAnchor="middle" fill="#d3eef5" opacity="0.13">
        {SEA_NAMES.map((sea) => (
          <text key={sea.label} x={sea.x} y={sea.y} fontSize={sea.size} letterSpacing="10">
            {sea.label.toUpperCase()}
          </text>
        ))}
      </g>

      {/* Grand Line and Calm Belts */}
      <rect x={0} y={BAND_TOP} width={MAP_WIDTH} height={BAND_BOTTOM - BAND_TOP} fill="url(#map-grandline)" />
      <rect x={0} y={BAND_TOP} width={MAP_WIDTH} height={CALM_NORTH_INNER - BAND_TOP} fill="rgba(211,238,245,0.17)" />
      <rect x={0} y={CALM_SOUTH_INNER} width={MAP_WIDTH} height={BAND_BOTTOM - CALM_SOUTH_INNER} fill="rgba(211,238,245,0.17)" />
      <g stroke="rgba(211,238,245,0.45)" strokeWidth="1" strokeDasharray="5 6">
        {[BAND_TOP, CALM_NORTH_INNER, CALM_SOUTH_INNER, BAND_BOTTOM].map((y) => (
          <line key={y} x1={0} x2={MAP_WIDTH} y1={y} y2={y} />
        ))}
      </g>
      <g fontFamily="var(--font-sans)" fontSize="9" fontWeight="600" letterSpacing="5" fill="#d3eef5" opacity="0.5" textAnchor="middle">
        {[190, 520, 880, 1210].map((x) => (
          <g key={x}>
            <text x={x} y={(BAND_TOP + CALM_NORTH_INNER) / 2 + 3}>CALM BELT</text>
            <text x={x} y={(CALM_SOUTH_INNER + BAND_BOTTOM) / 2 + 3}>CALM BELT</text>
          </g>
        ))}
      </g>

      {/* Red Line: centre, then the same wall again on both edges */}
      {[
        { x: HALF - RED_HALF, width: RED_HALF * 2 },
        { x: 0, width: EDGE },
        { x: MAP_WIDTH - EDGE, width: EDGE },
      ].map((strip) => (
        <g key={strip.x}>
          <rect x={strip.x} y={0} width={strip.width} height={MAP_HEIGHT} fill="url(#map-redline)" />
          <rect x={strip.x} y={0} width={strip.width} height={MAP_HEIGHT} fill="url(#map-rock)" />
        </g>
      ))}
      <text
        fontFamily="var(--font-display)"
        fontSize="17"
        letterSpacing="9"
        fill="#fbeab0"
        opacity="0.6"
        textAnchor="middle"
        transform={`translate(${HALF + 6} 190) rotate(-90)`}
      >
        RED LINE
      </text>
      <text
        fontFamily="var(--font-display)"
        fontSize="17"
        letterSpacing="9"
        fill="#fbeab0"
        opacity="0.6"
        textAnchor="middle"
        transform={`translate(${HALF + 6} 730) rotate(-90)`}
      >
        RED LINE
      </text>

      {/* Reverse Mountain: four currents up, one down into Paradise */}
      <g>
        <path d={`M${HALF - 34} 378 ${HALF} 334 ${HALF + 40} 378Z`} fill="#701214" stroke="#4d0c0e" strokeWidth="1" />
        <path d={`M${HALF} 334 ${HALF + 9} 346 ${HALF} 352 ${HALF - 8} 345Z`} fill="#fbf4e1" opacity="0.9" />
        <g stroke="#d3eef5" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7" strokeDasharray="3 4">
          <path d={`M${HALF - 60} 300 Q${HALF - 26} 312 ${HALF} 336`} />
          <path d={`M${HALF + 60} 300 Q${HALF + 26} 312 ${HALF} 336`} />
          <path d={`M${HALF} 336 Q${HALF + 16} 362 ${HALF + 44} 388`} />
        </g>
      </g>

      {/* compass rose */}
      <g transform="translate(596 112)" opacity="0.6">
        <circle r="40" fill="none" stroke="#f6dc8b" strokeWidth="1" />
        <circle r="31" fill="none" stroke="#f6dc8b" strokeWidth="0.6" strokeDasharray="2 3" />
        <path d="M0-37 6 0 0 37-6 0Z" fill="#f6dc8b" />
        <path d="M-37 0 0-6 37 0 0 6Z" fill="#b08424" />
        <path d="M0-37 6 0H-6Z" fill="#cf4034" />
        <text y="-45" textAnchor="middle" fontFamily="var(--font-display)" fontSize="15" fill="#f6dc8b">
          N
        </text>
      </g>
    </g>
  );
});
