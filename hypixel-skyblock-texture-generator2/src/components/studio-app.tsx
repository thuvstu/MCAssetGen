"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ItemTooltip } from "@/components/item-tooltip";
import { PixelEditor, type EditorTool } from "@/components/pixel-editor";
import { PixelImage } from "@/components/pixel-image";
import {
  CATALOG,
  CATEGORIES,
  CATEGORY_IDS,
  getItem,
  searchItems,
  type Category,
} from "@/lib/catalog";
import { generateTexture, RESOLUTIONS, type Resolution } from "@/lib/generate";
import { randomSeed } from "@/lib/ids";
import { getMasterwork, hasMasterwork, MASTERWORKS } from "@/lib/masterworks";
import { RARITIES, RARITY_IDS, type Rarity } from "@/lib/rarity";
import type { PackDetailDTO, TextureDTO } from "@/lib/serialize";
import {
  PALETTES,
  SIGNATURES,
  getPalette,
  getSignature,
  paletteSwatches,
  type MixEntry,
} from "@/lib/styles";

const TOOLS: { id: EditorTool; label: string }[] = [
  { id: "pencil", label: "鉛筆" },
  { id: "eraser", label: "消しゴム" },
  { id: "fill", label: "塗り" },
  { id: "picker", label: "スポイト" },
];

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error((await res.text()) || res.statusText);
  return res.json() as Promise<T>;
}

