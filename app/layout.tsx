import type { Metadata, Viewport } from "next";
import { Inter, Pirata_One } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { JsonLd } from "@/components/seo/JsonLd";
import { websiteSchema } from "@/lib/seo";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
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

// Search-engine ownership checks. Set these in the Vercel project's environment variables
// with the codes Google Search Console and Bing Webmaster Tools give you.
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  // Lets every page give its canonical and share-image URLs as plain paths.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_TITLE} | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "entertainment",
  keywords: [
    "One Piece timeline",
    "One Piece world map",
    "One Piece arcs in order",
    "One Piece sagas",
    "Straw Hat Pirates",
    "Straw Hat bounties",
    "Grand Line map",
    "Red Line",
    "Sea Circle Calendar",
    "One Piece chronology",
    "One Piece 3D map",
    "Library of Ohara",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_TITLE} | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_TITLE} | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    // Allow full-length snippets and large image previews in results and AI answers.
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
  },
  verification: {
    google: googleVerification,
    other: bingVerification ? { "msvalidate.01": bingVerification } : undefined,
  },
};

export const viewport: Viewport = {
  themeColor: "#06243a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${pirata.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-ocean-950 font-sans antialiased">
        <JsonLd data={websiteSchema()} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
