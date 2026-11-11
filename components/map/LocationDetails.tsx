"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, EyeOff, Flag, MapPin, Tv, Users } from "lucide-react";
import {
  regionName,
  type LocationStatus,
  type MapLocation,
  type Poneglyph,
  type RegionId,
  type Visitor,
} from "@/data/map";
import { arcsAtLocation } from "@/data/timeline";
import { isLandmark, paths } from "@/lib/content";
import { SPOILER_STEPS, useSpoilerLimit } from "@/lib/spoilers";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Lookups                                                              */
/* ------------------------------------------------------------------ */

/** One colour per sea, so the pill tells you where you are before you read it. */
const REGION_PILL: Record<RegionId, string> = {
  "east-blue": "border-sky-700/50 bg-sky-600/15 text-sky-900",
  "north-blue": "border-indigo-700/50 bg-indigo-600/15 text-indigo-900",
  "west-blue": "border-teal-700/50 bg-teal-600/15 text-teal-900",
  "south-blue": "border-cyan-700/50 bg-cyan-600/15 text-cyan-900",
  paradise: "border-emerald-700/50 bg-emerald-600/15 text-emerald-900",
  "new-world": "border-purple-700/50 bg-purple-600/15 text-purple-900",
  "red-line": "border-redline-700/50 bg-redline-500/15 text-redline-800",
  "calm-belt": "border-slate-600/50 bg-slate-500/15 text-slate-800",
  sky: "border-amber-700/50 bg-amber-500/20 text-amber-900",
};

const STATUS_BADGE: Record<LocationStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "border-emerald-800/40 bg-emerald-700/15 text-emerald-900" },
  destroyed: { label: "Destroyed", className: "border-redline-700/50 bg-redline-500/15 text-redline-700" },
  occupied: { label: "Occupied", className: "border-amber-800/50 bg-amber-500/20 text-amber-900" },
  unknown: { label: "Fate unknown", className: "border-slate-600/50 bg-slate-500/15 text-slate-800" },
};

const VISITOR_GROUPS: { kind: Visitor["kind"]; label: string }[] = [
  { kind: "crew", label: "Straw Hats" },
  { kind: "character", label: "Characters" },
  { kind: "organisation", label: "Crews and organisations" },
];

const NOTE_LABEL: Record<NonNullable<Visitor["note"]>, string> = {
  mentioned: "mentioned",
  flashback: "flashback",
  "anime-only": "anime only",
};

/** Chips shown per group before the rest fold into "+N more". */
const VISITOR_LIMIT = 5;

const sectionTitle = "text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500";

/* ------------------------------------------------------------------ */
/* Pieces                                                               */
/* ------------------------------------------------------------------ */

function StatCard({ label, value, tone = "plain", icon }: { label: string; value: string; tone?: "plain" | "anime" | "manga"; icon?: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col justify-between rounded-md border px-2.5 py-2",
        tone === "plain" && "border-ink-500/25 bg-parchment-50/70",
        // Episode and chapter are told apart by colour, icon and a tinted edge, not colour alone.
        tone === "anime" && "border-ocean-600/45 border-l-4 border-l-ocean-600 bg-ocean-500/10",
        tone === "manga" && "border-redline-600/45 border-l-4 border-l-redline-600 bg-redline-500/10",
      )}
    >
      <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
        {icon}
        {label}
      </dt>
      <dd className={cn("mt-0.5 break-words font-display leading-tight text-ink-900", value.length > 11 ? "text-[15px]" : "text-xl")}>{value}</dd>
    </div>
  );
}

