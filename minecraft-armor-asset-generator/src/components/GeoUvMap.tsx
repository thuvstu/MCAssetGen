import { useMemo, useState } from "react";
import { PART_LABELS } from "../lib/armorTypes";
import { PART_COLOR } from "../lib/exporter";
import { islandRect, type GeoLayout, type UvRect } from "../lib/geoModel";

interface Props {
  layout: GeoLayout;
  src: string;
  hovered: string | null;
  onHover: (bone: string | null) => void;
}

interface Picked {
  bone: string;
  cube: string;
  part: keyof typeof PART_COLOR;
  rect: UvRect;
}

export function GeoUvMap({ layout, src, hovered, onHover }: Props) {
  const [picked, setPicked] = useState<Picked | null>(null);

  const islands = useMemo(
    () =>
      layout.bones.flatMap((bone) =>
        bone.cubes.map((cube, index) => ({ bone, cube, index, rect: islandRect(cube) }))
      ),
    [layout]
  );
  const size = layout.size;
  const stroke = size / 360;

  const boneSummary = layout.bones.map((bone) => ({
    name: bone.name,
    part: bone.part,
    count: bone.cubes.length,
  }));

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div
        className="relative aspect-square w-full max-w-[720px] overflow-hidden border border-[#444b43]"
        style={{
          backgroundImage: "repeating-conic-gradient(#39403a 0% 25%, #272d28 0% 50%)",
          backgroundSize: "24px 24px",
        }}
      >
        <img
          src={src}
          alt="GeckoLib用UVアトラス"
          className="absolute inset-0 h-full w-full"
          style={{ imageRendering: "pixelated" }}
          draggable={false}
        />
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="キューブごとのUVアイランド"
          onMouseLeave={() => onHover(null)}
        >
          {islands.map(({ bone, cube, index, rect }) => {
            const active = hovered === bone.name;
            return (
              <rect
                key={`${bone.name}-${index}`}
                x={rect.x}
                y={rect.y}
                width={rect.w}
                height={rect.h}
                fill={active ? "rgba(255,200,120,0.28)" : "transparent"}
                stroke={PART_COLOR[bone.part]}
                strokeWidth={stroke}
                onMouseEnter={() => {
                  onHover(bone.name);
                  setPicked({ bone: bone.name, cube: cube.name, part: bone.part, rect });
                }}
              >
                <title>{`${bone.name} / ${cube.name}`}</title>
              </rect>
            );
          })}
        </svg>
      </div>

      <aside className="space-y-7 text-[11px] leading-relaxed text-[#aab2a6]">
        <div className="border-t border-[#41493f] pt-5">
          <div className="eyebrow mb-3">HOVER</div>
          {picked ? (
            <div className="space-y-1.5">
              <div className="font-mono text-[12px] text-[#f0d6ae]">{picked.bone}</div>
              <div className="text-[#e5e1d6]">{picked.cube}</div>
              <div className="font-mono text-[10px] text-[#8e978a]">
                {PART_LABELS[picked.part]} / u {Math.round(picked.rect.x)} v {Math.round(picked.rect.y)} /{" "}
                {Math.round(picked.rect.w)} x {Math.round(picked.rect.h)} px
              </div>
            </div>
          ) : (
            <p className="text-[#8e978a]">島にカーソルを置くと、対応するボーンがプレビューで光ります。</p>
          )}
        </div>

        <div className="border-t border-[#41493f] pt-5">
          <div className="eyebrow mb-3">BONES</div>
          <ul className="space-y-1.5 font-mono text-[10px]">
            {boneSummary.map((bone) => (
              <li
                key={bone.name}
                onMouseEnter={() => onHover(bone.name)}
                onMouseLeave={() => onHover(null)}
                className={`flex items-center justify-between gap-3 px-2 py-1 transition-colors ${
                  hovered === bone.name ? "bg-[#33302a] text-[#f2dcb8]" : "text-[#a6aea1]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2" style={{ background: PART_COLOR[bone.part] }} />
                  {bone.name}
                </span>
                <span className="text-[#788175]">{bone.count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-[#41493f] pt-5 text-[10px] text-[#8e978a]">
          1テクセル = 1モデル単位（1/16ブロック）。島は同じ面積を持たない各キューブを個別に展開しています。
        </div>
      </aside>
    </div>
  );
}
