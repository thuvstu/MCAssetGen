import { useEffect, useMemo, useState } from "react";
import { Search, Clock, Puzzle, Pencil, Plus, AlertTriangle } from "lucide-react";
import {
  CATEGORIES,
  ID_REGEX,
  getAllBlocks,
  getBlock,
  isRegistered,
  normalizeBlockId,
  parseStateString,
  stringifyState,
  type BlockDef,
  type CategoryId,
} from "../lib/minecraft-data";

interface Props {
  selectedId: string;
  selectedProps: Record<string, string>;
  command: string;
  recent: string[];
  customBlocks: BlockDef[];
  onSelect: (id: string) => void;
  onPropsChange: (props: Record<string, string>) => void;
  onCommandChange: (cmd: string) => void;
  onOpenCustom: (id: string | null) => void;
}

function Swatch({ def, selected, onClick }: { def: BlockDef; selected: boolean; onClick: () => void }) {
  const isAir = def.id === "minecraft:air";
  const isCustom = def.category === "custom";
  return (
    <button
      onClick={onClick}
      title={`${def.ja}\n${def.id}`}
      className={`group relative flex flex-col items-center gap-1 rounded-lg border p-1.5 transition ${
        selected
          ? "border-emerald-400 bg-emerald-950/80 shadow-[0_0_12px_rgba(52,211,153,0.35)]"
          : "border-zinc-800 bg-zinc-900/60 hover:border-emerald-700 hover:bg-zinc-800"
      }`}
    >
      {isCustom && (
        <span className="absolute right-0.5 top-0.5 rounded bg-fuchsia-600/80 px-0.5 text-[7px] font-bold leading-tight text-white">MOD</span>
      )}
      <span
        className="h-7 w-7 rounded-[4px] border border-black/50 shadow-inner"
        style={{
          background: isAir
            ? "repeating-conic-gradient(#3f3f46 0% 25%, #27272a 0% 50%) 0 0 / 10px 10px"
            : def.transparent
              ? `linear-gradient(135deg, ${def.color} 0%, ${def.color}cc 55%, ${def.color}66 100%)`
              : `linear-gradient(135deg, ${def.color} 0%, ${def.color} 60%, #00000055 130%)`,
          boxShadow: selected ? `0 0 0 1px #34d399` : undefined,
        }}
      />
      <span
        className={`w-full truncate text-center text-[9px] leading-tight ${
          selected ? "text-emerald-200" : "text-zinc-400 group-hover:text-zinc-200"
        }`}
      >
        {def.ja}
      </span>
    </button>
  );
}

