"use client";

import { useRef, useState } from "react";
import { BIOME_TAGS, newStructure } from "@/lib/mod/catalog";
import { inspectNbtBuffer } from "@/lib/mod/nbt";
import { Btn, Card, DiagnosticRow, Field, ListDetail, NumInput, Select, TextArea, TextInput, Toggle, slug, uniqueId, type TabProps } from "./ui";



export default function StructuresTab({ project, update, analysis }: TabProps) {
  const [sel, setSel] = useState(0);
  const [inspectInfo, setInspectInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const list = project.structures ?? [];
  const idx = Math.min(sel, list.length - 1);
  const struct = list[idx];
  const set = (fn: (s: NonNullable<typeof struct>) => void) =>
    update((p) => {
      if (!p.structures) p.structures = [];
      fn(p.structures[idx]);
    });

  const diags = analysis.diagnostics.filter(
    (d) => d.file === "project" && d.message.startsWith(`[構造物: ${struct?.id ?? ""}]`)
  );

  const handleNbtUpload = async (file: File) => {
    try {
      const arrayBuf = await file.arrayBuffer();
      const nodeBuf = Buffer.from(arrayBuf);
      const b64 = nodeBuf.toString("base64");
      const info = inspectNbtBuffer(nodeBuf);
      set((s) => {
        s.nbtBase64 = b64;
      });
      if (info) {
        setInspectInfo(
          `✔ NBT読み込み成功: パレットブロック数 ${info.paletteBlocks.length}個 (${info.paletteBlocks.slice(0, 4).join(", ")}...)`
        );
      } else {
        setInspectInfo("✔ NBTファイルを登録しました (圧縮データ保持)");
      }
    } catch {
      alert("NBTファイルの解析に失敗しました。有効な .nbt または .nbt.gz を選択してください。");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="min-h-0 flex-1">
        <ListDetail
          title="構造物 (Structure NBT / 初期村)"
          rows={list.map((s) => ({
            key: s.id,
            label: s.name,
            sub: `${s.id} · ${s.spawnNearOrigin ? "初期スポーン周辺" : `間隔 ${s.spacing}chunks`}`,
            badge: analysis.diagnostics.filter(
              (d) => d.severity === "error" && d.message.startsWith(`[構造物: ${s.id}]`)
            ).length,
          }))}
          selected={idx}
          onSelect={setSel}
          onAdd={() => {
            update((p) => {
              if (!p.structures) p.structures = [];
              p.structures.push({
                ...newStructure(),
                id: uniqueId("new_structure", p.structures.map((s) => s.id)),
              });
            });
            setSel(list.length);
          }}
          onDuplicate={() => {
            if (!struct) return;
            update((p) => {
              const c = structuredClone(p.structures[idx]);
              c.id = uniqueId(`${c.id}_copy`, p.structures.map((s) => s.id));
              p.structures.splice(idx + 1, 0, c);
            });
            setSel(idx + 1);
          }}
          onDelete={() => {
            if (!struct) return;
            update((p) => {
              p.structures.splice(idx, 1);
            });
            setSel(Math.max(0, idx - 1));
          }}
          empty="構造物設定がありません。「＋ 追加」で初期村やカスタムNBT建築を生成できます。"
        >
          {!struct ? (
            <Card>
              <p className="text-sm text-slate-400">
                左の「＋ 追加」から、初期スポーン地点に自動生成される鍛冶屋村や、Structure Block / Structure Viewer からエクスポートした .nbt 建築を自然生成に追加できます。
              </p>
            </Card>
          ) : (
            <div className="space-y-4 pb-8">
              <Card title="基本設定">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <Field label="構造物名">
                    <TextInput value={struct.name} onChange={(v) => set((s) => (s.name = v))} />
                  </Field>
                  <Field label="構造物ID" hint="小文字英数字と _ のみ">
                    <TextInput mono value={struct.id} onChange={(v) => set((s) => (s.id = slug(v)))} />
                  </Field>
                  <Field label="生成バイオームタグ" className="col-span-2" hint="例: #minecraft:is_overworld">
                    <TextInput
                      mono
                      list="struct-biome-list"
                      value={struct.biomes}
                      onChange={(v) => set((s) => (s.biomes = v.trim()))}
                    />
                  </Field>
                  <Field label="説明" className="col-span-full">
                    <TextInput value={struct.description} onChange={(v) => set((s) => (s.description = v))} />
                  </Field>
                </div>
                <datalist id="struct-biome-list">
                  {BIOME_TAGS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </Card>

              <Card
                title="🏛️ 構造物 NBT データ (Structure Block / Structure Viewer 連携)"
                right={
                  <Btn onClick={() => fileInputRef.current?.click()} className="!py-1 text-xs">
                    ⬆ .nbt ファイルをアップロード
                  </Btn>
                }
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".nbt,.schem"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleNbtUpload(f);
                    e.target.value = "";
                  }}
                />

                <div className="space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Minecraftゲーム内の <b>ストラクチャーブロック (Structure Block)</b> や Webツール <b>Structure Viewer</b> (minecraftmaps.com) 等で作成した <code>.nbt</code> ファイルをアップロードしてそのままワールド生成に組み込めます。
                  </p>
                  <div className="rounded-lg border border-[#262f3e] bg-[#0c0f14] p-3 text-xs">
                    {struct.nbtBase64 ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                          <span>✔ カスタムNBT登録済み</span>
                          <span className="text-[11px] text-slate-500 font-code">
                            ({Math.round((struct.nbtBase64.length * 3) / 4)} bytes)
                          </span>
                        </div>
                        {inspectInfo && <p className="text-slate-400 font-code">{inspectInfo}</p>}
                        <button
                          type="button"
                          onClick={() => {
                            set((s) => {
                              s.nbtBase64 = undefined;
                            });
                            setInspectInfo(null);
                          }}
                          className="mt-1 text-[11px] text-red-400 underline hover:text-red-300"
                        >
                          デフォルトの初期村・鍛冶工房プリセットに戻す
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-emerald-400 font-semibold">
                          ★ デフォルト: 「冒険者の初期村 (鍛冶工房 & 交易所)」プリセット
                        </p>
                        <p className="text-slate-400">
                          未アップロード時は、石レンガ建築・武器工房・鍛冶台・ランタンを備えた 7x5x7 の初期拠点が自動生成されます。カスタムNBTを読み込むといつでも差し替え可能です。
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card title="生成ルール & スポーン配置">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="col-span-full">
                    <Toggle
                      checked={struct.spawnNearOrigin}
                      onChange={(v) => set((s) => (s.spawnNearOrigin = v))}
                      label="初期スポーン地点周辺に優先して生成する (X=0, Z=0付近 / 初心者村として最適)"
                    />
                  </div>
                  <Field label="生成間隔 (spacing / chunks)" hint="平均間隔 (2〜128)">
                    <NumInput
                      value={struct.spacing}
                      min={2}
                      max={128}
                      onChange={(v) => set((s) => (s.spacing = Math.round(v)))}
                    />
                  </Field>
                  <Field label="最小分離間隔 (separation / chunks)" hint="最小間隔 (< spacing)">
                    <NumInput
                      value={struct.separation}
                      min={1}
                      max={127}
                      onChange={(sVal) => set((s) => (s.separation = Math.round(sVal)))}
                    />
                  </Field>
                  <Field label="地形適応 (Terrain Adaptation)">
                    <Select
                      value={struct.terrainAdaptation}
                      onChange={(v) => set((s) => (s.terrainAdaptation = v as typeof s.terrainAdaptation))}
                      options={[
                        { value: "beard_thin", label: "地ならし・平坦化 (おすすめ: 建物用)" },
                        { value: "beard_box", label: "ボックス地ならし (高台・土台)" },
                        { value: "bury", label: "埋設 (遺跡・地下室用)" },
                        { value: "none", label: "なし (地形そのまま)" },
                      ]}
                    />
                  </Field>
                  <Field label="生成ステップ">
                    <Select
                      value={struct.step}
                      onChange={(v) => set((s) => (s.step = v as typeof s.step))}
                      options={[
                        { value: "surface_structures", label: "地表構造物 (村・寺院・塔)" },
                        { value: "underground_structures", label: "地下構造物 (ダンジョン・要塞)" },
                      ]}
                    />
                  </Field>
                </div>
              </Card>

              {diags.length > 0 && <Card title="この構造物の検証結果">{diags.map((d, i) => <DiagnosticRow key={i} d={d} />)}</Card>}
            </div>
          )}
        </ListDetail>
      </div>
    </div>
  );
}
