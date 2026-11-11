/**
 * Small hand-drawn SVG sprites used around the site. They are simple original drawings,
 * kept as inline SVG so they scale cleanly and cost no network requests.
 */
import type { SVGProps } from "react";

type SpriteProps = SVGProps<SVGSVGElement>;

/** The background regular who turns up in crowds everywhere. */
export function PandamanSprite(props: SpriteProps) {
  return (
    <svg viewBox="0 0 40 56" aria-hidden="true" {...props}>
      {/* legs and shorts */}
      <rect x="11" y="42" width="7" height="12" rx="3" fill="#f3efe4" />
      <rect x="22" y="42" width="7" height="12" rx="3" fill="#f3efe4" />
      <path d="M9 34h22v10a3 3 0 0 1-3 3h-5l-3-4-3 4h-5a3 3 0 0 1-3-3z" fill="#22252b" />
      {/* torso and arms */}
      <rect x="8" y="22" width="24" height="17" rx="7" fill="#f3efe4" />
      <rect x="2" y="23" width="8" height="15" rx="4" fill="#22252b" />
      <rect x="30" y="23" width="8" height="15" rx="4" fill="#22252b" />
      <text x="20" y="34" textAnchor="middle" fontSize="7" fontWeight="700" fill="#22252b" fontFamily="sans-serif">
        P
      </text>
      {/* head */}
      <circle cx="9" cy="6" r="5" fill="#22252b" />
      <circle cx="31" cy="6" r="5" fill="#22252b" />
      <ellipse cx="20" cy="14" rx="13" ry="11.5" fill="#f3efe4" />
      <ellipse cx="14" cy="13" rx="4" ry="5" fill="#22252b" transform="rotate(-18 14 13)" />
      <ellipse cx="26" cy="13" rx="4" ry="5" fill="#22252b" transform="rotate(18 26 13)" />
      <circle cx="14.6" cy="12.6" r="1.2" fill="#f3efe4" />
      <circle cx="25.4" cy="12.6" r="1.2" fill="#f3efe4" />
      <ellipse cx="20" cy="18.5" rx="2.2" ry="1.5" fill="#22252b" />
      <path d="M16.5 21.5q3.5 2.4 7 0" fill="none" stroke="#22252b" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/** Romance Dawn tribute: a very small dachshund in a straw hat. */
export function StrawHatDachshund(props: SpriteProps) {
  return (
    <svg viewBox="0 0 70 34" aria-hidden="true" {...props}>
      {/* tail */}
      <path d="M8 17Q1 12 3 6" fill="none" stroke="#7a4a22" strokeWidth="2.6" strokeLinecap="round" />
      {/* legs */}
      <rect x="11" y="23" width="4.5" height="9" rx="2" fill="#6b3f1c" />
      <rect x="18" y="23" width="4.5" height="9" rx="2" fill="#7a4a22" />
      <rect x="40" y="23" width="4.5" height="9" rx="2" fill="#6b3f1c" />
      <rect x="47" y="23" width="4.5" height="9" rx="2" fill="#7a4a22" />
      {/* long body */}
      <rect x="6" y="13" width="48" height="13" rx="6.5" fill="#8a5628" />
      {/* head, snout, ear */}
      <circle cx="54" cy="14" r="8" fill="#8a5628" />
      <rect x="55" y="13" width="13" height="7" rx="3.5" fill="#8a5628" />
      <circle cx="67.4" cy="15" r="1.7" fill="#24170b" />
      <circle cx="57" cy="12" r="1.2" fill="#24170b" />
      <path d="M50 10q-5 7-1 14 5-3 5-12z" fill="#5c3516" />
      {/* straw hat */}
      <ellipse cx="53" cy="7.2" rx="12" ry="2.6" fill="#ecc14f" />
      <path d="M46 7a7 6 0 0 1 14 0z" fill="#f6dc8b" />
      <path d="M46.2 6.2h13.6v1.6H46.2z" fill="#b3261e" />
    </svg>
  );
}

/** A miniature Thousand Sunny for the timeline tracker. Bow faces right. */
export function ThousandSunnySprite(props: SpriteProps) {
  return (
    <svg viewBox="0 0 72 72" aria-hidden="true" {...props}>
      {/* mast and crow's nest */}
      <rect x="33" y="6" width="3" height="44" fill="#6f4826" />
      <rect x="29" y="12" width="11" height="4" rx="1" fill="#8a5d33" />
      {/* pennant */}
      <path d="M36 4v7l11-3.5z" fill="#15171c" />
      {/* main sail with a little straw-hat skull */}
      <path d="M17 18q18-5 36 0-3 12 0 24-18 5-36 0 3-12 0-24z" fill="#fbf4e1" stroke="#c6a465" strokeWidth="1" />
      <circle cx="35" cy="31" r="5" fill="#24170b" />
      <ellipse cx="35" cy="26.6" rx="7.4" ry="1.7" fill="#ecc14f" />
      <path d="M30.6 26.6a4.4 3.8 0 0 1 8.8 0z" fill="#f6dc8b" />
      <circle cx="33.2" cy="31" r="1.1" fill="#fbf4e1" />
      <circle cx="36.8" cy="31" r="1.1" fill="#fbf4e1" />
      {/* aft cabin */}
      <rect x="9" y="42" width="13" height="10" rx="2" fill="#f6dc8b" stroke="#b08424" strokeWidth="1" />
      {/* hull */}
      <path d="M6 50h56q-3 15-17 15H20Q9 65 6 50z" fill="#b3261e" />
      <path d="M6 50h56l-1.2 4H7.4z" fill="#ecc14f" />
      <path d="M10 58h48" stroke="#701214" strokeWidth="1.4" />
      {/* sun figurehead */}
      <g transform="translate(62 46)">
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x="-1.6" y="-11.5" width="3.2" height="6" rx="1.6" fill="#f59a2e" transform={`rotate(${i * 36})`} />
        ))}
        <circle r="7" fill="#f6dc8b" stroke="#d4a437" strokeWidth="1" />
        <circle cx="-2.2" cy="-1" r="1" fill="#24170b" />
        <circle cx="2.2" cy="-1" r="1" fill="#24170b" />
        <path d="M-2.4 2.4q2.4 1.8 4.8 0" fill="none" stroke="#24170b" strokeWidth="1" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Jolly Roger artwork as an SVG string, used as a CSS background for the waving flag. */
export const JOLLY_ROGER_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 160'>
<rect width='240' height='160' fill='#15171c'/>
<g stroke='#f4efe2' stroke-width='13' stroke-linecap='round'>
<path d='M62 34 178 126'/><path d='M178 34 62 126'/>
</g>
<g fill='#f4efe2'>
<circle cx='56' cy='30' r='9'/><circle cx='66' cy='24' r='9'/>
<circle cx='184' cy='30' r='9'/><circle cx='174' cy='24' r='9'/>
<circle cx='56' cy='130' r='9'/><circle cx='66' cy='136' r='9'/>
<circle cx='184' cy='130' r='9'/><circle cx='174' cy='136' r='9'/>
<ellipse cx='120' cy='78' rx='40' ry='36'/>
<rect x='98' y='98' width='44' height='30' rx='9'/>
</g>
<g fill='#15171c'>
<ellipse cx='104' cy='82' rx='10' ry='12'/><ellipse cx='136' cy='82' rx='10' ry='12'/>
<path d='M120 94l5 9h-10z'/>
<rect x='108' y='110' width='2.5' height='16'/><rect x='118.7' y='110' width='2.5' height='16'/><rect x='129.5' y='110' width='2.5' height='16'/>
<rect x='100' y='116' width='40' height='2.5'/>
</g>
<ellipse cx='120' cy='50' rx='62' ry='11' fill='#ecc14f'/>
<path d='M84 50a36 30 0 0 1 72 0z' fill='#f6dc8b'/>
<path d='M85 44h70v8H85z' fill='#b3261e'/>
</svg>`;

/** Doskoi Panda, the in-world fashion brand, as a round badge. */
export function DoskoiPandaMark(props: SpriteProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <circle cx="32" cy="32" r="31" fill="#fbf4e1" stroke="#24170b" strokeWidth="2" />
      <circle cx="17" cy="16" r="8" fill="#24170b" />
      <circle cx="47" cy="16" r="8" fill="#24170b" />
      <ellipse cx="32" cy="34" rx="21" ry="19" fill="#ffffff" stroke="#24170b" strokeWidth="2" />
      <ellipse cx="23" cy="31" rx="6" ry="7.5" fill="#24170b" transform="rotate(-20 23 31)" />
      <ellipse cx="41" cy="31" rx="6" ry="7.5" fill="#24170b" transform="rotate(20 41 31)" />
      <circle cx="24" cy="30" r="1.8" fill="#ffffff" />
      <circle cx="40" cy="30" r="1.8" fill="#ffffff" />
      <ellipse cx="32" cy="40" rx="3.4" ry="2.3" fill="#24170b" />
      <path d="M26.5 45q5.5 4 11 0" fill="none" stroke="#24170b" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** A compass-style Log Pose: glass sphere, one restless needle. */
export function LogPoseMark({ spinning = false, ...props }: SpriteProps & { spinning?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <circle cx="32" cy="32" r="27" fill="rgba(211,238,245,0.14)" stroke="#ecc14f" strokeWidth="3" />
      <circle cx="32" cy="32" r="21" fill="none" stroke="rgba(246,220,139,0.45)" strokeWidth="1" strokeDasharray="2 4" />
      <g className={spinning ? "animate-needle" : undefined} style={{ transformOrigin: "32px 32px" }}>
        <path d="M32 11 36.5 32 32 53 27.5 32Z" fill="#cf4034" />
        <path d="M27.5 32h9L32 53z" fill="#fbf4e1" />
      </g>
      <circle cx="32" cy="32" r="3.4" fill="#ecc14f" stroke="#8a6418" strokeWidth="1" />
    </svg>
  );
}
