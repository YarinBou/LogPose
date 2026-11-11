import type { MetadataRoute } from "next";
import { ALL_ARCS, SAGAS } from "@/data/timeline";
import { CREW_LIST, LANDMARKS, paths } from "@/lib/content";
import { absoluteUrl, LAST_UPDATED } from "@/lib/site";

type Entry = MetadataRoute.Sitemap[number];

/** Every indexable page on the site, generated from the same data the pages are built from. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(LAST_UPDATED);
  const entry = (path: string, priority: number, changeFrequency: Entry["changeFrequency"] = "monthly"): Entry => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency,
    priority,
  });

  return [
    entry("/", 1, "weekly"),
    entry(paths.arcs, 0.9, "weekly"),
    entry(paths.crew, 0.9),
    entry(paths.locations, 0.9),
    entry(paths.map3d, 0.8),
    ...SAGAS.map((saga) => entry(paths.saga(saga.id), 0.8)),
    ...ALL_ARCS.map((arc) => entry(paths.arc(arc.id), 0.8)),
    ...CREW_LIST.map((member) => entry(paths.crewMember(member.id), 0.7)),
    ...LANDMARKS.map((location) => entry(paths.location(location.id), 0.6)),
  ];
}
