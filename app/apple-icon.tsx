import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the Log Pose needle on deep sea blue. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#06243a" }}>
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 66,
            border: "10px solid #ecc14f",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(211,238,245,0.14)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: "rotate(18deg)" }}>
            <div style={{ width: 0, height: 0, borderLeft: "13px solid transparent", borderRight: "13px solid transparent", borderBottom: "46px solid #cf4034" }} />
            <div style={{ width: 0, height: 0, borderLeft: "13px solid transparent", borderRight: "13px solid transparent", borderTop: "46px solid #fbf4e1" }} />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
