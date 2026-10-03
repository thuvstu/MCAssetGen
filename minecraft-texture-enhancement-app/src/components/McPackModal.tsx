import { useMemo, useState } from "react";
import { Icon, Btn, Select, Toggle, Slider } from "./ui";
import { MC_VERSIONS, COMMON_PATHS, TEX_TO_MC, buildEntry, downloadPack, validPath, type PackEntry } from "../lib/mcpack";
import { isAnimated, type Inst } from "../lib/pipeline";

interface Props {
  base: ImageData; insts: Inst[]; seed: number; texId: string | null;
  entries: PackEntry[]; setEntries: (e: PackEntry[]) => void;
  onClose: () => void; onToast: (m: string) => void;
}

export default function McPackModal({ base, insts, seed, texId, entries, setEntries, onClose, onToast }: Props) {
  const auto = texId ? TEX_TO_MC[texId] : undefined;
  const [path, setPath] = useState(auto?.path ?? "block/stone");
  const animated = isAnimated(insts);
  const [anim, setAnim] = useState(animated);
  const [frames, setFrames] = useState(16);
  const [loopSec, setLoopSec] = useState(2);
  const [interp, setInterp] = useState(false);
  const [ver, setVer] = useState("1.21.4");
  const [name, setName] = useState("PixelForge Pack");
  const [desc, setDesc] = useState("§6PIXELFORGE§r で強化したテクスチャ");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"build" | "guide">("build");

  const target = useMemo(() => COMMON_PATHS.find((p) => p.path === path), [path]);
  const ok = validPath(path);
  const dup = entries.some((e) => e.path === path);

  const add = async () => {
    if (!ok) return;
    setBusy(true);
    try {
      const e = await buildEntry({
        base, insts, seed, path, label: target?.label ?? path,
        frames: anim ? frames : 1, loopSec, interpolate: interp,
      });
      setEntries([...entries.filter((x) => x.path !== path), e]);
      onToast(`${e.label} をパックに追加しました`);
    } finally { setBusy(false); }
  };

  const save = async () => {
    if (!entries.length) return;
    setBusy(true);
    try {
      await downloadPack(entries, { name, description: desc, fmt: MC_VERSIONS.find((v) => v.v === ver)!.fmt });
      onToast("リソースパック (.zip) を保存しました");
      setStep("guide");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-[#070a0f]/85 backdrop-blur-[3px]" onClick={onClose} />
      <div className="reveal relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[6px] border border-[var(--line2)] bg-[#12161f] shadow-[0_40px_120px_-40px_#000]">
        <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-[var(--lime)]/40 bg-[#18200f] text-[var(--lime)]">
            <Icon name="box" className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-pixel text-[17px] leading-none">マイクラに入れる</h3>
            <p className="mt-1 font-bit text-[9px] uppercase tracking-[0.16em] text-[var(--ink3)]">Java Edition リソースパック</p>
          </div>
          <div className="ml-4 flex gap-1">
            <Btn size="sm" active={step === "build"} accent="#b6e14f" onClick={() => setStep("build")}>① パックを作る</Btn>
            <Btn size="sm" active={step === "guide"} accent="#37d6c4" onClick={() => setStep("guide")}>② 導入方法</Btn>
          </div>
          <button onClick={onClose} className="ml-auto text-[var(--ink3)] hover:text-[var(--ink)]">
            <Icon name="plus" className="h-5 w-5 rotate-45" />
          </button>
        </div>

        {step === "build" ? (
          <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto md:grid-cols-2">
            {/* 左: 現在のテクスチャを追加 */}
            <div className="space-y-3 border-[var(--line)] p-4 md:border-r">
              <h4 className="font-pixel text-[14px] text-[var(--lime)]">今のテクスチャをどこに使う？</h4>
              <div>
                <div className="mb-0.5 text-[10.5px] text-[var(--ink3)]">置き換えるマイクラのテクスチャ</div>
                <input list="mcpaths" value={path} onChange={(e) => setPath(e.target.value.trim().toLowerCase())}
                  className="w-full rounded-[3px] border border-[var(--line2)] bg-[#0f131a] px-2 py-1.5 font-bit text-[11px] text-[var(--ink)] outline-none focus:border-[var(--lime)]" />
                <datalist id="mcpaths">
                  {COMMON_PATHS.map((p) => <option key={p.path} value={p.path}>{p.label}</option>)}
                </datalist>
                <div className="mt-1 text-[10.5px]">
                  {!ok ? <span className="text-[var(--rose)]">形式が正しくありません（例: block/stone, item/diamond_sword）</span>
                    : <span className="text-[var(--ink3)]">→ <b className="text-[var(--ink2)]">{target?.label ?? "カスタム指定"}</b>
                      <span className="ml-1 font-bit text-[9px]">assets/minecraft/textures/{path}.png</span></span>}
                </div>
                {auto && auto.path !== path && (
                  <button onClick={() => setPath(auto.path)} className="mt-1 text-[10.5px] text-[var(--teal)] underline">
                    おすすめ: {auto.label} ({auto.path})
                  </button>
                )}
              </div>

              {(target?.warn || (texId && TEX_TO_MC[texId]?.path === path && TEX_TO_MC[texId]?.warn)) && (
                <div className="rounded-[3px] border border-[var(--amber)]/40 bg-[#211a0e] p-2 text-[10.5px] leading-relaxed text-[var(--amber)]">
                  ⚠ {target?.warn ?? TEX_TO_MC[texId!]?.warn}
                </div>
              )}

              <div className="rounded-[3px] border border-[var(--line)] bg-[#0f131a] p-2.5">
                <Toggle label={`アニメーションとして書き出す${animated ? "" : "（動くエフェクトがありません）"}`} value={anim && animated}
                  onChange={setAnim} accent="#f5a63c" />
                {anim && animated && (
                  <div className="mt-2 space-y-2">
                    <Slider label="フレーム数" value={frames} min={2} max={32} step={1} onChange={setFrames} />
                    <Slider label="1周の長さ" value={loopSec} min={0.5} max={6} step={0.5} unit="秒" onChange={setLoopSec} />
                    <Toggle label="フレーム間をなめらかに補間" value={interp} onChange={setInterp} accent="#f5a63c" />
                    <p className="text-[10px] leading-relaxed text-[var(--ink3)]">
                      縦に {frames} 枚並べた画像と .mcmeta を作ります。1フレーム ≈ {Math.max(1, Math.round((loopSec * 20) / frames))} tick。
                      ブロックとアイテムで動きます。
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-[3px] border border-[var(--line)] bg-[#0f131a] px-2.5 py-2 text-[10.5px] text-[var(--ink3)]">
                <span>解像度 <b className="text-[var(--ink)]">{base.width}×{base.width}</b></span>
                <span>{base.width > 16 ? `${base.width / 16}倍の高解像度パック` : "バニラと同じ 16px"}</span>
              </div>

              <Btn active accent="#b6e14f" onClick={add} disabled={!ok || busy} className="w-full py-2">
                <Icon name="plus" className="h-4 w-4" />{dup ? "パック内の同じテクスチャを上書き" : "パックに追加"}
              </Btn>
              <p className="text-[10px] leading-relaxed text-[var(--ink3)]">
                ヒント：追加したあと左の素材や効果を変えて、別のテクスチャもどんどん同じパックへ追加できます。
              </p>
            </div>

            {/* 右: パックの中身 */}
            <div className="flex min-h-0 flex-col p-4">
              <h4 className="mb-2 flex items-center justify-between font-pixel text-[14px] text-[var(--teal)]">
                パックの中身 <span className="font-bit text-[10px] text-[var(--ink3)]">{entries.length} 枚</span>
              </h4>
              <div className="min-h-[120px] flex-1 space-y-1 overflow-y-auto">
                {!entries.length && (
                  <p className="rounded-[3px] border border-dashed border-[var(--line2)] p-6 text-center text-[11px] text-[var(--ink3)]">
                    まだ空です。左の「パックに追加」を押してください。
                  </p>
                )}
                {entries.map((e) => (
                  <div key={e.key} className="flex items-center gap-2 rounded-[3px] border border-[var(--line)] bg-[#151a23] p-1.5">
                    <img src={e.thumb} className="pixelated checker h-9 w-9 rounded-[2px]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11.5px]">{e.label}</div>
                      <div className="truncate font-bit text-[9px] text-[var(--ink3)]">
                        {e.path}.png · {e.size}px{e.frames > 1 ? ` · ${e.frames}f ANIM` : ""}
                      </div>
                    </div>
                    <button onClick={() => setEntries(entries.filter((x) => x.key !== e.key))}
                      className="p-1 text-[var(--ink3)] hover:text-[var(--rose)]"><Icon name="trash" className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>

              <div className="mt-3 space-y-2 border-t border-[var(--line)] pt-3">
                <Select label="遊んでいるマイクラのバージョン" value={ver} accent="#37d6c4"
                  options={MC_VERSIONS.map((v) => ({ v: v.v, l: `${v.l}  (pack_format ${v.fmt})` }))} onChange={setVer} />
                <label className="block">
                  <div className="mb-0.5 text-[10.5px] text-[var(--ink3)]">パック名</div>
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-[3px] border border-[var(--line2)] bg-[#0f131a] px-2 py-1.5 text-[12px] outline-none focus:border-[var(--teal)]" />
                </label>
                <label className="block">
                  <div className="mb-0.5 text-[10.5px] text-[var(--ink3)]">説明文（§ で色付け可）</div>
                  <input value={desc} onChange={(e) => setDesc(e.target.value)}
                    className="w-full rounded-[3px] border border-[var(--line2)] bg-[#0f131a] px-2 py-1.5 text-[12px] outline-none focus:border-[var(--teal)]" />
                </label>
                <Btn active accent="#37d6c4" onClick={save} disabled={!entries.length || busy} className="w-full py-2">
                  <Icon name="download" className="h-4 w-4" />リソースパック (.zip) を保存
                </Btn>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto p-5 text-[12.5px] leading-relaxed text-[var(--ink2)]">
            <ol className="space-y-3">
              {[
                ["zip を保存", "「① パックを作る」で .zip を保存します。解凍は不要です。"],
                ["フォルダを開く", "マイクラのタイトル画面 → 設定 → リソースパック → 左下の「パックフォルダーを開く」。"],
                ["zip を入れる", "開いた resourcepacks フォルダに zip をそのままドラッグします。"],
                ["有効化", "画面に戻ると左側にパックが出ます。矢印で右側（使用中）へ移動し「完了」。"],
                ["確認", "ワールドに入って、置き換えたブロックやアイテムを見てください。F3+T で再読み込みできます。"],
              ].map(([t, d], i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] bg-[var(--teal)] font-bit text-[11px] text-[#0c0f15]">{i + 1}</span>
                  <span><b className="text-[var(--ink)]">{t}</b><br />{d}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <div className="rounded-[3px] border border-[var(--line)] bg-[#0f131a] p-3 text-[11px]">
                <b className="text-[var(--amber)]">「互換性がない」と出たら</b><br />
                バージョン選択が違う可能性があります。そのままでも使えることが多いですが、正しいバージョンで作り直すと確実です。
              </div>
              <div className="rounded-[3px] border border-[var(--line)] bg-[#0f131a] p-3 text-[11px]">
                <b className="text-[var(--amber)]">反映されないときは</b><br />
                パスが違う可能性があります（例: 草の上面は block/grass_block_top）。名前はバージョンで変わることもあります。
              </div>
              <div className="rounded-[3px] border border-[var(--line)] bg-[#0f131a] p-3 text-[11px]">
                <b className="text-[var(--amber)]">光る効果について</b><br />
                グローやブルームは「テクスチャに描き込まれた色」として入ります。マイクラ内で本当に光源になるわけではありません。
              </div>
              <div className="rounded-[3px] border border-[var(--line)] bg-[#0f131a] p-3 text-[11px]">
                <b className="text-[var(--amber)]">統合版 (Bedrock) は</b><br />
                このパックは Java 版専用です。統合版はフォルダ構成が違うため、そのままでは使えません。
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
