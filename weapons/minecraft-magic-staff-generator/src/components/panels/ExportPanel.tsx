import { useState } from "react";
import { Check, Copy, Download, FileJson, Film, Package, Sparkles } from "lucide-react";
import type { Config } from "../../engine/data";
import { evolutionSeries } from "../../engine/evolution";
import {
  MC_VERSIONS, VANILLA_TARGETS, buildGiveCommand, buildPackMcmeta, packFileList, validateServerCollection,
  type McVersionId, type PackOptions, type PackTarget, type ServerPackItem,
} from "../../engine/pack";
import type { Atelier } from "../../state/useAtelier";
import { StaticThumb } from "../Preview";
import { Chips, Section, Slider, Toggle } from "../ui";

type Props = {
  atelier: Atelier;
  collection: ServerPackItem[];
  setCollection: React.Dispatch<React.SetStateAction<ServerPackItem[]>>;
  variations: Config[];
  packing: boolean;
  packError: string;
  onExportTexture: (kind: "png" | "sheet" | "json", scale: number) => void;
  onExportPack: () => void;
  onExportCollection: (mode: "vanilla" | "cit") => void;
};

const exportScaleOptions = [[1, "×1"], [2, "×2"], [4, "×4"], [8, "×8"]] as [number, string][];

export function ExportPanel({ atelier, collection, setCollection, variations, packing, packError, onExportTexture, onExportPack, onExportCollection }: Props) {
  const { config, commit, patch, pack, setPack, notify } = atelier;
  const [scale, setScale] = useState(2);
  const [copied, setCopied] = useState(false);
  const [serverMode, setServerMode] = useState<"vanilla" | "cit">("vanilla");

  const options: PackOptions = {
    version: pack.version as McVersionId,
    target: pack.target as PackTarget,
    itemId: pack.itemId || "blaze_rod",
    namespace: pack.namespace || "spellforge",
    customModelData: pack.customModelData,
    emissive: pack.emissive,
    lang: pack.lang,
    model: pack.model,
    interpolate: pack.interpolate,
  };

  const giveCommand = buildGiveCommand(config, options);
  const version = MC_VERSIONS.find((v) => v.id === pack.version) ?? MC_VERSIONS[8];
  const errors = validateServerCollection(collection);

  const copyCommand = () => {
    navigator.clipboard?.writeText(giveCommand);
    setCopied(true);
    notify("配布コマンドをコピーしました");
    window.setTimeout(() => setCopied(false), 1800);
  };

  const nextCommandData = () => Math.max(pack.customModelData, ...collection.map((entry) => entry.customModelData + 1), 1);

  const addCurrent = () => setCollection((items) => {
    const commandData = nextCommandData();
    return [...items, {
      config: { ...config }, itemId: options.itemId, customModelData: commandData,
      textureId: `${config.type}_${config.element}_${commandData}`,
    }];
  });

  const addVariations = () => setCollection((items) => {
    const start = nextCommandData();
    return [...items, ...variations.slice(0, 8).map((variant, index) => ({
      config: { ...variant, frames: config.frames, frametime: config.frametime },
      itemId: options.itemId, customModelData: start + index,
      textureId: `${variant.type}_${variant.element}_${start + index}`,
    }))];
  });

  const addLineage = () => setCollection((items) => {
    const start = nextCommandData();
    return [...items, ...evolutionSeries(config).map((stage, index) => ({
      config: stage.config, itemId: options.itemId, customModelData: start + index,
      textureId: `${config.type}_${config.element}_stage_${start + index}`, evolutionStage: index,
    }))];
  });

  return (
    <>
      <Section title="ネイティブ解像度">
        <Chips cols={4} value={config.size} onChange={(v: 32 | 64 | 128 | 256) => patch("size", v)} options={[[32, "32px"], [64, "64px"], [128, "128px"], [256, "256px"]]} />
        <p className="note">ピクセルを直接計算して描画しています。拡大ではないため、大きいほど細密になります。</p>
      </Section>

      <Section title="アニメーション">
        <Chips cols={6} value={config.frames} onChange={(v: number) => patch("frames", v)} options={[[1, "静止"], [4, "4f"], [8, "8f"], [16, "16f"], [24, "24f"], [32, "32f"]]} />
        <Slider label="frametime (tick)" value={config.frametime} min={1} max={8} onChange={(v) => patch("frametime", v)} />
      </Section>

      <Section title="単体テクスチャ">
        <Chips cols={4} value={scale} onChange={setScale} options={exportScaleOptions} />
        <div className="export-list">
          <button onClick={() => onExportTexture("png", scale)}>
            <Download size={15} /><div><b>PNG 静止画</b><small>{config.size * scale}px · 1フレーム目</small></div>
          </button>
          <button disabled={config.frames <= 1} onClick={() => onExportTexture("sheet", 1)}>
            <Film size={15} /><div><b>アニメPNG + .mcmeta</b><small>{config.size}×{config.size * config.frames}px の縦長シート</small></div>
          </button>
          <button onClick={() => onExportTexture("json", 1)}>
            <FileJson size={15} /><div><b>設定JSONを保存</b><small>ロック状態ごと保存</small></div>
          </button>
          <label className="file-btn">
            <FileJson size={15} /><div><b>設定JSONを読み込む</b><small>保存した構成を復元</small></div>
            <input type="file" accept="application/json" onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              file.text().then((text) => {
                try { commit({ ...config, ...JSON.parse(text) }); notify("構成を読み込みました"); }
                catch { notify("JSONを読み込めませんでした", "warn"); }
              });
              event.target.value = "";
            }} />
          </label>
        </div>
      </Section>

      <Section title="リソースパック · 対象バージョン">
        <Chips cols={5} value={pack.version} onChange={(v: string) => setPack({ ...pack, version: v })} options={MC_VERSIONS.map((v) => [v.id, v.label] as [string, string])} />
        <p className="note">
          {version.range
            ? `${version.label} は format ${version.format} を最小値に、min_format / max_format の範囲形式で出力します。`
            : `${version.label} は pack_format ${version.format} で出力します。`}
        </p>
      </Section>

      <Section title="導入方式">
        <Chips cols={3} value={pack.target} onChange={(v: string) => setPack({ ...pack, target: v as PackTarget })} options={[["vanilla", "バニラ置換"], ["cit", "CIT / Skyblock"], ["custom", "Mod 独自ID"]] as [string, string][]} />
        {pack.target !== "custom" && (
          <div className="quick-picks">
            {VANILLA_TARGETS.map((target) => (
              <button key={target.id} className={pack.itemId === target.id ? "on" : ""} onClick={() => setPack({ ...pack, itemId: target.id })}>
                <code>{target.id}</code><small>{target.label}</small>
              </button>
            ))}
          </div>
        )}
        <div className="field-grid">
          {pack.target !== "vanilla" && (
            <label className="field-pair"><span>名前空間</span>
              <input className="text-input" value={pack.namespace} onChange={(event) => setPack({ ...pack, namespace: event.target.value })} />
            </label>
          )}
          <label className="field-pair"><span>対象アイテムID</span>
            <input className="text-input" value={pack.itemId} onChange={(event) => setPack({ ...pack, itemId: event.target.value })} placeholder="blaze_rod" />
          </label>
          <label className="field-pair"><span>CustomModelData 開始値</span>
            <input className="text-input" type="number" min={1} value={pack.customModelData} onChange={(event) => setPack({ ...pack, customModelData: Number(event.target.value) || 1 })} />
          </label>
        </div>
      </Section>

      <Section title="同梱オプション">
        <Toggle label="発光テクスチャ (_e.png)" hint="OptiFine / Iris 用の暗所発光マップ" value={pack.emissive} onChange={(v) => setPack({ ...pack, emissive: v })} />
        <Toggle label="フレーム補間 (interpolate)" hint="アニメーションを滑らかに接続" value={pack.interpolate} onChange={(v) => setPack({ ...pack, interpolate: v })} />
        <Toggle label="手持ちモデル定義 (.json)" hint="一人称・三人称の構え角度を最適化" value={pack.model} onChange={(v) => setPack({ ...pack, model: v })} />
        {pack.target === "custom" && <Toggle label="言語ファイル (en_us / ja_jp)" hint="アイテム名を翻訳に登録" value={pack.lang} onChange={(v) => setPack({ ...pack, lang: v })} />}
      </Section>

      <Section title={`サーバー用コレクション · ${collection.length}点`} extra={collection.length > 0 ? <button className="mini" onClick={() => { setCollection([]); notify("コレクションを空にしました", "info"); }}>全消去</button> : undefined}>
        <p className="note">同一ベースアイテムへ複数のCustomModelDataを割り当てます。バニラ方式はクライアントMod不要、CIT方式はOptiFine / CIT Resewnが必要です。</p>
        <Chips cols={2} value={serverMode} onChange={setServerMode} options={[["vanilla", "バニラCMDモデル"], ["cit", "CIT 名前照合"]] as ["vanilla" | "cit", string][]} />
        <div className="collection-actions">
          <button onClick={addCurrent}>現在を追加</button>
          <button onClick={addVariations}><Sparkles size={12} />試作8点</button>
          <button onClick={addLineage}>進化4段階</button>
        </div>
        {collection.length > 0 && (
          <div className="collection-list">
            {collection.map((entry, index) => (
              <div className="collection-item" key={`${entry.textureId}-${index}`}>
                <StaticThumb cfg={{ ...entry.config, frames: 1, size: 32 }} className="px" />
                <div>
                  <b>{entry.config.name || entry.textureId}</b>
                  <small>CMD {entry.customModelData} · {entry.itemId}{entry.evolutionStage !== undefined ? ` · 段階${entry.evolutionStage + 1}` : ""}</small>
                </div>
                <button aria-label="削除" onClick={() => setCollection((items) => items.filter((_, i) => i !== index))}>×</button>
              </div>
            ))}
          </div>
        )}
        {errors.length > 0 && <p className="pack-warning">{errors.join(" / ")}</p>}
        <button className="btn-pack" onClick={() => onExportCollection(serverMode)} disabled={packing || !collection.length || errors.length > 0}>
          <Package size={15} />{packing ? "生成中…" : `${collection.length}点の${serverMode === "vanilla" ? "バニラ" : "CIT"}パックを書き出す`}
        </button>
      </Section>

      <Section title="配布コマンドと出力確認" extra={<button className="mini" onClick={copyCommand}>{copied ? <><Check size={11} />コピー済</> : <><Copy size={11} />/give</>}</button>}>
        {packError && <p className="pack-warning">{packError}</p>}
        <pre className="code-preview cmd-box" onClick={copyCommand} title="クリックでコピー">{giveCommand}</pre>
        <pre className="code-preview">{JSON.stringify(buildPackMcmeta(config, options), null, 2)}</pre>
        <ul className="file-tree">{packFileList(options, config).map((file) => <li key={file}><code>{file}</code></li>)}</ul>
        <button className="btn-pack" onClick={onExportPack} disabled={packing}>
          <Package size={15} />{packing ? "パッケージ生成中…" : "リソースパックZIPを書き出す"}
        </button>
        <p className="note">ZIPを <code>.minecraft/resourcepacks</code> へ置くか、サーバーの <code>resource-pack</code> に設定して配布できます。</p>
      </Section>
    </>
  );
}