export default function BlockPalette({
  selectedId,
  selectedProps,
  command,
  recent,
  customBlocks,
  onSelect,
  onPropsChange,
  onCommandChange,
  onOpenCustom,
}: Props) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<CategoryId | "recent" | "all">("building");

  // 入力欄のドラフト (編集中は外部からの上書きをしない)
  const [idDraft, setIdDraft] = useState(selectedId);
  const [idEditing, setIdEditing] = useState(false);
  const [stateDraft, setStateDraft] = useState(stringifyState(selectedProps));
  const [stateEditing, setStateEditing] = useState(false);

  useEffect(() => {
    if (!idEditing) setIdDraft(selectedId);
  }, [selectedId, idEditing]);
  useEffect(() => {
    if (!stateEditing) setStateDraft(stringifyState(selectedProps));
  }, [selectedProps, stateEditing]);

  // customBlocks の変化で再計算させる
  const allBlocks = useMemo(
    () => getAllBlocks().filter((b) => b.id !== "minecraft:glazed_terracotta_placeholder"),
    [customBlocks]
  );

  const filtered = useMemo(() => {
    const raw = query.trim();
    const q = raw.toLowerCase();
    let list: BlockDef[];
    if (cat === "recent") list = recent.map((id) => getBlock(id));
    else if (cat === "all") list = allBlocks;
    else list = allBlocks.filter((b) => b.category === cat);
    if (!q) return list;
    return list.filter(
      (b) => b.ja.toLowerCase().includes(q) || b.en.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.ja.includes(raw)
    );
  }, [query, cat, recent, allBlocks]);

  // 検索語を仮IDとして使えるか
  const candidateId = normalizeBlockId(query);
  const canUseAsId =
    query.trim().length > 0 && ID_REGEX.test(candidateId) && !allBlocks.some((b) => b.id === candidateId);

  const def = getBlock(selectedId);
  const registered = isRegistered(selectedId);
  const isCommandBlock = selectedId.includes("command_block");

  const commitId = () => {
    setIdEditing(false);
    const n = normalizeBlockId(idDraft);
    if (!n || !ID_REGEX.test(n)) {
      setIdDraft(selectedId);
      return;
    }
    if (n !== selectedId) onSelect(n);
  };

  const commitState = () => {
    setStateEditing(false);
    onPropsChange(parseStateString(stateDraft));
  };

  return (
    <div className="flex h-full flex-col gap-3">
      {/* 検索 */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="検索 (石・glass・mymod:ruby…)"
          spellCheck={false}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 py-2 pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none"
        />
      </div>

      {/* カテゴリ */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setCat("recent")}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition ${
            cat === "recent" ? "bg-emerald-600 text-white" : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          }`}
        >
          <Clock className="h-3 w-3" /> 最近
        </button>
        <button
          onClick={() => setCat("all")}
          className={`rounded-md px-2 py-1 text-[11px] transition ${
            cat === "all" ? "bg-emerald-600 text-white" : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          }`}
        >
          全部
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`rounded-md px-2 py-1 text-[11px] transition ${
              cat === c.id
                ? c.id === "custom" ? "bg-fuchsia-600 text-white" : "bg-emerald-600 text-white"
                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            {c.ja}
          </button>
        ))}
      </div>

      {/* 選択中ブロック */}
      <div className="rounded-lg border border-emerald-800/60 bg-gradient-to-br from-emerald-950/60 to-zinc-950 p-2.5">
        <div className="flex items-center gap-2.5">
          <span
            className="h-10 w-10 shrink-0 rounded-md border border-black/60 shadow"
            style={{ background: `linear-gradient(135deg, ${def.color}, #00000066 140%)` }}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold text-white">{def.ja}</div>
            <div className="truncate font-mono text-[10px] text-emerald-400">{selectedId}</div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            {!registered && (
              <span className="flex items-center gap-0.5 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] text-amber-300">
                <AlertTriangle className="h-2.5 w-2.5" /> 未登録ID
              </span>
            )}
            {def.category === "custom" && registered && (
              <span className="rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-[9px] text-fuchsia-300">MOD/カスタム</span>
            )}
            {def.blockEntity && (
              <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] text-sky-300">TileEntity</span>
            )}
          </div>
        </div>

        {/* ID直接入力 (仮ID) */}
        <label className="mt-2.5 block">
          <span className="mb-0.5 flex items-center gap-1 font-mono text-[9px] text-zinc-500">
            <Pencil className="h-2.5 w-2.5" /> ID（仮IDでOK・Enterで反映）
          </span>
          <input
            value={idDraft}
            onChange={(e) => setIdDraft(e.target.value)}
            onFocus={() => setIdEditing(true)}
            onBlur={commitId}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") {
                setIdDraft(selectedId);
                (e.target as HTMLInputElement).blur();
              }
            }}
            spellCheck={false}
            placeholder="mymod:ruby_block"
            className="w-full rounded-md border border-zinc-700 bg-black/60 px-2 py-1 font-mono text-[11px] text-emerald-200 placeholder:text-zinc-700 focus:border-emerald-500 focus:outline-none"
          />
        </label>

        {/* 定義済みのプロパティ */}
        {def.props && Object.keys(def.props).length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {Object.entries(def.props).map(([key, values]) => (
              <label key={key} className="block">
                <span className="mb-0.5 block font-mono text-[9px] text-zinc-500">{key}</span>
                <select
                  value={selectedProps[key] ?? def.defaults?.[key] ?? values[0]}
                  onChange={(e) => onPropsChange({ ...selectedProps, [key]: e.target.value })}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-1.5 py-1 font-mono text-[11px] text-zinc-200 focus:border-emerald-500 focus:outline-none"
                >
                  {values.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        )}

        {/* 任意のブロックステート (未登録MODブロックでも使える) */}
        <label className="mt-2 block">
          <span className="mb-0.5 block font-mono text-[9px] text-zinc-500">
            ステート文字列（任意）<span className="text-zinc-600"> 例: facing=north,lit=true</span>
          </span>
          <input
            value={stateDraft}
            onChange={(e) => setStateDraft(e.target.value)}
            onFocus={() => setStateEditing(true)}
            onBlur={commitState}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            spellCheck={false}
            placeholder="(なし)"
            className="w-full rounded-md border border-zinc-700 bg-black/60 px-2 py-1 font-mono text-[11px] text-zinc-200 placeholder:text-zinc-700 focus:border-emerald-500 focus:outline-none"
          />
        </label>

        {/* カスタム登録導線 */}
        <div className="mt-2 flex gap-1.5">
          {!registered ? (
            <button
              onClick={() => onOpenCustom(selectedId)}
              className="flex flex-1 items-center justify-center gap-1 rounded-md border border-fuchsia-800 bg-fuchsia-950/40 py-1 text-[10px] font-bold text-fuchsia-300 hover:bg-fuchsia-900/50"
            >
              <Plus className="h-3 w-3" /> この仮IDをカスタム登録
            </button>
          ) : def.category === "custom" ? (
            <button
              onClick={() => onOpenCustom(selectedId)}
              className="flex flex-1 items-center justify-center gap-1 rounded-md border border-fuchsia-800 bg-fuchsia-950/40 py-1 text-[10px] font-bold text-fuchsia-300 hover:bg-fuchsia-900/50"
            >
              <Pencil className="h-3 w-3" /> カスタム定義を編集
            </button>
          ) : null}
          <button
            onClick={() => onOpenCustom(null)}
            className="flex items-center justify-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <Puzzle className="h-3 w-3" /> MOD管理
          </button>
        </div>

        {/* コマンドブロック用 */}
        {isCommandBlock && (
          <div className="mt-2">
            <span className="mb-0.5 block font-mono text-[9px] text-amber-400">Command (BlockEntity NBTに保存)</span>
            <input
              value={command}
              onChange={(e) => onCommandChange(e.target.value)}
              placeholder="say Hello!"
              spellCheck={false}
              className="w-full rounded-md border border-amber-800/60 bg-black px-2 py-1.5 font-mono text-[11px] text-amber-200 placeholder:text-zinc-700 focus:border-amber-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* グリッド */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1 mc-scroll">
        {canUseAsId && (
          <button
            onClick={() => {
              onSelect(candidateId);
              setQuery("");
            }}
            className="mb-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-fuchsia-700 bg-fuchsia-950/30 px-2.5 py-2 text-left transition hover:bg-fuchsia-900/40"
          >
            <Plus className="h-3.5 w-3.5 shrink-0 text-fuchsia-400" />
            <span className="min-w-0">
              <span className="block text-[11px] font-bold text-fuchsia-200">仮IDとして使う</span>
              <span className="block truncate font-mono text-[10px] text-fuchsia-400/80">{candidateId}</span>
            </span>
          </button>
        )}
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-600">
            {cat === "recent" ? "まだ履歴がありません" : cat === "custom" ? "MODブロックは未登録です" : "見つかりませんでした"}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 pb-2">
            {filtered.map((b) => (
              <Swatch key={b.id} def={b} selected={b.id === selectedId} onClick={() => onSelect(b.id)} />
            ))}
          </div>
        )}
      </div>
      <div className="shrink-0 text-center text-[10px] text-zinc-600">{filtered.length} ブロック</div>
    </div>
  );
}
