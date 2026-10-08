import { useEffect, useState } from "react";
import { X, Plus, Trash2, Download, Upload, Puzzle, Pencil, CheckCircle2, AlertCircle } from "lucide-react";
import { ID_REGEX, normalizeBlockId, type BlockDef } from "../lib/minecraft-data";
import {
  validateCustomDef,
  exportCustomBlocksJson,
  importCustomBlocksJson,
} from "../lib/custom-blocks";

interface Row {
  key: string;
  values: string;
  def: string;
}

interface Form {
  id: string;
  ja: string;
  color: string;
  transparent: boolean;
  blockEntity: boolean;
  rows: Row[];
}

const EMPTY_ROW: Row = { key: "", values: "", def: "" };

const emptyForm = (id: string): Form => ({
  id,
  ja: "",
  color: "#7c8c9c",
  transparent: false,
  blockEntity: false,
  rows: [{ ...EMPTY_ROW }],
});

const defToForm = (d: BlockDef): Form => ({
  id: d.id,
  ja: d.ja,
  color: d.color,
  transparent: !!d.transparent,
  blockEntity: !!d.blockEntity,
  rows: Object.keys(d.props ?? {}).length
    ? Object.entries(d.props ?? {}).map(([k, vs]) => ({
        key: k,
        values: vs.join(","),
        def: d.defaults?.[k] ?? vs[0] ?? "",
      }))
    : [{ ...EMPTY_ROW }],
});

const TEMPLATES: { label: string; row: Row }[] = [
  { label: "向き(4方向)", row: { key: "facing", values: "north,south,east,west", def: "north" } },
  { label: "向き(6方向)", row: { key: "facing", values: "down,up,north,south,east,west", def: "north" } },
  { label: "軸(xyz)", row: { key: "axis", values: "x,y,z", def: "y" } },
  { label: "ON/OFF", row: { key: "powered", values: "true,false", def: "false" } },
  { label: "段階(0-15)", row: { key: "level", values: "0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15", def: "0" } },
];

interface Props {
  open: boolean;
  onClose: () => void;
  blocks: BlockDef[];
  initialId: string | null;
  onSave: (defs: BlockDef[]) => void;
  onToast: (msg: string) => void;
}

