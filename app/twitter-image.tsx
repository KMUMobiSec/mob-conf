import { ImageResponse } from "next/og";
import { CURRENT_YEAR, YEAR_CONFIG } from "@/constants/config";

export const runtime = "edge";

const config = YEAR_CONFIG[CURRENT_YEAR];

export const alt = `EBISION ${CURRENT_YEAR} — The ${config.edition} IFIP WG 8.4 International Symposium on E-Business Information Systems Evolution`;

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #1a2e0a 0%, #2d4a14 30%, #578429 70%, #7AB356 100%)",
        fontFamily: "system-ui, sans-serif",
        padding: "60px 80px",
      }}
    >
      {/* Top badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.15)",
            borderRadius: "999px",
            padding: "8px 24px",
            fontSize: "18px",
            color: "rgba(255,255,255,0.9)",
            letterSpacing: "2px",
            textTransform: "uppercase" as const,
          }}
        >
          IFIP WG 8.4 International Symposium
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: "72px",
          fontWeight: 800,
          color: "#ffffff",
          textAlign: "center",
          lineHeight: 1.1,
          marginBottom: "16px",
          letterSpacing: "-1px",
        }}
      >
        EBISION {CURRENT_YEAR}
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: "24px",
          color: "rgba(255,255,255,0.85)",
          textAlign: "center",
          lineHeight: 1.4,
          maxWidth: "800px",
          marginBottom: "32px",
        }}
      >
        The {config.edition} International Symposium on E-Business Information Systems Evolution
      </div>

      {/* Divider */}
      <div
        style={{
          width: "80px",
          height: "3px",
          background: "rgba(255,255,255,0.4)",
          borderRadius: "2px",
          marginBottom: "32px",
        }}
      />

      {/* Details */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "32px",
          fontSize: "20px",
          color: "rgba(255,255,255,0.8)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>{config.dates}</span>
        </div>
        <div
          style={{
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.5)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>
            {config.venue}, {config.location}
          </span>
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
