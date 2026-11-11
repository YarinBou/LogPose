/**
 * Share images: the 1200 x 630 card shown when a page is linked in a chat, a post or a
 * search result. Drawn with next/og, which renders a small subset of CSS (flexbox only),
 * so the layout here is deliberately simple: sea, Grand Line band, Red Line, and text.
 */
import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

interface OgCardInput {
  /** Small line above the title. */
  kicker: string;
  title: string;
  /** One line under the title. */
  subtitle?: string;
}

export function ogCard({ kicker, title, subtitle }: OgCardInput): ImageResponse {
  // Long titles step down in size so they stay on two lines.
  const titleSize = title.length > 30 ? 64 : title.length > 14 ? 84 : 104;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "linear-gradient(180deg, #0b2a45 0%, #0f4b6e 45%, #0a3551 75%, #031523 100%)",
          color: "#fbf4e1",
          fontFamily: "sans-serif",
        }}
      >
        {/* Grand Line between its Calm Belts */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 436, height: 12, background: "rgba(211,238,245,0.22)", display: "flex" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 448, height: 84, background: "rgba(32,137,173,0.55)", display: "flex" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 532, height: 12, background: "rgba(211,238,245,0.22)", display: "flex" }} />

        {/* Red Line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 150,
            width: 96,
            display: "flex",
            background: "linear-gradient(90deg, #4d0c0e 0%, #94191a 22%, #cf4034 50%, #b3261e 64%, #4d0c0e 100%)",
          }}
        />

        {/* text */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", width: 900, height: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 30, letterSpacing: 6, textTransform: "uppercase", color: "#f6dc8b" }}>
            <div style={{ display: "flex", width: 44, height: 44, borderRadius: 22, border: "5px solid #ecc14f", marginRight: 18 }} />
            {SITE_NAME}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 28, letterSpacing: 4, textTransform: "uppercase", color: "#f6dc8b", marginBottom: 14 }}>
              {kicker}
            </div>
            <div style={{ display: "flex", fontSize: titleSize, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>{title}</div>
            {subtitle ? (
              <div style={{ display: "flex", fontSize: 32, lineHeight: 1.3, marginTop: 22, color: "#d3eef5" }}>{subtitle}</div>
            ) : null}
          </div>

          <div style={{ display: "flex", fontSize: 24, color: "rgba(251,244,225,0.75)" }}>One Piece timeline and world map</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