function VisitorChips({ visitors, label }: { visitors: Visitor[]; label: string }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? visitors : visitors.slice(0, VISITOR_LIMIT);
  const hidden = visitors.length - shown.length;

  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-500">{label}</p>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {shown.map((visitor) => (
          <li
            key={`${visitor.name}-${visitor.note ?? ""}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] text-ink-900",
              visitor.kind === "crew" && "border-redline-700/40 bg-redline-500/10 font-semibold",
              visitor.kind === "character" && "border-ink-500/35 bg-parchment-50/80",
              visitor.kind === "organisation" && "border-ocean-700/40 bg-ocean-500/10",
            )}
          >
            {visitor.name}
            {visitor.note ? (
              <span className="rounded-sm bg-ink-900/80 px-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-parchment-100">
                {NOTE_LABEL[visitor.note]}
              </span>
            ) : null}
          </li>
        ))}
        {hidden > 0 ? (
          <li>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label={`Show ${hidden} more ${label.toLowerCase()}`}
              className="rounded-full border border-dashed border-ink-500/60 px-2 py-0.5 text-[12px] font-semibold text-ink-700 hover:border-ink-900 hover:text-ink-900"
            >
              +{hidden} more
            </button>
          </li>
        ) : null}
        {expanded && visitors.length > VISITOR_LIMIT ? (
          <li>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded-full px-2 py-0.5 text-[12px] font-semibold text-ink-500 underline underline-offset-2 hover:text-ink-900"
            >
              Show fewer
            </button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

/** The reader's "how far have you read" choice, shown at the foot of every panel. */
function SpoilerControl() {
  const [limit, setLimit] = useSpoilerLimit();
  return (
    <label className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-ink-500/25 pt-3 text-[12px] text-ink-700">
      <span className="inline-flex items-center gap-1 font-semibold">
        <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
        Spoiler guard
      </span>
      <select
        value={Number.isFinite(limit) ? String(limit) : "all"}
        onChange={(event) => setLimit(event.target.value === "all" ? Number.POSITIVE_INFINITY : Number(event.target.value))}
        className="min-w-0 flex-1 rounded-md border border-ink-500/40 bg-parchment-50 px-2 py-1 text-[12px] text-ink-900"
      >
        {SPOILER_STEPS.map((step) => (
          <option key={step.label} value={Number.isFinite(step.chapter) ? String(step.chapter) : "all"}>
            {step.label}
            {Number.isFinite(step.chapter) ? ` (ch. ${step.chapter})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Location                                                             */
/* ------------------------------------------------------------------ */

interface LocationDetailsProps {
  location: MapLocation;
  /**
   * Prefix for links to timeline cards. The 2D map lives on the home page and links with
   * "#arc-..."; the 3D map is its own page and needs "/#arc-...".
   */
  arcHrefBase?: string;
  /** Id for the heading, so the surrounding dialog can be labelled by it. */
  headingId?: string;
}

/**
 * Everything known about one place: where it is, what it is, what happened there, who has
 * been there, and where it sits on the timeline. Shared by the 2D map and the 3D globe.
 */
export function LocationDetails({ location, arcHrefBase = "", headingId }: LocationDetailsProps) {
  const [limit] = useSpoilerLimit();
  const [revealed, setRevealed] = useState<string | null>(null);

  const arcs = arcsAtLocation(location.id);
  const guarded = (location.spoilerLevel ?? 0) > limit && revealed !== location.id;
  const status = location.status ? STATUS_BADGE[location.status] : undefined;

  const stats: { label: string; value: string; tone?: "anime" | "manga"; icon?: React.ReactNode }[] = [];
  if (location.saga) stats.push({ label: "Saga", value: location.saga.replace(" Saga", "") });
  if (location.arc) stats.push({ label: "Arc", value: location.arc });
  if (location.firstAnimeEpisode) {
    stats.push({ label: "First episode", value: `Ep. ${location.firstAnimeEpisode}`, tone: "anime", icon: <Tv className="h-3 w-3" aria-hidden="true" /> });
  }
  if (location.firstMangaChapter) {
    stats.push({ label: "First chapter", value: `Ch. ${location.firstMangaChapter}`, tone: "manga", icon: <BookOpen className="h-3 w-3" aria-hidden="true" /> });
  } else if (arcs.length > 0) {
    // No first-appearance chapter on record: the arc's own chapter range is still exact.
    stats.push({ label: "Arc chapters", value: arcs[0].chapters.replace("Ch. ", ""), tone: "manga", icon: <BookOpen className="h-3 w-3" aria-hidden="true" /> });
  }

  const facts = [
    { label: "Ruler", value: location.ruler },
    { label: "Affiliation", value: location.affiliation },
    { label: "Population", value: location.population },
    { label: "Climate", value: location.climate },
    { label: "Notable features", value: location.features },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  const visitors = location.visitedBy ?? [];

  return (
    <div className="space-y-4">
      {/* header */}
      <header>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em]", REGION_PILL[location.region])}>
            {regionName(location.region)}
          </span>
          {status ? (
            <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", status.className)}>{status.label}</span>
          ) : null}
          {location.unplaced ? (
            <span className="rounded-full border border-dashed border-ink-500/60 px-2 py-0.5 text-[11px] font-semibold text-ink-700">Position unconfirmed</span>
          ) : null}
          {location.faction ? (
            <span className="rounded-full border border-ink-500/40 px-2 py-0.5 text-[11px] font-semibold text-ink-700">Crew or organisation</span>
          ) : null}
        </div>
        <h3 id={headingId} className="mt-1.5 font-display text-4xl leading-none text-ink-900">
          {location.name}
        </h3>
        <p className="mt-1 flex items-start gap-1 text-[13px] text-ink-700">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" aria-hidden="true" />
          {location.note}
        </p>
      </header>

      {guarded ? (
        <div className="rounded-md border border-dashed border-ink-500/50 bg-parchment-50/60 px-3 py-3 text-[13.5px] text-ink-700">
          <p className="flex items-center gap-1.5 font-semibold text-ink-900">
            <EyeOff className="h-4 w-4" aria-hidden="true" />
            Hidden by your spoiler guard
          </p>
          <p className="mt-1">
            What is written about {location.name} refers to events up to chapter {location.spoilerLevel}. You have set the guard at
            chapter {limit}.
          </p>
          <button
            type="button"
            onClick={() => setRevealed(location.id)}
            className="mt-2 rounded-full border border-ink-700/50 px-3 py-1 text-[12px] font-semibold text-ink-900 hover:bg-ink-900 hover:text-parchment-100"
          >
            Show it anyway
          </button>
        </div>
      ) : (
        <>
          {stats.length > 0 ? (
            <dl
              // An odd card out takes the full row rather than leaving a hole beside it.
              className={cn("grid grid-cols-2 gap-2 [&>*:last-child:nth-child(odd)]:col-span-2", stats.length >= 4 && "sm:grid-cols-4")}
              aria-label="At a glance"
            >
              {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </dl>
          ) : null}

          {location.description ? <p className="text-[14.5px] leading-relaxed text-ink-700">{location.description}</p> : null}

          {facts.length > 0 ? (
            <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.label} className={cn(fact.label === "Notable features" && "sm:col-span-2")}>
                  <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-500">{fact.label}</dt>
                  <dd className="text-ink-900">{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {location.keyEvents && location.keyEvents.length > 0 ? (
            <section aria-labelledby={headingId ? `${headingId}-events` : undefined}>
              <h4 id={headingId ? `${headingId}-events` : undefined} className={cn(sectionTitle, "flex items-center gap-1.5")}>
                <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                Key events
              </h4>
              <ol className="mt-1.5 space-y-1.5">
                {location.keyEvents.map((event, index) => (
                  <li key={event} className="flex gap-2 text-[13.5px] leading-snug text-ink-700">
                    <span className="mt-px grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-ink-900 text-[10px] font-bold text-parchment-100" aria-hidden="true">
                      {index + 1}
                    </span>
                    {event}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {visitors.length > 0 ? (
            <section aria-labelledby={headingId ? `${headingId}-visitors` : undefined}>
              <h4 id={headingId ? `${headingId}-visitors` : undefined} className={cn(sectionTitle, "flex items-center gap-1.5")}>
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                Visited by
              </h4>
              <div className="mt-1.5 space-y-2">
                {VISITOR_GROUPS.map(({ kind, label }) => {
                  const group = visitors.filter((visitor) => visitor.kind === kind);
                  return group.length > 0 ? <VisitorChips key={kind} visitors={group} label={label} /> : null;
                })}
              </div>
            </section>
          ) : null}
        </>
      )}

      {arcs.length > 0 ? (
        <section aria-labelledby={headingId ? `${headingId}-timeline` : undefined}>
          <h4 id={headingId ? `${headingId}-timeline` : undefined} className={sectionTitle}>
            On the timeline
          </h4>
          <ul className="mt-1.5 space-y-1">
            {arcs.map((arc) => (
              <li key={arc.id}>
                <a
                  href={`${arcHrefBase}#arc-${arc.id}`}
                  className="text-sm font-semibold text-ocean-700 underline decoration-ocean-700/40 underline-offset-2 hover:text-ocean-600"
                >
                  {arc.name}
                </a>
                <span className="text-[12.5px] text-ink-500"> · {arc.dateLabel}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {location.pois.length > 0 ? (
        <section aria-labelledby={headingId ? `${headingId}-pois` : undefined}>
          <h4 id={headingId ? `${headingId}-pois` : undefined} className={sectionTitle}>
            Points of interest ({location.pois.length})
          </h4>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {location.pois.map((poi) => (
              <li key={poi} className="rounded-sm border border-ink-500/30 bg-parchment-50/70 px-1.5 py-0.5 text-[12px] text-ink-700">
                {poi}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isLandmark(location.id) ? (
        <p>
          <Link
            href={paths.location(location.id)}
            className="text-[13px] font-semibold text-ocean-700 underline decoration-ocean-700/40 underline-offset-2 hover:text-ocean-600"
          >
            Full page for {location.name}
          </Link>
        </p>
      ) : null}

      <SpoilerControl />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Poneglyph                                                            */
/* ------------------------------------------------------------------ */

export function PoneglyphDetails({ stone, headingId }: { stone: Poneglyph; headingId?: string }) {
  return (
    <div>
      <span
        className={cn(
          "rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em]",
          stone.road ? "border-redline-700/50 bg-redline-500/15 text-redline-800" : "border-slate-600/50 bg-slate-500/15 text-slate-800",
        )}
      >
        {stone.road ? "Road Poneglyph" : "Poneglyph"}
      </span>
      <h3 id={headingId} className="mt-1.5 font-display text-3xl leading-none text-ink-900">
        {stone.name}
      </h3>
      <dl className="mt-3 space-y-2 text-sm text-ink-700">
        {stone.location ? (
          <div>
            <dt className={sectionTitle}>Where</dt>
            <dd>{stone.location}</dd>
          </div>
        ) : null}
        {stone.readBy ? (
          <div>
            <dt className={sectionTitle}>Read by</dt>
            <dd>{stone.readBy}</dd>
          </div>
        ) : null}
      </dl>
      {stone.road ? (
        <p className="mt-3 border-l-2 border-redline-500 pl-2.5 text-[13px] leading-snug text-ink-700">
          One of four red stones. Each gives a position; where the four lines cross lies Laugh Tale.
        </p>
      ) : null}
    </div>
  );
}
