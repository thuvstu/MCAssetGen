import type { Diagnostic, Severity } from "../mod/types";
import { DEFAULT_SYMBOLS, fqnsForSimple, getRegistryMode, isKnownFqn, pitfalls, simpleName } from "./registry";
import { YARN_TO_MOJ } from "./registryMojmap";

const yarnHint = (name: string) => (getRegistryMode() === "mojmap" && YARN_TO_MOJ[name] && YARN_TO_MOJ[name] !== name ? ` — Yarn名です。Mojang名: ${YARN_TO_MOJ[name]}` : "");

// ======================= Lexer =======================
export type TokenType = "ident" | "keyword" | "number" | "string" | "char" | "symbol" | "comment";

export interface Token {
  type: TokenType;
  text: string;
  line: number; // 1-based
  col: number; // 1-based
  offset: number;
}

export interface LexError {
  line: number;
  col: number;
  message: string;
}

export const KEYWORDS = new Set([
  "package", "import", "class", "object", "interface", "fun", "val", "var", "if", "else", "when", "for", "while", "do",
  "return", "break", "continue", "is", "in", "as", "try", "catch", "finally", "throw", "override", "private", "public",
  "protected", "internal", "abstract", "open", "final", "data", "sealed", "enum", "companion", "init", "constructor",
  "this", "super", "null", "true", "false", "typealias", "by", "where", "const", "lateinit", "inline", "suspend",
  "vararg", "out", "operator", "infix", "annotation", "reified",
]);

const OPS = ["===", "!==", "..<", "?.", "?:", "!!", "::", "->", "==", "!=", "<=", ">=", "&&", "||", "..", "+=", "-=", "*=", "/=", "%=", "++", "--"];
const NUM_RE = /(0[xX][0-9a-fA-F_]+|0[bB][01_]+|\d[\d_]*(\.\d[\d_]*)?([eE][+-]?\d+)?)[fFLuU]*/y;
const IDENT_RE = /[A-Za-z_][A-Za-z0-9_]*/y;

