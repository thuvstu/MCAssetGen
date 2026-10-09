import type { Diagnostic, GeneratedFile } from "./types";

// ---------------------------------------------------------------- symbol index
const PKGS: Record<string, string[]> = {
  "net.minecraft.item": ["Item", "Items", "ItemStack", "ItemGroup", "ItemGroups", "BlockItem", "SwordItem", "PickaxeItem", "AxeItem", "ShovelItem", "HoeItem", "MiningToolItem", "ToolItem", "ToolMaterial", "ToolMaterials", "ItemConvertible", "ItemUsageContext", "ArmorItem", "ArmorMaterial", "ArmorMaterials", "BowItem"],
  "net.minecraft.item.tooltip": ["TooltipType"],
  "net.minecraft.component": ["DataComponentTypes"],
  "net.minecraft.component.type": ["FoodComponent", "AttributeModifiersComponent"],
  "net.minecraft.block": ["Block", "Blocks", "AbstractBlock", "BlockState", "BlockRenderType", "ShapeContext"],
  "net.minecraft.block.entity": ["BlockEntity"],
  "net.minecraft.entity": ["Entity", "EntityType", "LivingEntity", "SpawnReason", "ItemEntity", "LightningEntity", "EquipmentSlot", "MovementType", "ExperienceOrbEntity"],
  "net.minecraft.entity.attribute": ["EntityAttributes", "EntityAttribute", "EntityAttributeInstance"],
  "net.minecraft.entity.player": ["PlayerEntity", "HungerManager"],
  "net.minecraft.entity.mob": ["MobEntity", "ZombieEntity", "HostileEntity", "CreeperEntity", "SkeletonEntity"],
  "net.minecraft.entity.passive": ["AnimalEntity", "VillagerEntity"],
  "net.minecraft.entity.projectile": ["ProjectileEntity", "ProjectileUtil", "ArrowEntity", "SmallFireballEntity", "FireballEntity", "PersistentProjectileEntity", "TridentEntity", "WitherSkullEntity"],
  "net.minecraft.entity.projectile.thrown": ["SnowballEntity"],
  "net.minecraft.entity.effect": ["StatusEffect", "StatusEffects", "StatusEffectInstance"],
  "net.minecraft.entity.damage": ["DamageSource", "DamageSources", "DamageTypes"],
  "net.minecraft.server.world": ["ServerWorld"],
  "net.minecraft.server.network": ["ServerPlayerEntity"],
  "net.minecraft.server": ["MinecraftServer"],
  "net.minecraft.server.command": ["CommandManager", "ServerCommandSource"],
  "net.minecraft.command": ["CommandSource"],
  "net.minecraft.world": ["World", "WorldAccess", "WorldView", "PersistentState", "PersistentStateManager"],
  "net.minecraft.world.gen": ["GenerationStep"],
  "net.minecraft.nbt": ["NbtCompound", "NbtList", "NbtElement"],
  "net.fabricmc.fabric.api.biome.v1": ["BiomeModifications", "BiomeSelectors"],
  "net.minecraft.util": ["Identifier", "Hand", "ActionResult", "TypedActionResult", "Rarity", "Formatting", "ItemActionResult"],
  "net.minecraft.util.math": ["BlockPos", "Vec3d", "Box", "Direction", "MathHelper"],
  "net.minecraft.util.hit": ["HitResult", "BlockHitResult", "EntityHitResult"],
  "net.minecraft.util.shape": ["VoxelShape", "VoxelShapes"],
  "net.minecraft.text": ["Text", "MutableText"],
  "net.minecraft.registry": ["Registries", "Registry", "RegistryKey", "RegistryKeys", "RegistryWrapper"],
  "net.minecraft.registry.entry": ["RegistryEntry"],
  "net.minecraft.registry.tag": ["TagKey", "BlockTags", "ItemTags"],
  "net.minecraft.sound": ["SoundEvent", "SoundEvents", "SoundCategory", "BlockSoundGroup"],
  "net.minecraft.particle": ["ParticleTypes", "ParticleEffect", "SimpleParticleType"],
  "net.minecraft.network.packet.s2c.play": ["TitleS2CPacket", "SubtitleS2CPacket"],
  "net.minecraft.state": ["StateManager"],
  "net.minecraft.state.property": ["Properties", "BooleanProperty", "IntProperty"],
  "net.fabricmc.api": ["ModInitializer", "ClientModInitializer", "EnvType", "Environment"],
  "net.fabricmc.fabric.api.event.lifecycle.v1": ["ServerTickEvents", "ServerLifecycleEvents", "ServerEntityEvents"],
  "net.fabricmc.fabric.api.event.player": ["PlayerBlockBreakEvents", "AttackEntityCallback", "UseItemCallback", "UseBlockCallback", "UseEntityCallback"],
  "net.fabricmc.fabric.api.networking.v1": ["ServerPlayConnectionEvents"],
  "net.fabricmc.fabric.api.entity.event.v1": ["ServerLivingEntityEvents", "ServerPlayerEvents"],
  "net.fabricmc.fabric.api.command.v2": ["CommandRegistrationCallback"],
  "net.fabricmc.fabric.api.itemgroup.v1": ["FabricItemGroup", "ItemGroupEvents"],
  "net.fabricmc.fabric.api.registry": ["FuelRegistry"],
  "com.mojang.brigadier.arguments": ["StringArgumentType", "IntegerArgumentType", "FloatArgumentType", "BoolArgumentType", "DoubleArgumentType"],
  "com.mojang.brigadier": ["CommandDispatcher"],
  "com.mojang.brigadier.context": ["CommandContext"],
  "org.slf4j": ["Logger", "LoggerFactory"],
  "java.util": ["UUID", "Random", "Optional"],
  "kotlin.math": ["cos", "sin", "tan", "sqrt", "abs", "max", "min", "PI", "atan2", "floor", "ceil", "round", "pow"],
  "kotlin.random": ["Random"],
};

