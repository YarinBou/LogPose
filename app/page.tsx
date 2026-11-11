import type { Metadata } from "next";
import { CrewManifest } from "@/components/CrewManifest";
import { PandamanHuntProvider } from "@/components/EasterEggs";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { WorldMap } from "@/components/map/WorldMap";
import { ParallaxBackdrop } from "@/components/ParallaxBackdrop";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteNav } from "@/components/SiteNav";
import { GrandTimeline } from "@/components/timeline/GrandTimeline";
import { getLocation } from "@/data/map";
import { ALL_ARCS, PANDAMAN_TOTAL } from "@/data/timeline";
import { paths } from "@/lib/content";
import { FAQ } from "@/lib/faq";
import { collectionSchema, faqSchema } from "@/lib/seo";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_TITLE} | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
};

/**
 * Fail the build, rather than ship a broken link, if the timeline points at a map location
 * that does not exist or the Pandaman count drifts from the three the hunt promises.
 */
function assertDataIntegrity(): void {
  for (const arc of ALL_ARCS) {
    for (const id of arc.locationIds) {
      if (!getLocation(id)) {
        throw new Error(`Arc "${arc.id}" refers to unknown map location "${id}".`);
      }
    }
  }
  if (PANDAMAN_TOTAL !== 3) {
    throw new Error(`Expected exactly 3 hidden Pandamen, found ${PANDAMAN_TOTAL}.`);
  }
}

export default function HomePage() {
  assertDataIntegrity();

  return (
    <PandamanHuntProvider total={PANDAMAN_TOTAL}>
      <JsonLd
        data={[
          collectionSchema({
            path: "/",
            name: `${SITE_TITLE}: every arc in order`,
            description: SITE_DESCRIPTION,
            items: ALL_ARCS.map((arc) => ({ name: `${arc.name} Arc`, path: paths.arc(arc.id) })),
          }),
          faqSchema(FAQ),
        ]}
      />
      <ParallaxBackdrop />
      <SiteNav />
      <main className="relative">
        <Hero />
        <GrandTimeline />
        <CrewManifest />
        <WorldMap />
        <Faq />
      </main>
      <Footer />
    </PandamanHuntProvider>
  );
}