export function lexKotlin(src: string): { tokens: Token[]; errors: LexError[] } {
  const tokens: Token[] = [];
  const errors: LexError[] = [];
  const n = src.length;
  const lineStarts = [0];
  for (let k = 0; k < n; k++) if (src[k] === "\n") lineStarts.push(k + 1);
  const pos = (o: number) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= o) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo + 1, col: o - lineStarts[lo] + 1 };
  };
  const push = (type: TokenType, start: number, end: number) => {
    tokens.push({ type, text: src.slice(start, end), offset: start, ...pos(start) });
  };
  const err = (o: number, message: string) => errors.push({ ...pos(o), message });
  let i = 0;

  const lexUntil = (stopAtBrace: boolean) => {
    let depth = 0;
    while (i < n) {
      const c = src[i];
      if (c === " " || c === "\t" || c === "\r" || c === "\n") { i++; continue; }
      if (c === "/" && src[i + 1] === "/") {
        const s = i;
        while (i < n && src[i] !== "\n") i++;
        push("comment", s, i);
        continue;
      }
      if (c === "/" && src[i + 1] === "*") {
        const s = i;
        let d = 1;
        i += 2;
        while (i < n && d > 0) {
          if (src[i] === "/" && src[i + 1] === "*") { d++; i += 2; }
          else if (src[i] === "*" && src[i + 1] === "/") { d--; i += 2; }
          else i++;
        }
        if (d > 0) err(s, "コメント `/*` が閉じられていません");
        push("comment", s, Math.min(i, n));
        continue;
      }
      if (c === '"' && src.startsWith('"""', i)) {
        const s = i;
        i += 3;
        let closed = false;
        while (i < n) {
          if (src.startsWith('"""', i)) { i += 3; closed = true; break; }
          if (src[i] === "$" && src[i + 1] === "{") { i += 2; lexUntil(true); continue; }
          i++;
        }
        if (!closed) err(s, 'raw文字列 """ が閉じられていません');
        push("string", s, Math.min(i, n));
        continue;
      }
      if (c === '"') {
        const s = i;
        i++;
        let closed = false;
        while (i < n) {
          const ch = src[i];
          if (ch === "\\") { i += 2; continue; }
          if (ch === '"') { i++; closed = true; break; }
          if (ch === "\n") break;
          if (ch === "$" && src[i + 1] === "{") { i += 2; lexUntil(true); continue; }
          if (ch === "$" && /[A-Za-z_]/.test(src[i + 1] ?? "")) {
            i++;
            IDENT_RE.lastIndex = i;
            const m = IDENT_RE.exec(src);
            if (m) { push("ident", i, i + m[0].length); i += m[0].length; }
            continue;
          }
          i++;
        }
        if (!closed) err(s, "文字列リテラルが閉じられていません (`\"` が不足)");
        push("string", s, Math.min(i, n));
        continue;
      }
      if (c === "'") {
        const s = i;
        i++;
        if (src[i] === "\\") i += 2;
        else i++;
        if (src[i] === "'") i++;
        else {
          err(s, "文字リテラルが正しく閉じられていません");
          while (i < n && src[i] !== "'" && src[i] !== "\n") i++;
          if (src[i] === "'") i++;
        }
        push("char", s, Math.min(i, n));
        continue;
      }
      if (c === "`") {
        const s = i;
        i++;
        while (i < n && src[i] !== "`" && src[i] !== "\n") i++;
        if (src[i] === "`") i++;
        else err(s, "バッククォート識別子が閉じられていません");
        push("ident", s, i);
        continue;
      }
      if (/[0-9]/.test(c)) {
        NUM_RE.lastIndex = i;
        const m = NUM_RE.exec(src);
        const len = m ? m[0].length : 1;
        push("number", i, i + len);
        i += len;
        continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        IDENT_RE.lastIndex = i;
        const m = IDENT_RE.exec(src)!;
        const text = m[0];
        push(KEYWORDS.has(text) ? "keyword" : "ident", i, i + text.length);
        i += text.length;
        continue;
      }
      if (c === "{") { depth++; push("symbol", i, i + 1); i++; continue; }
      if (c === "}") {
        if (stopAtBrace && depth === 0) { i++; return; }
        depth--;
        push("symbol", i, i + 1);
        i++;
        continue;
      }
      const op = OPS.find((o) => src.startsWith(o, i));
      if (op) { push("symbol", i, i + op.length); i += op.length; continue; }
      push("symbol", i, i + 1);
      i++;
    }
  };
  lexUntil(false);
  return { tokens, errors };
}

// ======================= Analyzer =======================
export interface AnalyzeContext {
  expectedPackage?: string;
  projectPackage?: string;
  symbols: Record<string, string>; // project-declared simple -> fqn
  /** クライアント専用エントリポイント (client/ 以下)。MinecraftClient等の使用を許可 */
  clientFile?: boolean;
}