export const KNOWN_FQCN = new Set<string>();
const BY_SIMPLE = new Map<string, string[]>();
for (const [pkg, names] of Object.entries(PKGS)) {
  for (const n of names) {
    const f = `${pkg}.${n}`;
    KNOWN_FQCN.add(f);
    BY_SIMPLE.set(n, [...(BY_SIMPLE.get(n) ?? []), f]);
  }
}

const BUILTINS = new Set([
  "String", "Int", "Long", "Short", "Byte", "Float", "Double", "Boolean", "Char", "Unit", "Any", "Nothing", "Array",
  "IntArray", "FloatArray", "DoubleArray", "List", "MutableList", "Map", "MutableMap", "Set", "MutableSet", "HashMap",
  "HashSet", "ArrayList", "LinkedHashMap", "Pair", "Triple", "Math", "Exception", "RuntimeException",
  "IllegalStateException", "IllegalArgumentException", "Throwable", "Comparable", "Iterable", "Sequence", "Collection",
  "Suppress", "JvmStatic", "JvmField", "JvmOverloads", "Deprecated", "Volatile", "Synchronized", "CharSequence", "Number",
  "Result", "Lazy", "System", "Thread", "Integer", "Object", "Runnable", "StringBuilder", "Regex", "Enum", "Annotation",
  "Class", "Iterator", "MutableIterator", "Function", "Void", "Character",
]);

const MOJANG_TO_YARN: Record<string, string> = {
  ResourceLocation: "Identifier", InteractionHand: "Hand", InteractionResult: "ActionResult",
  InteractionResultHolder: "TypedActionResult", Level: "World", ServerLevel: "ServerWorld", Player: "PlayerEntity",
  ServerPlayer: "ServerPlayerEntity", MobEffects: "StatusEffects", MobEffectInstance: "StatusEffectInstance",
  Component: "Text", BuiltInRegistries: "Registries", BlockBehaviour: "AbstractBlock", CreativeModeTab: "ItemGroup",
  SoundSource: "SoundCategory", Vec3: "Vec3d", AABB: "Box", LightningBolt: "LightningEntity", Mob: "MobEntity",
};

