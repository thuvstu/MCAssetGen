"use client";

import { useState, type DragEvent, type RefObject } from "react";
import {
  CheckCheck,
  Expand,
  Info,
  Layers3,
  RotateCcw,
  Upload,
} from "lucide-react";
import { useStudioStore } from "./studio-context";

interface TexturePanelProps {
  inputRef: RefObject<HTMLInputElement | null>;
  onOpenAtlasPicker: () => void;
}

function approximateKilobytes(dataUrl: string): number {
  return Math.max(1, Math.round((dataUrl.length * 0.75) / 1024));
}

export default function TexturePanel({
  inputRef,
  onOpenAtlasPicker,
}: TexturePanelProps) {
  const { studio, setTab, notify } = useStudioStore();
  const [dragging, setDragging] = useState(false);
  const { model, settings, busy } = studio;

  const acceptFile = async (file: File | undefined) => {
    setDragging(false);
    await studio.uploadAtlas(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(true);
  };

  const onDragLeave = (event: DragEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node))
      setDragging(false);
  };

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    void acceptFile(event.dataTransfer.files[0]);
  };

  const copyColor = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color);
      notify(`${color} をコピーしました。`);
    } catch {
      notify(color, "info");
    }
  };

  return (
    <section
      className={`texture-panel ${dragging ? "is-dragging" : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      aria-label="UVアトラス"
    >
      <div className="texture-panel-heading">
        <h2>
          <Layers3 size={15} />
          UVアトラス
          <span
            className="info-dot"
            title="PNG画像を読み込むと、画像の色を3Dモデルに適用します。"
          >
            <Info size={12} />
          </span>
        </h2>
        <div>
          <span className="texture-size-badge">
            {model.texture.width} × {model.texture.height} px
          </span>
          {settings.atlas && (
            <button
              className="icon-button small"
              onClick={studio.clearAtlas}
              disabled={busy}
              title="デフォルトのアトラスに戻す"
            >
              <RotateCcw size={13} />
            </button>
          )}
          <button
            className="icon-button small"
            title="UVエディタで開く"
            onClick={() => setTab("uv")}
          >
            <Expand size={13} />
          </button>
        </div>
      </div>

      <div className="texture-panel-content">
        <button
          className="texture-thumbnail"
          onClick={() => setTab("uv")}
          title="UVアトラスを拡大"
        >
          <img src={model.texture.source} alt="現在のUVアトラス" />
          <span>
            <Expand size={13} />
          </span>
        </button>

        <div className="texture-file-info">
          <strong title={model.texture.name}>{model.texture.name}</strong>
          <p>
            PNG <span>·</span> {approximateKilobytes(model.texture.source)} KB
          </p>
          <span className="texture-applied">
            <CheckCheck size={12} />
            テクスチャ適用済み
          </span>
          <div className="palette-swatches">
            {model.palette.map((color, index) => (
              <button
                key={index}
                style={{ backgroundColor: color }}
                title={`${color} をコピー`}
                aria-label={`${color} をコピー`}
                onClick={() => void copyColor(color)}
              />
            ))}
          </div>
        </div>

        <button
          className="texture-dropzone"
          onClick={onOpenAtlasPicker}
          disabled={busy}
        >
          <Upload size={19} />
          <span>UVアトラスをドロップ</span>
          <small>
            または <b>ファイルを選択</b>
          </small>
          <em>PNG · 最大 2 MB</em>
        </button>
      </div>

      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/png"
        onChange={(event) => void acceptFile(event.target.files?.[0])}
        aria-label="UVアトラスをアップロード"
      />
    </section>
  );
}
