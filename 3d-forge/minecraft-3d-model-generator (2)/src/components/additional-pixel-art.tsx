import type { ModelKind } from "@/lib/model-types";
export const ADDITIONAL_ART_KINDS: ModelKind[] = [
  "runeblade",
  "cursedblade",
  "bloodblade",
  "elderstaff",
  "bloodstaff",
  "grimoire",
  "magiccircle",
  "bow",
  "rifle",
  "pistol",
  "railgun",
  "chainsaw",
  "relic",
  "spear",
  "mace",
];
export default function AdditionalPixelArt({
  kind,
  size,
}: {
  kind: ModelKind;
  size: number;
}) {
  const blood = kind === "bloodblade" || kind === "bloodstaff",
    dark = kind === "cursedblade";
  const main = blood ? "#e34f66" : dark ? "#9565c8" : "#a694e8",
    light = blood ? "#ffbfbc" : "#dac9ff",
    gold = "#c4a36c",
    steel = "#798a97",
    ink = "#353041";
  return (
    <svg
      className="pixel-art"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {["runeblade", "cursedblade", "bloodblade"].includes(kind) && (
        <>
          <path d="M14 2h4v4h3v13h-3v4h-4v-4h-3V6h3V2Z" fill={ink} />
          <path d="M14 5h4v14h-4V5Z" fill={main} />
          <path d="M15 5h2v15h-2V5Z" fill={light} />
          <path d="M7 19h5v3h8v-3h5v5h-5v2h-8v-2H7v-5Z" fill={gold} />
          <path d="M14 24h4v6h-4v-6Z" fill="#63515a" />
          {(dark || blood) && (
            <path
              d="M10 7h3v3h-3V7Zm9 3h3v3h-3v-3Zm-9 5h3v3h-3v-3Z"
              fill={main}
            />
          )}
          <path d="M15 21h2v2h-2zM14 28h4v2h-4z" fill={main} />
        </>
      )}
      {["elderstaff", "bloodstaff"].includes(kind) && (
        <>
          <path d="M14 13h4v17h-4z" fill={ink} />
          <path d="M15 14h2v16h-2z" fill={gold} />
          <path
            d="M8 3h3v3H8v7h3v3h10v-3h3V6h-3V3h3v3h3v7h-3v5H8v-5H5V6h3V3Z"
            fill={gold}
          />
          <path d="M14 3h4v3h3v6h-3v3h-4v-3h-3V6h3V3Z" fill={main} />
          <path d="M14 5h2v6h-2V5Z" fill={light} />
          <path d="M12 20h8v2h-8zM12 25h8v2h-8z" fill={gold} />
          {blood && <path d="M4 3h3v4H4zM25 3h3v4h-3z" fill={main} />}
        </>
      )}
      {kind === "grimoire" && (
        <>
          <path d="M2 8h11l3 3 3-3h11v18H19l-3 3-3-3H2V8Z" fill={ink} />
          <path
            d="M4 9h8l3 3v13l-3-2H4V9Zm24 0h-8l-3 3v13l3-2h8V9Z"
            fill="#c9bea9"
          />
          <path
            d="M5 12h7v1H5zM5 16h7v1H5zM5 20h7v1H5zM20 12h7v1h-7zM20 16h7v1h-7zM20 20h7v1h-7z"
            fill="#766b84"
          />
          <path
            d="M15 11h2v16h-2zM2 7h4v3H2zM26 7h4v3h-4zM2 24h4v3H2zM26 24h4v3h-4z"
            fill={gold}
          />
          <path d="M13 2h6v3h-6zM15 0h2v7h-2z" fill={main} />
        </>
      )}
      {kind === "magiccircle" && (
        <>
          <path
            d="M10 3h12v3h5v5h3v12h-3v5h-5v3H10v-3H5v-5H2V11h3V6h5V3Z"
            stroke={main}
            strokeWidth="1.2"
          />
          <path
            d="m16 7 9 16H7L16 7Zm0 18L7 10h18l-9 15Z"
            stroke={gold}
            strokeWidth="1"
          />
          <path
            d="M14 14h4v4h-4zM14 2h4v3h-4zM14 28h4v3h-4zM1 14h3v4H1zM28 14h3v4h-3z"
            fill={light}
          />
        </>
      )}
      {kind === "bow" && (
        <>
          <path
            d="M6 2h7v3h6v5h4v12h-4v5h-6v3H6v-3h6v-3h5v-5h2v-6h-2V8h-5V5H6V2Z"
            fill={gold}
          />
          <path d="M6 3h1v25H6zM6 15h23v2H6z" fill="#c9ecd8" />
          <path d="m27 13 4 3-4 3v-6Z" fill="#98d9c3" />
          <path d="M18 13h5v6h-5zM13 6h3v3h-3zM13 23h3v3h-3z" fill="#638676" />
        </>
      )}
      {["rifle", "pistol", "railgun"].includes(kind) && (
        <>
          <path
            d={
              kind === "pistol"
                ? "M6 8h23v6H16v4h-3v11H6V8Z"
                : "M2 10h21v3h7v3h-8v3h-9v7H9v-7H2V10Z"
            }
            fill={steel}
          />
          <path
            d={kind === "pistol" ? "M6 8h23v2H6V8Z" : "M3 9h20v3H3V9Z"}
            fill="#b3bdc4"
          />
          <path d="M10 14h7v3h-7zM11 22h3v5h-3z" fill={ink} />
          {kind === "rifle" && (
            <>
              <path d="M9 4h9v4H9V4Z" fill={ink} />
              <path d="M17 4h3v4h-3zM21 13h9v2h-9z" fill="#93dce0" />
            </>
          )}
          {kind === "railgun" && (
            <>
              <path d="M18 7h12v2H18zM18 17h12v2H18z" fill="#95e7f2" />
              <path d="M19 9h2v8h-2zM24 9h2v8h-2zM29 9h2v8h-2z" fill={gold} />
            </>
          )}
          <path d="M6 17h5v2H6zM5 23h4v2H5z" fill="#3d4854" />
        </>
      )}
      {kind === "chainsaw" && (
        <>
          <path d="M12 2h8v18h-8z" fill={steel} />
          <path d="M14 4h4v14h-4z" fill={ink} />
          {Array.from({ length: 6 }, (_, i) => (
            <path
              key={i}
              d={`M10 ${3 + i * 2}h2v1h-2zM20 ${3 + i * 2}h2v1h-2z`}
              fill="#bbc6c9"
            />
          ))}
          <path d="M8 18h16v8H8zM12 26h8v5h-8z" fill={gold} />
          <path d="M11 20h10v4H11zM13 27h6v3h-6z" fill={ink} />
          <path d="M4 19h4v7H4zM24 19h4v7h-4z" fill={steel} />
        </>
      )}
      {kind === "relic" && (
        <>
          <path
            d="m16 2 11 13-11 15L5 15 16 2Z"
            stroke={gold}
            strokeWidth="2"
          />
          <path d="M13 9h6v3h3v9h-3v3h-6v-3h-3v-9h3V9Z" fill={main} />
          <path d="M13 11h3v9h-3z" fill={light} />
          <path
            d="M3 15h26v2H3zM15 1h2v4h-2zM14 28h4v3h-4zM1 12h3v4H1zM28 12h3v4h-3z"
            fill={gold}
          />
        </>
      )}
      {kind === "spear" && (
        <>
          <path d="M15 12h2v19h-2zM10 13h12v2H10z" fill={gold} />
          <path d="M15 1h2v3h3v7h-3v3h-2v-3h-3V4h3V1Z" fill={main} />
          <path d="M15 3h1v8h-1z" fill={light} />
          <path
            d="M7 11h3v5H7zM10 13h3v5h-3zM19 13h3v5h-3zM22 11h3v5h-3z"
            fill={gold}
          />
          <path d="M9 17h2v7H9zM21 17h2v7h-2zM14 23h4v2h-4z" fill="#8c7199" />
        </>
      )}
      {kind === "mace" && (
        <>
          <path d="M14 16h4v14h-4z" fill={gold} />
          <path d="M9 4h14v14H9V4Z" fill={steel} />
          <path d="M6 6h3v10H6zM23 6h3v10h-3zM12 1h8v3h-8z" fill={gold} />
          <path d="M14 6h4v10h-4z" fill="#95def3" />
          <path d="M12 20h8v2h-8zM12 26h8v2h-8z" fill={ink} />
        </>
      )}
    </svg>
  );
}
