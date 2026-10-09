import { BLOCK_TRIGGERS, CUSTOM_MOB_TRIGGERS, STATUS_EFFECTS, GLOBAL_TRIGGERS, ITEM_TRIGGERS, MOB_TRIGGERS, findCondition, findMechanic, findTargeter, num, type ParamDef } from "./catalog";
import { KOTLIN_KEYWORDS, skillFnName } from "./codegen";
import type { Diagnostic, ModProject, Params } from "./types";

const VANILLA_COMMANDS = new Set(["give", "tp", "teleport", "kill", "gamemode", "time", "weather", "summon", "effect", "say", "tell", "msg", "help", "list", "op", "deop", "ban", "kick", "stop", "reload", "execute", "data", "clear", "fill", "setblock", "item", "enchant", "xp", "experience", "particle", "playsound", "title", "scoreboard", "tag", "team", "difficulty", "seed", "spawnpoint", "gamerule"]);

function checkParams(defs: ParamDef[], params: Params, where: string, out: Diagnostic[]) {
  for (const d of defs) {
    const v = params[d.key];
    if (v === undefined) continue;
    if ((d.type === "number" || d.type === "int") && !Number.isFinite(num(v, NaN)))
      out.push({ severity: "error", source: "model", message: `${d.label}(${d.key}) は数値である必要があります: "${v}"`, location: where });
    if (d.type === "select" && d.options && !d.options.some((o) => o.value === String(v).toUpperCase() || o.value === String(v)))
      out.push({ severity: "error", source: "model", message: `${d.label}(${d.key}) の値 "${v}" は不正です`, location: where });
  }
  for (const k of Object.keys(params)) {
    if (!defs.some((d) => d.key === k)) out.push({ severity: "warning", source: "model", message: `未知のパラメータ "${k}" は無視されます`, location: where });
  }
}

