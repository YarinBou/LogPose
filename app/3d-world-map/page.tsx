import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteNav } from "@/components/SiteNav";
import { World3D } from "@/components/world3d/World3D";
import { paths } from "@/lib/content";
import { articleSchema, breadcrumbSchema, pageMetadata } from "@/lib/seo";

const TITLE = "One Piece 3D World Map: Interactive Globe";
const DESCRIPTION =
  "The One Piece world as an interactive 3D globe: the Red Line ringing the poles, the Grand Line on the equator, every charted island, and the Thousand Sunny sailing the Straw Hats' course arc by arc.";

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: paths.map3d, type: "website" });

export default function World3DPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "3D World Map", path: paths.map3d },
          ]),
          articleSchema({ path: paths.map3d, headline: TITLE, description: DESCRIPTION }),
        ]}
      />
      <SiteNav solid />
      <main>
        <World3D />
      </main>
    </>
  );
}
