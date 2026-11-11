/**
 * Builders for page metadata and schema.org structured data (JSON-LD).
 * Structured data tells search engines and AI crawlers what a page is about without
 * making them infer it from the layout.
 */
import type { Metadata } from "next";
import { absoluteUrl, LAST_UPDATED, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

type Json = Record<string, unknown>;

/** The work this whole site is about. Referenced from every page's structured data. */
export const ONE_PIECE: Json = {
  "@type": "ComicSeries",
  name: "One Piece",
  author: { "@type": "Person", name: "Eiichiro Oda" },
  publisher: { "@type": "Organization", name: "Shueisha" },
  sameAs: ["https://en.wikipedia.org/wiki/One_Piece"],
};

const WEBSITE_ID = `${SITE_URL}/#website`;

export function websiteSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    alternateName: `${SITE_NAME}: ${SITE_TITLE}`,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    about: ONE_PIECE,
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbSchema(crumbs: Crumb[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

interface ArticleInput {
  path: string;
  headline: string;
  description: string;
  /** Extra things the page is about, beyond One Piece itself. */
  about?: Json[];
}

export function articleSchema({ path, headline, description, about = [] }: ArticleInput): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    inLanguage: "en",
    dateModified: LAST_UPDATED,
    datePublished: LAST_UPDATED,
    isPartOf: { "@id": WEBSITE_ID },
    about: [ONE_PIECE, ...about],
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}

interface ListInput {
  path: string;
  name: string;
  description: string;
  items: { name: string; path: string }[];
}

/** A page that is mainly an ordered list of other pages. */
export function collectionSchema({ path, name, description, items }: ListInput): Json {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteUrl(path),
    inLanguage: "en",
    dateModified: LAST_UPDATED,
    isPartOf: { "@id": WEBSITE_ID },
    about: ONE_PIECE,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: absoluteUrl(item.path),
      })),
    },
  };
}

export function faqSchema(entries: { question: string; answer: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

interface PageMetaInput {
  /** Page title without the site name; the root layout appends it. */
  title: string;
  description: string;
  path: string;
  /** "article" for single-topic pages, "website" for the home page and lists. */
  type?: "article" | "website";
}

/** Title, description, canonical URL and share-card fields for one page. */
export function pageMetadata({ title, description, path, type = "article" }: PageMetaInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      title: `${title} | ${SITE_NAME}`,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}
