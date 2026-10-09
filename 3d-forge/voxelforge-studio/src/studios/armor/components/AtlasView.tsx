import { useState } from "react";
import { PART_COLOR } from "../lib/exporter";
import { ATLAS_H, ATLAS_W, FACE_LABEL, LAYER1_FACES, LAYER2_FACES } from "../lib/uvLayout";
import { Button, Toggle } from "./ui";

interface Props {
  layer: 1 | 2;
  src: string;
  fromUpload: boolean;
  onDownloadAtlas: () => void;
  onDownloadGuide: () => void;
  onDownloadBlank: () => void;
}

const LAYER_INFO = {
  1: {
    name: "humanoid（layer_1）",
    path: "textures/entity/equipment/humanoid/",
    desc: "ヘルメット（頭）・チェストプレート（胴＋腕）・ブーツ（脚）",
  },
  2: {
    name: "humanoid_leggings（layer_2）",
    path: "textures/entity/equipment/humanoid_leggings/",
    desc: "レギンス（脚＋腰）",
  },
} as const;

export function AtlasView({ layer, src, fromUpload, onDownloadAtlas, onDownloadGuide, onDownloadBlank }: Props) {
  const [overlay, setOverlay] = useState(true);
  const faces = layer === 1 ? LAYER1_FACES : LAYER2_FACES;
  const info = LAYER_INFO[layer];

  return (
    <section className="space-y-5 border-t border-[#41473e] pt-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl text-[#f0e7d7]">{info.name}</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-[#90998e]">
            <span className="font-mono">{info.path}</span> / {info.desc}
          </p>
          {fromUpload && (
            <p className="mt-2 text-[10px] text-[#dcba84]">手描きPNGを表示中</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-2 min-w-[130px]">
            <Toggle label="UVガイド" checked={overlay} onChange={setOverlay} />
          </div>
          <Button variant="secondary" onClick={onDownloadAtlas}>
            アトラス PNG
          </Button>
          <Button variant="secondary" onClick={onDownloadGuide}>
            ガイド付き PNG
          </Button>
          <Button variant="ghost" onClick={onDownloadBlank} title="白紙のUVテンプレート">
            白紙テンプレ
          </Button>
        </div>
      </div>

      <div
        className="relative mx-auto w-full overflow-hidden border border-[#444b43] p-3"
        style={{
          backgroundImage: "repeating-conic-gradient(#39403a 0% 25%, #272d28 0% 50%)",
          backgroundSize: "24px 24px",
        }}
      >
        <div className="relative mx-auto w-full" style={{ aspectRatio: `${ATLAS_W} / ${ATLAS_H}` }}>
          <img
            src={src}
            alt={`layer ${layer} atlas`}
            className="absolute inset-0 h-full w-full"
            style={{ imageRendering: "pixelated" }}
            draggable={false}
          />
          {overlay && (
            <svg
              viewBox={`0 0 ${ATLAS_W} ${ATLAS_H}`}
              className="pointer-events-none absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
            >
              {faces.map((f, i) => {
                const { x, y, w, h } = f.rect;
                return (
                  <g key={i}>
                    <rect
                      x={x + 0.06}
                      y={y + 0.06}
                      width={w - 0.12}
                      height={h - 0.12}
                      fill="none"
                      stroke={PART_COLOR[f.part]}
                      strokeWidth={0.13}
                    />
                    <text
                      x={x + w / 2}
                      y={y + h / 2}
                      fontSize={Math.min(1.9, w / 2.6, h / 2.6)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      stroke="black"
                      strokeWidth={0.22}
                      paintOrder="stroke"
                    >
                      {FACE_LABEL[f.name]}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-[11px] text-[#aab2a6]">
        {(Object.keys(PART_COLOR) as (keyof typeof PART_COLOR)[])
          .filter((p) => (layer === 1 ? p !== "leggings" : p === "leggings"))
          .map((p) => (
            <span key={p} className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5" style={{ background: PART_COLOR[p] }} />
              {p === "helmet" && "ヘルメット"}
              {p === "chest" && "チェスト"}
              {p === "leggings" && "レギンス"}
              {p === "boots" && "ブーツ"}
            </span>
          ))}
      </div>
    </section>
  );
}