function download(text: string, name: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function CustomBlockModal({ open, onClose, blocks, initialId, onSave, onToast }: Props) {
  const [form, setForm] = useState<Form>(emptyForm(""));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 開くたびに初期化 (既存IDなら編集モード)
  useEffect(() => {
    if (!open) return;
    const existing = initialId ? blocks.find((b) => b.id === initialId) : undefined;
    if (existing) {
      setForm(defToForm(existing));
      setEditingId(existing.id);
    } else {
      setForm(emptyForm(initialId ?? ""));
      setEditingId(null);
    }
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialId]);

  if (!open) return null;

  const normalizedId = normalizeBlockId(form.id);
  const idOk = ID_REGEX.test(normalizedId);

  const buildDef = (): BlockDef => {
    const props: Record<string, string[]> = {};
    const defaults: Record<string, string> = {};
    for (const r of form.rows) {
      const k = r.key.trim();
      if (!k) continue;
      const vs = r.values.split(",").map((s) => s.trim()).filter(Boolean);
      if (!vs.length) continue;
      props[k] = vs;
      defaults[k] = vs.includes(r.def.trim()) ? r.def.trim() : vs[0];
    }
    return {
      id: normalizedId,
      ja: form.ja.trim() || normalizedId.split(":").pop() || normalizedId,
      en: normalizedId,
      color: form.color,
      category: "custom",
      transparent: form.transparent || undefined,
      blockEntity: form.blockEntity || undefined,
      props: Object.keys(props).length ? props : undefined,
      defaults: Object.keys(defaults).length ? defaults : undefined,
    };
  };

  const handleSave = () => {
    const def = buildDef();
    const err = validateCustomDef(def);
    if (err) {
      setError(err);
      return;
    }
    const exists = blocks.some((b) => b.id === def.id);
    const next = exists ? blocks.map((b) => (b.id === def.id ? def : b)) : [...blocks, def];
    onSave(next);
    onToast(`${def.ja} を${exists ? "更新" : "登録"}しました`);
    setForm(emptyForm(""));
    setEditingId(null);
    setError(null);
  };

  const handleDelete = (id: string) => {
    onSave(blocks.filter((b) => b.id !== id));
    if (editingId === id) {
      setForm(emptyForm(""));
      setEditingId(null);
    }
    onToast("カスタムブロックを削除しました");
  };

  const updateRow = (i: number, patch: Partial<Row>) =>
    setForm((f) => ({ ...f, rows: f.rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) }));

  const handleImport = async (file: File) => {
    try {
      const incoming = importCustomBlocksJson(await file.text());
      const merged = [...blocks];
      for (const d of incoming) {
        const i = merged.findIndex((b) => b.id === d.id);
        if (i >= 0) merged[i] = d;
        else merged.push(d);
      }
      onSave(merged);
      onToast(`${incoming.length}件のカスタムブロックを読み込みました`);
    } catch (e) {
      setError(`読込失敗: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-emerald-800/60 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <h2 className="flex items-center gap-2 text-sm font-black text-white">
            <Puzzle className="h-4 w-4 text-fuchsia-400" /> MOD・カスタムブロック管理
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden md:grid-cols-[260px_1fr]">
          {/* 一覧 */}
          <div className="flex min-h-0 flex-col border-b border-zinc-800 md:border-b-0 md:border-r">
            <div className="flex-1 space-y-1 overflow-y-auto p-3 mc-scroll">
              {blocks.length === 0 && (
                <div className="py-6 text-center text-[11px] leading-relaxed text-zinc-600">
                  登録済みのMODブロックはありません。
                  <br />
                  右のフォームで登録するか、未登録IDのまま使うこともできます。
                </div>
              )}
              {blocks.map((b) => (
                <div
                  key={b.id}
                  className={`group flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                    editingId === b.id ? "border-fuchsia-500 bg-fuchsia-950/30" : "border-zinc-800 bg-zinc-900/60"
                  }`}
                >
                  <span className="h-5 w-5 shrink-0 rounded border border-black/60" style={{ background: b.color }} />
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      setForm(defToForm(b));
                      setEditingId(b.id);
                      setError(null);
                    }}
                  >
                    <div className="truncate text-[11px] font-bold text-zinc-200">{b.ja}</div>
                    <div className="truncate font-mono text-[9px] text-zinc-500">{b.id}</div>
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="rounded p-1 text-zinc-600 hover:bg-red-950 hover:text-red-400" title="削除">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 border-t border-zinc-800 p-2.5">
              <button
                onClick={() => download(exportCustomBlocksJson(blocks), "custom_blocks.json")}
                disabled={!blocks.length}
                className="flex flex-1 items-center justify-center gap-1 rounded-md bg-zinc-800 py-1.5 text-[10px] font-bold text-zinc-200 hover:bg-zinc-700 disabled:opacity-35"
              >
                <Download className="h-3 w-3" /> JSON書出
              </button>
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-md bg-zinc-800 py-1.5 text-[10px] font-bold text-zinc-200 hover:bg-zinc-700">
                <Upload className="h-3 w-3" /> JSON読込
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImport(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          {/* フォーム */}
          <div className="min-h-0 overflow-y-auto p-4 mc-scroll">
            <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold text-zinc-400">
              {editingId ? (
                <>
                  <Pencil className="h-3.5 w-3.5 text-amber-400" /> 編集中: <span className="font-mono text-amber-300">{editingId}</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 text-emerald-400" /> 新規登録
                </>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[10px] text-zinc-500">
                  ブロックID <span className="text-zinc-600">（仮IDでOK。例: mymod:ruby_block）</span>
                </span>
                <div className="relative">
                  <input
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    placeholder="mymod:ruby_block"
                    spellCheck={false}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 py-1.5 pl-2 pr-7 font-mono text-xs text-white focus:border-fuchsia-500 focus:outline-none"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">
                    {form.id ? (
                      idOk ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                    ) : null}
                  </span>
                </div>
                {form.id && normalizedId !== form.id && (
                  <div className="mt-0.5 font-mono text-[9px] text-zinc-500">正規化: {normalizedId}</div>
                )}
              </label>

              <label className="block">
                <span className="mb-1 block text-[10px] text-zinc-500">表示名（日本語・任意）</span>
                <input
                  value={form.ja}
                  onChange={(e) => setForm({ ...form, ja: e.target.value })}
                  placeholder="ルビーブロック"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white focus:border-fuchsia-500 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[10px] text-zinc-500">表示色（3Dプレビュー用）</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="h-7 w-10 cursor-pointer rounded border border-zinc-700 bg-zinc-900"
                  />
                  <span className="font-mono text-[10px] text-zinc-400">{form.color}</span>
                </div>
              </label>

              <div className="flex gap-4 sm:col-span-2">
                <label className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                  <input type="checkbox" checked={form.transparent} onChange={(e) => setForm({ ...form, transparent: e.target.checked })} className="accent-fuchsia-500" />
                  半透明
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                  <input type="checkbox" checked={form.blockEntity} onChange={(e) => setForm({ ...form, blockEntity: e.target.checked })} className="accent-fuchsia-500" />
                  TileEntity（専用データを持つ）
                </label>
              </div>
            </div>

            {/* プロパティ */}
            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-zinc-300">ブロックステート（プロパティ）</span>
                <div className="flex flex-wrap gap-1">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          rows: [...f.rows.filter((r) => r.key.trim()), { ...t.row }],
                        }))
                      }
                      className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                    >
                      + {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                {form.rows.map((r, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1.6fr_0.8fr_auto] gap-1.5">
                    <input
                      value={r.key}
                      onChange={(e) => updateRow(i, { key: e.target.value })}
                      placeholder="キー facing"
                      spellCheck={false}
                      className="rounded-md border border-zinc-700 bg-zinc-900 px-1.5 py-1 font-mono text-[11px] text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
                    />
                    <input
                      value={r.values}
                      onChange={(e) => updateRow(i, { values: e.target.value })}
                      placeholder="値 north,south,east"
                      spellCheck={false}
                      className="rounded-md border border-zinc-700 bg-zinc-900 px-1.5 py-1 font-mono text-[11px] text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
                    />
                    <input
                      value={r.def}
                      onChange={(e) => updateRow(i, { def: e.target.value })}
                      placeholder="既定"
                      spellCheck={false}
                      className="rounded-md border border-zinc-700 bg-zinc-900 px-1.5 py-1 font-mono text-[11px] text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
                    />
                    <button
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          rows: f.rows.length > 1 ? f.rows.filter((_, idx) => idx !== i) : [{ ...EMPTY_ROW }],
                        }))
                      }
                      className="rounded-md px-1.5 text-zinc-600 hover:bg-red-950 hover:text-red-400"
                      title="行を削除"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setForm((f) => ({ ...f, rows: [...f.rows, { ...EMPTY_ROW }] }))}
                className="mt-2 flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-200"
              >
                <Plus className="h-3 w-3" /> プロパティを追加
              </button>
              <div className="mt-2 text-[9px] leading-relaxed text-zinc-600">
                値はカンマ区切り。プロパティ名は小文字英数字と_のみ。ここで定義しなくても、パレットの「ステート文字列」欄で任意のステートを指定できます。
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded-md border border-red-900 bg-red-950/40 px-3 py-2 text-[11px] text-red-300">{error}</div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleSave}
                disabled={!idOk}
                className="flex-1 rounded-lg bg-gradient-to-r from-fuchsia-600 to-violet-600 py-2 text-[12px] font-black text-white shadow-lg transition hover:from-fuchsia-500 hover:to-violet-500 disabled:opacity-35"
              >
                {editingId ? "変更を保存" : "カスタムブロックを登録"}
              </button>
              {(editingId || form.id) && (
                <button
                  onClick={() => {
                    setForm(emptyForm(""));
                    setEditingId(null);
                    setError(null);
                  }}
                  className="rounded-lg border border-zinc-700 px-3 text-[11px] text-zinc-400 hover:bg-zinc-800"
                >
                  クリア
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