const OVERRIDABLE: Record<string, Set<string>> = {
  Item: new Set(["use", "postHit", "finishUsing", "hasGlint", "appendTooltip", "useOnBlock", "useOnEntity", "inventoryTick", "getMaxUseTime", "getUseAction", "onStoppedUsing", "postMine", "canMine", "isUsedOnRelease", "getName", "onCraft", "onCraftByPlayer", "isEnchantable", "getItemBarStep", "isItemBarVisible", "usageTick", "postDamageEntity", "getMiningSpeed", "isCorrectForDrops", "onItemEntityDestroyed", "getTranslationKey", "toString"]),
  Block: new Set(["onUse", "onUseWithItem", "onSteppedOn", "onPlaced", "onBreak", "onBroken", "randomTick", "scheduledTick", "getOutlineShape", "getCollisionShape", "onEntityCollision", "onLandedUpon", "appendProperties", "getPlacementState", "hasRandomTicks", "neighborUpdate", "onStateReplaced", "getStateForNeighborUpdate", "emitsRedstonePower", "getWeakRedstonePower", "getStrongRedstonePower", "afterBreak", "onDestroyedByExplosion", "onBlockAdded", "getRenderType", "randomDisplayTick", "canPlaceAt", "getDroppedStacks", "onProjectileHit", "onSyncedBlockEvent", "getPickStack", "toString"]),
  ModInitializer: new Set(["onInitialize"]),
};
for (const t of ["SwordItem", "PickaxeItem", "AxeItem", "ShovelItem", "HoeItem", "MiningToolItem", "ToolItem"]) OVERRIDABLE[t] = OVERRIDABLE.Item;
OVERRIDABLE.ArmorItem = OVERRIDABLE.Item;

// ---------------------------------------------------------------- lexer
type TokKind = "ident" | "keyword" | "number" | "string" | "char" | "op" | "comment" | "annotation";
export interface Token {
  kind: TokKind;
  text: string;
  line: number;
  col: number;
  inTemplate?: boolean;
}

export const KT_KEYWORDS = new Set([
  "package", "import", "class", "interface", "object", "fun", "val", "var", "if", "else", "when", "for", "while", "do",
  "return", "break", "continue", "throw", "try", "catch", "finally", "is", "as", "in", "null", "true", "false", "this",
  "super", "typealias", "companion", "data", "private", "public", "internal", "protected", "override", "open",
  "abstract", "sealed", "enum", "const", "lateinit", "inline", "operator", "infix", "suspend", "vararg", "out", "by",
  "init", "constructor", "where", "get", "set", "annotation", "inner", "reified", "crossinline", "noinline", "tailrec", "external",
]);

const VALID_ESC = new Set(["t", "b", "n", "r", "'", '"', "\\", "$"]);

