"use client";

import { Download, Upload } from "lucide-react";
import type { GeneratedModel, UVRect } from "@/lib/model-types";
import { useStudioStore } from "./studio-context";

/** Unique UV rectangles, so overlapping cubes only outline once. */
function uniqueRegions(model: GeneratedModel): UVRect[] {
  return [
    ...new Map(
      model.cubes.map((cube) => [cube.uv.join(","), cube.uv]),
    ).values(),
  ];
}

export default function UvEditor({
  model,
  onOpenAtlasPicker,
}: {
  model: GeneratedModel;
  onOpenAtlasPicker: () => void;
}) {
  const { exporter, openModal } = useStudioStore();
  const { width, height, source, name } = model.texture;

  return (
    <div className="uv-workspace">
      <div className="uv-large-texture">
        <img src={source} alt="UVテクスチャアトラス" />
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="uv-overlay"
          aria-hidden="true"
        >
          {uniqueRegions(model).map((uv, index) => (
            <rect
              key={index}
              x={uv[0]}
              y={uv[1]}
              width={uv[2] - uv[0]}
              height={uv[3] - uv[1]}
              fill="none"
              stroke="#f4de92"
              strokeWidth={width / 350}
            />
          ))}
        </svg>
      </div>

      <div className="uv-info">
        <span className="eyebrow">TEXTURE ATLAS</span>
        <h3>{name}</h3>
        <p>
          {width} × {height} pixels
        </p>
        <span className="uv-legend">
          <i />
          キューブのUV領域
        </span>
        <p className="uv-explanation">
          テクスチャの色領域と各キューブを
          <br />
          自動でマッピングしています。
        </p>
        <button className="secondary-button" onClick={onOpenAtlasPicker}>
          <Upload size={14} />
          アトラスを変更
        </button>
        <button
          className="text-button uv-export"
          onClick={() => {
            exporter.setFormat("png");
            openModal("export");
          }}
        >
          <Download size={14} />
          PNGで保存
        </button>
      </div>
    </div>
  );
}
