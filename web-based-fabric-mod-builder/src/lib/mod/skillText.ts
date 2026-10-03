import { CONDITIONS, MECHANICS, TARGETERS, findCondition, findMechanic, findTargeter, normalizeParams } from "./catalog";
import type { ConditionRef, Params, ParamValue, SkillLine } from "./types";
import { uid } from "./types";

function fmtVal(v: ParamValue): string {
  const s = String(v);
  if (/^[A-Za-z0-9_.:\-+<>%]+$/.test(s) && s.length > 0) return s;
  return '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n") + '"';
}

function fmtParams(p: Params): string {
  const entries = Object.entries(p);
  if (entries.length === 0) return "";
  return "{" + entries.map(([k, v]) => `${k}=${fmtVal(v)}`).join(";") + "}";
}

export function serializeLine(l: SkillLine): string {
  const mech = findMechanic(l.mechanic);
  let s = `- ${mech ? mech.id : l.mechanic}${fmtParams(l.params)}`;
  if (!mech?.noTargeter) {
    const t = findTargeter(l.targeter);
    s += ` @${t ? t.id : l.targeter}${fmtParams(l.targeterParams)}`;
  }
  for (const c of l.conditions) {
    const cd = findCondition(c.type);
    s += ` ?${c.negate ? "!" : ""}${cd ? cd.id : c.type}${fmtParams(c.params)}`;
  }
  return s;
}

export function serializeConditions(conds: ConditionRef[]): string {
  return conds.map((c) => `?${c.negate ? "!" : ""}${c.type}${fmtParams(c.params)}`).join(" ");
}

export interface ParseError {
  line: number;
  message: string;
}

function parseValue(raw: string): ParamValue {
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return parseFloat(raw);
  return raw;
}

/** Parse "{a=1;b="x y"}" starting at position i (pointing at '{'). */
function parseParamBlock(src: string, i: number): { params: Params; end: number; error?: string } {
  const params: Params = {};
  i++; // skip {
  let key = "";
  let val = "";
  let mode: "key" | "val" = "key";
  let quoted = false;
  let wasQuoted = false;
  const flush = () => {
    const k = key.trim();
    if (k) params[k] = wasQuoted ? val : parseValue(val.trim());
    key = "";
    val = "";
    mode = "key";
    wasQuoted = false;
  };
  while (i < src.length) {
    const ch = src[i];
    if (quoted) {
      if (ch === "\\" && i + 1 < src.length) {
        const n = src[i + 1];
        val += n === "n" ? "\n" : n;
        i += 2;
        continue;
      }
      if (ch === '"') {
        quoted = false;
        i++;
        continue;
      }
      val += ch;
      i++;
      continue;
    }
    if (ch === "}") {
      flush();
      return { params, end: i + 1 };
    }
    if (ch === ";" || ch === ",") {
      flush();
      i++;
      continue;
    }
    if (mode === "key") {
      if (ch === "=") mode = "val";
      else key += ch;
    } else {
      if (ch === '"' && val.trim() === "") {
        quoted = true;
        wasQuoted = true;
        val = "";
      } else val += ch;
    }
    i++;
  }
  return { params, end: i, error: "'}' が閉じられていません" };
}

function readName(src: string, i: number): { name: string; end: number } {
  let j = i;
  while (j < src.length && /[A-Za-z0-9_:]/.test(src[j])) j++;
  return { name: src.slice(i, j), end: j };
}

export function parseLine(text: string, lineNo: number): { line?: SkillLine; errors: ParseError[] } {
  const errors: ParseError[] = [];
  let s = text.trim();
  if (s.startsWith("-")) s = s.slice(1).trim();
  if (!s) return { errors };
  let i = 0;
  const m = readName(s, i);
  if (!m.name) return { errors: [{ line: lineNo, message: "メカニック名がありません" }] };
  i = m.end;
  let params: Params = {};
  if (s[i] === "{") {
    const r = parseParamBlock(s, i);
    if (r.error) errors.push({ line: lineNo, message: r.error });
    params = r.params;
    i = r.end;
  }
  const mech = findMechanic(m.name);
  if (!mech) errors.push({ line: lineNo, message: `不明なメカニック: ${m.name}（使用可能: ${MECHANICS.map((x) => x.id).join(", ")}）` });
  const line: SkillLine = {
    id: uid(),
    mechanic: mech ? mech.id : m.name,
    params: mech ? normalizeParams(mech.params, params) : params,
    targeter: "Self",
    targeterParams: {},
    conditions: [],
  };
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === "@") {
      const t = readName(s, i + 1);
      i = t.end;
      let tp: Params = {};
      if (s[i] === "{") {
        const r = parseParamBlock(s, i);
        if (r.error) errors.push({ line: lineNo, message: r.error });
        tp = r.params;
        i = r.end;
      }
      const td = findTargeter(t.name);
      if (!td) errors.push({ line: lineNo, message: `不明なターゲッター: @${t.name}（使用可能: ${TARGETERS.map((x) => "@" + x.id).join(", ")}）` });
      line.targeter = td ? td.id : t.name;
      line.targeterParams = td ? normalizeParams(td.params, tp) : tp;
      continue;
    }
    if (ch === "?") {
      let j = i + 1;
      let negate = false;
      if (s[j] === "!") {
        negate = true;
        j++;
      }
      const c = readName(s, j);
      i = c.end;
      let cp: Params = {};
      if (s[i] === "{") {
        const r = parseParamBlock(s, i);
        if (r.error) errors.push({ line: lineNo, message: r.error });
        cp = r.params;
        i = r.end;
      }
      const cd = findCondition(c.name);
      if (!cd) errors.push({ line: lineNo, message: `不明な条件: ?${c.name}（使用可能: ${CONDITIONS.map((x) => x.id).join(", ")}）` });
      line.conditions.push({ id: uid(), type: cd ? cd.id : c.name, params: cd ? normalizeParams(cd.params, cp) : cp, negate });
      continue;
    }
    if (ch === "~") {
      errors.push({ line: lineNo, message: "トリガー(~onX)はスキル行ではなく、アイテム/ブロック/モブ/イベント側で設定します" });
      while (i < s.length && !/\s/.test(s[i])) i++;
      continue;
    }
    errors.push({ line: lineNo, message: `予期しない文字 '${ch}'` });
    i++;
  }
  return { line, errors };
}

export function parseSkillText(text: string): { lines: SkillLine[]; errors: ParseError[] } {
  const lines: SkillLine[] = [];
  const errors: ParseError[] = [];
  text.split("\n").forEach((raw, idx) => {
    const t = raw.trim();
    if (!t || t.startsWith("#")) return;
    const r = parseLine(t, idx + 1);
    errors.push(...r.errors);
    if (r.line) lines.push(r.line);
  });
  return { lines, errors };
}
