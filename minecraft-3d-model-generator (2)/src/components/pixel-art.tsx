import type { ModelKind } from "@/lib/model-types";
import AdditionalPixelArt, {
  ADDITIONAL_ART_KINDS,
} from "./additional-pixel-art";

export function ForgeLogo({ small = false }: { small?: boolean }) {
  return (
    <svg
      width={small ? 24 : 33}
      height={small ? 28 : 37}
      viewBox="0 0 36 40"
      fill="none"
      aria-hidden="true"
    >
      <path d="M18 1 35 10.5v19L18 39 1 29.5v-19L18 1Z" fill="#a992f1" />
      <path d="m18 1 17 9.5-17 10L1 10.5 18 1Z" fill="#c5b2ff" />
      <path d="M18 20.5 35 10.5v19L18 39V20.5Z" fill="#8065ca" />
      <path d="m10 15 8 4.5 8-4.5v10l-8 4.5-8-4.5V15Z" fill="#17121f" />
      <path d="m18 10 8 4.7-8 4.6-8-4.6L18 10Z" fill="#efebff" />
      <path d="M18 19.4v10l-8-4.5v-10l8 4.5Z" fill="#d8ccfc" />
      <path d="m18 19.4 8-4.5v10l-8 4.5v-10Z" fill="#a894df" />
    </svg>
  );
}

