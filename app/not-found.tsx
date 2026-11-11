import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404: this door is off its hinges",
};

/**
 * Minatomo, the carpenter of Foosha Village, mending the tavern door.
 * The hammer arm and the loose door are animated with the keyframes in globals.css.
 */
function MinatomoAtWork() {
  return (
    <svg viewBox="0 0 420 300" className="h-auto w-full" role="img" aria-label="Minatomo the carpenter hammering a tavern door that hangs from one hinge">
      {/* tavern wall */}
      <rect width="420" height="300" fill="#6f4826" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={i * 56} y="0" width="2" height="300" fill="rgba(0,0,0,0.28)" />
      ))}
      <rect y="262" width="420" height="38" fill="#3d2613" />
      <rect y="262" width="420" height="3" fill="rgba(0,0,0,0.4)" />

      {/* sign */}
      <g transform="translate(92 22)">
        <rect width="236" height="44" rx="5" fill="#f4e6c3" stroke="#3d2613" strokeWidth="4" />
        <text x="118" y="31" textAnchor="middle" fontFamily="var(--font-display)" fontSize="27" fill="#24170b" letterSpacing="3">
          PARTYS BAR
        </text>
      </g>

      {/* doorway, dark inside */}
      <rect x="150" y="84" width="124" height="180" fill="#150d06" />
      <rect x="143" y="78" width="138" height="8" fill="#3d2613" />
      <rect x="143" y="78" width="8" height="186" fill="#3d2613" />
      <rect x="273" y="78" width="8" height="186" fill="#3d2613" />
      <text x="212" y="182" textAnchor="middle" fontFamily="var(--font-display)" fontSize="64" fill="rgba(246,220,139,0.16)">
        404
      </text>

      {/* the door, hanging from its top hinge */}
      <g style={{ transformOrigin: "151px 92px", animation: "door-rattle 1.5s ease-in-out infinite" }}>
        <rect x="151" y="88" width="116" height="170" rx="3" fill="#8a5d33" stroke="#3d2613" strokeWidth="3" />
        <rect x="163" y="100" width="92" height="64" rx="2" fill="none" stroke="#55361c" strokeWidth="3" />
        <rect x="163" y="176" width="92" height="70" rx="2" fill="none" stroke="#55361c" strokeWidth="3" />
        <circle cx="254" cy="172" r="5" fill="#ecc14f" stroke="#8a6418" strokeWidth="1.5" />
        <rect x="147" y="96" width="14" height="8" rx="2" fill="#2a2a2e" />
        {/* the hinge that gave up */}
        <rect x="147" y="232" width="14" height="8" rx="2" fill="#2a2a2e" transform="rotate(24 154 236)" />
      </g>

      {/* a few stray nails */}
      <g stroke="#c4ccd6" strokeWidth="2" strokeLinecap="round">
        <path d="M112 270l7-5M126 274l8-2M100 276l6 3" />
      </g>

      {/* Minatomo */}
      <g transform="translate(296 118)">
        {/* legs and boots */}
        <rect x="20" y="96" width="15" height="42" rx="5" fill="#2f4a66" />
        <rect x="41" y="96" width="15" height="42" rx="5" fill="#2f4a66" />
        <rect x="15" y="134" width="23" height="11" rx="5" fill="#24170b" />
        <rect x="39" y="134" width="23" height="11" rx="5" fill="#24170b" />
        {/* body: work shirt and apron */}
        <rect x="12" y="44" width="52" height="60" rx="14" fill="#d9c9a3" />
        <path d="M22 58h32v44a6 6 0 0 1-6 6H28a6 6 0 0 1-6-6z" fill="#55361c" />
        <rect x="30" y="70" width="16" height="12" rx="2" fill="#3d2613" />
        {/* resting arm */}
        <rect x="56" y="52" width="13" height="42" rx="6.5" fill="#d9c9a3" />
        <circle cx="62.5" cy="96" r="7" fill="#e8b98a" />
        {/* head, headband, pencil behind the ear */}
        <circle cx="38" cy="24" r="21" fill="#e8b98a" />
        <path d="M17 18q21-12 42 0v8q-21-10-42 0z" fill="#f4efe2" />
        <path d="M58 20l12-5-3 9z" fill="#f4efe2" />
        <path d="M20 12q18-18 36 0-18-7-36 0z" fill="#3d2613" />
        <rect x="50" y="6" width="16" height="3.5" rx="1.5" fill="#ecc14f" transform="rotate(-28 50 6)" />
        <circle cx="29" cy="28" r="2.2" fill="#24170b" />
        <circle cx="43" cy="28" r="2.2" fill="#24170b" />
        <path d="M27 37q8 5 16 0" fill="none" stroke="#24170b" strokeWidth="2" strokeLinecap="round" />
        {/* hammer arm, swinging at the hinge */}
        <g style={{ transformOrigin: "16px 56px", animation: "hammer-swing 0.75s ease-in-out infinite" }}>
          <rect x="-26" y="50" width="46" height="13" rx="6.5" fill="#d9c9a3" />
          <circle cx="-26" cy="56.5" r="7.5" fill="#e8b98a" />
          <rect x="-30" y="16" width="7" height="46" rx="3" fill="#8a5d33" />
          <rect x="-43" y="8" width="32" height="15" rx="3" fill="#5a606b" />
        </g>
      </g>
    </svg>
  );
}

export default function NotFound() {
  return (
    <main className="wood grid min-h-screen place-items-center px-4 py-16">
      <div className="parchment gold-trim w-full max-w-2xl rounded-xl p-5 text-center sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-ink-500">Foosha Village · Error 404</p>
        <h1 className="mt-2 font-display text-5xl leading-none text-ink-900 sm:text-6xl">This door is off its hinges</h1>

        <div className="mx-auto mt-6 max-w-md overflow-hidden rounded-lg border-4 border-wood-800 shadow-lg">
          <MinatomoAtWork />
        </div>

        <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-ink-700">
          Minatomo, the village carpenter, is still fixing the door to Makino&apos;s tavern. Whatever page you were
          looking for is not behind it. He says to come back when the hinge is on.
        </p>

        <Link
          href="/"
          className="wood gold-trim mt-7 inline-flex items-center rounded-full px-7 py-3 font-display text-xl tracking-wide text-gold-200 transition-transform hover:scale-105"
        >
          Back to the ship
        </Link>
      </div>
    </main>
  );
}
