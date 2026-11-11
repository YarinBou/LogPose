import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from "@/lib/site";

/** Web app manifest: name, colours and icons for "add to home screen" and browser UI. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}: ${SITE_TITLE}`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#031523",
    theme_color: "#06243a",
    categories: ["entertainment", "education", "books"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
