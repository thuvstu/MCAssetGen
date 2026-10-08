import { checkEnv, resolveEnv } from "../mod/targets";
import {
  BLOCK_SOUNDS, EFFECTS, ENTITY_TYPES, ENTITY_TYPES as MOB_BASES, PARTICLES, PLACE_BLOCKS, SOUNDS, schemaOf,
} from "../mod/catalog";
import { parsePngDataUrl } from "../mod/png";
import type { Action, Diagnostic, ModProject, Severity } from "../mod/model";

const ID_RE = /^[a-z][a-z0-9_]*$/;
const KT_KEYWORDS = new Set(["in", "is", "as", "object", "class", "fun", "val", "var", "if", "else", "when", "for", "while", "do", "return", "package", "import", "interface", "this", "super", "null", "true", "false", "try", "typealias", "throw", "break", "continue"]);

// ================= project-level logic checks =================
export function analyzeProject(p: ModProject): Diagnostic[] {
  const out: Diagnostic[] = [];
  const add = (severity: Severity, code: string, where: string, message: string) =>
    out.push({ file: "project", line: 0, col: 0, severity, code, message: `[${where}] ${message}` });

  const m = p.meta;
  for (const e of checkEnv(resolveEnv(m))) add(e.severity, e.code, "ビルド環境", e.message);
  if (!/^[a-z][a-z0-9_]{1,63}$/.test(m.modId)) add("error", "PJ-MODID", "Mod設定", "Mod IDは小文字英数字と_のみ、英字始まり、2〜64文字にしてください");
  if (!m.name.trim()) add("error", "PJ-NAME", "Mod設定", "Mod名が空です");
  if (!/^\d+\.\d+\.\d+([-+][\w.]+)?$/.test(m.version)) add("error", "PJ-VERSION", "Mod設定", "バージョンは 1.0.0 のようなセマンティックバージョンにしてください");
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(m.packageName)) add("error", "PJ-PACKAGE", "Mod設定", "パッケージ名は com.example.mymod のような形式にしてください");
  else m.packageName.split(".").forEach((seg) => KT_KEYWORDS.has(seg) && add("error", "PJ-PACKAGE", "Mod設定", `パッケージ名に Kotlin の予約語 '${seg}' は使用できません`));
  if (p.mana.max < 1) add("error", "PJ-MANA", "マナ設定", "最大マナは1以上にしてください");

  const skillIds = new Set(p.skills.map((s) => s.id));
  const modItemIds = new Set([...p.items.map((x) => x.id), ...p.blocks.map((x) => x.id)]);

  const seen = new Map<string, string>();
  const checkId = (kind: string, id: string, scope: string) => {
    if (!ID_RE.test(id)) add("error", "PJ-ID", `${kind}: ${id || "(空)"}`, "IDは小文字英数字と_のみ、英字始まりにしてください");
    const key = `${scope}:${id}`;
    if (seen.has(key)) add("error", "PJ-DUP", `${kind}: ${id}`, `ID '${id}' が重複しています (${seen.get(key)})`);
    else seen.set(key, kind);
  };

  for (const it of p.items) {
    checkId("アイテム", it.id, "item");
    if (p.blocks.some((b) => b.id === it.id)) add("error", "PJ-DUP", `アイテム: ${it.id}`, "ブロックと同じIDです (ブロックアイテムと衝突)");
    const w = `アイテム: ${it.id}`;
    if (!it.name.trim()) add("warning", "PJ-NAME", w, "表示名が空です");
    if (it.maxCount < 1 || it.maxCount > 99) add("error", "PJ-STACK", w, "最大スタック数は1〜99です");
    if (it.durability > 0 && it.maxCount > 1) add("info", "PJ-DURABILITY", w, "耐久値がある場合、最大スタック数は自動的に1として扱われます");
    if (it.skillId && !skillIds.has(it.skillId)) add("error", "PJ-REF", w, `スキル '${it.skillId}' が存在しません`);
    if (it.customTexture && !parsePngDataUrl(it.customTexture)) add("error", "PJ-TEXTURE", w, "アップロードされたテクスチャがPNG形式ではありません");
    if (it.food && (it.food.nutrition < 0 || it.food.saturation < 0)) add("error", "PJ-FOOD", w, "食料値は0以上にしてください");
    if (!/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(it.texture)) add("error", "PJ-TEXTURE", w, `テクスチャ '${it.texture}' の形式が不正です (例: minecraft:item/stick)`);
  }
  for (const b of p.blocks) {
    checkId("ブロック", b.id, "block");
    const w = `ブロック: ${b.id}`;
    if (b.customTexture && !parsePngDataUrl(b.customTexture)) add("error", "PJ-TEXTURE", w, "アップロードされたテクスチャがPNG形式ではありません");
    if (b.ore) {
      const o = b.ore;
      if (o.dropItem.trim() && !/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(o.dropItem.includes(":") ? o.dropItem : `${m.modId}:${o.dropItem}`)) add("error", "PJ-ORE", w, `ドロップアイテム '${o.dropItem}' のID形式が不正です`);
      if (o.dropItem.startsWith(`${m.modId}:`) && !modItemIds.has(o.dropItem.split(":")[1])) add("error", "PJ-REF", w, `ドロップアイテム '${o.dropItem}' はこのModに存在しません`);
      if (o.dropMin < 0 || o.dropMax < o.dropMin) add("error", "PJ-ORE", w, "ドロップ数は 最小 ≤ 最大 (0以上) にしてください");
      if (o.dropMax > 16) add("warning", "PJ-BALANCE", w, "ドロップ数の最大が16を超えています");
      if (o.veinSize < 1 || o.veinSize > 64) add("error", "PJ-ORE", w, "脈のサイズは1〜64です");
      if (o.veinsPerChunk < 1 || o.veinsPerChunk > 64) add("error", "PJ-ORE", w, "1チャンクあたりの脈数は1〜64です");
      if (o.maxY < o.minY) add("error", "PJ-ORE", w, "高さの範囲は 最小Y ≤ 最大Y にしてください");
      if (o.dimension === "OVERWORLD" && (o.minY < -64 || o.maxY > 319)) add("error", "PJ-ORE", w, "オーバーワールドの高さは -64〜319 の範囲です");
      if (o.dimension === "NETHER" && (o.minY < 0 || o.maxY > 127)) add("error", "PJ-ORE", w, "ネザーの高さは 0〜127 の範囲です");
      if (o.dimension === "END" && (o.minY < 0 || o.maxY > 255)) add("warning", "PJ-ORE", w, "エンドの高さは 0〜255 の範囲を推奨します");
      if (o.veinSize * o.veinsPerChunk > 400) add("warning", "PJ-PERF", w, "生成量が多すぎます (脈サイズ×脈数 ≤ 400 を推奨)。ワールド生成が重くなります");
      if (o.xpMax < o.xpMin) add("error", "PJ-ORE", w, "経験値は 最小 ≤ 最大 にしてください");
      if (b.tool === "none") add("warning", "PJ-TOOL", w, "鉱石の適正ツールが未設定です (ピッケル推奨)");
    }
    if (b.luminance < 0 || b.luminance > 15) add("error", "PJ-LIGHT", w, "発光レベルは0〜15です");
    if (b.hardness < 0) add("error", "PJ-HARD", w, "硬度は0以上にしてください");
    if (b.resistance < 0) add("error", "PJ-RES", w, "爆発耐性は0以上にしてください");
    if (!BLOCK_SOUNDS.includes(b.sound)) add("error", "PJ-SOUND", w, `不明なサウンドグループ '${b.sound}'`);
    if (b.skillId && !skillIds.has(b.skillId)) add("error", "PJ-REF", w, `スキル '${b.skillId}' が存在しません`);
    if (b.requiresTool && b.tool === "none") add("warning", "PJ-TOOL", w, "「適正ツール必須」ですが適正ツールが未設定です。素手でも壊せなくなります");
    if (!/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(b.texture)) add("error", "PJ-TEXTURE", w, `テクスチャ '${b.texture}' の形式が不正です`);
  }

  const referenced = new Set<string>();
  p.items.forEach((x) => x.skillId && referenced.add(x.skillId));
  p.blocks.forEach((x) => x.skillId && referenced.add(x.skillId));
  p.config.slots.forEach((x) => x && referenced.add(x));

  // cast chain graph
  const edges = new Map<string, string[]>();
  const walk = (list: Action[], fn: (a: Action, depth: number) => void, depth = 0) =>
    list.forEach((a) => { fn(a, depth); if (a.children) walk(a.children, fn, depth + 1); });

  for (const s of p.skills) {
    checkId("スキル", s.id, "skill");
    const w = `スキル: ${s.id}`;
    if (!s.name.trim()) add("warning", "PJ-NAME", w, "表示名が空です");
    if (s.cooldown < 0) add("error", "PJ-CD", w, "クールダウンは0以上にしてください");
    if (s.manaCost < 0) add("error", "PJ-MANA", w, "マナ消費は0以上にしてください");
    if (s.manaCost > p.mana.max) add("error", "PJ-MANA", w, `マナ消費(${s.manaCost})が最大マナ(${p.mana.max})を超えており、永遠に発動できません`);
    if (s.actions.length === 0) add("warning", "PJ-EMPTY", w, "アクションが1つもありません");
    if ((s.trigger.type === "PERIODIC" || s.trigger.type === "WEAR") && s.trigger.intervalSec < 1) add("error", "PJ-TRIGGER", w, "間隔は1秒以上にしてください");
    if (s.trigger.type === "WEAR") {
      const wid = s.trigger.heldItem.trim();
      if (!wid) add("error", "PJ-TRIGGER", w, "「装備中」トリガーには装備するアイテムIDが必要です");
      else {
        const full = wid.includes(":") ? wid : `${m.modId}:${wid}`;
        if (full.startsWith(`${m.modId}:`) && !p.items.some((x) => x.id === full.split(":")[1])) add("error", "PJ-REF", w, `装備アイテム '${full}' がこのModに存在しません`);
        else if (full.startsWith(`${m.modId}:`) && p.items.find((x) => x.id === full.split(":")[1])?.kind !== "armor") add("warning", "PJ-TRIGGER", w, `'${full}' は防具ではないため「装備中」と判定されません`);
      }
      if (s.cooldown > 0 || s.manaCost > 0) add("info", "PJ-TRIGGER", w, "装備中トリガーはコスト(クールダウン/マナ)を消費せず発動します");
    }
    if (s.trigger.type !== "MANUAL" && referenced.has(s.id)) add("warning", "PJ-TRIGGER", w, "自動トリガーのスキルがアイテム/ブロックにも割り当てられています (二重発動の可能性)");
    if (s.trigger.type === "PERIODIC" && s.cooldown === 0 && s.manaCost === 0 && s.trigger.intervalSec < 3)
      add("info", "PJ-PERF", w, "短い間隔のパッシブスキルはサーバー負荷になる可能性があります");
    if (s.trigger.type === "MANUAL" && !referenced.has(s.id)) add("info", "PJ-UNBOUND", w, "アイテム/ブロックに未割り当てです (/skill cast で発動できます)");
    s.conditions.forEach((c) => {
      if (c.type === "HEALTH_BELOW" && !(Number(c.value) > 0 && Number(c.value) <= 100)) add("error", "PJ-COND", w, "体力条件は1〜100(%)の数値にしてください");
      if ((c.type === "HOLDING" || c.type === "WEARING") && !/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(c.value)) add("error", "PJ-COND", w, "持ち物/装備条件は mymod:item のID形式にしてください");
      if (c.type === "MANA_ABOVE" && !(Number(c.value) >= 0)) add("error", "PJ-COND", w, "マナ条件は0以上の数値にしてください");
      if (c.type === "VARIABLE") {
        const [, vn = "", lo = "", hi = ""] = c.value.split("|");
        if (!/^[A-Za-z0-9_]+$/.test(vn)) add("error", "PJ-COND", w, "変数条件の変数名は英数字と _ のみです");
        if ((lo.trim() !== "" && Number.isNaN(Number(lo))) || (hi.trim() !== "" && Number.isNaN(Number(hi)))) add("error", "PJ-COND", w, "変数条件の範囲は数値で指定してください");
        if (lo.trim() !== "" && hi.trim() !== "" && Number(lo) > Number(hi)) add("error", "PJ-COND", w, "変数条件は 最小 ≤ 最大 にしてください");
      }
    });
    if (s.trigger.heldItem && !/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(s.trigger.heldItem)) add("error", "PJ-TRIGGER", w, "手持ちアイテム条件のID形式が不正です");

    const targets: string[] = [];
    edges.set(s.id, targets);
    walk(s.actions, (a, depth) => {
      const sc = schemaOf(a.type);
      const aw = `${w} › ${sc?.label ?? a.type}`;
      const pr = a.params;
      if (!sc) return add("error", "PJ-ACTION", aw, `不明なアクション種別 '${a.type}'`);
      if (depth >= 3) add("warning", "PJ-NEST", aw, "ネストが深すぎます (3階層以内を推奨)");
      if (sc.container && (a.children?.length ?? 0) === 0) add("warning", "PJ-EMPTY", aw, "中身が空のブロックです");
      const radius = Number(pr.radius);
      if (pr.target === "AREA" && radius > 32) add("warning", "PJ-RADIUS", aw, `範囲${radius}ブロックは広すぎます。サーバー負荷に注意してください`);
      switch (a.type) {
        case "damage": if (Number(pr.amount) > 100) add("warning", "PJ-BALANCE", aw, "ダメージ量が100を超えています"); break;
        case "effect":
          if (!EFFECTS.some((e) => e.key === pr.effect)) add("error", "PJ-EFFECT", aw, `不明なポーション効果 '${pr.effect}'`);
          if (Number(pr.amplifier) > 9) add("warning", "PJ-BALANCE", aw, "効果レベルが10を超えています");
          break;
        case "particles":
          if (!PARTICLES.some((e) => e.key === pr.particle)) add("error", "PJ-PARTICLE", aw, `不明なパーティクル '${pr.particle}'`);
          if (Number(pr.count) > 200) add("warning", "PJ-PERF", aw, "パーティクル数が多すぎます (200以下を推奨)");
          break;
        case "sound": if (!SOUNDS.some((e) => e.key === pr.sound)) add("error", "PJ-SOUND", aw, `不明なサウンド '${pr.sound}'`); break;
        case "explosion": if (Number(pr.power) > 10) add("warning", "PJ-BALANCE", aw, "爆発威力が10を超えています (TNT=4)"); break;
        case "repeat":
          if (Number(pr.times) * (a.children?.length ?? 1) > 200) add("warning", "PJ-PERF", aw, "実行回数が多すぎます");
          break;
        case "command":
          if (!String(pr.command).trim()) add("error", "PJ-CMD", aw, "コマンドが空です");
          else if (String(pr.command).startsWith("/")) add("info", "PJ-CMD", aw, "先頭の / は自動的に除去されます");
          break;
        case "summon":
          if (!ENTITY_TYPES.some((e) => e.key === pr.entity)) add("error", "PJ-ENTITY", aw, `不明なMob '${pr.entity}'`);
          if (Number(pr.count) > 10) add("warning", "PJ-PERF", aw, "召喚数が多すぎます (10体以下を推奨)");
          break;
        case "placeBlock":
          if (!PLACE_BLOCKS.some((e) => e.key === pr.block)) add("error", "PJ-BLOCK", aw, `不明なブロック '${pr.block}'`);
          if (["LAVA", "WATER"].includes(String(pr.block)) && pr.target === "SELF") add("info", "PJ-BALANCE", aw, "自分の位置に流体を設置すると自身が巻き込まれます");
          break;
        case "teleportNear":
          if (Number(pr.distance) > 16) add("warning", "PJ-BALANCE", aw, "転送距離が長すぎます");
          break;
        case "missile": {
          const t = String(pr.onHitSkill);
          if (!PARTICLES.some((e) => e.key === pr.particle)) add("error", "PJ-PARTICLE", aw, `不明なパーティクル '${pr.particle}'`);
          if (!t) add("warning", "PJ-REF", aw, "着弾時のスキルが未設定です (演出のみの弾になります)");
          else if (!skillIds.has(t)) add("error", "PJ-REF", aw, `着弾スキル '${t}' が存在しません`);
          else { targets.push(t); referenced.add(t); }
          if (Number(pr.speed) * Number(pr.lifetime) > 160) add("warning", "PJ-PERF", aw, "射程が160ブロックを超えます (チャンク未ロード領域に飛ぶ可能性)");
          if (Number(pr.hitRadius) > 2) add("info", "PJ-BALANCE", aw, "当たり判定が大きいため、横を通っただけで命中します");
          break;
        }
        case "ring":
          if (!PARTICLES.some((e) => e.key === pr.particle)) add("error", "PJ-PARTICLE", aw, `不明なパーティクル '${pr.particle}'`);
          if (Number(pr.points) > 100) add("warning", "PJ-PERF", aw, "点の数が多すぎます");
          break;
        case "setVar": case "addVar": case "ifVar":
          if (!/^[A-Za-z0-9_]+$/.test(String(pr.name))) add("error", "PJ-VAR", aw, `変数名 '${pr.name}' は英数字と _ のみ使えます`);
          if (a.type === "ifVar" && Number(pr.min) > Number(pr.max)) add("error", "PJ-VAR", aw, "範囲は 最小 ≤ 最大 にしてください");
          if (a.type === "addVar" && Number(pr.min) > Number(pr.max)) add("error", "PJ-VAR", aw, "下限は上限以下にしてください");
          break;
        case "summonCustom": {
          const mid = String(pr.mobId);
          if (!mid) add("error", "PJ-REF", aw, "カスタムモブが未選択です (「モブ」タブで作成できます)");
          else if (!p.mobs.some((mb) => mb.id === mid)) add("error", "PJ-REF", aw, `カスタムモブ '${mid}' が存在しません`);
          if (Number(pr.count) > 5) add("warning", "PJ-PERF", aw, "一度に召喚する数が多すぎます");
          break;
        }
        case "chance": if (Number(pr.percent) <= 0) add("warning", "PJ-EMPTY", aw, "確率が0%のため中身は実行されません"); break;
        case "message": case "title": {
          const txt = `${pr.text ?? ""} ${pr.subtitle ?? ""}`;
          for (const mt of txt.matchAll(/<([a-z]+)[.]([A-Za-z0-9_]+)>/g)) if (!["var", "target", "global"].includes(mt[1])) add("warning", "PJ-VAR", aw, `不明なプレースホルダ <${mt[1]}.${mt[2]}> (使えるのは var / target / global)`);
          break;
        }
        case "giveItem": case "dropItem": {
          const id = String(pr.item);
          if (!id.trim()) add("error", "PJ-ITEM", aw, "アイテムIDが空です");
          else if (id.startsWith(`${m.modId}:`) && !modItemIds.has(id.split(":")[1])) add("error", "PJ-REF", aw, `Mod内にアイテム '${id}' が存在しません`);
          break;
        }
        case "castSkill": {
          const t = String(pr.skillId);
          if (!t) add("error", "PJ-REF", aw, "連鎖するスキルが未選択です");
          else if (!skillIds.has(t)) add("error", "PJ-REF", aw, `スキル '${t}' が存在しません`);
          else targets.push(t);
          break;
        }
        case "custom":
          if (!String(pr.code).trim()) add("warning", "PJ-EMPTY", aw, "Kotlinコードが空です");
          break;
      }
    });
  }
  // cycle detection
  const state = new Map<string, number>();
  const cyc = new Set<string>();
  const dfs = (id: string, path: string[]) => {
    state.set(id, 1);
    for (const n of edges.get(id) ?? []) {
      if (state.get(n) === 1) {
        const loop = [...path.slice(path.indexOf(n)), n];
        const key = [...loop].sort().join(",");
        if (!cyc.has(key)) { cyc.add(key); add("error", "PJ-CYCLE", `スキル: ${n}`, `スキルの循環参照を検出: ${loop.join(" → ")} (無限ループになります)`); }
      } else if (!state.get(n) && edges.has(n)) dfs(n, [...path, n]);
    }
    state.set(id, 2);
  };
  p.skills.forEach((s) => { if (!state.get(s.id)) dfs(s.id, [s.id]); });

  const COOKING_TYPES = ["smelting", "blasting", "smoking", "campfire_cooking"] as const;
  for (const r of p.recipes) {
    checkId("レシピ", r.id, "recipe");
    const w = `レシピ: ${r.id}`;
    const isCrafting = r.type === "shaped" || r.type === "shapeless";
    const isCooking = (COOKING_TYPES as readonly string[]).includes(r.type);
    const cells = r.grid.map((x) => x.trim()).filter(Boolean);
    if (isCrafting && cells.length === 0) add("error", "PJ-RECIPE", w, "材料が1つもありません");
    if (!isCrafting && !r.inputItem?.trim()) add("error", "PJ-RECIPE", w, `${r.type} には材料 (inputItem) が必要です`);
    if (!r.resultItem.trim()) add("error", "PJ-RECIPE", w, "完成品が未設定です");
    if (r.resultCount < 1 || r.resultCount > 64) add("error", "PJ-RECIPE", w, "完成個数は1〜64です");
    if (isCooking && (r.cookingTimeTicks ?? 200) < 1) add("error", "PJ-RECIPE", w, "調理時間は1tick以上にしてください");
    if (isCooking && (r.cookingExperience ?? 0) < 0) add("error", "PJ-RECIPE", w, "獲得経験値は0以上にしてください");
    if (r.type === "stonecutting" && r.resultCount > 1) add("info", "PJ-RECIPE", w, "石切台は個数を1にするのが一般的です");
    const check = (raw: string, role: string) => {
      // 材料には #minecraft:planks のようなタグも指定できる (完成品は不可)
      const isTag = role === "材料" && raw.startsWith("#");
      const id = isTag ? raw.slice(1) : raw;
      if (!isTag && id.startsWith(`${m.modId}:`) && !modItemIds.has(id.split(":")[1])) add("error", "PJ-REF", w, `${role} '${id}' はこのModに存在しません`);
      if (id && !/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(id.includes(":") ? id : `minecraft:${id}`)) add("error", "PJ-ID", w, `${role} '${raw}' のID形式が不正です`);
      if (raw.startsWith("#") && role !== "材料") add("error", "PJ-ID", w, `${role} にタグ (#) は指定できません`);
    };
    cells.forEach((c) => check(c, "材料"));
    if (r.inputItem) check(r.inputItem, "材料");
    if (r.resultItem) check(r.resultItem, "完成品");
  }

  // -- 拡張機能の検証 --
  const usedMats = new Set(p.materials.map((m: any) => m.id));
  const usedShops = new Set(p.shops.map((m: any) => m.id));
  const usedMobs = new Set(p.mobs.map((m: any) => m.id));
  const usedSPs = new Set(p.skillPoints.map((m: any) => m.id));

  for (const mb of p.mobs) {
    const w = `モブ: ${mb.id}`;
    if (!/^[a-z][a-z0-9_]*$/.test(mb.id)) add("error", "PJ-ID", w, "IDは小文字英数字と_のみ、英字始まりにしてください");
    if (p.mobs.filter((x) => x.id === mb.id).length > 1) add("error", "PJ-DUP", w, `モブID '${mb.id}' が重複しています`);
    if (mb.maxHealth <= 0) add("error", "PJ-MOB", w, "最大体力は0より大きい値にしてください");
    if (mb.maxHealth > 1024) add("error", "PJ-MOB", w, "最大体力は1024以下にしてください (バニラの属性上限)");
    if (!MOB_BASES.some((e) => e.key === mb.baseMob)) add("error", "PJ-MOB", w, `ベースMob '${mb.baseMob}' は選択肢にありません`);
    if (mb.drops.some((dd) => dd.countMax < dd.countMin)) add("error", "PJ-MOB", w, "ドロップ数は 最小 <= 最大 にしてください");
    if (mb.drops.some((dd) => dd.chance < 0 || dd.chance > 1)) add("error", "PJ-MOB", w, "ドロップ確率は 0〜1 で指定してください (0.5 = 50%)");
    for (const dd of mb.drops) {
      if (dd.item.startsWith(`${m.modId}:`) && !modItemIds.has(dd.item.split(":")[1])) add("error", "PJ-REF", w, `ドロップ '${dd.item}' はこのModに存在しません`);
    }
  }
  for (const rule of p.drops) {
    const w = `ドロップ表: ${rule.id}`;
    if (rule.items.length === 0) add("warning", "PJ-DROP", w, "品目がありません");
    if (rule.items.some((x) => x.max < x.min)) add("error", "PJ-DROP", w, "ドロップ数は 最小 <= 最大 にしてください");
    if (rule.items.some((x) => x.chance < 0 || x.chance > 1)) add("error", "PJ-DROP", w, "確率は 0〜1 で指定してください");
    if (rule.targetMob !== "ANY" && !/^[a-z0-9_.-]+(:[a-z0-9_./-]+)?$/.test(rule.targetMob)) add("error", "PJ-DROP", w, `対象 '${rule.targetMob}' の形式が不正です (ANY または minecraft:zombie)`);
    for (const x of rule.items) {
      if (x.id.startsWith(`${m.modId}:`) && !modItemIds.has(x.id.split(":")[1])) add("error", "PJ-REF", w, `品目 '${x.id}' はこのModに存在しません`);
    }
  }
  const ID = /^[a-z][a-z0-9_]*$/;
  const RES = /^[a-z0-9_.-]+:[a-z0-9_./-]+$/;
  const resOk = (v: string) => RES.test(v.includes(":") ? v : `minecraft:${v}`);
  const skillIdSet = new Set(p.skills.map((x) => x.id));
  const legacy = resolveEnv(m).mappings === "yarn";
  const dupCheck = (label: string, ids: string[]) => {
    ids.forEach((id, i) => { if (ids.indexOf(id) !== i) add("error", "PJ-DUP", `${label}: ${id}`, `ID '${id}' が重複しています`); });
  };
  const itemRef = (w: string, role: string, id: string) => {
    if (!id) return;
    if (!resOk(id)) add("error", "PJ-ID", w, `${role} '${id}' のID形式が不正です`);
    else if (id.startsWith(`${m.modId}:`) && !modItemIds.has(id.split(":")[1]) && !p.blocks.some((b) => b.id === id.split(":")[1])) add("error", "PJ-REF", w, `${role} '${id}' はこのModに存在しません`);
  };
  const needNew = (kind: string, n: number) => { if (n > 0 && legacy) add("error", "PJ-PROFILE", kind, `${kind}は Minecraft 1.21.11 プロファイルでのみ生成できます (旧 1.21.1/Yarn プロファイルでは未対応)。Mod設定でプロファイルを切り替えてください`); };

  // 素材
  dupCheck("素材", p.materials.map((x) => x.id));
  for (const mt of p.materials) {
    const w = `素材: ${mt.id}`;
    if (!ID.test(mt.id)) add("error", "PJ-ID", w, "IDは小文字英数字と_のみ、英字始まりにしてください");
    if (!(mt.damageMultiplier > 0) || !(mt.speedMultiplier > 0) || !(mt.durabilityMultiplier > 0)) add("error", "PJ-MAT", w, "倍率は0より大きい値にしてください");
    if (mt.damageMultiplier > 5 || mt.durabilityMultiplier > 10) add("warning", "PJ-BALANCE", w, "倍率が非常に大きいです");
  }
  for (const it of p.items) if (it.materialId && !p.materials.some((x) => x.id === it.materialId)) add("error", "PJ-REF", `アイテム: ${it.id}`, `素材 '${it.materialId}' が存在しません`);

  // アイテム属性ボーナス (1.21.11 のみ)
  for (const it of p.items) {
    const has = [it.bonusMaxHealth, it.bonusMovementSpeed, it.bonusArmor, it.bonusToughness, it.bonusKnockbackResistance].some((v) => Number(v) > 0);
    if (has && legacy) add("warning", "PJ-PROFILE", `アイテム: ${it.id}`, "属性ボーナスは Minecraft 1.21.11 プロファイルでのみ反映されます (旧プロファイルでは無視されます)");
    if (Number(it.bonusMovementSpeed) > 0.2) add("warning", "PJ-BALANCE", `アイテム: ${it.id}`, "移動速度ボーナスが大きすぎます (標準 0.1、0.02 で約20%)");
    if (Number(it.bonusMaxHealth) > 40) add("warning", "PJ-BALANCE", `アイテム: ${it.id}`, "最大体力ボーナスが大きすぎます");
  }

  // ショップ (取引画面)
  needNew("ショップ", p.shops.length);
  dupCheck("ショップ", p.shops.map((x) => x.id));
  const blockOpeners = p.shops.map((x) => x.openedByBlockId).filter(Boolean) as string[];
  for (const sh of p.shops) {
    const w = `ショップ: ${sh.id}`;
    if (!ID.test(sh.id)) add("error", "PJ-ID", w, "IDは小文字英数字と_のみ、英字始まりにしてください");
    if (sh.trades.length === 0) add("warning", "PJ-SHOP", w, "取引がありません");
    if (sh.trades.length > 40) add("warning", "PJ-SHOP", w, "取引が多すぎます (40件以下を推奨)");
    if (sh.openedByBlockId && !p.blocks.some((b) => b.id === sh.openedByBlockId)) add("error", "PJ-REF", w, `開くブロック '${sh.openedByBlockId}' がこのModに存在しません (ブロックIDのみ指定: 例 mana_crystal_block)`);
    if (sh.openedByBlockId && blockOpeners.filter((b) => b === sh.openedByBlockId).length > 1) add("error", "PJ-DUP", w, `ブロック '${sh.openedByBlockId}' が複数のショップに割り当てられています`);
    sh.trades.forEach((t, i) => {
      const tw = `${w} / 取引${i + 1}`;
      if (!t.offerItem) add("error", "PJ-SHOP", tw, "販売アイテムが未設定です");
      if (!t.requiredItem1) add("error", "PJ-SHOP", tw, "必要アイテム1が未設定です");
      for (const [role, id] of [["販売", t.offerItem], ["必要1", t.requiredItem1], ["必要2", t.requiredItem2]] as const) itemRef(tw, role, id);
      if (t.offerCount < 1 || t.offerCount > 64 || t.requiredCount1 < 1 || t.requiredCount1 > 64) add("error", "PJ-SHOP", tw, "個数は1〜64にしてください");
      if (t.requiredItem2 && (t.requiredCount2 < 1 || t.requiredCount2 > 64)) add("error", "PJ-SHOP", tw, "必要アイテム2の個数は1〜64にしてください");
      if (t.offerItem && t.offerItem === t.requiredItem1 && t.offerCount <= t.requiredCount1) add("warning", "PJ-SHOP", tw, "同じアイテム同士の交換で増えません (無限増殖ではありませんが無意味な取引です)");
    });
  }

  // スキルポイント
  needNew("スキルポイント強化", p.skillPoints.length);
  dupCheck("強化", p.skillPoints.map((x) => x.id));
  for (const sp of p.skillPoints) {
    const w = `強化: ${sp.id}`;
    if (!ID.test(sp.id)) add("error", "PJ-ID", w, "IDは小文字英数字と_のみ、英字始まりにしてください");
    if (sp.cost < 1) add("error", "PJ-SP", w, "必要ポイントは1以上にしてください");
    if (!(sp.amount > 0)) add("error", "PJ-SP", w, "上昇量は0より大きい値にしてください");
    if (sp.effect === "INCREASE_SPEED" && sp.amount > 0.05) add("warning", "PJ-BALANCE", w, "移動速度の上昇量が大きすぎます (標準 0.1、0.004 で約4%)");
    if (sp.effect === "INCREASE_MAX_HEALTH" && sp.amount > 20) add("warning", "PJ-BALANCE", w, "最大HPの上昇量が大きすぎます");
  }
  if (p.skillPoints.length > 0 && !p.skills.some((sk) => sk.actions.some(function walk(a: Action): boolean { return a.type === "grantSkillPoints" || (a.children ?? []).some(walk); }))) {
    add("warning", "PJ-SP", "スキルポイント", "ポイントを獲得する手段がありません。スキルに「スキルポイント獲得」アクションを追加してください");
  }

  // カスタムエフェクト
  needNew("カスタムエフェクト", p.effects.length);
  dupCheck("エフェクト", p.effects.map((x) => x.id));
  for (const ef of p.effects) {
    const w = `エフェクト: ${ef.id}`;
    if (!ID.test(ef.id)) add("error", "PJ-ID", w, "IDは小文字英数字と_のみ、英字始まりにしてください");
    if (!/^#[0-9a-fA-F]{6}$/.test(ef.color)) add("error", "PJ-EFFECT", w, `色 '${ef.color}' は #RRGGBB 形式にしてください`);
    if (ef.tickSkillId && !skillIdSet.has(ef.tickSkillId)) add("error", "PJ-REF", w, `毎tickスキル '${ef.tickSkillId}' が存在しません`);
    if (ef.reviveSkillId && !skillIdSet.has(ef.reviveSkillId)) add("error", "PJ-REF", w, `復活スキル '${ef.reviveSkillId}' が存在しません`);
    if (ef.tickSkillId && ef.intervalTicks < 1) add("error", "PJ-EFFECT", w, "発動間隔は1tick以上にしてください");
    if (ef.tickSkillId && ef.intervalTicks < 10) add("warning", "PJ-PERF", w, "発動間隔が短すぎます (10tick以上を推奨)");
    if (ef.revive && !(ef.reviveHealth > 0)) add("error", "PJ-EFFECT", w, "復活時のHPは0より大きくしてください");
    if (!ef.revive && !ef.tickSkillId) add("info", "PJ-EFFECT", w, "復活も毎tickスキルも未設定のため、見た目だけのエフェクトになります");
    const tsk = p.skills.find((x) => x.id === ef.tickSkillId);
    if (tsk && (tsk.manaCost > 0 || tsk.cooldown > 0)) add("info", "PJ-EFFECT", w, `毎tickスキル「${tsk.name}」のマナ/クールダウンは無視されます (無消費で発動)`);
  }

  // 実績
  needNew("実績", p.advancements.length);
  dupCheck("実績", p.advancements.map((x) => x.id));
  const advIds = new Set(p.advancements.map((x) => x.id));
  const advanceTargets = new Set<string>();
  const collect = (list: Action[]) => list.forEach((a) => { if (a.type === "advance") advanceTargets.add(String(a.params.advId)); collect(a.children ?? []); });
  p.skills.forEach((sk) => collect(sk.actions));
  for (const ad of p.advancements) {
    const w = `実績: ${ad.id}`;
    if (!ID.test(ad.id) || ad.id === "root") add("error", "PJ-ID", w, "IDは小文字英数字と_のみ、英字始まり (root は予約語) にしてください");
    if (!ad.name.trim()) add("error", "PJ-ADV", w, "名前が空です");
    if (ad.steps < 1 || ad.steps > 100) add("error", "PJ-ADV", w, "段数は1〜100にしてください");
    itemRef(w, "アイコン", ad.icon);
    if (!ad.icon) add("error", "PJ-ADV", w, "アイコンが未設定です");
    if (ad.kind === "OBTAIN_ITEM") { if (!ad.item) add("error", "PJ-ADV", w, "入手するアイテムが未設定です"); itemRef(w, "入手アイテム", ad.item); if (ad.steps > 1) add("info", "PJ-ADV", w, "「アイテム入手」型は段数が無視されます"); }
    if (ad.kind === "KILL_MOB" && ad.mob !== "ANY" && !(ad.mob && resOk(ad.mob))) add("error", "PJ-ADV", w, `討伐対象 '${ad.mob}' が不正です (ANY または minecraft:zombie)`);
    if (ad.parent && !advIds.has(ad.parent) && !ad.parent.includes(":")) add("error", "PJ-REF", w, `親実績 '${ad.parent}' が存在しません`);
    // 循環チェック
    const seen = new Set<string>([ad.id]);
    let cur = ad.parent;
    while (cur && advIds.has(cur)) { if (seen.has(cur)) { add("error", "PJ-ADV", w, "親実績が循環しています"); break; } seen.add(cur); cur = p.advancements.find((x) => x.id === cur)?.parent ?? ""; }
    if (ad.kind === "MANUAL" && !advanceTargets.has(ad.id)) add("warning", "PJ-ADV", w, "どのスキルからも進められません (スキルに「実績を進める」アクションを追加してください)");
    if (ad.kind === "OBTAIN_ITEM" && advanceTargets.has(ad.id)) add("info", "PJ-ADV", w, "「アイテム入手」型はアイテム取得で自動達成されます");
  }

  // 生成 (バイオーム / 地表クラスター)
  const biomeOk = (v: string) => !v || /^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(v);
  for (const b of p.blocks) {
    const w = `ブロック: ${b.id}`;
    if (b.ore && !biomeOk(b.ore.biomeTag ?? "")) add("error", "PJ-ORE", w, `鉱石のバイオームタグ '${b.ore.biomeTag}' の形式が不正です (例: minecraft:is_forest)`);
    if (b.surface) {
      const sf = b.surface;
      if (!biomeOk(sf.biomeTag)) add("error", "PJ-SURFACE", w, `地表生成のバイオームタグ '${sf.biomeTag}' の形式が不正です`);
      if (sf.rarity < 1 || sf.rarity > 1000) add("error", "PJ-SURFACE", w, "希少度は1〜1000にしてください");
      if (sf.tries < 1 || sf.tries > 256) add("error", "PJ-SURFACE", w, "試行回数は1〜256にしてください");
      if (sf.spread < 1 || sf.spread > 16) add("error", "PJ-SURFACE", w, "広がりは1〜16にしてください");
      if (sf.tries > 64 && sf.rarity < 4) add("warning", "PJ-PERF", w, "生成量が多すぎます (ワールド生成が重くなります)");
    }
  }

  // アクション参照 (カスタムエフェクト / 実績)
  const walkAct = (sk: string, list: Action[]) => list.forEach((a) => {
    const w = `スキル: ${sk}`;
    if (a.type === "customEffect") { const id = String(a.params.effectId); if (!id) add("error", "PJ-REF", w, "カスタムエフェクトが未選択です"); else if (!p.effects.some((e) => e.id === id)) add("error", "PJ-REF", w, `カスタムエフェクト '${id}' が存在しません`); }
    if (a.type === "advance") { const id = String(a.params.advId); if (!id) add("error", "PJ-REF", w, "実績が未選択です"); else if (!advIds.has(id)) add("error", "PJ-REF", w, `実績 '${id}' が存在しません`); }
    if (a.type === "openShop") { const id = String(a.params.shopId); if (!id) add("error", "PJ-REF", w, "ショップが未選択です"); else if (!p.shops.some((x) => x.id === id)) add("error", "PJ-REF", w, `ショップ '${id}' が存在しません`); }
    walkAct(sk, a.children ?? []);
  });
  p.skills.forEach((sk) => walkAct(sk.id, sk.actions));

  // 構造物検証 (NBTインポート / 初期村生成)
  for (const st of p.structures ?? []) {
    const w = `構造物: ${st.id}`;
    if (!ID.test(st.id)) add("error", "PJ-STRUCT", w, "構造物IDは小文字英数字と_のみ、英字始まりにしてください");
    if (!st.name.trim()) add("warning", "PJ-STRUCT", w, "構造物名が未入力です");
    if (st.spacing <= st.separation) add("error", "PJ-STRUCT", w, "生成間隔 (spacing) は最小分離間隔 (separation) より大きくしてください");
    if (st.spacing < 2 || st.spacing > 128) add("error", "PJ-STRUCT", w, "生成間隔は 2〜128 の範囲にしてください");
    if (!st.biomes.trim()) add("error", "PJ-STRUCT", w, "生成バイオームタグが未指定です (例: #minecraft:is_overworld)");
  }
  return out;
}
