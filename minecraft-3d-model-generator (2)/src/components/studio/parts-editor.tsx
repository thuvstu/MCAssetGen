"use client";
import { useMemo, useState } from "react";
import {
  Box,
  Check,
  Copy,
  Eye,
  EyeOff,
  Layers,
  Plus,
  Redo2,
  Search,
  Trash2,
  Undo2,
} from "lucide-react";
import { cubeGroup } from "@/lib/editor-recipe";
import type { Vec3 } from "@/lib/model-types";
import Toggle from "@/components/ui/toggle";
import { useStudioStore } from "./studio-context";

export default function PartsEditor() {
  const { studio, viewportActions } = useStudioStore();
  const [query, setQuery] = useState(""),
    [limit, setLimit] = useState(80);
  const cube = studio.model.cubes.find((c) => c.name === studio.selectedCube);
  const visible = useMemo(
    () =>
      studio.model.cubes.filter((c) =>
        (c.label ?? c.name).toLowerCase().includes(query.toLowerCase()),
      ),
    [studio.model.cubes, query],
  );
  const groups = useMemo(() => {
    const result = new Map<string, typeof visible>();
    for (const c of visible.slice(0, limit)) {
      const group = cubeGroup(c);
      result.set(group, [...(result.get(group) ?? []), c]);
    }
    return [...result];
  }, [visible, limit]);
  const select = (name: string) => {
    studio.selectCube(name);
    viewportActions.setActionScrub(0);
  };
  const move = (axis: number, value: number) => {
    if (!cube) return;
    const old = (cube.from[axis] + cube.to[axis]) / 2,
      half = (cube.to[axis] - cube.from[axis]) / 2;
    const centre = Math.max(-23.4 + half, Math.min(23.4 - half, value));
    const from = cube.from.map((n, i) =>
        i === axis ? n + centre - old : n,
      ) as Vec3,
      to = cube.to.map((n, i) => (i === axis ? n + centre - old : n)) as Vec3;
    studio.editCube({ target: cube.name, from, to });
  };
  const resize = (axis: number, value: number) => {
    if (!cube) return;
    const centre = (cube.from[axis] + cube.to[axis]) / 2,
      half = Math.max(0.025, Math.min(value / 2, 23.4 - Math.abs(centre)));
    studio.editCube({
      target: cube.name,
      from: cube.from.map((n, i) => (i === axis ? centre - half : n)) as Vec3,
      to: cube.to.map((n, i) => (i === axis ? centre + half : n)) as Vec3,
    });
  };
  return (
    <div className="parts-editor">
      <div className="editor-tools">
        <button
          onClick={studio.undo}
          disabled={!studio.canUndo || studio.busy}
          title="元に戻す (Ctrl+Z)"
          aria-label="元に戻す"
        >
          <Undo2 size={14} />
        </button>
        <button
          onClick={studio.redo}
          disabled={!studio.canRedo || studio.busy}
          title="やり直し (Ctrl+Shift+Z)"
          aria-label="やり直し"
        >
          <Redo2 size={14} />
        </button>
        <span />
        <button
          className="add-cube"
          onClick={studio.addCube}
          disabled={studio.busy}
        >
          <Plus size={12} />
          キューブを追加
        </button>
      </div>
      <p className="inspector-description">
        3Dモデルのクリック、または一覧から選択。
        <br />
        座標はMinecraftモデル単位。編集内容は保存されます。
      </p>
      {cube ? (
        <div className="selected-part">
          <div className="selected-part-title">
            <Box size={13} />
            <strong>{cube.label ?? cube.name}</strong>
            <span>SELECTED</span>
          </div>
          <label className="part-name-label">
            表示名
            <input
              aria-label="選択パーツの名前"
              value={cube.label ?? cube.name}
              maxLength={80}
              onChange={(e) =>
                studio.editCube({ target: cube.name, label: e.target.value })
              }
            />
          </label>
          <label className="vector-label">位置</label>
          <div className="mini-vector">
            {["X", "Y", "Z"].map((axis, i) => (
              <label key={axis}>
                <span>{axis}</span>
                <input
                  type="number"
                  aria-label={`選択パーツの${axis}位置`}
                  step={0.25}
                  min={-23.4}
                  max={23.4}
                  value={+((cube.from[i] + cube.to[i]) / 2).toFixed(3)}
                  onChange={(e) => move(i, Number(e.target.value))}
                />
              </label>
            ))}
          </div>
          <label className="vector-label">サイズ</label>
          <div className="mini-vector">
            {["X", "Y", "Z"].map((axis, i) => (
              <label key={axis}>
                <span>{axis}</span>
                <input
                  type="number"
                  aria-label={`選択パーツの${axis}サイズ`}
                  step={0.25}
                  min={0.05}
                  max={40}
                  value={+(cube.to[i] - cube.from[i]).toFixed(3)}
                  onChange={(e) => resize(i, Number(e.target.value))}
                />
              </label>
            ))}
          </div>
          <div className="part-colour-row">
            <label>
              塗り
              <input
                type="color"
                aria-label="選択パーツの色"
                value={cube.color}
                onChange={(e) =>
                  studio.editCube({ target: cube.name, color: e.target.value })
                }
              />
              <small>{cube.color}</small>
            </label>
            <Toggle
              checked={!!cube.emissive}
              onChange={() =>
                studio.editCube({ target: cube.name, emissive: !cube.emissive })
              }
              label="選択パーツを発光させる"
            />
            <span>発光</span>
          </div>
          <div className="part-actions">
            <button onClick={studio.duplicateCube}>
              <Copy size={12} />
              複製
            </button>
            <button
              onClick={() =>
                studio.editCube({ target: cube.name, hidden: !cube.hidden })
              }
            >
              {cube.hidden ? <Eye size={12} /> : <EyeOff size={12} />}{" "}
              {cube.hidden ? "表示" : "非表示"}
            </button>
            <button className="part-delete" onClick={studio.deleteCube}>
              <Trash2 size={12} />
              {cube.name.startsWith("custom_") ? "削除" : "除外"}
            </button>
          </div>
        </div>
      ) : (
        <div className="part-empty">
          <Box size={24} />
          <span>編集するパーツを選んでください</span>
          <small>クリックで輪郭がハイライトされます</small>
        </div>
      )}
      <div className="inspector-section-title">
        <Layers size={14} />
        <span>アウトライナー</span>
        <small>
          {studio.model.cubes.filter((c) => !c.hidden).length} /{" "}
          {studio.model.cubes.length}
        </small>
      </div>
      <div className="outliner-search">
        <Search size={12} />
        <input
          aria-label="パーツを検索"
          placeholder="名前でパーツを検索…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(80);
          }}
        />
      </div>
      <div className="outliner">
        {groups.map(([label, cubes]) => (
          <details key={label} open>
            <summary>
              {label}
              <small>{cubes.length}</small>
            </summary>
            {cubes.map((c) => (
              <div
                key={c.name}
                className={`outliner-row ${c.name === studio.selectedCube ? "selected" : ""} ${c.hidden ? "is-hidden" : ""}`}
              >
                <button
                  className="outliner-pick"
                  onClick={() => select(c.name)}
                  title={c.label ?? c.name}
                >
                  <Box size={10} />
                  <span>{c.label ?? c.name}</span>
                </button>
                <button
                  className="outliner-eye"
                  title={c.hidden ? "表示する" : "非表示にする"}
                  onClick={() =>
                    studio.editCube({ target: c.name, hidden: !c.hidden })
                  }
                >
                  {c.hidden ? <EyeOff size={11} /> : <Eye size={11} />}
                </button>
              </div>
            ))}
          </details>
        ))}
      </div>
      {visible.length > limit && (
        <button
          className="outliner-more"
          onClick={() => setLimit((n) => n + 80)}
        >
          さらに80件表示（残り{visible.length - limit}）
        </button>
      )}
      {visible.length === 0 && (
        <p className="inspector-description">一致するパーツはありません。</p>
      )}
      <div className="editor-help">
        <Check size={11} />
        移動・サイズ・塗りは即時反映。保存時にPNGも更新。
      </div>
    </div>
  );
}
