import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteNav } from "@/components/SiteNav";
import { breadcrumbSchema, type Crumb } from "@/lib/seo";
import { cn } from "@/lib/utils";

interface ContentShellProps {
  /** Trail from the home page to this page. The last entry is the page itself. */
  crumbs: Crumb[];
  /** Small line above the title. */
  kicker: string;
  title: string;
  /** Opening paragraph: the page's subject in one or two sentences. */
  lead?: ReactNode;
  children: ReactNode;
  /** Structured data for the page, besides the breadcrumb trail (added here). */
  schema?: Record<string, unknown>[];
}

/**
 * Frame for the reference pages (arcs, sagas, crew, locations). These pages are plain
 * server-rendered HTML with no scroll effects, so the whole text is in the first response
 * for search engines, AI crawlers and screen readers alike.
 */
export function ContentShell({ crumbs, kicker, title, lead, children, schema = [] }: ContentShellProps) {
  return (
    <>
      <JsonLd data={[breadcrumbSchema(crumbs), ...schema]} />
      <SiteNav solid />
      <div
        className="min-h-screen pt-14"
        style={{ background: "linear-gradient(180deg, #0b2a45 0%, #0f4b6e 30%, #0a3551 70%, #031523 100%)" }}
      >
        <main className="mx-auto max-w-4xl px-3 pb-20 pt-6 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.1em] text-parchment-100/80">
              {crumbs.map((crumb, index) => {
                const last = index === crumbs.length - 1;
                return (
                  <li key={crumb.path} className="flex items-center gap-1">
                    {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-gold-400/70" aria-hidden="true" /> : null}
                    {last ? (
                      <span aria-current="page" className="text-gold-300">
                        {crumb.name}
                      </span>
                    ) : (
                      <Link href={crumb.path} className="hover:text-gold-300">
                        {crumb.name}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          <article className="parchment rounded-lg px-5 py-7 sm:px-9 sm:py-9">
            <header>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-500">{kicker}</p>
              <h1 className="mt-1 font-display text-5xl leading-[0.95] text-ink-900 sm:text-6xl">{title}</h1>
              {lead ? <p className="mt-4 text-[17px] leading-relaxed text-ink-700">{lead}</p> : null}
            </header>
            <div className="mt-7 space-y-9">{children}</div>
          </article>
        </main>
      </div>
      <Footer />
    </>
  );
}

/** A titled block inside a content page. */
export function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="border-b border-ink-500/30 pb-1 font-display text-3xl leading-none text-ink-900">{title}</h2>
      <div className="mt-3 space-y-3 text-[15.5px] leading-relaxed text-ink-700">{children}</div>
    </section>
  );
}

export interface Fact {
  label: string;
  value: ReactNode;
}

/** Key facts as a definition list: easy to scan, and easy for a machine to extract. */
export function FactList({ facts }: { facts: Fact[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
      {facts.map((fact) => (
        <div key={fact.label} className="border-b border-ink-500/15 pb-2">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">{fact.label}</dt>
          <dd className="text-[15.5px] text-ink-900">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** In-text link, styled for parchment. */
export function TextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn("font-semibold text-ocean-700 underline decoration-ocean-700/40 underline-offset-2 hover:text-ocean-600", className)}
    >
      {children}
    </Link>
  );
}

/** "Previous / next" links at the foot of a page in a series. */
export function SeriesNav({
  previous,
  next,
}: {
  previous?: { label: string; href: string };
  next?: { label: string; href: string };
}) {
  if (!previous && !next) return null;
  return (
    <nav aria-label="In this series" className="flex flex-col gap-3 border-t border-ink-500/30 pt-5 sm:flex-row sm:justify-between">
      {previous ? (
        <Link href={previous.href} className="group sm:max-w-[48%]">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Previous</span>
          <span className="font-display text-2xl leading-tight text-ink-900 group-hover:text-redline-600">{previous.label}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.href} className="group sm:max-w-[48%] sm:text-right">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Next</span>
          <span className="font-display text-2xl leading-tight text-ink-900 group-hover:text-redline-600">{next.label}</span>
        </Link>
      ) : null}
    </nav>
  );
}

/** Closing line on every reference page: where the facts come from. */
export function SourceNote() {
  return (
    <p className="border-t border-ink-500/30 pt-4 text-[12.5px] leading-snug text-ink-500">
      Dates and place names follow the Library of Ohara&apos;s{" "}
      <a href="https://thelibraryofohara.com/the-one-piece-timeline/" target="_blank" rel="noreferrer" className="underline underline-offset-2">
        One Piece timeline
      </a>{" "}
      and{" "}
      <a href="https://thelibraryofohara.com/onepieceworldmap/" target="_blank" rel="noreferrer" className="underline underline-offset-2">
        world map
      </a>
      . LogPose is an unofficial fan project; One Piece is created by Eiichiro Oda.
    </p>
  );
}
