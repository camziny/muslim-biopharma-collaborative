import { ImageResponse } from "next/og";

export const alt = "Muslim Biopharma Collaborative";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAFAFA",
          color: "#171717",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            background: "#171717",
            color: "#FAFAFA",
            fontSize: 42,
            fontWeight: 700,
            letterSpacing: "0.04em",
            borderRadius: 28,
            marginBottom: 40,
          }}
        >
          MBC
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 650,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          Muslim Biopharma Collaborative
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontSize: 28,
            color: "#737373",
            letterSpacing: "-0.01em",
          }}
        >
          Member directory
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