export function lexKotlin(src: string, file: string): { tokens: Token[]; diags: Diagnostic[] } {
  const tokens: Token[] = [];
  const diags: Diagnostic[] = [];
  type Mode = { kind: "str"; line: number; col: number } | { kind: "raw"; line: number; col: number } | { kind: "tmpl"; depth: number };
  const modes: Mode[] = [];
  const brackets: { ch: string; line: number; col: number }[] = [];
  let i = 0;
  let line = 1;
  let col = 1;
  const err = (message: string, l = line, c = col, sev: Diagnostic["severity"] = "error") =>
    diags.push({ severity: sev, message, file, line: l, col: c, source: "kotlin" });
  const adv = (n = 1) => {
    for (let k = 0; k < n; k++) {
      if (src[i] === "\n") {
        line++;
        col = 1;
      } else col++;
      i++;
    }
  };
  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

  while (i < src.length) {
    const top = modes[modes.length - 1];
    const ch = src[i];
    if (top && (top.kind === "str" || top.kind === "raw")) {
      if (top.kind === "raw" && src.startsWith('"""', i)) {
        let n = 3;
        while (src[i + n] === '"') n++;
        adv(n);
        modes.pop();
        continue;
      }
      if (top.kind === "str") {
        if (ch === '"') {
          adv();
          modes.pop();
          continue;
        }
        if (ch === "\n") {
          err("文字列リテラルが閉じられていません", top.line, top.col);
          modes.pop();
          continue;
        }
        if (ch === "\\") {
          const n = src[i + 1];
          if (n === "u") {
            if (!/^[0-9a-fA-F]{4}$/.test(src.slice(i + 2, i + 6))) err("不正な Unicode エスケープ");
            adv(6);
          } else {
            if (!VALID_ESC.has(n)) err(`不正なエスケープシーケンス '\\${n ?? ""}'`);
            adv(2);
          }
          continue;
        }
      }
      if (ch === "$" && src[i + 1] === "{") {
        adv(2);
        modes.push({ kind: "tmpl", depth: 0 });
        continue;
      }
      if (ch === "$" && /[A-Za-z_]/.test(src[i + 1] ?? "")) {
        adv();
        const sl = line;
        const sc = col;
        let j = i;
        while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
        const text = src.slice(i, j);
        tokens.push({ kind: KT_KEYWORDS.has(text) ? "keyword" : "ident", text, line: sl, col: sc, inTemplate: true });
        adv(j - i);
        continue;
      }
      adv();
      continue;
    }
    // code mode (possibly inside template)
    if (ch === "\n" || ch === " " || ch === "\t" || ch === "\r") {
      adv();
      continue;
    }
    const sl = line;
    const sc = col;
    if (src.startsWith("//", i)) {
      let j = i;
      while (j < src.length && src[j] !== "\n") j++;
      tokens.push({ kind: "comment", text: src.slice(i, j), line: sl, col: sc });
      adv(j - i);
      continue;
    }
    if (src.startsWith("/*", i)) {
      let depth = 0;
      let j = i;
      while (j < src.length) {
        if (src.startsWith("/*", j)) {
          depth++;
          j += 2;
        } else if (src.startsWith("*/", j)) {
          depth--;
          j += 2;
          if (depth === 0) break;
        } else j++;
      }
      if (depth !== 0) err("ブロックコメントが閉じられていません", sl, sc);
      tokens.push({ kind: "comment", text: src.slice(i, j), line: sl, col: sc });
      adv(j - i);
      continue;
    }
    if (src.startsWith('"""', i)) {
      tokens.push({ kind: "string", text: '"""', line: sl, col: sc });
      modes.push({ kind: "raw", line: sl, col: sc });
      adv(3);
      continue;
    }
    if (ch === '"') {
      tokens.push({ kind: "string", text: '"', line: sl, col: sc });
      modes.push({ kind: "str", line: sl, col: sc });
      adv();
      continue;
    }
    if (ch === "'") {
      let j = i + 1;
      if (src[j] === "\\") j += src[j + 1] === "u" ? 6 : 2;
      else j += 1;
      if (src[j] !== "'") err("文字リテラルが不正です", sl, sc);
      else j++;
      tokens.push({ kind: "char", text: src.slice(i, j), line: sl, col: sc });
      adv(Math.max(1, j - i));
      continue;
    }
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(src[i + 1] ?? "") && !/[A-Za-z0-9_)\]]/.test(src[i - 1] ?? ""))) {
      const m = /^(0[xX][0-9a-fA-F_]+[uUL]*|0[bB][01_]+[uUL]*|(\d[\d_]*)?\.?\d[\d_]*([eE][+-]?\d+)?[fFL]?u?)/.exec(src.slice(i));
      const text = m && m[0] ? m[0] : ch;
      tokens.push({ kind: "number", text, line: sl, col: sc });
      adv(text.length);
      continue;
    }
    if (ch === "`") {
      const j = src.indexOf("`", i + 1);
      const end = j < 0 || src.slice(i, j).includes("\n") ? i + 1 : j + 1;
      if (end === i + 1) err("バッククォート識別子が閉じられていません", sl, sc);
      tokens.push({ kind: "ident", text: src.slice(i + 1, end - 1), line: sl, col: sc });
      adv(end - i);
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      const text = src.slice(i, j);
      tokens.push({ kind: KT_KEYWORDS.has(text) ? "keyword" : "ident", text, line: sl, col: sc, inTemplate: top?.kind === "tmpl" });
      adv(j - i);
      continue;
    }
    if (ch === "@") {
      tokens.push({ kind: "annotation", text: "@", line: sl, col: sc });
      adv();
      continue;
    }
    // operators / brackets
    if (ch === "(" || ch === "[" || ch === "{") {
      if (ch === "{" && top?.kind === "tmpl") top.depth++;
      brackets.push({ ch, line: sl, col: sc });
      tokens.push({ kind: "op", text: ch, line: sl, col: sc });
      adv();
      continue;
    }
    if (ch === ")" || ch === "]" || ch === "}") {
      if (ch === "}" && top?.kind === "tmpl" && top.depth === 0) {
        modes.pop();
        adv();
        continue;
      }
      if (ch === "}" && top?.kind === "tmpl") top.depth--;
      const open = brackets.pop();
      if (!open) err(`対応する '${pairs[ch]}' がない '${ch}' です`, sl, sc);
      else if (open.ch !== pairs[ch]) {
        err(`括弧の対応が不正です: '${open.ch}' (${open.line}:${open.col}) に対して '${ch}'`, sl, sc);
      }
      tokens.push({ kind: "op", text: ch, line: sl, col: sc });
      adv();
      continue;
    }
    const ops = ["?.", "?:", "!!", "::", "->", "==", "!=", "<=", ">=", "&&", "||", "+=", "-=", "*=", "/=", "..", "++", "--"];
    const op = ops.find((o) => src.startsWith(o, i)) ?? ch;
    tokens.push({ kind: "op", text: op, line: sl, col: sc });
    adv(op.length);
  }
  for (const m of modes) {
    if (m.kind === "str" || m.kind === "raw") err("文字列リテラルが閉じられていません（ファイル末尾）", m.line, m.col);
    else err("文字列テンプレート ${ が閉じられていません");
  }
  for (const b of brackets) err(`'${b.ch}' が閉じられていません`, b.line, b.col);
  return { tokens, diags };
}

