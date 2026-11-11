import type { Metadata, Viewport } from "next";
import { Inter, Pirata_One } from "next/font/google";
import "./globals.css";

const pirata = Pirata_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pirata",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LogPose: the voyage of the Straw Hat Pirates",
    template: "%s | LogPose",
  },
  description:
    "An interactive chronicle of the One Piece timeline, lore and geography: every arc of the Straw Hat Pirates' journey, dated on the Sea Circle Calendar and charted on the world map.",
  keywords: ["One Piece", "timeline", "Straw Hat Pirates", "Grand Line", "world map", "Library of Ohara"],
};

export const viewport: Viewport = {
  themeColor: "#06243a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${pirata.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-ocean-950 font-sans antialiased">{children}</body>
    </html>
  );
}
