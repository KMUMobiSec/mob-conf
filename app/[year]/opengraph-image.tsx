import { ImageResponse } from "next/og";
import { VALID_YEARS, type ValidYear, YEAR_CONFIG } from "@/constants/config";

export const runtime = "edge";

export const alt =
  "EBISION — IFIP WG 8.4 International Symposium on E-Business Information Systems Evolution";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const yearNum = Number(year) as ValidYear;

  const config = VALID_YEARS.includes(yearNum)
    ? YEAR_CONFIG[yearNum]
    : YEAR_CONFIG[2026 as ValidYear]; // fallback

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
        EBISION {year}
      </div>
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
      <div
        style={{
          width: "80px",
          height: "3px",
          background: "rgba(255,255,255,0.4)",
          borderRadius: "2px",
          marginBottom: "32px",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "32px",
          fontSize: "20px",
          color: "rgba(255,255,255,0.8)",
        }}
      >
        <span>{config.dates}</span>
        <div
          style={{
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.5)",
          }}
        />
        <span>
          {config.venue}, {config.location}
        </span>
      </div>
    </div>,
    { ...size },
  );
}