export function StudioApp({
  initialPack,
  initialSignature,
  initialPalette,
  initialMasterwork,
}: {
  initialPack?: PackDetailDTO;
  initialSignature?: string;
  initialPalette?: string;
  initialMasterwork?: string;
}) {
  const first = CATALOG[0]!;
  const bootTex = initialPack?.textures[0];
  const bootItem = (bootTex && getItem(bootTex.itemId)) || first;

  const [packId, setPackId] = useState<string | null>(initialPack?.id ?? null);
  const [packName, setPackName] = useState(initialPack?.name ?? "Untitled Forge");
  const [author, setAuthor] = useState(initialPack?.author ?? "Anonymous Smith");
  const [description, setDescription] = useState(
    initialPack?.description ?? "SkyForge で鍛造したオリジナルパック",
  );
  const [isPublic, setIsPublic] = useState(initialPack?.isPublic ?? true);
  const [saved, setSaved] = useState<TextureDTO[]>(initialPack?.textures ?? []);

  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [itemId, setItemId] = useState(bootItem.id);

  const [paletteMix, setPaletteMix] = useState<MixEntry[]>(
    bootTex?.styleMix?.length
      ? bootTex.styleMix
      : [{ id: initialPalette || initialPack?.styleId || "reborn_flare", weight: 2 }],
  );
  const [signatureMix, setSignatureMix] = useState<MixEntry[]>(
    bootTex?.signatureMix?.length
      ? bootTex.signatureMix
      : [{ id: initialSignature || initialPack?.signatureId || "reborn_clean", weight: 1 }],
  );

  const item = getItem(itemId) ?? first;
  const [rarity, setRarity] = useState<Rarity>((bootTex?.rarity as Rarity) || bootItem.rarity);
  const [resolution, setResolution] = useState<Resolution>(
    (RESOLUTIONS as number[]).includes(bootTex?.resolution ?? initialPack?.resolution ?? 16)
      ? ((bootTex?.resolution ?? initialPack?.resolution ?? 16) as Resolution)
      : 16,
  );
  const [seed, setSeed] = useState(bootTex?.seed ?? randomSeed());
  const [hueShift, setHueShift] = useState(bootTex?.hueShift ?? 0);
  const [glow, setGlow] = useState(bootTex?.glow ?? 48);
  const [metallic, setMetallic] = useState(bootTex?.metallic ?? 55);
  const [chaos, setChaos] = useState(bootTex?.chaos ?? 28);
  const [templateId, setTemplateId] = useState<string>(bootTex?.templateId ?? bootItem.templates[0]!);

  const bootGen = bootTex
    ? { pixels: bootTex.pixels, width: bootTex.resolution, templateId: bootTex.templateId }
    : generateTexture({
        itemId: bootItem.id,
        resolution,
        seed,
        styleMix: paletteMix,
        signatureMix,
        rarity: bootItem.rarity,
        hueShift,
        glow,
        metallic,
        chaos,
        templateId: bootItem.templates[0],
      });

  const [pixels, setPixels] = useState<number[]>(bootGen.pixels);
  const [size, setSize] = useState(bootGen.width);
  const [dirty, setDirty] = useState(!bootTex);
  const [status, setStatus] = useState("画法と系譜を調合して鍛造してください");
  const [busy, setBusy] = useState(false);
  const [tool, setTool] = useState<EditorTool>("pencil");
  const [brush, setBrush] = useState("#e4b84a");
  const [history, setHistory] = useState<number[][]>([]);
  const [compare, setCompare] = useState<"signature" | "palette">("signature");
  const appliedInitialMasterwork = useRef<string | null>(null);

  const filtered = useMemo(() => {
    const list = searchItems(query);
    return category === "all" ? list : list.filter((i) => i.category === category);
  }, [query, category]);

  const forge = useCallback(
    (over?: {
      itemId?: string;
      seed?: number;
      resolution?: Resolution;
      rarity?: Rarity;
      templateId?: string;
      paletteMix?: MixEntry[];
      signatureMix?: MixEntry[];
    }) => {
      const nextId = over?.itemId ?? itemId;
      const nextItem = getItem(nextId) ?? item;
      const nextSeed = over?.seed ?? seed;
      const nextRes = over?.resolution ?? resolution;
      const nextTemplate = over?.templateId ?? templateId;
      const gen = generateTexture({
        itemId: nextItem.id,
        resolution: nextRes,
        seed: nextSeed,
        styleMix: over?.paletteMix ?? paletteMix,
        signatureMix: over?.signatureMix ?? signatureMix,
        rarity: over?.rarity ?? rarity,
        hueShift,
        glow,
        metallic,
        chaos,
        templateId: nextTemplate,
      });
      setPixels(gen.pixels);
      setSize(gen.width);
      setTemplateId(gen.templateId);
      setHistory([]);
      setDirty(true);
      const sigName = gen.signatureIds.map((s) => getSignature(s).nameJa).join(" + ");
      const palName = gen.paletteIds.map((p) => getPalette(p).nameJa).join(" + ");
      setStatus(
        `${nextItem.name} を鍛造 · ${gen.renderMode === "native64" ? "TRUE NATIVE 64" : `${nextRes}×${nextRes}`} · ${sigName} × ${palName} · seed ${nextSeed}`,
      );
    },
    [itemId, item, seed, resolution, templateId, paletteMix, signatureMix, rarity, hueShift, glow, metallic, chaos],
  );

  const comparison = useMemo(() => {
    const list = compare === "signature" ? SIGNATURES : PALETTES;
    return list.map((entry) => {
      const gen = generateTexture({
        itemId: item.id,
        resolution: 16, // compare strip renders fast; detail costs nothing here
        seed,
        styleMix: compare === "signature" ? paletteMix : [{ id: entry.id, weight: 1 }],
        signatureMix: compare === "signature" ? [{ id: entry.id, weight: 1 }] : signatureMix,
        rarity,
        hueShift,
        glow,
        metallic,
        chaos,
        templateId,
      });
      return { entry, gen };
    });
  }, [compare, item.id, seed, paletteMix, signatureMix, rarity, hueShift, glow, metallic, chaos, templateId]);

  function loadTexture(tex: TextureDTO) {
    const catalogItem = getItem(tex.itemId);
    setItemId(tex.itemId);
    setPixels(tex.pixels);
    setSize(tex.resolution);
    setResolution(tex.resolution === 32 ? 32 : 16);
    setSeed(tex.seed);
    setPaletteMix(tex.styleMix.length ? tex.styleMix : [{ id: "reborn_flare", weight: 1 }]);
    setSignatureMix(tex.signatureMix?.length ? tex.signatureMix : [{ id: "reborn_clean", weight: 1 }]);
    setRarity((tex.rarity as Rarity) || catalogItem?.rarity || "legendary");
    setHueShift(tex.hueShift);
    setGlow(tex.glow);
    setMetallic(tex.metallic);
    setChaos(tex.chaos);
    setTemplateId(tex.templateId);
    setHistory([]);
    setDirty(false);
    setStatus(`${tex.name} を読み込みました`);
  }

  function selectItem(id: string) {
    const next = getItem(id);
    if (!next) return;
    const existing = saved.find((t) => t.itemId === id);
    if (existing) {
      loadTexture(existing);
      return;
    }
    const nextSeed = randomSeed();
    setItemId(id);
    setRarity(next.rarity);
    setSeed(nextSeed);
    setTemplateId(next.templates[0]!);
    forge({ itemId: id, seed: nextSeed, rarity: next.rarity, templateId: next.templates[0] });
  }

  /** Loads an original curated PNG into the exact same pixel/save/export flow. */
  const loadMasterwork = useCallback(async (itemId: string) => {
    const masterwork = getMasterwork(itemId);
    const nextItem = getItem(itemId);
    if (!masterwork || !nextItem) return;
    setBusy(true);
    try {
      const image = new Image();
      image.decoding = "async";
      image.src = masterwork.file;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("ピクセルキャンバスを初期化できません");
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, 64, 64);
      ctx.drawImage(image, 0, 0, 64, 64);
      const rgba = Array.from(ctx.getImageData(0, 0, 64, 64).data);
      setItemId(itemId);
      setRarity(nextItem.rarity);
      setResolution(64);
      setPixels(rgba);
      setSize(64);
      setTemplateId(`masterwork:${itemId}`);
      setHistory([]);
      setDirty(true);
      setStatus(`${masterwork.titleJa} を原画として読み込みました。ピクセル編集・保存・ZIP出力できます。`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "原画の読み込みに失敗しました");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!initialMasterwork || appliedInitialMasterwork.current === initialMasterwork) return;
    if (!getMasterwork(initialMasterwork)) return;
    appliedInitialMasterwork.current = initialMasterwork;
    void loadMasterwork(initialMasterwork);
  }, [initialMasterwork, loadMasterwork]);

  function toggleMix(
    kind: "signature" | "palette",
    id: string,
  ) {
    const apply = (current: MixEntry[], max: number): MixEntry[] => {
      const exists = current.find((m) => m.id === id);
      if (exists) {
        const next = current.filter((m) => m.id !== id);
        return next.length ? next : current;
      }
      const entry = { id, weight: kind === "palette" ? 1 : 1 };
      return current.length >= max ? [...current.slice(1), entry] : [...current, entry];
    };
    if (kind === "signature") {
      const next = apply(signatureMix, 2);
      setSignatureMix(next);
      forge({ signatureMix: next });
    } else {
      const next = apply(paletteMix, 3);
      setPaletteMix(next);
      forge({ paletteMix: next });
    }
  }

  function setWeight(kind: "signature" | "palette", id: string, weight: number) {
    if (kind === "signature") {
      const next = signatureMix.map((m) => (m.id === id ? { ...m, weight } : m));
      setSignatureMix(next);
      forge({ signatureMix: next });
    } else {
      const next = paletteMix.map((m) => (m.id === id ? { ...m, weight } : m));
      setPaletteMix(next);
      forge({ paletteMix: next });
    }
  }

  function editPixels(next: number[]) {
    setHistory((h) => [...h.slice(-40), pixels]);
    setPixels(next);
    setDirty(true);
  }

  function undo() {
    setHistory((h) => {
      const prev = h[h.length - 1];
      if (!prev) return h;
      setPixels(prev);
      setDirty(true);
      return h.slice(0, -1);
    });
  }

  function randomizeAll() {
    const nextItem = CATALOG[Math.floor(Math.random() * CATALOG.length)]!;
    const sig = [...SIGNATURES].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 2));
    const pal = [...PALETTES].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3));
    const nextSig = sig.map((s, i) => ({ id: s.id, weight: 2 - i }));
    const nextPal = pal.map((p, i) => ({ id: p.id, weight: 3 - i }));
    const nextSeed = randomSeed();
    setItemId(nextItem.id);
    setRarity(nextItem.rarity);
    setSignatureMix(nextSig);
    setPaletteMix(nextPal);
    setSeed(nextSeed);
    setHueShift(Math.floor(Math.random() * 70) - 35);
    setGlow(20 + Math.floor(Math.random() * 70));
    setMetallic(20 + Math.floor(Math.random() * 70));
    setChaos(Math.floor(Math.random() * 70));
    setTemplateId(nextItem.templates[0]!);
    forge({
      itemId: nextItem.id,
      seed: nextSeed,
      rarity: nextItem.rarity,
      signatureMix: nextSig,
      paletteMix: nextPal,
      templateId: nextItem.templates[0],
    });
  }

  async function saveCurrent() {
    setBusy(true);
    try {
      let id = packId;
      const meta = {
        name: packName,
        author,
        description,
        resolution,
        styleId: paletteMix[0]?.id,
        signatureId: signatureMix[0]?.id,
        isPublic,
      };
      if (!id) {
        const created = await api<{ id: string }>("/api/packs", {
          method: "POST",
          body: JSON.stringify(meta),
        });
        id = created.id;
        setPackId(id);
      } else {
        await api(`/api/packs/${id}`, { method: "PATCH", body: JSON.stringify(meta) });
      }
      const tex = await api<TextureDTO>(`/api/packs/${id}/textures`, {
        method: "POST",
        body: JSON.stringify({
          itemId,
          rarity,
          styleMix: paletteMix,
          signatureMix,
          seed,
          resolution,
          pixels,
          hueShift,
          glow,
          metallic,
          chaos,
          templateId,
        }),
      });
      setSaved((list) => [...list.filter((t) => t.itemId !== tex.itemId), tex]);
      setDirty(false);
      setStatus(`${item.name} をパックに保存しました`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function removeSaved(tex: TextureDTO) {
    if (!confirm(`${tex.name} をパックから外しますか？`)) return;
    await fetch(`/api/textures/${tex.id}`, { method: "DELETE" });
    setSaved((list) => list.filter((t) => t.id !== tex.id));
    setStatus(`${tex.name} を外しました`);
  }

  /** Re-forge every saved texture with the current essence mix (bulk restyle). */
  async function reforgePack() {
    if (!packId) {
      setStatus("先にパックへ保存してください（一括適用はパック単位です）");
      return;
    }
    if (!saved.length) {
      setStatus("パックが空です");
      return;
    }
    setBusy(true);
    try {
      const next: TextureDTO[] = [];
      let preservedMasterworks = 0;
      for (const tex of saved) {
        if (tex.templateId.startsWith("masterwork:")) {
          next.push(tex);
          preservedMasterworks++;
          continue;
        }
        const catalogItem = getItem(tex.itemId);
        if (!catalogItem) continue;
        const gen = generateTexture({
          itemId: tex.itemId,
          resolution: resolution,
          seed: tex.seed,
          styleMix: paletteMix,
          signatureMix,
          rarity: (tex.rarity as Rarity) || catalogItem.rarity,
          hueShift,
          glow,
          metallic,
          chaos,
          templateId: tex.templateId,
        });
        const updated = await api<TextureDTO>(`/api/packs/${packId}/textures`, {
          method: "POST",
          body: JSON.stringify({
            itemId: tex.itemId,
            rarity: tex.rarity,
            styleMix: paletteMix,
            signatureMix,
            seed: tex.seed,
            resolution,
            pixels: gen.pixels,
            hueShift,
            glow,
            metallic,
            chaos,
            templateId: gen.templateId,
          }),
        });
        next.push(updated);
        if (updated.itemId === itemId) {
          setPixels(gen.pixels);
          setSize(gen.width);
          setTemplateId(gen.templateId);
        }
      }
      setSaved(next);
      setDirty(false);
      setStatus(
        `${next.length - preservedMasterworks} 点に現在の画法・系譜を適用しました${
          preservedMasterworks ? `（原画 ${preservedMasterworks} 点は保持）` : ""
        }`,
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "一括適用に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  function downloadPng() {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < img.data.length; i++) img.data[i] = pixels[i] ?? 0;
    ctx.putImageData(img, 0, 0);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${item.id}.png`;
    a.click();
  }

  const swatches = useMemo(() => {
    const colors = new Set<string>();
    for (const entry of paletteMix) {
      for (const c of paletteSwatches(getPalette(entry.id))) colors.add(c);
    }
    return [...colors];
  }, [paletteMix]);
  const currentMasterwork = getMasterwork(item.id);
  const isMasterworkLoaded = templateId === `masterwork:${item.id}`;

  /** Masterworks grouped by catalog category so 50+ pieces stay browsable. */
  const masterworkGroups = useMemo(() => {
    const buckets = new Map<Category, typeof MASTERWORKS>();
    for (const masterwork of MASTERWORKS) {
      const catalogItem = getItem(masterwork.itemId);
      if (!catalogItem) continue;
      const list = buckets.get(catalogItem.category) ?? [];
      list.push(masterwork);
      buckets.set(catalogItem.category, list);
    }
    return CATEGORY_IDS.filter((id) => buckets.has(id)).map((category) => ({
      category,
      items: buckets.get(category)!,
    }));
  }, []);

  return (
    <div className="bg-forge min-h-screen">
      <div className="mx-auto max-w-[1560px] px-3 py-4 lg:px-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
          <div>
            <p className="font-pixel text-[10px] tracking-[0.25em] text-gold">FORGE STUDIO</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <input
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
                className="bg-transparent font-display text-xl tracking-wide text-gold-2 outline-none"
              />
              {packId ? (
                <Link href={`/packs/${packId}`} className="text-[11px] text-aqua/80 hover:text-aqua">
                  パックページ
                </Link>
              ) : null}
            </div>
            <p className="max-w-2xl text-[12px] text-paper/50">{status}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <button type="button" className="mc-btn px-3 py-1.5" onClick={randomizeAll}>
              カオス鍛造
            </button>
            <button
              type="button"
              className="mc-btn px-3 py-1.5"
              onClick={() => {
                const next = randomSeed();
                setSeed(next);
                forge({ seed: next });
              }}
            >
              再鍛造
            </button>
            <button type="button" className="mc-btn px-3 py-1.5" onClick={downloadPng}>
              PNG
            </button>
            <button
              type="button"
              disabled={busy || !saved.length}
              onClick={() => void reforgePack()}
              className="border border-mythic/50 bg-mythic/10 px-3 py-1.5 text-mythic disabled:opacity-40"
              title="パック内の全テクスチャに現在の画法・系譜を適用"
            >
              全{saved.length}点に適用
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveCurrent()}
              className="border border-gold/60 bg-gold/15 px-3 py-1.5 text-gold-2 disabled:opacity-50"
            >
              {busy ? "保存中…" : dirty ? "パックに保存" : "保存済み"}
            </button>
            {(() => {
              const currentTexture = saved.find((t) => t.itemId === itemId);
              if (!currentTexture) return null;
              return (
                <span className="flex gap-2">
                  <a
                    href={`/api/textures/${currentTexture.id}/png?dl=1`}
                    className="border border-line px-3 py-1.5 text-paper/70 hover:border-aqua/60 hover:text-aqua"
                    title="現在の1枚を PNG で保存"
                  >
                    単体PNG
                  </a>
                  <a
                    href={`/api/textures/${currentTexture.id}/export?dl=1`}
                    className="border border-gold/60 bg-gold/15 px-3 py-1.5 text-gold-2"
                    title="現在の1枚だけで導入できるリソースパックZIP"
                  >
                    単体ZIP
                  </a>
                </span>
              );
            })()}
            {packId ? (
              <a
                href={`/api/packs/${packId}/export`}
                className="border border-aqua/50 bg-aqua/10 px-3 py-1.5 text-aqua"
              >
                ZIP書き出し
              </a>
            ) : null}
          </div>
        </div>

        {/* 3-step workflow so the flow is self-explanatory */}
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <div
            className={`flex items-center gap-2 border px-3 py-2 text-[12px] ${
              true ? "border-gold/50 bg-gold/10 text-gold-2" : "border-line text-paper/60"
            }`}
          >
            <span className="font-display">①</span>
            アイテムを選んで、画法 × 系譜をタップで調合
          </div>
          <div
            className={`flex items-center gap-2 border px-3 py-2 text-[12px] ${
              saved.length
                ? "border-line text-paper/60"
                : "border-gold/50 bg-gold/10 text-gold-2"
            }`}
          >
            <span className="font-display">②</span>
            {saved.length ? `パックに保存済（${saved.length}点）` : "気に入ったら「パックに保存」"}
          </div>
          <div
            className={`flex items-center gap-2 border px-3 py-2 text-[12px] ${
              packId ? "border-aqua/50 bg-aqua/10 text-aqua" : "border-line text-paper/60"
            }`}
          >
            <span className="font-display">③</span>
            {packId ? "ZIP書き出し → resourcepacks/ へ" : "保存するとZIP書き出しが有効化"}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[250px_minmax(0,1fr)_320px]">
          <aside className="border border-line bg-panel/80 p-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="アイテム検索"
              className="w-full border border-line bg-ink px-2 py-1.5 text-sm outline-none focus:border-gold/50"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={`px-2 py-0.5 text-[11px] ${category === "all" ? "bg-gold/20 text-gold-2" : "text-paper/60"}`}
              >
                全部
              </button>
              {CATEGORY_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCategory(id)}
                  className={`px-2 py-0.5 text-[11px] ${category === id ? "bg-gold/20 text-gold-2" : "text-paper/60"}`}
                >
                  {CATEGORIES[id].labelJa}
                </button>
              ))}
            </div>
            <div className="mt-2 max-h-[68vh] space-y-0.5 overflow-auto pr-1">
              {filtered.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => selectItem(entry.id)}
                  className={`flex w-full items-center justify-between px-2 py-1.5 text-left text-xs ${
                    entry.id === itemId ? "bg-gold/15 text-gold-2" : "hover:bg-white/5"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{entry.name}</span>
                    <span className="block truncate text-[10px] text-paper/40">{entry.nameJa}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[9px]">
                    {hasMasterwork(entry.id) ? (
                      <span className="text-mythic" title="オリジナル原画あり">
                        ★
                      </span>
                    ) : null}
                    <span style={{ color: RARITIES[entry.rarity].color }}>
                      {saved.some((t) => t.itemId === entry.id) ? "●" : ""}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-4">
            <div className="border border-line bg-panel/70 p-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-pixel text-[10px] tracking-widest text-paper/40">PREVIEW</p>
                    {size === 64 ? (
                      <span className="border border-aqua/50 bg-aqua/10 px-2 py-0.5 font-pixel text-[9px] tracking-wider text-aqua">
                        TRUE NATIVE 64 · 1PX DETAIL
                      </span>
                    ) : null}
                  </div>
                  <div className="slot relative grid aspect-square place-items-center">
                    {pixels.length ? (
                      <PixelImage
                        pixels={pixels}
                        width={size}
                        height={size}
                        scale={size === 16 ? 13 : size === 32 ? 7 : 4}
                        glint={["mythic", "divine", "legendary", "ultimate"].includes(rarity)}
                      />
                    ) : null}
                  </div>
                  <div className="mt-3">
                    <ItemTooltip item={item} rarity={rarity} />
                  </div>
                  {currentMasterwork ? (
                    <button
                      type="button"
                      disabled={busy || isMasterworkLoaded}
                      onClick={() => void loadMasterwork(currentMasterwork.itemId)}
                      className="mt-3 w-full border border-mythic/60 bg-mythic/10 px-3 py-2 text-left text-xs text-mythic disabled:opacity-50"
                    >
                      <span className="font-pixel text-[10px] tracking-wider">ORIGINAL MASTERWORK 64</span>
                      <span className="mt-1 block text-paper/75">
                        {isMasterworkLoaded
                          ? "現在、この原画を編集しています"
                          : `${currentMasterwork.titleJa} を64px原画として使う`}
                      </span>
                    </button>
                  ) : null}
                </div>
                <div>
                  <p className="mb-2 font-pixel text-[10px] tracking-widest text-paper/40">PIXEL FORGE</p>
                  <PixelEditor
                    pixels={pixels}
                    width={size}
                    height={size}
                    tool={tool}
                    color={brush}
                    onChange={editPixels}
                    onPick={setBrush}
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                    {TOOLS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTool(t.id)}
                        className={`px-2 py-1 ${tool === t.id ? "bg-gold/20 text-gold-2" : "bg-ink text-paper/60"}`}
                      >
                        {t.label}
                      </button>
                    ))}
                    <button type="button" onClick={undo} className="bg-ink px-2 py-1 text-paper/60">
                      戻す
                    </button>
                    <input
                      type="color"
                      value={brush}
                      onChange={(e) => setBrush(e.target.value)}
                      className="h-7 w-10 bg-transparent"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {swatches.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBrush(c)}
                        className="h-5 w-5 border border-black"
                        style={{ background: c }}
                        aria-label={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-line bg-panel/70 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-pixel text-[10px] tracking-widest text-paper/40">
                  ESSENCE COMPARE · {item.name}
                </p>
                <div className="flex gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCompare("signature")}
                    className={`px-2 py-0.5 ${compare === "signature" ? "bg-gold/20 text-gold-2" : "text-paper/50"}`}
                  >
                    画法
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompare("palette")}
                    className={`px-2 py-0.5 ${compare === "palette" ? "bg-gold/20 text-gold-2" : "text-paper/50"}`}
                  >
                    系譜
                  </button>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {comparison.map(({ entry, gen }) => {
                  const active =
                    compare === "signature"
                      ? signatureMix.some((m) => m.id === entry.id)
                      : paletteMix.some((m) => m.id === entry.id);
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => toggleMix(compare, entry.id)}
                      title={entry.essence}
                      className={`w-[104px] shrink-0 border p-2 text-left ${
                        active ? "border-gold/70 bg-gold/10" : "border-line hover:border-paper/30"
                      }`}
                    >
                      <span className="slot grid aspect-square place-items-center">
                        <PixelImage pixels={gen.pixels} width={gen.width} height={gen.height} scale={5} />
                      </span>
                      <span className="mt-1 block text-[10px] leading-tight text-paper/80">
                        {entry.nameJa}
                      </span>
                      <span className="block text-[9px] leading-tight text-paper/40">
                        {entry.tagline}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border border-mythic/30 bg-mythic/5 p-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="font-pixel text-[10px] tracking-widest text-mythic">ORIGINAL MASTERWORK FOUNDATIONS</p>
                  <p className="mt-1 text-[11px] text-paper/55">
                    高品質なオリジナル原画。クリックすると64pxの実ピクセルとして読み込まれ、そのまま編集・保存・ZIP出力できる。
                  </p>
                </div>
                <span className="text-[10px] text-paper/40">
                  {MASTERWORKS.length} / {CATALOG.length} アイテム（★印）
                </span>
              </div>
              <div className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-1">
                {masterworkGroups.map((group) => (
                  <div key={group.category}>
                    <p className="mb-1 font-pixel text-[9px] tracking-widest text-paper/35">
                      {CATEGORIES[group.category].labelJa} · {group.items.length}
                    </p>
                    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-8">
                      {group.items.map((masterwork) => {
                        const selected = isMasterworkLoaded && item.id === masterwork.itemId;
                        return (
                          <button
                            key={masterwork.itemId}
                            type="button"
                            disabled={busy}
                            onClick={() => void loadMasterwork(masterwork.itemId)}
                            className={`border p-1 transition ${
                              selected
                                ? "border-mythic bg-mythic/20"
                                : "border-line hover:border-mythic/60"
                            } disabled:opacity-50`}
                            title={`${masterwork.titleJa} · ${masterwork.note}`}
                          >
                            <span className="slot grid aspect-square place-items-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={masterwork.file}
                                alt={masterwork.titleJa}
                                loading="lazy"
                                className="pixelated h-full w-full object-contain"
                              />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-3">
            <div className="border border-line bg-panel/80 p-3">
              <p className="font-pixel text-[10px] tracking-widest text-gold">画法 SIGNATURE</p>
              <p className="mt-1 text-[11px] text-paper/50">
                最大2つ。輪郭・ベベル・階調・装飾量など“どう描くか”を混ぜる。
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1">
                {SIGNATURES.map((sig) => {
                  const active = signatureMix.some((m) => m.id === sig.id);
                  return (
                    <button
                      key={sig.id}
                      type="button"
                      onClick={() => toggleMix("signature", sig.id)}
                      className={`border p-1.5 text-left ${active ? "border-gold/70 bg-gold/10" : "border-line"}`}
                    >
                      <span className="block text-[10px] leading-tight text-paper/85">{sig.nameJa}</span>
                      <span className="block text-[9px] leading-tight text-paper/40">{sig.tags.join("/")}</span>
                    </button>
                  );
                })}
              </div>
              {signatureMix.map((entry) => {
                const sig = getSignature(entry.id);
                return (
                  <label key={entry.id} className="mt-2 block text-[11px] text-paper/70">
                    {sig.nameJa} ×{entry.weight}
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={entry.weight}
                      className="range-gold mt-1 w-full"
                      onChange={(e) => setWeight("signature", entry.id, Number(e.target.value))}
                    />
                  </label>
                );
              })}
              <p className="mt-2 text-[11px] leading-relaxed text-paper/55">
                {getSignature(signatureMix[0]?.id ?? "reborn_clean").essence}
              </p>
            </div>

            <div className="border border-line bg-panel/80 p-3">
              <p className="font-pixel text-[10px] tracking-widest text-aqua">系譜 PALETTE</p>
              <p className="mt-1 text-[11px] text-paper/50">最大3つ。何で出来ているか（色）を混ぜる。</p>
              <div className="mt-2 grid grid-cols-3 gap-1">
                {PALETTES.map((pal) => {
                  const active = paletteMix.some((m) => m.id === pal.id);
                  return (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => toggleMix("palette", pal.id)}
                      title={`${pal.essence}`}
                      className={`border p-1 text-left ${active ? "border-aqua/70 bg-aqua/10" : "border-line"}`}
                    >
                      <span className="flex h-2 w-full">
                        {paletteSwatches(pal).map((c) => (
                          <span key={c} className="flex-1" style={{ background: c }} />
                        ))}
                      </span>
                      <span className="mt-1 block text-[9px] leading-tight text-paper/80">
                        {pal.nameJa}
                      </span>
                    </button>
                  );
                })}
              </div>
              {paletteMix.map((entry) => {
                const pal = getPalette(entry.id);
                return (
                  <label key={entry.id} className="mt-2 block text-[11px] text-paper/70">
                    {pal.nameJa} ×{entry.weight}
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={entry.weight}
                      className="range-gold mt-1 w-full"
                      onChange={(e) => setWeight("palette", entry.id, Number(e.target.value))}
                    />
                  </label>
                );
              })}
            </div>

            <div className="border border-line bg-panel/80 p-3 text-[12px]">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  レアリティ
                  <select
                    value={rarity}
                    onChange={(e) => {
                      const next = e.target.value as Rarity;
                      setRarity(next);
                      forge({ rarity: next });
                    }}
                    className="mt-1 w-full border border-line bg-ink px-2 py-1"
                  >
                    {RARITY_IDS.map((id) => (
                      <option key={id} value={id}>
                        {RARITIES[id].labelJa}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  解像度
                  <select
                    value={resolution}
                    onChange={(e) => {
                      const next = (Number(e.target.value) === 64
                        ? 64
                        : Number(e.target.value) === 32
                          ? 32
                          : 16) as Resolution;
                      setResolution(next);
                      forge({ resolution: next });
                    }}
                    className="mt-1 w-full border border-line bg-ink px-2 py-1"
                  >
                    {RESOLUTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}×{r}
                        {r === 64 ? "（専用64pxモデル）" : r === 32 ? "（精細化）" : "（クラシック）"}
                      </option>
                    ))}
                  </select>
                  {resolution === 64 ? (
                    <span className="mt-1 block text-[10px] leading-relaxed text-aqua/70">
                      16/32型を拡大せず、64座標の別シルエット・曲線・1px刻印で生成
                    </span>
                  ) : null}
                </label>
              </div>
              <label className="mt-2 block">
                型（シルエット）
                <select
                  value={templateId}
                  onChange={(e) => {
                    setTemplateId(e.target.value);
                    forge({ templateId: e.target.value });
                  }}
                  className="mt-1 w-full border border-line bg-ink px-2 py-1"
                >
                  {templateId.startsWith("masterwork:") ? (
                    <option value={templateId}>ORIGINAL MASTERWORK 64</option>
                  ) : null}
                  {item.templates.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </label>
              {(
                [
                  { label: "色相", value: hueShift, min: -180, max: 180, setter: setHueShift },
                  { label: "発光", value: glow, min: 0, max: 100, setter: setGlow },
                  { label: "金属", value: metallic, min: 0, max: 100, setter: setMetallic },
                  { label: "カオス", value: chaos, min: 0, max: 100, setter: setChaos },
                ] as const
              ).map((slider) => (
                <label key={slider.label} className="mt-2 block text-paper/70">
                  {slider.label} {slider.value}
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    value={slider.value}
                    className="range-gold mt-1 w-full"
                    onChange={(e) => slider.setter(Number(e.target.value))}
                  />
                </label>
              ))}
              <label className="mt-2 block">
                シード
                <input
                  value={seed}
                  onChange={(e) => setSeed(Number(e.target.value) || 0)}
                  className="mt-1 w-full border border-line bg-ink px-2 py-1"
                />
              </label>
              <button
                type="button"
                className="mt-3 w-full border border-gold/50 bg-gold/10 py-2 text-gold-2"
                onClick={() => forge()}
              >
                この調合で鍛造
              </button>
            </div>

            <div className="border border-line bg-panel/80 p-3 text-[12px]">
              <p className="font-pixel text-[10px] tracking-widest text-paper/40">PACK META</p>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="mt-2 w-full border border-line bg-ink px-2 py-1"
                placeholder="作者"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-2 w-full border border-line bg-ink px-2 py-1"
              />
              <label className="mt-2 flex items-center gap-2 text-paper/60">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                ギャラリーに公開
              </label>
            </div>
          </aside>
        </div>

        <section className="mt-4 border border-line bg-panel/70 p-3">
          <p className="mb-2 font-pixel text-[10px] tracking-widest text-paper/40">
            PACK CONTENTS · {saved.length}（ダブルクリックで外す）
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {saved.length === 0 ? (
              <p className="text-xs text-paper/40">
                まだ入っていない。上段②の「パックに保存」を押すとここに出て、③のZIPにまとまる。
              </p>
            ) : (
              saved.map((tex) => (
                <button
                  key={tex.id}
                  type="button"
                  onClick={() => loadTexture(tex)}
                  onDoubleClick={() => void removeSaved(tex)}
                  className="slot grid h-20 w-20 shrink-0 place-items-center"
                  title={tex.name}
                >
                  <PixelImage
                    pixels={tex.pixels}
                    width={tex.resolution}
                    height={tex.resolution}
                    scale={tex.resolution === 16 ? 4 : tex.resolution === 32 ? 2 : 1}
                  />
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
