"use client";
import { useCallback, useEffect, useState } from "react";
import { kindById } from "@/lib/forge";
import { useForge, type LibraryItem } from "@/lib/store";
import { Section } from "../ui";

const ADJ = ["緋の", "蒼穹の", "常夜の", "黎明の", "終焉の", "忘却の", "雷鳴の", "静寂の", "獄炎の", "月蝕の", "白金の", "深緑の", "殉教の", "暁の", "無窮の", "泡沫の"];
const NOUN: Record<string, string[]> = {
  sword: ["太刀", "聖剣", "断罪剣", "星切"],
  axe: ["戦斧", "断頭斧", "雷斧"],
  spear: ["槍", "穿孔槍", "海神槍"],
  ornspear: ["宝槍", "儀仗槍", "王槍"],
  bow: ["長弓", "狙撃弓", "星弓"],
  mace: ["鎚矛", "破城槌", "裁きの鎚"],
  chainsaw: ["鎖鋸", "解体鋸", "咆哮鋸"],
  gun: ["魔銃", "六連銃", "葬送銃"],
  railgun: ["磁道砲", "収束砲", "雷道砲"],
  cursed: ["呪刃", "魔剣", "喰刃"],
  bloodscythe: ["血鎌", "死神鎌", "緋鎌"],
  staff: ["杖", "大魔杖", "祈りの杖"],
  tome: ["魔導書", "禁書", "写本"],
  sigil: ["魔法陣", "召喚陣", "星辰陣"],
  relic: ["聖遺物", "心核", "秘宝"],
  shield: ["大盾", "聖壁", "守りの盾"],
  armor: ["兜", "胸甲", "肩鎧"],
  crown: ["宝冠", "王冠", "戴冠"],
};
const forgeName = (kind: string) => {
  const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
  return `${pick(ADJ)}${pick(NOUN[kind] ?? ["器"])}`;
};

export default function LibraryPanel() {
  const p = useForge((s) => s.params);
  const set = useForge((s) => s.set);
  const load = useForge((s) => s.load);
  const say = useForge((s) => s.say);
  const capture = useForge((s) => s.capture);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [dbError, setDbError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/models", { cache: "no-store" });
      const j = await r.json();
      setItems(Array.isArray(j.models) ? j.models : []);
      setDbError(!r.ok);
    } catch {
      setDbError(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = async () => {
    setSaving(true);
    try {
      const thumbnail = capture?.() ?? null;
      const r = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: p.name, kind: p.kind, params: p, thumbnail }),
      });
      const j = await r.json();
      if (j.model) say(`「${p.name}」を保存庫に納めました ／ #${String(j.model.id).padStart(3, "0")}`);
      else say("保存に失敗しました（DB接続を確認してください）");
      await refresh();
    } catch {
      say("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await fetch(`/api/models?id=${id}`, { method: "DELETE" });
      setItems((l) => l.filter((m) => m.id !== id));
      say(`#${String(id).padStart(3, "0")} を削除しました`);
    } catch {
      say("削除に失敗しました");
    }
  };

  return (
    <Section no="13" title="保存庫" en={`LIBRARY · ${items.length}`}>
      <div className="flex items-end gap-1.5">
        <label className="min-w-0 flex-1">
          <span className="mb-1 block font-mono text-[9px] tracking-[0.18em] text-ink/60">NAME ／ {kindById(p.kind).name}</span>
          <input
            value={p.name}
            maxLength={40}
            onChange={(e) => set({ name: e.target.value }, { silent: true })}
            aria-label="モデル名"
            className="w-full border border-ink/35 bg-paper2/60 px-2 py-1.5 font-display text-[15px] text-ink outline-none focus:border-vermilion"
          />
        </label>
        <button
          type="button"
          onClick={() => set({ name: forgeName(p.kind) }, { silent: true })}
          title="銘を授ける（ランダム命名）"
          aria-label="ランダム命名"
          className="border border-ink/40 px-2.5 py-2 text-[13px] text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          ⚄
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="border border-vermilion bg-vermilion px-3 py-2 text-[11px] tracking-[0.14em] text-white transition-colors duration-100 hover:bg-ink hover:border-ink disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存"}
        </button>
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(JSON.stringify(p));
              say("構成をクリップボードへ写しました");
            } catch {
              say("コピーできませんでした");
            }
          }}
          className="flex-1 border border-ink/40 px-2 py-1.5 text-[10px] tracking-[0.12em] text-ink/80 transition-colors hover:bg-ink hover:text-paper"
        >
          構成をコピー
        </button>
        <button
          type="button"
          onClick={() => setPasting((v) => !v)}
          aria-expanded={pasting}
          className={`flex-1 border px-2 py-1.5 text-[10px] tracking-[0.12em] transition-colors ${pasting ? "border-ink bg-ink text-paper" : "border-ink/40 text-ink/80 hover:bg-ink hover:text-paper"}`}
        >
          構成を貼り付け
        </button>
      </div>
      {pasting && (
        <div className="space-y-1.5">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder='コピーした構成 JSON をここへ'
            rows={3}
            className="w-full border border-ink/35 bg-paper2/60 p-2 font-mono text-[10px] text-ink outline-none focus:border-vermilion"
          />
          <button
            type="button"
            onClick={() => {
              try {
                load(JSON.parse(pasteText));
                setPasting(false);
                setPasteText("");
                say("構成を読み込みました");
              } catch {
                say("JSON を解釈できませんでした");
              }
            }}
            className="w-full border border-vermilion px-2 py-1.5 text-[10px] tracking-[0.14em] text-vermilion transition-colors hover:bg-vermilion hover:text-white"
          >
            この構成を展開する
          </button>
        </div>
      )}
      {dbError && <div className="border border-vermilion/60 bg-vermilion/10 px-2 py-1.5 text-[11px] text-vermilion">保存庫に接続できません — DATABASE_URL を確認してください</div>}
      {loaded && items.length === 0 && !dbError && (
        <p className="py-2 text-[11px] leading-relaxed text-ink/60">
          まだ何も納められていません。「保存」を押すとステージのサムネイルと全パラメータが PostgreSQL に記録されます。
        </p>
      )}
      <div className="grid grid-cols-3 gap-1.5">
        {items.map((m) => (
          <div key={m.id} className="group relative border border-ink/25 bg-stage">
            <button type="button" onClick={() => { load(m.params, m.name); say(`「${m.name}」を読み込みました`); }} className="block w-full text-left" title={`${m.name} を読み込む`}>
              {m.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.thumbnail} alt={m.name} className="aspect-square w-full object-cover" />
              ) : (
                <span className="grid aspect-square w-full place-items-center font-display text-[26px] text-white/30">{kindById(m.kind === "circle" ? "sigil" : m.kind === "float" ? "relic" : m.kind).name.slice(0, 1)}</span>
              )}
              <span className="block truncate bg-paper px-1 py-0.5 font-display text-[11px] text-ink">{m.name}</span>
            </button>
            <span className="absolute left-1 top-1 bg-black/60 px-1 font-mono text-[8px] tabular-nums text-white/80">#{String(m.id).padStart(3, "0")}</span>
            <button
              type="button"
              onClick={() => remove(m.id)}
              aria-label={`${m.name} を削除`}
              className="absolute right-1 top-1 hidden h-5 w-5 place-items-center bg-black/70 text-[10px] text-white hover:bg-vermilion group-hover:grid focus-visible:grid"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </Section>
  );
}
