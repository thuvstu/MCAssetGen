import type { ModProject } from "../mod/model";

// ================= completeness checklist =================
export interface ChecklistItem { key: string; label: string; done: boolean; hint: string; weight: number }
export interface Completeness { score: number; items: ChecklistItem[] }

export function checkCompleteness(p: ModProject): Completeness {
  const has = (n: number) => n > 0;
  const manualSkills = p.skills.filter((s) => s.trigger.type === "MANUAL");
  const boundSkills = manualSkills.filter((s) => p.items.some((i) => i.skillId === s.id) || p.blocks.some((b) => b.skillId === s.id));
  const keySlotSkills = p.config.slots.filter(Boolean).filter((id) => p.skills.some((s) => s.id === id));
  // 防具の耐久0は「素材に合わせる」なので正常。通常アイテムは耐久ありならスタック1が妥当
  const usable = (it: (typeof p.items)[number]) => (it.kind === "simple" && it.durability > 0 ? it.maxCount <= 1 : true);
  const items: ChecklistItem[] = [
    { key: "meta", label: "Mod ID・名前・バージョンが設定済み", done: Boolean(p.meta.modId && p.meta.name && /^\d+\.\d+\.\d+/.test(p.meta.version)), hint: "Mod設定タブで入力します", weight: 1 },
    { key: "skills", label: "スキルが1つ以上ある", done: has(p.skills.length), hint: "スキルタブでブロックを組みます", weight: 3 },
    { key: "action", label: "全スキルにアクションがある", done: p.skills.length > 0 && p.skills.every((s) => s.actions.length > 0), hint: "空のスキルはゲーム内で何も起こりません", weight: 2 },
    { key: "cost", label: "コスト設計(クールダウン/マナ)が設定済み", done: p.skills.length > 0 && p.skills.some((s) => s.cooldown > 0 || s.manaCost > 0), hint: "連打可能なスキルはサーバー負荷に注意", weight: 2 },
    { key: "items", label: "アイテムがある", done: has(p.items.length), hint: "配布可能なアイテムを作りましょう", weight: 2 },
    { key: "kind", label: "武器・防具・道具のいずれかがある", done: p.items.some((i) => i.kind !== "simple"), hint: "戦闘系Modの説得力が上がります", weight: 1 },
    { key: "usable", label: "アイテムのスタック/耐久が妥当", done: p.items.length > 0 && p.items.every(usable), hint: "耐久値のあるアイテムはスタック不可にします", weight: 1 },
    { key: "bound", label: "スキルがアイテム/ブロックから発動できる", done: has(boundSkills.length) || has(keySlotSkills.length), hint: "右クリック割り当てかキースロット設定が必要", weight: 3 },
    { key: "slots", label: "キースロット(1〜4)にスキルを割り当て", done: has(keySlotSkills.length), hint: "Mod設定の「キースロット」で設定します", weight: 2 },
    { key: "blocks", label: "ブロックがある", done: has(p.blocks.length), hint: "拠点要素があるとModらしくなります", weight: 1 },
    { key: "recipes", label: "入手経路(レシピ)がある", done: p.items.length + p.blocks.length === 0 || p.recipes.length > 0, hint: "レシピがないとクリエイティブ専用になります", weight: 3 },
    { key: "recipeComplete", label: "全レシピに完成品が設定されている", done: p.recipes.length === 0 || p.recipes.every((r) => Boolean(r.resultItem.trim()) && r.grid.some((c) => c.trim())), hint: "レシピタブで完成品を選択します", weight: 2 },
    { key: "lang", label: "表示名がすべて入力済み", done: [...p.items, ...p.blocks].every((x) => x.name.trim()) && Boolean(p.meta.name.trim()), hint: "lang に反映されます", weight: 2 },
    { key: "tooltip", label: "主要アイテムにツールチップがある", done: p.items.filter((i) => i.skillId).every((i) => Boolean(i.tooltip.trim())) && p.items.some((i) => i.skillId), hint: "使い方が伝わる説明を書きましょう", weight: 1 },
    { key: "balance", label: "ダメージ/威力がバランス内", done: !p.skills.some((s) => s.actions.some((a) => (a.type === "damage" && Number(a.params.amount) > 100) || (a.type === "explosion" && Number(a.params.power) > 10))), hint: "過剰な数値は他Mod/サーバーと衝突します", weight: 2 },
    { key: "desc", label: "Modの説明文がある", done: Boolean(p.meta.description.trim()), hint: "fabric.mod.json / CurseForge説明に使われます", weight: 1 },
    { key: "ore", label: "鉱石のワールド生成設定がある", done: p.blocks.some((b) => b.ore) , hint: "ブロックタブで「鉱石として生成する」をオン", weight: 1 },
    { key: "wear", label: "装備セット効果(装備中トリガー)がある", done: p.skills.some((s) => s.trigger.type === "WEAR"), hint: "トリガー「防具を装備している間」を使います", weight: 1 },
    { key: "pack", label: "Mod IDがパッケージ名と整合", done: p.meta.packageName.endsWith(p.meta.modId.replace(/_/g, "")) || p.meta.packageName.includes(p.meta.modId), hint: "パッケージ名にMod IDを含めると整理しやすくなります", weight: 1 },
    { key: "sys", label: "拡張システム(ショップ,モブ,ステータス等)を使っている", done: has(p.shops.length) || has(p.mobs.length) || has(p.drops.length) || has(p.skillPoints.length), hint: "ショップ、モブ、ドロップ表、ステータス振り分けなどが新たに実装されました", weight: 2 },
    { key: "struct", label: "構造物生成(初期村/NBT)または武器工房が設定済み", done: Boolean(p.structures?.length || p.forge?.enabled), hint: "初期村の自動生成や武器工房でゲーム内プレイ感が大きく向上します", weight: 2 },
  ];
  const total = items.reduce((a, b) => a + b.weight, 0);
  const got = items.reduce((a, b) => a + (b.done ? b.weight : 0), 0);
  return { score: Math.round((got / total) * 100), items };
}