// ---------------------------------------------------------------- analysis
interface FileInfo {
  file: GeneratedFile;
  pkg: string;
  tokens: Token[];
  topDecls: Set<string>;
  allDecls: Set<string>;
}

function collectDecls(tokens: Token[]): { top: Set<string>; all: Set<string> } {
  const top = new Set<string>();
  const all = new Set<string>();
  let depth = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.kind === "comment") continue;
    if (t.text === "{") depth++;
    if (t.text === "}") depth--;
    if (t.kind === "keyword" && ["class", "object", "interface", "typealias", "fun", "val", "var"].includes(t.text)) {
      let j = i + 1;
      while (tokens[j]?.kind === "comment") j++;
      // generic params: fun <T> name
      if (tokens[j]?.text === "<") {
        let d = 0;
        for (; j < tokens.length; j++) {
          if (tokens[j].text === "<") d++;
          else if (tokens[j].text === ">") {
            d--;
            if (d === 0) {
              j++;
              break;
            }
          } else if (tokens[j].kind === "ident") all.add(tokens[j].text);
        }
      }
      // extension receiver: fun Foo.bar
      const n = tokens[j];
      if (n && n.kind === "ident") {
        let name = n.text;
        if (tokens[j + 1]?.text === "." && tokens[j + 2]?.kind === "ident") name = tokens[j + 2].text;
        all.add(name);
        if (depth === 0) top.add(name);
      }
      // class generics: class Foo<T>
      if (t.text === "class" && tokens[j + 1]?.text === "<") {
        for (let k = j + 2; k < tokens.length && tokens[k].text !== ">"; k++) if (tokens[k].kind === "ident") all.add(tokens[k].text);
      }
    }
    // enum entries & destructuring skipped; lambda params are lowercase in practice
  }
  return { top, all };
}

