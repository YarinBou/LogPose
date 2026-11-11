import { CrewManifest } from "@/components/CrewManifest";
import { PandamanHuntProvider } from "@/components/EasterEggs";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { WorldMap } from "@/components/map/WorldMap";
import { ParallaxBackdrop } from "@/components/ParallaxBackdrop";
import { SiteNav } from "@/components/SiteNav";
import { GrandTimeline } from "@/components/timeline/GrandTimeline";
import { getLocation } from "@/data/map";
import { ALL_ARCS, PANDAMAN_TOTAL } from "@/data/timeline";

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
      <ParallaxBackdrop />
      <SiteNav />
      <main className="relative">
        <Hero />
        <GrandTimeline />
        <CrewManifest />
        <WorldMap />
      </main>
      <Footer />
    </PandamanHuntProvider>
  );
}