export function validateProject(p: ModProject): Diagnostic[] {
  const out: Diagnostic[] = [];
  const m = p.meta;
  const E = (message: string, location: string, fix?: string) => out.push({ severity: "error", source: "model", message, location, fix });
  const W = (message: string, location: string, fix?: string) => out.push({ severity: "warning", source: "model", message, location, fix });
  const I = (message: string, location: string) => out.push({ severity: "info", source: "model", message, location });

  if (!/^[a-z][a-z0-9_]{1,63}$/.test(m.modId)) E(`Mod ID "${m.modId}" は小文字英数字と_のみ（2〜64文字、先頭は英字）`, "Mod設定");
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(m.packageName)) E(`パッケージ名 "${m.packageName}" が不正です（例: com.example.mymod）`, "Mod設定");
  else if (m.packageName.split(".").some((s) => KOTLIN_KEYWORDS.has(s))) E("パッケージ名に Kotlin の予約語が含まれています", "Mod設定");
  if (!/^[A-Z][A-Za-z0-9]*$/.test(m.mainClass)) E(`メインクラス名 "${m.mainClass}" は PascalCase の英数字にしてください`, "Mod設定");
  if (["ModItems", "ModBlocks", "ModEvents", "ModCommands", "ModItemGroups"].includes(m.mainClass)) E("メインクラス名が生成クラスと衝突しています", "Mod設定");
  if (!m.version.trim()) E("バージョンが空です", "Mod設定");
  if (!m.name.trim()) E("Mod名が空です", "Mod設定");
  if (m.minecraftVersion !== "1.21.1") W(`Minecraft ${m.minecraftVersion} は生成コードの対象(1.21.1)と異なります`, "Mod設定");

  const skillNames = new Map<string, number>();
  const fnNames = new Map<string, string>();
  for (const s of p.skills) {
    const loc = `スキル ${s.name || "(無名)"}`;
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(s.name)) E(`スキル名 "${s.name}" は英字で始まる英数字/_にしてください`, loc);
    skillNames.set(s.name, (skillNames.get(s.name) ?? 0) + 1);
    const fn = skillFnName(s.name);
    if (fnNames.has(fn) && fnNames.get(fn) !== s.name) E(`スキル "${s.name}" の関数名が "${fnNames.get(fn)}" と衝突します`, loc);
    fnNames.set(fn, s.name);
    if (["cast", "NAMES"].includes(fn)) E(`スキル名 "${s.name}" は予約されています`, loc);
    if (s.cooldown < 0) E("クールダウンは0以上", loc);
    if (s.lines.length === 0) W("メカニックが1つもありません", loc);
    s.conditions.forEach((c) => {
      const cd = findCondition(c.type);
      if (!cd) E(`不明な条件: ${c.type}`, loc);
      else checkParams(cd.params, c.params, `${loc} / 条件 ${c.type}`, out);
    });
    s.lines.forEach((l, idx) => {
      const lloc = `${loc} / 行 ${idx + 1}`;
      const mech = findMechanic(l.mechanic);
      if (!mech) {
        E(`不明なメカニック: ${l.mechanic}`, lloc);
        return;
      }
      checkParams(mech.params, l.params, lloc, out);
      if (!mech.noTargeter) {
        const t = findTargeter(l.targeter);
        if (!t) E(`不明なターゲッター: @${l.targeter}`, lloc);
        else {
          checkParams(t.params, l.targeterParams, `${lloc} / @${t.id}`, out);
          if (mech.entityOnly && !t.returnsEntities)
            W(`${mech.label} はエンティティが必要ですが @${t.id} は位置のみを返すため効果がありません`, lloc, "@Target / @Self / @EntitiesInRadius などに変更");
          const r = num(l.targeterParams.r ?? l.targeterParams.range ?? 0);
          if (r > 64) W(`ターゲッター範囲 ${r} は大きすぎます（負荷注意）`, lloc);
        }
      }
      l.conditions.forEach((c) => {
        const cd = findCondition(c.type);
        if (!cd) E(`不明な条件: ${c.type}`, lloc);
        else checkParams(cd.params, c.params, `${lloc} / ?${c.type}`, out);
      });
      if (mech.id === "delay" && idx === s.lines.length - 1) W("最後の行の delay は意味がありません", lloc);
      if ((mech.id === "skill" || mech.id === "repeat")) {
        const ref = String(l.params.s ?? "");
        if (!ref) E("呼び出すスキルが指定されていません", lloc);
        else if (!p.skills.some((x) => x.name === ref)) E(`存在しないスキル "${ref}" を呼び出しています`, lloc);
      }
      if (mech.id === "kotlin" && !String(l.params.code ?? "").trim()) W("カスタムKotlinコードが空です", lloc);
      if (mech.id === "explosion" && num(l.params.power) > 10) W("爆発威力が非常に大きいです", lloc);
      if (mech.id === "summon" && !/^[a-z0-9_.-]+:[a-z0-9_/.-]+$/.test(String(l.params.type ?? ""))) E(`エンティティID "${l.params.type}" の形式が不正です (namespace:path)`, lloc);
      if (mech.id === "giveitem" && !/^[a-z0-9_.-]+:[a-z0-9_/.-]+$/.test(String(l.params.item ?? ""))) E(`アイテムID "${l.params.item}" の形式が不正です`, lloc);
      if (mech.id === "setblock" && !/^[a-z0-9_.-]+:[a-z0-9_/.-]+$/.test(String(l.params.block ?? ""))) E(`ブロックID "${l.params.block}" の形式が不正です`, lloc);
      if (mech.id === "sound" && !/^([a-z0-9_.-]+:)?[a-z0-9_/.-]+$/.test(String(l.params.sound ?? ""))) E(`サウンドID "${l.params.sound}" の形式が不正です`, lloc);
    });
  }
  for (const [n, c] of skillNames) if (c > 1) E(`スキル名 "${n}" が重複しています`, `スキル ${n}`);

  // recursion detection (skill -> skill calls without delay = infinite recursion)
  const graph = new Map<string, { to: string; delayed: boolean }[]>();
  for (const s of p.skills) {
    const edges: { to: string; delayed: boolean }[] = [];
    let delayed = false;
    for (const l of s.lines) {
      if (l.mechanic === "delay") delayed = true;
      if (l.mechanic === "skill") edges.push({ to: String(l.params.s ?? ""), delayed });
      if (l.mechanic === "repeat") edges.push({ to: String(l.params.s ?? ""), delayed });
    }
    graph.set(s.name, edges);
  }
  const reported = new Set<string>();
  const dfs = (start: string, cur: string, path: string[], anyDelay: boolean, seen: Set<string>) => {
    for (const e of graph.get(cur) ?? []) {
      const d = anyDelay || e.delayed;
      if (e.to === start) {
        const key = [...path, e.to].join("→");
        if (reported.has(start)) continue;
        reported.add(start);
        if (d) W(`スキルが循環呼び出しされています（遅延あり・無限ループ注意）: ${key}`, `スキル ${start}`);
        else E(`無限再帰: ${key}（delay が無いためサーバーがクラッシュします）`, `スキル ${start}`, "条件 ?chance や delay を追加");
        continue;
      }
      if (seen.has(e.to)) continue;
      seen.add(e.to);
      dfs(start, e.to, [...path, e.to], d, seen);
    }
  };
  for (const s of p.skills) dfs(s.name, s.name, [s.name], false, new Set());

  const used = new Set<string>();
  const checkTrigger = (skill: string, trigger: string, allowed: { id: string }[], loc: string) => {
    used.add(skill);
    if (!skill) E("スキルが選択されていません", loc);
    else if (!p.skills.some((s) => s.name === skill)) E(`存在しないスキル "${skill}"`, loc);
    if (!allowed.some((a) => a.id === trigger)) E(`このトリガーは使用できません: ${trigger}`, loc);
  };

  const ids = new Map<string, string>();
  const regCheck = (name: string, kind: string) => {
    const loc = `${kind} ${name}`;
    if (!/^[a-z0-9_]+$/.test(name)) E(`登録名 "${name}" は小文字英数字と_のみ`, loc);
    if (ids.has(name)) E(`登録名 "${name}" が ${ids.get(name)} と重複しています（ブロックはアイテムとしても登録されます）`, loc);
    ids.set(name, kind);
  };
  for (const it of p.items) {
    const loc = `アイテム ${it.registryName}`;
    regCheck(it.registryName, "アイテム");
    if (!it.displayName.trim()) W("表示名が空です", loc);
    if (it.kind === "basic" || it.kind === "food") {
      if (it.maxCount < 1 || it.maxCount > 99) E("最大スタック数は1〜99", loc);
    }
    if (it.kind === "food" && it.nutrition < 0) E("満腹度は0以上", loc);
    if (it.kind === "sword" && !Number.isInteger(it.attackDamage)) W("剣の攻撃力は整数に丸められます", loc);
    const armorKind = ["helmet", "chestplate", "leggings", "boots"].includes(it.kind);
    if (!armorKind && it.triggers.some((t) => t.trigger === "onWear")) W("~onWear は防具アイテムでのみ発火します", loc);
    if (armorKind && it.triggers.some((t) => t.trigger === "onUse")) W("防具の ~onUse は右クリック装備を上書きします", loc);
    for (const t of it.triggers) {
      checkTrigger(t.skill, t.trigger, ITEM_TRIGGERS, `${loc} / ~${t.trigger}`);
      if (t.trigger === "onWear" && (t.interval ?? 0) < 1) E("タイマー間隔は1tick以上", loc);
      if (t.trigger === "onEat" && it.kind !== "food") W("~onEat は食料アイテムでのみ発火します", loc);
      if (t.trigger === "onHeld" && (t.interval ?? 0) < 1) E("タイマー間隔は1tick以上", loc);
      if (t.trigger === "onHeld" && (t.interval ?? 20) < 5) W("短いタイマー間隔はサーバー負荷が高くなります", loc);
    }
  }
  for (const b of p.blocks) {
    const loc = `ブロック ${b.registryName}`;
    regCheck(b.registryName, "ブロック");
    if (!b.displayName.trim()) W("表示名が空です", loc);
    if (b.hardness < -1) E("硬度は -1 (破壊不可) 以上", loc);
    if (b.luminance < 0 || b.luminance > 15) E("明るさは0〜15", loc);
    if (b.dropItem?.trim()) {
      if (!/^[a-z0-9_.-]+:[a-z0-9_/.-]+$/.test(b.dropItem.trim())) E(`ドロップアイテム "${b.dropItem}" の形式が不正です`, loc);
      if ((b.dropMin ?? 1) > (b.dropMax ?? 1)) W("ドロップ最小数が最大数より大きいです", loc);
    }
    if (b.oreGen?.enabled) {
      const o = b.oreGen;
      if (o.minY >= o.maxY) E("鉱石生成: 最小Yは最大Yより小さくしてください", loc);
      if (o.veinSize < 1 || o.veinSize > 64) E("鉱脈サイズは1〜64", loc);
      if (o.veinsPerChunk < 1) E("チャンク当たりの鉱脈数は1以上", loc);
      if (o.veinsPerChunk > 50) W("チャンク当たりの鉱脈数が多すぎます", loc);
      if (o.dimension === "overworld" && (o.minY < -64 || o.maxY > 320)) W("オーバーワールドの高さは -64〜320 です", loc);
      if (!b.requiresTool) I("鉱石は「適正ツール必須」にするのが一般的です", loc);
    }
    if (b.requiresTool && b.tool === "none") W("適正ツールが必要なのにツール種別が未設定のため、ドロップしません", loc, "ツール種別を設定");
    for (const t of b.triggers) {
      checkTrigger(t.skill, t.trigger, BLOCK_TRIGGERS, `${loc} / ~${t.trigger}`);
      if (t.trigger === "onStep") {
        const s = p.skills.find((x) => x.name === t.skill);
        if (s && s.cooldown <= 0) W(`~onStep は毎tick発火します。スキル ${s.name} にクールダウンを設定してください`, loc);
      }
    }
  }
  for (const mob of p.mobSkills) {
    const loc = `モブスキル ${mob.entityType} ~${mob.trigger}`;
    if (!/^[a-z0-9_.-]+:[a-z0-9_/.-]+$/.test(mob.entityType)) E(`エンティティID "${mob.entityType}" の形式が不正です`, loc);
    checkTrigger(mob.skill, mob.trigger, MOB_TRIGGERS, loc);
    if (mob.trigger === "onTimer" && mob.interval < 1) E("タイマー間隔は1tick以上", loc);
    if (mob.trigger === "onTimer" && mob.interval < 10) W("モブタイマーは全ワールドの全エンティティを走査します。10tick以上を推奨", loc);
  }
  for (const ev of p.events) {
    const loc = `イベント ~${ev.trigger}`;
    checkTrigger(ev.skill, ev.trigger, GLOBAL_TRIGGERS, loc);
    if (ev.trigger === "onTimer" && ev.interval < 1) E("タイマー間隔は1tick以上", loc);
  }
  const cmdNames = new Set<string>();
  for (const c of p.commands) {
    const loc = `コマンド /${c.name}`;
    if (!/^[a-z0-9_]+$/.test(c.name)) E("コマンド名は小文字英数字と_のみ", loc);
    if (VANILLA_COMMANDS.has(c.name)) W(`/${c.name} はバニラコマンドと衝突します`, loc);
    if (c.name === m.modId) E(`/${c.name} はデバッグコマンドとして予約されています`, loc);
    if (cmdNames.has(c.name)) E("コマンド名が重複しています", loc);
    cmdNames.add(c.name);
    if (c.permissionLevel < 0 || c.permissionLevel > 4) E("権限レベルは0〜4", loc);
    used.add(c.skill);
    if (!p.skills.some((s) => s.name === c.skill)) E(`存在しないスキル "${c.skill}"`, loc);
  }
  for (const s of p.skills) {
    for (const l of s.lines) if (l.mechanic === "skill" || l.mechanic === "repeat") used.add(String(l.params.s ?? ""));
  }
  for (const mob of p.mobs) for (const t of mob.triggers) used.add(t.skill);
  for (const s of p.skills) if (!used.has(s.name)) I(`スキル "${s.name}" はどこからも使われていません（/${m.modId} cast ${s.name} で実行可能）`, `スキル ${s.name}`);

  // ---------------- custom mobs
  const ID_RE = /^[a-z0-9_.-]+:[a-z0-9_/.-]+$/;
  const modItems = new Set([...p.items.map((i) => `${m.modId}:${i.registryName}`), ...p.blocks.map((b) => `${m.modId}:${b.registryName}`)]);
  const checkItemRef = (id: string, loc: string, label: string, allowTag = false) => {
    const v = id.trim();
    if (!v) return;
    if (allowTag && v.startsWith("#")) {
      if (!ID_RE.test(v.slice(1))) E(`${label}: タグ "${v}" の形式が不正です`, loc);
      return;
    }
    if (!ID_RE.test(v)) E(`${label}: アイテムID "${v}" の形式が不正です（例: minecraft:diamond）`, loc);
    else if (v.startsWith(m.modId + ":") && !modItems.has(v)) E(`${label}: このModに "${v}" は存在しません`, loc);
  };
  const mobNames = new Set<string>();
  const naturalBases = new Map<string, number>();
  for (const mob of p.mobs) {
    const loc = `カスタムモブ ${mob.name}`;
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(mob.name)) E(`内部名 "${mob.name}" は英字で始まる英数字/_にしてください`, loc);
    if (mobNames.has(mob.name)) E(`内部名 "${mob.name}" が重複しています`, loc);
    mobNames.add(mob.name);
    if (!ID_RE.test(mob.baseType)) E(`ベースエンティティ "${mob.baseType}" の形式が不正です`, loc);
    if (mob.baseType === "minecraft:player") E("プレイヤーはベースにできません", loc);
    if (!(mob.health > 0)) E("HPは0より大きくしてください", loc);
    if (mob.health > 1024) W("HP 1024 を超える値はバニラの属性上限で切り詰められます", loc);
    if (mob.damage < 0) E("攻撃力は0以上", loc);
    if (mob.speedMultiplier <= 0) E("移動速度倍率は0より大きく", loc);
    if (mob.knockbackResistance < 0 || mob.knockbackResistance > 1) W("ノックバック耐性は0〜1", loc);
    if (mob.spawnChance < 0 || mob.spawnChance > 1) E("自然スポーン置換率は0〜1", loc);
    if (mob.naturalSpawn) naturalBases.set(mob.baseType, (naturalBases.get(mob.baseType) ?? 0) + mob.spawnChance);
    for (const [slot, id] of Object.entries(mob.equipment)) checkItemRef(id, loc, `装備 ${slot}`);
    for (const ef of mob.effects) if (!STATUS_EFFECTS.includes(ef.type.toUpperCase())) E(`不明な効果 ${ef.type}`, loc);
    for (const dr of mob.drops) {
      checkItemRef(dr.item, loc, "ドロップ");
      if (!dr.item.trim()) E("ドロップのアイテムIDが空です", loc);
      if (dr.chance < 0 || dr.chance > 1) E("ドロップ確率は0〜1", loc);
      if (dr.min > dr.max) W("ドロップ最小数が最大数より大きいです", loc);
    }
    for (const t of mob.triggers) {
      checkTrigger(t.skill, t.trigger, CUSTOM_MOB_TRIGGERS, `${loc} / ~${t.trigger}`);
      if (t.trigger === "onTimer" && (t.interval ?? 0) < 1) E("タイマー間隔は1tick以上", loc);
    }
  }
  for (const [base, sum] of naturalBases) if (sum > 1) W(`${base} の自然スポーン置換率の合計が 100% を超えています`, "カスタムモブ");
  for (const s of p.skills) {
    s.lines.forEach((l, idx) => {
      const lloc = `スキル ${s.name} / 行 ${idx + 1}`;
      if (l.mechanic === "summonmob") {
        const ref = String(l.params.mob ?? "");
        if (!mobNames.has(ref)) E(`存在しないカスタムモブ "${ref}"`, lloc);
      }
      if (l.mechanic === "giveitem" || l.mechanic === "dropitem") checkItemRef(String(l.params.item ?? ""), lloc, "アイテム");
      [...l.conditions, ...s.conditions].forEach((c) => {
        if (c.type === "mythicMob" && !mobNames.has(String(c.params.id ?? ""))) E(`条件 ?mythicMob: 存在しないカスタムモブ "${c.params.id}"`, lloc);
        if (c.type === "holding") checkItemRef(String(c.params.item ?? ""), lloc, "?holding");
      });
    });
  }

  // ---------------- recipes
  const recipeNames = new Set<string>();
  for (const r of p.recipes) {
    const loc = `レシピ ${r.name}`;
    if (!/^[a-z0-9_]+$/.test(r.name)) E(`レシピ名 "${r.name}" は小文字英数字と_のみ`, loc);
    if (recipeNames.has(r.name)) E("レシピ名が重複しています", loc);
    recipeNames.add(r.name);
    if (!r.result.trim()) E("完成品が未設定です", loc);
    checkItemRef(r.result, loc, "完成品");
    if (r.count < 1 || r.count > 99) E("完成品の個数は1〜99", loc);
    if (r.type === "shaped" || r.type === "shapeless") {
      const filled = r.grid.filter((g) => g.trim());
      if (filled.length === 0) E("材料が1つもありません", loc);
      filled.forEach((g) => checkItemRef(g, loc, "材料", true));
    } else {
      if (!r.input.trim()) E("材料が未設定です", loc);
      checkItemRef(r.input, loc, "材料", true);
      if (r.type !== "stonecutting" && r.cookingTime < 1) E("調理時間は1tick以上", loc);
      if (r.type !== "stonecutting" && r.count !== 1) W("かまど系レシピの完成品は常に1個です", loc);
    }
  }
  const unreachable = [...modItems].filter((id) => !p.recipes.some((r) => r.result.trim() === id));
  if (p.recipes.length > 0 && unreachable.length) I(`レシピで入手できない要素: ${unreachable.join(", ")}（クリエイティブ/コマンドのみ）`, "レシピ");

  return out;
}
