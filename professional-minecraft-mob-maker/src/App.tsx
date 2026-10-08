import { useEffect, useMemo, useState } from "react";
import { images } from "@/assets";
import { ARCHETYPES, getArchetype } from "@/data/archetypes";
import { Gallery } from "@/components/Gallery";
import { Inspector, type TabId } from "@/components/Inspector";
import { SpawnEgg } from "@/components/SpawnEgg";
import { Viewport } from "@/components/Viewport";
import { RARITY_COLOR, TEMPERAMENT_LABEL } from "@/data/catalog";
import { buildPresets } from "@/data/presets";
import {
  cloneMob,
  combatScore,
  createMob,
  mergeMob,
  randomMob,
  rankOf,
  uniqueEntityId,
} from "@/lib/model";
import { loadSave, writeSave } from "@/lib/storage";
import type { MobDraft } from "@/types";
import { cn } from "@/utils/cn";

type Filter = "all" | "hostile" | "neutral" | "passive" | "boss";

function hydrate(raw: MobDraft): MobDraft | null {
  if (!raw?.archetype || !ARCHETYPES.some((a) => a.id === raw.archetype)) return null;
  try {
    const base = createMob(raw.archetype, raw.variant);
    return {
      ...base,
      ...raw,
      uid: raw.uid || base.uid,
      colors: raw.colors ?? base.colors,
      spawn: { ...base.spawn, ...(raw.spawn ?? {}) },
      sounds: { ...base.sounds, ...(raw.sounds ?? {}) },
      partEnabled: raw.partEnabled ?? base.partEnabled,
      partScale: raw.partScale ?? base.partScale,
      partTint: raw.partTint ?? {},
      abilities: raw.abilities ?? base.abilities,
      behaviors: raw.behaviors ?? base.behaviors,
      drops: raw.drops ?? [],
    };
  } catch {
    return null;
  }
}

function initialState(): { mobs: MobDraft[]; selectedId: string | null } {
  const saved = loadSave();
  if (saved && saved.mobs.length) {
    const mobs = saved.mobs.map(hydrate).filter((m): m is MobDraft => Boolean(m));
    if (mobs.length) {
      const selectedId = mobs.some((m) => m.uid === saved.selectedId) ? saved.selectedId : mobs[0].uid;
      return { mobs, selectedId };
    }
  }
  const mobs = buildPresets();
  return { mobs, selectedId: mobs[0]?.uid ?? null };
}