const SKILL_ACTION_ARITY: Record<string, [number, number]> = {
  damage: [4, 4], heal: [4, 4], effect: [6, 6], ignite: [4, 4], launch: [5, 5], blink: [2, 2], explosion: [5, 5],
  lightning: [3, 3], particles: [5, 5], sound: [4, 4], message: [3, 3], giveItem: [3, 3], command: [2, 2],
  restoreMana: [2, 2], castSkill: [2, 2], later: [3, 3], repeatEvery: [4, 4],
  summon: [5, 5], fireball: [4, 4], missile: [7, 7], ring: [6, 6], setVar: [4, 4], addVar: [6, 6], title: [3, 3], feed: [2, 2], chance: [2, 2], summonCustom: [5, 5], openShop: [2, 2], grantSkillPoints: [2, 2], allocateSkillPoint: [3, 3], tradeInShop: [2, 2], bossbar: [4, 4], scoreboard: [3, 3], totemEffect: [3, 3], spiral: [6, 6], openGui: [2, 2], swap: [3, 3], knockup: [4, 4], gravity: [4, 4], silence: [4, 4], pull: [4, 4], lifesteal: [5, 5], chainLightning: [6, 6], dropItem: [5, 5], shield: [2, 2], resetCooldowns: [1, 1], placeBlock: [5, 5], breakBlock: [4, 4], teleportNear: [4, 4], clearEffects: [3, 3], giveXp: [2, 2],
};
/** 生成ランタイムの各objectが持つメンバー (タイポ検出用) */
export const OBJECT_MEMBERS: Record<string, string[]> = {
  SkillManager: ["maxMana", "regenPerSecond", "register", "get", "ids", "getMana", "addMana", "setMana", "sync", "castSlot", "load", "save", "tick", "isInOffhand", "isHolding", "isWearing", "resetCooldowns", "silence", "isSilenced", "capOf", "cast"],
  Variables: ["get", "set", "add", "inRange", "render", "load", "save"],
  Missiles: ["launch", "tick"],
  ModWorldGen: ["register"],
  ModItemAttributes: ["register"],
  ModExtras: ["register", "applyEffect", "advance", "openShop", "extraMana", "applyUpgrades"],
  ModMobs: ["spawn", "ids", "register"],
  ModConfig: ["maxMana", "regenPerSecond", "hud", "slots", "slotKeys", "load", "save"],
  HudState: ["mana", "maxMana"],
  Scheduler: ["schedule", "tick"],
  TargetMode: ["SELF", "TARGET", "AREA"],
  ModInfo: ["MOD_ID", "LOGGER"],
};
const CTX_MEMBERS = new Set(["player", "world", "target", "entities", "anchor", "positions", "point", "origin"]);
const MUST_OVERRIDE = new Set(["onInitialize", "use", "appendTooltip", "onUse"]);
const PASCAL_RE = /^[A-Z][A-Za-z0-9]*[a-z][A-Za-z0-9]*$/;
const DECL_PREV = new Set(["val", "var", "fun", "class", "object", "interface", "typealias", "enum"]);

interface ImportInfo {
  fqn: string;
  alias: string | null;
  wildcard: boolean;
  line: number;
  col: number;
  simple: string;
}

