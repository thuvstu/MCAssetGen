/** Kotlin lexer: tokenization + lexical errors (unterminated strings/comments, bracket hints are in the analyzer). */
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