export default function App() {
  const boot = useMemo(() => initialState(), []);
  const [mobs, setMobs] = useState<MobDraft[]>(boot.mobs);
  const [selectedId, setSelectedId] = useState<string | null>(boot.selectedId);
  const [gallery, setGallery] = useState(false);
  const [tab, setTab] = useState<TabId>("form");
  const [part, setPart] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [toast, setToast] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [tip, setTip] = useState(() => localStorage.getItem("mobforge.tip") !== "off");

  const selected = mobs.find((m) => m.uid === selectedId) ?? null;

  useEffect(() => {
    const t = window.setTimeout(() => writeSave({ version: 1, mobs, selectedId }), 180);
    return () => window.clearTimeout(t);
  }, [mobs, selectedId]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGallery(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const update = (patch: Partial<MobDraft>) => {
    if (!selected) return;
    setMobs((prev) => prev.map((m) => (m.uid === selected.uid ? mergeMob(m, patch) : m)));
  };

  const addMob = (mob: MobDraft) => {
    const entityId = uniqueEntityId(mob.entityId, mobs);
    const next = { ...mob, entityId };
    setMobs((prev) => [next, ...prev]);
    setSelectedId(next.uid);
    setGallery(false);
    setTab("form");
    setPart(null);
    setToast(`${next.displayName} を工房に入れました`);
  };

  const remove = (id: string) => {
    setMobs((prev) => prev.filter((m) => m.uid !== id));
    if (selectedId === id) {
      const rest = mobs.filter((m) => m.uid !== id);
      setSelectedId(rest[0]?.uid ?? null);
    }
    setConfirmId(null);
  };

  const filtered = mobs.filter((m) => {
    if (filter === "boss" && !m.bossBar && m.archetype !== "boss") return false;
    if (filter !== "all" && filter !== "boss" && m.temperament !== filter) return false;
    const q = query.trim();
    if (!q) return true;
    return (
      m.displayName.includes(q) ||
      m.displayNameEn.toLowerCase().includes(q.toLowerCase()) ||
      m.entityId.includes(q.toLowerCase()) ||
      getArchetype(m.archetype).name.includes(q)
    );
  });

  const importJson = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as { draft?: MobDraft } & Partial<MobDraft>;
      const draft = (data.draft ?? data) as MobDraft;
      if (!draft || !draft.archetype || !draft.colors) {
        setToast("モブ工房の JSON ではありません");
        return;
      }
      addMob({
        ...draft,
        uid: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch {
      setToast("JSON を読めませんでした");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink text-cream xl:h-screen xl:overflow-hidden">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-panel px-3">
        <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-[#143528] ring-1 ring-emerald/40">
          <span className="text-lg leading-none text-emerald">⬡</span>
          <img
            src={images.logo}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </span>
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h1 className="text-base font-black tracking-tight">モブ工房</h1>
            <span className="font-mono text-[10px] tracking-[0.18em] text-emerald">MOBFORGE</span>
          </div>
          <p className="truncate text-[10px] text-muted">Mod 追加用モブを、型から実装の手前まで</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => addMob(randomMob())}
            className="hidden rounded-md border border-line px-2.5 py-1.5 text-xs text-cream hover:border-gold/40 sm:inline"
          >
            ランダム
          </button>
          <button
            type="button"
            onClick={() => setGallery(true)}
            className="rounded-md bg-emerald px-3 py-1.5 text-xs font-bold text-ink"
          >
            型から作る
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => {
              setTab("arena");
              setGallery(false);
            }}
            className="rounded-md border border-line px-2.5 py-1.5 text-xs text-cream hover:border-emerald/40 disabled:opacity-40"
          >
            ⚔️ 実戦模擬
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => {
              setTab("export");
              setGallery(false);
            }}
            className="rounded-md bg-gold px-2.5 py-1.5 text-xs font-bold text-ink hover:bg-gold/90 disabled:opacity-40"
          >
            書き出し
          </button>
        </div>
      </header>

      {tip && (
        <div className="flex items-center gap-3 border-b border-emerald/20 bg-emerald/10 px-3 py-2 text-xs text-cream">
          <span className="min-w-0 flex-1">
            中央のモブをドラッグで回し、部位をクリックして比率と色を変える。右のタブで戦闘・出現・ドロップを詰めたら、出力から <span className="font-bold text-emerald">Fabric 1.21.11（Mojmap）のプロジェクト一式</span>を書き出せます。モデル・box UV テクスチャ・RenderState 描画まで生成します。データはこのブラウザにだけ保存されます。
          </span>
          <button
            type="button"
            className="shrink-0 text-emerald"
            onClick={() => {
              localStorage.setItem("mobforge.tip", "off");
              setTip(false);
            }}
          >
            閉じる
          </button>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[272px_minmax(0,1fr)_400px]">
        <aside className="mf-scroll flex min-h-0 flex-col border-b border-line bg-[#14171c] xl:border-b-0 xl:border-r">
          <div className="space-y-2 border-b border-line p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-widest text-muted">ライブラリ {mobs.length}</span>
              <label className="cursor-pointer text-[11px] text-emerald">
                JSON を開く
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void importJson(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="名前 / ID"
              className="w-full rounded-md border border-line bg-ink px-2 py-1.5 text-xs outline-none focus:border-emerald/50"
            />
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["all", "すべて"],
                  ["hostile", "敵対"],
                  ["neutral", "中立"],
                  ["passive", "友好"],
                  ["boss", "ボス"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px]",
                    filter === id ? "bg-white/10 text-cream" : "text-muted hover:text-cream",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mf-scroll min-h-[180px] flex-1 overflow-y-auto p-2">
            {filtered.length === 0 && (
              <div className="px-2 py-8 text-center text-xs text-muted">
                モブがありません。
                <button type="button" className="mt-2 block w-full text-emerald" onClick={() => setGallery(true)}>
                  型紙を開く
                </button>
              </div>
            )}
            {filtered.map((m) => {
              const active = m.uid === selectedId;
              const rank = rankOf(combatScore(m));
              return (
                <div
                  key={m.uid}
                  className={cn(
                    "mb-1 rounded-lg border px-2 py-2",
                    active ? "border-emerald/50 bg-emerald/10" : "border-transparent hover:bg-white/5",
                  )}
                >
                  <button type="button" className="flex w-full items-center gap-2 text-left" onClick={() => { setSelectedId(m.uid); setPart(null); }}>
                    <SpawnEgg base={m.eggBase} spots={m.eggSpots} size={28} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{m.displayName}</span>
                      <span className="block truncate font-mono text-[10px] text-muted">
                        {getArchetype(m.archetype).name} · {TEMPERAMENT_LABEL[m.temperament]}
                      </span>
                    </span>
                    <span className="font-mono text-[10px]" style={{ color: RARITY_COLOR[m.rarity] }}>
                      {rank}
                    </span>
                  </button>
                  {active && (
                    <div className="mt-2 flex gap-2 pl-9 text-[10px]">
                      <button
                        type="button"
                        className="text-muted hover:text-cream"
                        onClick={() => addMob(cloneMob(m, mobs, false))}
                      >
                        複製
                      </button>
                      <button
                        type="button"
                        className="text-gold hover:text-cream"
                        onClick={() => addMob(cloneMob(m, mobs, true))}
                      >
                        変異
                      </button>
                      {confirmId === m.uid ? (
                        <button type="button" className="text-rose" onClick={() => remove(m.uid)}>
                          本当に消す
                        </button>
                      ) : (
                        <button type="button" className="text-muted hover:text-rose" onClick={() => setConfirmId(m.uid)}>
                          削除
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <main className="relative min-h-[360px] min-w-0 xl:min-h-0">
          {selected ? (
            <Viewport
              mob={selected}
              selectedPart={part}
              onSelectPart={(id) => {
                setPart(id);
                setTab("form");
              }}
            />
          ) : (
            <div className="grid h-full place-items-center p-8 text-center">
              <div>
                <p className="text-lg font-black">工房は空です</p>
                <p className="mt-1 text-sm text-muted">型紙から最初のモブを置いてください。</p>
                <button type="button" onClick={() => setGallery(true)} className="mt-4 rounded-md bg-emerald px-4 py-2 text-sm font-bold text-ink">
                  型から作る
                </button>
              </div>
            </div>
          )}
        </main>

        <aside className="min-h-[420px] border-t border-line xl:min-h-0 xl:border-l xl:border-t-0">
          {selected ? (
            <Inspector
              mob={selected}
              onChange={update}
              tab={tab}
              setTab={setTab}
              selectedPart={part}
              onSelectPart={setPart}
              onToast={setToast}
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted">モブを選択</div>
          )}
        </aside>
      </div>

      {gallery && <Gallery onPick={addMob} onClose={() => setGallery(false)} canClose={mobs.length > 0} />}

      {toast && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-emerald/30 bg-ink/90 px-4 py-2 text-xs text-cream shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
