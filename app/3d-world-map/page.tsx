import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { World3D } from "@/components/world3d/World3D";

export const metadata: Metadata = {
  title: "3D World Map",
  description:
    "The One Piece world as a globe: the Red Line ringing the poles, the Grand Line on the equator, every charted island, and the Thousand Sunny sailing the Straw Hats' course. Built with three.js and Blender.",
};

export default function World3DPage() {
  return (
    <>
      <SiteNav solid />
      <main>
        <World3D />
      </main>
    </>
  );
}