export function analyzeKotlin(file: string, src: string, ctx: AnalyzeContext): Diagnostic[] {
  const out: Diagnostic[] = [];
  const add = (line: number, col: number, severity: Severity, code: string, message: string, fix?: Diagnostic["fix"]) =>
    out.push({ file, line, col, severity, code, message, fix });

  const { tokens, errors } = lexKotlin(src);
  errors.forEach((e) => add(e.line, e.col, "error", "KT-SYNTAX", e.message));

  // --- bracket matching ---
  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const stack: Token[] = [];
  for (const t of tokens) {
    if (t.type !== "symbol") continue;
    if ("([{".includes(t.text)) stack.push(t);
    else if (pairs[t.text]) {
      const top = stack[stack.length - 1];
      if (!top) add(t.line, t.col, "error", "KT-BRACKET", `対応する開き括弧のない '${t.text}' があります`);
      else if (top.text !== pairs[t.text]) {
        add(t.line, t.col, "error", "KT-BRACKET", `'${t.text}' が不正です。${top.line}行目の '${top.text}' に対応する '${{ "(": ")", "[": "]", "{": "}" }[top.text]}' が必要です`);
        stack.pop();
      } else stack.pop();
    }
  }
  for (const t of stack) add(t.line, t.col, "error", "KT-BRACKET", `'${t.text}' が閉じられていません (対応する '${{ "(": ")", "[": "]", "{": "}" }[t.text]}' が不足)`);

  const ct = tokens.filter((t) => t.type !== "comment");

  // --- package / imports ---
  const skip = new Set<number>();
  let pkg: string | null = null;
  const imports: ImportInfo[] = [];
  for (let k = 0; k < ct.length; k++) {
    const t = ct[k];
    const firstOnLine = k === 0 || ct[k - 1].line !== t.line;
    if (t.type === "keyword" && (t.text === "package" || t.text === "import") && firstOnLine) {
      let j = k + 1;
      let name = "";
      let wildcard = false;
      let alias: string | null = null;
      skip.add(k);
      while (j < ct.length && ct[j].line === t.line) {
        const x = ct[j];
        if (x.type === "keyword" && x.text === "as") {
          skip.add(j);
          if (ct[j + 1]) { alias = ct[j + 1].text; skip.add(j + 1); }
          break;
        }
        if (x.text === "*") wildcard = true;
        if (x.type === "ident" || x.type === "keyword" || x.text === "." || x.text === "*") name += x.text;
        else break;
        skip.add(j);
        j++;
      }
      if (t.text === "package") pkg = name;
      else imports.push({ fqn: wildcard ? name.replace(/\.\*$/, "") : name, alias, wildcard, line: t.line, col: t.col, simple: simpleName(name), });
    }
  }

  if (pkg === null) add(1, 1, "error", "KT-PACKAGE", "package宣言がありません");
  else if (ctx.expectedPackage && pkg !== ctx.expectedPackage)
    add(1, 1, "error", "KT-PACKAGE", `package '${pkg}' がファイルパスと一致しません (期待値: '${ctx.expectedPackage}')`);

  // --- declared names ---
  const declared = new Set<string>();
  ct.forEach((t, k) => {
    if (t.type === "keyword" && ["class", "object", "interface", "typealias"].includes(t.text) && ct[k + 1]?.type === "ident") declared.add(ct[k + 1].text);
  });

  // --- used simple names (non-import) ---
  const usedNames = new Set<string>();
  ct.forEach((t, k) => {
    if (skip.has(k)) return;
    if (t.type === "ident") usedNames.add(t.text);
  });

  // --- import checks ---
  const seenImports = new Set<string>();
  const explicit = new Map<string, string>(); // simple/alias -> fqn
  const wildcards: string[] = [];
  const projectRoot = ctx.projectPackage ? ctx.projectPackage + "." : null;
  const projectFqns = new Set(Object.values(ctx.symbols));
  for (const im of imports) {
    const key = im.fqn + (im.wildcard ? ".*" : "") + (im.alias ? ` as ${im.alias}` : "");
    if (seenImports.has(key)) add(im.line, im.col, "warning", "KT-DUP-IMPORT", `import '${im.fqn}' が重複しています`);
    seenImports.add(key);
    if (im.wildcard) {
      wildcards.push(im.fqn);
      continue;
    }
    explicit.set(im.alias ?? im.simple, im.fqn);
    const pitfall = pitfalls().find((p) => p.re.test(im.simple));
    if (pitfall && !(ctx.clientFile && pitfall.code === "MC-CLIENT-ONLY")) add(im.line, im.col, pitfall.severity, pitfall.code, `import ${im.fqn}: ${pitfall.message}`);
    if (im.fqn.startsWith("net.minecraft.util.registry.")) {
      add(im.line, im.col, "error", "MC-PACKAGE", `パッケージ '${im.fqn.replace(/\.[^.]+$/, "")}' は1.19.3以降 'net.minecraft.registry' に移動しました`);
    } else if (projectRoot && im.fqn.startsWith(projectRoot)) {
      if (!projectFqns.has(im.fqn)) add(im.line, im.col, "error", "KT-IMPORT", `Unresolved reference: '${im.fqn}' (このプロジェクトに存在しないクラスです)`);
    } else if (!isKnownFqn(im.fqn)) {
      if (/^(net\.minecraft|net\.fabricmc|com\.mojang)\./.test(im.fqn)) {
        const cands = fqnsForSimple(im.simple);
        add(im.line, im.col, "error", "KT-IMPORT",
          `Unresolved reference: '${im.fqn}'` + (cands.length ? ` — もしかして: ${cands.join(" / ")}` : yarnHint(im.simple) || (getRegistryMode() === "mojmap" ? " — 1.21.11 (Mojang) に該当クラスが見つかりません" : " — 1.21.1 (Yarn) に該当クラスが見つかりません")),
        );
      } else if (/^(kotlin|java|javax|org\.slf4j)\./.test(im.fqn)) {
        add(im.line, im.col, "info", "KT-IMPORT-UNVERIFIED", `'${im.fqn}' は検証用レジストリに未登録です (標準ライブラリなら問題ありません)`);
      } else {
        add(im.line, im.col, "warning", "KT-IMPORT-EXTERNAL", `外部ライブラリ '${im.fqn}' は検証できません。build.gradle.kts に依存関係が必要です`);
      }
    }
    if (!usedNames.has(im.alias ?? im.simple)) add(im.line, im.col, "warning", "KT-UNUSED-IMPORT", `未使用のimport: '${im.fqn}'`);
  }

  // --- unresolved references (PascalCase) ---
  const reported = new Map<string, { idx: number; count: number }>();
  ct.forEach((t, k) => {
    if (skip.has(k) || t.type !== "ident" || !PASCAL_RE.test(t.text)) return;
    const prev = ct[k - 1];
    if (prev && (prev.text === "." || prev.text === "?." || DECL_PREV.has(prev.text))) return;
    const name = t.text;
    if (declared.has(name) || explicit.has(name) || DEFAULT_SYMBOLS.has(name)) return;
    const sym = ctx.symbols[name];
    if (sym && ctx.expectedPackage && sym.slice(0, sym.lastIndexOf(".")) === ctx.expectedPackage) return;
    if (wildcards.some((w) => fqnsForSimple(name).some((f) => f === `${w}.${name}`) || (projectFqns.has(`${w}.${name}`)))) return;
    if (reported.has(name)) { reported.get(name)!.count++; return; }
    const cands = [...fqnsForSimple(name), ...(sym ? [sym] : [])];
    const fix = cands.length === 1 ? ({ kind: "addImport", fqn: cands[0] } as const) : undefined;
    reported.set(name, { idx: out.length, count: 1 });
    add(t.line, t.col, "error", "KT-UNRESOLVED",
      `Unresolved reference: '${name}'` + (cands.length ? ` — import が必要です: ${cands.join(" / ")}` : yarnHint(name) || " — 宣言もimportも見つかりません"),
      fix,
    );
  });
  reported.forEach((v) => { if (v.count > 1) out[v.idx].message += ` (ほか${v.count - 1}箇所)`; });

  // --- API pitfalls & lint ---
  ct.forEach((t, k) => {
    if (skip.has(k)) return;
    const prev = ct[k - 1];
    const next = ct[k + 1];
    const nextSameLine = next && next.line === t.line;

    if (t.type === "ident" && !(prev && prev.text === ".")) {
      // dotted chain
      let chain = t.text;
      let j = k;
      while (ct[j + 1]?.text === "." && ct[j + 2]?.type === "ident") { chain += "." + ct[j + 2].text; j += 2; }
      for (const p of pitfalls()) {
        if (ctx.clientFile && p.code === "MC-CLIENT-ONLY") continue;
        if (p.re.test(chain) || (p.re.test(t.text) && !imports.some((im) => im.simple === t.text))) {
          add(t.line, t.col, p.severity, p.code, p.message);
          break;
        }
      }
      if (t.text === "Identifier" && next?.text === "(" && prev?.text !== "fun" && prev?.text !== "class")
        add(t.line, t.col, "error", "MC-IDENTIFIER", "`Identifier(...)` のコンストラクタは1.21でprivateです。`Identifier.of(namespace, path)` を使用してください");
      if (chain === "System.out.println" || chain === "System.out.print" || chain === "System.err.println")
        add(t.line, t.col, "warning", "MC-LOG", "標準出力ではなく `ModInfo.LOGGER` (SLF4J) を使用してください");
      if (chain === "Thread.sleep")
        add(t.line, t.col, "warning", "MC-BLOCKING", "`Thread.sleep` はサーバースレッドを停止させます。`Scheduler.schedule` / `SkillActions.later` を使用してください");
      if (t.text === "SkillActions" && ct[k + 1]?.text === ".") {
        const fn = ct[k + 2];
        if (fn?.type === "ident") {
          const arity = SKILL_ACTION_ARITY[fn.text];
          if (!arity) add(fn.line, fn.col, "error", "KT-UNRESOLVED", `Unresolved reference: 'SkillActions.${fn.text}'`);
          else if (ct[k + 3]?.text === "(") {
            // count args
            let depth = 0, args = 0, hasAny = false, e = k + 3;
            for (; e < ct.length; e++) {
              const x = ct[e];
              if (x.type === "symbol" && "([{".includes(x.text)) depth++;
              else if (x.type === "symbol" && ")]}".includes(x.text)) { depth--; if (depth === 0) break; }
              else if (depth === 1 && x.text === ",") args++;
              if (depth >= 1 && e > k + 3 && !(depth === 1 && x.text === ",")) hasAny = true;
            }
            let count = hasAny ? args + 1 : 0;
            // trailing comma
            if (ct[e - 1]?.text === ",") count = Math.max(0, count - 1);
            if (ct[e + 1]?.text === "{") count++;
            if (count < arity[0] || count > arity[1])
              add(fn.line, fn.col, "error", "KT-ARGS", `'SkillActions.${fn.text}' は引数 ${arity[0]} 個が必要ですが ${count} 個渡されています`);
          }
        }
      }
    }
    if (t.type === "ident" && (t.text === "ctx" || (t.text === "c" && file.endsWith("Skills.kt"))) && next?.text === "." && ct[k + 2]?.type === "ident" && prev?.text !== "." && ct[k + 2].line === t.line) {
      const m = ct[k + 2];
      if (!CTX_MEMBERS.has(m.text)) add(m.line, m.col, "error", "KT-UNRESOLVED", `Unresolved reference: '${m.text}' (SkillContext のメンバーは player / world / target / entities() / anchor())`);
    }
    if (t.type === "ident" && t.text === "new" && next?.type === "ident" && nextSameLine)
      add(t.line, t.col, "error", "KT-JAVA", "Kotlinに `new` 演算子はありません。`ClassName(...)` と書いてください");
    if (t.type === "ident" && t.text === "instanceof") add(t.line, t.col, "error", "KT-JAVA", "Kotlinでは `instanceof` ではなく `is` を使用します");
    if (t.type === "ident" && t.text === "void") add(t.line, t.col, "error", "KT-JAVA", "Kotlinに `void` はありません。戻り値なしの場合は型を省略(Unit)してください");
    if (t.type === "ident" && t.text === "static") add(t.line, t.col, "error", "KT-JAVA", "Kotlinに `static` はありません。`object` または `companion object` を使用してください");
    if (t.type === "ident" && t.text === "Override" && prev?.text === "@") add(t.line, t.col, "error", "KT-JAVA", "`@Override` ではなく `override` 修飾子を使用します");
    if (t.type === "keyword" && t.text === "while" && next?.text === "(" && ct[k + 2]?.text === "true" && ct[k + 3]?.text === ")")
      add(t.line, t.col, "warning", "MC-LOOP", "`while (true)` はサーバーtickをフリーズさせる可能性があります");
    if (t.text === "!!") add(t.line, t.col, "info", "KT-NPE", "`!!` はNullPointerExceptionの原因になります。`?.` / `?:` の使用を検討してください");
    if (t.text === ";" && (!next || next.line !== t.line)) add(t.line, t.col, "info", "KT-SEMI", "不要なセミコロンです");
    if (t.type === "keyword" && t.text === "fun" && ct[k + 1]?.type === "ident" && MUST_OVERRIDE.has(ct[k + 1].text)) {
      let hasOverride = false;
      for (let b = k - 1; b >= 0 && ct[b].line >= t.line - 0 && b >= k - 4; b--) if (ct[b].text === "override") hasOverride = true;
      if (!hasOverride) add(t.line, t.col, "error", "KT-OVERRIDE", `'${ct[k + 1].text}' は親クラス/インターフェースのメソッドです。'override' 修飾子が必要です`);
    }
  });

  return out.sort((a, b) => a.line - b.line || a.col - b.col);
}