export default function PixelArt({
  kind,
  size = 48,
  variant = "default",
}: {
  kind: ModelKind;
  size?: number;
  variant?: string;
}) {
  if (ADDITIONAL_ART_KINDS.includes(kind))
    return <AdditionalPixelArt kind={kind} size={size} />;
  const emerald = variant === "emerald" || kind === "axe";
  const purple = variant === "purple" || kind === "staff" || kind === "shield";
  const main = purple ? "#a68cdb" : emerald ? "#6dc995" : "#6ccdc3";
  const light = purple ? "#d7bcff" : emerald ? "#a7e9b1" : "#aff3e0";
  const mid = purple ? "#725593" : emerald ? "#397b65" : "#348885";
  const dark = "#263f46",
    wood = "#ad8759",
    woodDark = "#655043";
  return (
    <svg
      className="pixel-art"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      shapeRendering="crispEdges"
      fill="none"
      aria-hidden="true"
    >
      {kind === "sword" && (
        <>
          <path
            d="M24 2h6v6h-2v4h-4v4h-4v4h-4v4h-4v-4H8v-4h4v-4h4V8h4V4h4V2Z"
            fill={dark}
          />
          <path
            d="M25 4h3v4h-2v3h-4v4h-4v4h-4v-3h2v-4h4V8h4V5h1V4Z"
            fill={main}
          />
          <path
            d="M25 4h3v2h-3v3h-4v4h-4v4h-3v-2h2v-4h4V7h4V5h1V4Z"
            fill={light}
          />
          <path d="M24 10h2v2h-4v4h-4v4h-4v-2h3v-4h4v-4h3Z" fill={mid} />
          <path d="M7 15h3v3h3v3h3v3h-3v-2h-3v-3H7v-4Z" fill={wood} />
          <path d="m9 21 3 3-6 6H2v-4l7-5Z" fill={woodDark} />
          <path d="M8 23h3v2H8v3H5v-3h3v-2Z" fill="#a78a75" />
          <path d="M2 27h3v3H2v-3Z" fill={mid} />
        </>
      )}
      {kind === "pickaxe" && (
        <>
          <path
            d="M7 3h12v3h5v4h3v5h3v8h-4v-5h-3v-5h-4v-3h-5V7H7V3Z"
            fill={dark}
          />
          <path
            d="M8 4h10v3h5v4h3v5h2v5h-2v-4h-3v-5h-5V9h-5V6H8V4Z"
            fill={main}
          />
          <path d="M8 4h10v2H8V4Zm10 3h5v2h-5V7Z" fill={light} />
          <path
            d="M18 10h4v4h-4v4h-4v4h-4v4H6v4H2v-5h4v-4h4v-4h4v-4h4v-3Z"
            fill={woodDark}
          />
          <path
            d="M18 12h2v2h-3v4h-4v4H9v4H5v3H3v-3h4v-4h4v-4h4v-4h3v-2Z"
            fill={wood}
          />
        </>
      )}
      {kind === "axe" && (
        <>
          <path d="M15 3h6v3h4v4h4v8h-4v3h-7v-4h-4v-4h-3V7h4V3Z" fill={dark} />
          <path d="M19 5h2v3h4v4h2v5h-4v2h-4v-4h-3v-4h-2V8h5V5Z" fill={main} />
          <path d="M22 9h3v3h2v5h-3v2h-4v-3h4v-4h-2V9Z" fill={light} />
          <path
            d="M14 10h4v5h-4v4h-4v4H6v5H2v-5h4v-4h4v-4h4v-5Z"
            fill={woodDark}
          />
          <path d="M14 12h2v3h-3v4H9v4H5v4H3v-3h4v-4h4v-4h3v-4Z" fill={wood} />
          <path d="M13 8h4v4h-4V8Z" fill="#c5ad78" />
        </>
      )}
      {kind === "shield" && (
        <>
          <path
            d="M7 3h18v3h3v15h-3v4h-4v3h-5v3h-3v-3H9v-3H5v-5H3V6h4V3Z"
            fill="#454049"
          />
          <path
            d="M7 5h17v3h2v12h-3v4h-4v3h-5v-2h-4v-3H7v-4H5V8h2V5Z"
            fill={wood}
          />
          <path
            d="M9 7h13v3h2v9h-3v3h-4v3h-3v-3h-4v-3H8v-9h1V7Z"
            fill="#594969"
          />
          <path d="M14 7h3v16h-3V7Z" fill={mid} />
          <path d="M12 11h7v3h3v4h-3v3h-7v-3H9v-4h3v-3Z" fill={wood} />
          <path d="M13 12h5v3h2v2h-3v3h-3v-3h-3v-2h2v-3Z" fill={main} />
          <path d="M13 12h4v3h-4v-3Z" fill={light} />
        </>
      )}
      {kind === "staff" && (
        <>
          <path d="M21 2h6v3h3v7h-3v4h-7v-3h-3V5h4V2Z" fill={dark} />
          <path d="M22 3h4v3h3v5h-4v3h-4v-3h-3V6h4V3Z" fill={main} />
          <path d="M22 4h4v2h-3v5h-4V7h3V4Z" fill={light} />
          <path
            d="M15 9h3v5h5v3h-6v4h-4v4H9v4H5v2H2v-5h4v-4h4v-4h4v-4h1V9Z"
            fill={woodDark}
          />
          <path
            d="M16 11h2v5h4v2h-6v3h-4v4H8v4H4v-2h3v-4h4v-4h4v-4h1v-4Z"
            fill={wood}
          />
          <path d="M8 23h3v3H8v-3Z" fill={main} />
        </>
      )}
      {kind === "block" && (
        <>
          <path d="m16 3 13 7v15l-13 7L3 25V10l13-7Z" fill="#314946" />
          <path d="m16 3 13 7-13 7L3 10l13-7Z" fill="#719379" />
          <path d="M3 10 16 17v15L3 25V10Z" fill="#506a61" />
          <path d="m16 17 13-7v15l-13 7V17Z" fill="#3a504b" />
          <path d="M7 14h4v4H7v-4Zm4 7h4v4h-4v-4Zm-6 0h3v3H5v-3Z" fill={main} />
          <path
            d="M20 18h4v4h-4v-4Zm4-5h3v3h-3v-3Zm-6 12h3v3h-3v-3Z"
            fill={mid}
          />
          <path
            d="M13 6h5v3h-5V6Zm6 3h5v3h-5V9Zm-9 1h4v3h-4v-3Z"
            fill={light}
          />
        </>
      )}
      {kind === "drill" && (
        <>
          <path d="M12 15h8v11h-8zM13 27h6v3h-6z" fill="#22262c" />
          <path d="M8 10h16v8H8z" fill="#3b434c" />
          <path
            d="M6 11h2v6H6zM24 11h2v6h-2zM10 8h4v2h-4zM18 8h4v2h-4z"
            fill="#69757f"
          />
          <path d="M13 8h6v2h-6z" fill="#c98f3a" />
          <path d="M12 2h8v2h-8zM14 4h6v2h-6zM12 6h8v2h-8z" fill="#9fadb8" />
          <path d="M12 2h4v2h-4z" fill="#dfe9f2" />
          <path d="M15 16h2v6h-2z" fill="#c98f3a" />
          <path d="M8 20h3v2H8zM21 20h3v2h-3z" fill="#3f6f8a" />
        </>
      )}
      {kind === "cannon" && (
        <>
          <path d="M12 2h8v14h-8z" fill="#69757f" />
          <path d="M13 3h3v12h-3z" fill="#9fadb8" />
          <path
            d="M10 4h2v2h-2zM20 4h2v2h-2zM10 8h2v2h-2zM20 8h2v2h-2z"
            fill="#c98f3a"
          />
          <path d="M9 15h14v8H9z" fill="#3b434c" />
          <path d="M11 17h10v4H11z" fill="#3f6f8a" />
          <path d="M14 18h4v2h-4z" fill="#dfe9f2" />
          <path d="M13 23h6v7h-6z" fill="#22262c" />
          <path d="M6 17h3v4H6zM23 17h3v4h-3z" fill="#c98f3a" />
          <path d="M26 18h2v2h-2zM4 18h2v2H4z" fill="#69757f" />
        </>
      )}
      {kind === "mechblade" && (
        <>
          <path d="M13 2h6v5h-6zM12 8h8v5h-8zM12 14h8v5h-8z" fill="#69757f" />
          <path d="M14 3h2v16h-2z" fill="#3f6f8a" />
          <path d="M15 2h2v20h-2z" fill="#dfe9f2" />
          <path d="M8 19h16v5H8z" fill="#3b434c" />
          <path d="M10 20h12v2H10z" fill="#c98f3a" />
          <path d="M6 20h2v4H6zM24 20h2v4h-2z" fill="#22262c" />
          <path d="M7 24h2v2H7zM23 24h2v2h-2z" fill="#3f6f8a" />
          <path d="M13 24h6v6h-6z" fill="#22262c" />
        </>
      )}
    </svg>
  );
}