export function analyzeKotlinFiles(files: GeneratedFile[], basePackage: string): Diagnostic[] {
  const diags: Diagnostic[] = [];
  const infos: FileInfo[] = [];
  for (const f of files.filter((x) => x.language === "kotlin")) {
    const lx = lexKotlin(f.content, f.path);
    diags.push(...lx.diags);
    const code = lx.tokens.filter((t) => t.kind !== "comment");
    let pkg = "";
    if (code[0]?.text === "package") {
      const parts: string[] = [];
      for (let j = 1; j < code.length; j++) {
        if (code[j].kind === "ident" || code[j].kind === "keyword") parts.push(code[j].text);
        if (code[j + 1]?.text !== ".") break;
        j++;
      }
      pkg = parts.join(".");
    } else {
      diags.push({ severity: "warning", message: "package 宣言がありません", file: f.path, line: 1, source: "kotlin" });
    }
    const expectedPkg = f.path.replace(/^src\/main\/kotlin\//, "").split("/").slice(0, -1).join(".");
    if (pkg && expectedPkg && pkg !== expectedPkg)
      diags.push({ severity: "warning", message: `package '${pkg}' がディレクトリ '${expectedPkg}' と一致しません`, file: f.path, line: 1, source: "kotlin" });
    const d = collectDecls(lx.tokens);
    infos.push({ file: f, pkg, tokens: lx.tokens, topDecls: d.top, allDecls: d.all });
  }
  // project-wide declaration table: pkg -> names
  const projectDecls = new Map<string, Set<string>>();
  for (const inf of infos) {
    const s = projectDecls.get(inf.pkg) ?? new Set<string>();
    inf.topDecls.forEach((n) => s.add(n));
    projectDecls.set(inf.pkg, s);
  }

  for (const inf of infos) {
    const path = inf.file.path;
    const toks = inf.tokens;
    const code = toks.filter((t) => t.kind !== "comment");
    const imported = new Map<string, { fqcn: string; line: number; used: boolean }>();
    const wildcardPkgs: string[] = [];
    const importLines = new Set<number>();
    // --- imports
    for (let i = 0; i < code.length; i++) {
      if (code[i].text !== "import" || code[i].kind !== "keyword") continue;
      const ln = code[i].line;
      importLines.add(ln);
      const parts: string[] = [];
      let j = i + 1;
      let wildcard = false;
      for (; j < code.length && code[j].line === ln; j++) {
        const t = code[j];
        if (t.kind === "ident" || t.kind === "keyword") {
          if (t.text === "as" && parts.length) break;
          parts.push(t.text);
        } else if (t.text === "*") wildcard = true;
      }
      let alias: string | undefined;
      if (code[j]?.text === "as" && code[j + 1]) alias = code[j + 1].text;
      const fq = parts.join(".");
      if (wildcard) {
        wildcardPkgs.push(fq);
        continue;
      }
      const simple = alias ?? parts[parts.length - 1];
      if (imported.has(simple)) {
        const prev = imported.get(simple)!;
        diags.push({
          severity: prev.fqcn === fq ? "warning" : "error",
          message: prev.fqcn === fq ? `重複した import: ${fq}` : `名前 '${simple}' の import が衝突しています (${prev.fqcn} / ${fq})`,
          file: path, line: ln, source: "kotlin",
        });
      }
      imported.set(simple, { fqcn: fq, line: ln, used: false });
      // resolve
      const pkgOf = parts.slice(0, -1).join(".");
      const last = parts[parts.length - 1];
      if (fq.startsWith(basePackage + ".") || fq === basePackage) {
        const decls = projectDecls.get(pkgOf);
        if (!decls || !decls.has(last))
          diags.push({ severity: "error", message: `未解決の import: ${fq}（プロジェクト内に宣言がありません）`, file: path, line: ln, source: "kotlin" });
      } else if (!KNOWN_FQCN.has(fq)) {
        const cands = BY_SIMPLE.get(last);
        if (cands && !/^(kotlin|java)\./.test(fq)) {
          diags.push({ severity: "error", message: `未解決の import: ${fq}`, file: path, line: ln, source: "kotlin", fix: `import ${cands[0]}` });
        } else if (MOJANG_TO_YARN[last]) {
          diags.push({ severity: "error", message: `${last} は Mojang マッピング名です。Yarn では ${MOJANG_TO_YARN[last]} を使用します`, file: path, line: ln, source: "kotlin", fix: BY_SIMPLE.get(MOJANG_TO_YARN[last])?.[0] ? `import ${BY_SIMPLE.get(MOJANG_TO_YARN[last])![0]}` : undefined });
        } else if (/^(net\.minecraft|net\.fabricmc|com\.mojang)\./.test(fq)) {
          diags.push({ severity: "info", message: `辞書にないクラスの import（検証不能）: ${fq}`, file: path, line: ln, source: "kotlin" });
        }
      }
    }

    // --- references
    const local = inf.allDecls;
    const samePkg = projectDecls.get(inf.pkg) ?? new Set<string>();
    const reported = new Set<string>();
    for (let i = 0; i < code.length; i++) {
      const t = code[i];
      if (t.kind !== "ident") continue;
      if (importLines.has(t.line) || (i > 0 && code[i - 1].text === "package")) continue;
      const imp = imported.get(t.text);
      if (imp) imp.used = true;
      const prev = code[i - 1];
      if (prev && (prev.text === "." || prev.text === "?." || prev.text === "::")) continue;
      if (!/^[A-Z]/.test(t.text)) continue;
      if (prev?.kind === "annotation") {
        const pp = code[i - 2];
        if (pp && (pp.text === "return" || pp.text === "break" || pp.text === "continue" || pp.text === "this" || pp.text === "super")) continue;
      }
      if (code[i + 1]?.kind === "annotation" && !t.inTemplate) continue; // label definition: Foo@
      if (imp || local.has(t.text) || samePkg.has(t.text) || BUILTINS.has(t.text)) continue;
      if (wildcardPkgs.some((w) => KNOWN_FQCN.has(`${w}.${t.text}`) || projectDecls.get(w)?.has(t.text))) continue;
      if (wildcardPkgs.length && !wildcardPkgs.every((w) => w.startsWith(basePackage) || PKGS[w])) continue;
      // fully qualified usage like net.minecraft.item.Items.BOOK
      if (prev && prev.kind === "ident" && /^[a-z]/.test(prev.text)) continue;
      const key = t.text;
      if (reported.has(key)) continue;
      reported.add(key);
      const cands = BY_SIMPLE.get(t.text);
      const internal = [...projectDecls.entries()].find(([, s]) => s.has(t.text));
      if (MOJANG_TO_YARN[t.text]) {
        diags.push({ severity: "error", message: `未解決の参照: ${t.text}（Mojang マッピング名。Yarn では ${MOJANG_TO_YARN[t.text]}）`, file: path, line: t.line, col: t.col, source: "kotlin" });
      } else if (cands) {
        diags.push({ severity: "error", message: `未解決の参照: ${t.text}（import がありません）`, file: path, line: t.line, col: t.col, source: "kotlin", fix: `import ${cands[0]}` });
      } else if (internal) {
        diags.push({ severity: "error", message: `未解決の参照: ${t.text}（別パッケージ ${internal[0]} にあります）`, file: path, line: t.line, col: t.col, source: "kotlin", fix: `import ${internal[0]}.${t.text}` });
      } else {
        diags.push({ severity: "warning", message: `未解決の可能性がある参照: ${t.text}（継承メンバーでなければ import が必要）`, file: path, line: t.line, col: t.col, source: "kotlin" });
      }
    }
    for (const [name, imp] of imported) {
      if (!imp.used) diags.push({ severity: "info", message: `未使用の import: ${imp.fqcn}`, file: path, line: imp.line, source: "kotlin" });
      void name;
    }

    // --- lint rules (Minecraft 1.21.1 / Yarn specific)
    for (let i = 0; i < code.length; i++) {
      const t = code[i];
      const prev = code[i - 1];
      const next = code[i + 1];
      if (t.kind === "ident" && t.text === "Identifier" && next?.text === "(" && prev?.text !== ".")
        diags.push({ severity: "error", message: "Identifier のコンストラクタは 1.21 で private になりました", file: path, line: t.line, col: t.col, source: "kotlin", fix: "Identifier.of(namespace, path) を使用" });
      if (t.kind === "ident" && t.text === "new" && code[i + 1]?.kind === "ident" && /^[A-Z]/.test(code[i + 1].text))
        diags.push({ severity: "error", message: "Kotlin に new キーワードはありません", file: path, line: t.line, col: t.col, source: "kotlin", fix: `${code[i + 1].text}(...) のように記述` });
      if (t.kind === "ident" && t.text === "isClient" && next?.text === "(")
        diags.push({ severity: "error", message: "World.isClient はフィールドです（() は不要）", file: path, line: t.line, col: t.col, source: "kotlin", fix: "world.isClient" });
      if (t.kind === "ident" && t.text === "Thread" && next?.text === "." && code[i + 2]?.text === "sleep")
        diags.push({ severity: "error", message: "Thread.sleep はサーバースレッドを停止させます", file: path, line: t.line, col: t.col, source: "kotlin", fix: "delay メカニック / SkillScheduler.runLater を使用" });
      if (t.text === "!!")
        diags.push({ severity: "info", message: "!! は NullPointerException の原因になります", file: path, line: t.line, col: t.col, source: "kotlin", fix: "?.let { } や ?: を使用" });
      if (t.kind === "ident" && t.text === "println" && prev?.text !== ".")
        diags.push({ severity: "info", message: "println よりロガーの使用を推奨", file: path, line: t.line, col: t.col, source: "kotlin" });
      if (t.kind === "ident" && t.text === "setOnFireFor" && next?.text === "(" && /^\d+$/.test(code[i + 2]?.text ?? ""))
        diags.push({ severity: "warning", message: "1.21 の setOnFireFor は Float 引数です", file: path, line: t.line, col: t.col, source: "kotlin", fix: "setOnFireForTicks(ticks) を使用" });
      if (t.kind === "keyword" && (t.text === "continue" || t.text === "break")) {
        // walk outward through enclosing blocks: loop body => OK, lambda => error (Kotlin 2.1)
        let depth = 0;
        let verdict: "ok" | "lambda" | "none" = "none";
        for (let k = i - 1; k >= 0 && verdict === "none"; k--) {
          if (code[k].text === "}") depth++;
          else if (code[k].text === "{") {
            if (depth > 0) {
              depth--;
              continue;
            }
            const before = code[k - 1];
            if (before?.text === ")") {
              // find matching '('
              let pd = 0;
              let m = k - 1;
              for (; m >= 0; m--) {
                if (code[m].text === ")") pd++;
                else if (code[m].text === "(") {
                  pd--;
                  if (pd === 0) break;
                }
              }
              const kw = code[m - 1]?.text;
              if (kw === "for" || kw === "while") verdict = "ok";
              else if (kw === "if" || kw === "when" || kw === "catch") continue;
              else verdict = "lambda"; // e.g. runLater(20) { ... }
            } else if (before?.text === "else" || before?.text === "try" || before?.text === "finally" || before?.text === "do" || before?.text === "->") {
              if (before.text === "do") verdict = "ok";
              continue;
            } else if (before?.kind === "ident" || before?.text === "=" || before?.text === "(" || before?.text === ",") {
              verdict = "lambda";
            } else {
              continue;
            }
          }
        }
        if (verdict === "lambda")
          diags.push({ severity: "error", message: `ラムダ内で ${t.text} は使用できません (Kotlin 2.1)`, file: path, line: t.line, col: t.col, source: "kotlin", fix: "return@run などのラベル付き return を使用" });
      }
    }

    // --- override checks
    const classStack: { base: string; depth: number }[] = [];
    let depth = 0;
    let pendingBase: string | null = null;
    for (let i = 0; i < code.length; i++) {
      const t = code[i];
      if (t.kind === "keyword" && (t.text === "class" || t.text === "object")) {
        // find ':' base before '{' or newline-level end
        pendingBase = null;
        let par = 0;
        for (let k = i + 1; k < code.length; k++) {
          const x = code[k];
          if (x.text === "(") par++;
          else if (x.text === ")") par--;
          else if (par === 0 && x.text === ":" && code[k + 1]?.kind === "ident") {
            pendingBase = code[k + 1].text;
            break;
          } else if (par === 0 && (x.text === "{" || x.text === "}" || (x.kind === "keyword" && ["class", "object", "fun", "val"].includes(x.text)))) break;
        }
        if (!pendingBase) pendingBase = "";
      }
      if (t.text === "{") {
        depth++;
        if (pendingBase !== null) {
          classStack.push({ base: pendingBase, depth });
          pendingBase = null;
        }
      }
      if (t.text === "}") {
        if (classStack.length && classStack[classStack.length - 1].depth === depth) classStack.pop();
        depth--;
      }
      if (t.kind === "keyword" && t.text === "override" && code[i + 1]?.text === "fun") {
        const nameTok = code[i + 2];
        const cls = classStack[classStack.length - 1];
        if (cls && cls.depth === depth && OVERRIDABLE[cls.base] && nameTok && !OVERRIDABLE[cls.base].has(nameTok.text)) {
          diags.push({ severity: "warning", message: `'${nameTok.text}' は ${cls.base} のオーバーライド可能メソッドとして確認できません`, file: path, line: nameTok.line, col: nameTok.col, source: "kotlin" });
        }
      }
    }
  }

  // attach origin info for custom code
  const byPath = new Map(files.map((f) => [f.path, f.content.split("\n")]));
  for (const d of diags) {
    if (!d.file || !d.line) continue;
    const lines = byPath.get(d.file);
    if (!lines) continue;
    for (let k = d.line - 1; k >= 0; k--) {
      const l = lines[k];
      if (l.includes("// @end") && k !== d.line - 1) break;
      const m = /\/\/ @origin skill=(\S+) line=(\d+)/.exec(l);
      if (m) {
        d.location = `スキル ${m[1]} / 行 ${m[2]} (カスタムKotlin)`;
        break;
      }
      if (/^\s*fun /.test(l)) break;
    }
  }
  return diags;
}
