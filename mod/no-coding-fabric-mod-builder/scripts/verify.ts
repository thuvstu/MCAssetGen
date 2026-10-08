/**
 * MythicForge 回帰検証スクリプト
 *   npx tsx scripts/verify.ts                 # 全プリセット × 全プロファイルを静的解析
 *   npx tsx scripts/verify.ts --out /tmp/kv   # 全アクション入りの Kitchen Sink を書き出し (Gradle でコンパイル確認用)
 * エラーが1件でもあれば終了コード 1。
 */
import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { ACTION_SCHEMAS, newAction, presetProject, starterProject } from "../src/lib/mod/catalog";
import { runPipeline } from "../src/lib/analyzer/pipeline";
import { generateProject } from "../src/lib/mod/codegen";
import { PROFILES, type ProfileId } from "../src/lib/mod/targets";
import type { ModProject } from "../src/lib/mod/types";

const outIdx = process.argv.indexOf("--out");
const outDir = outIdx > 0 ? process.argv[outIdx + 1] : null;

function withProfile(p: ModProject, profile: ProfileId): ModProject {
  const c = structuredClone(p);
  c.meta.env = { ...PROFILES[profile].env };
  if (profile === "mc1_21_1_yarn") {
    // 拡張システムは 1.21.11 専用なので旧プロファイルでは除外
    c.effects = []; c.advancements = []; c.shops = []; c.skillPoints = [];
    c.forge.enabled = false;
    c.structures = [];
    const strip = (list: ModProject["skills"][number]["actions"]): ModProject["skills"][number]["actions"] =>
      list.filter((a) => !["customEffect", "advance", "openShop"].includes(a.type)).map((a) => ({ ...a, children: a.children ? strip(a.children) : undefined }));
    c.skills = c.skills.map((s) => ({ ...s, actions: strip(s.actions) }));
  }
  return c;
}

function kitchen(): ModProject {
  const p = starterProject("Kitchen Verify");
  const id = p.meta.modId;
  const all = ACTION_SCHEMAS.filter((s) => s.type !== "custom").map((s) => {
    const a = newAction(s.type);
    if (s.type === "castSkill") a.params.skillId = "dash";
    if (s.type === "missile") a.params.onHitSkill = "arcane_impact";
    if (s.type === "giveItem" || s.type === "dropItem") a.params.item = `${id}:mythril_ingot`;
    if (s.type === "summonCustom") a.params.mobId = "blood_slime";
    if (s.type === "customEffect") a.params.effectId = "arcane_focus";
    if (s.type === "advance") a.params.advId = "reborn";
    if (s.type === "openShop") a.params.shopId = "adventurer";
    if (a.children) a.children = [newAction("message")];
    return a;
  });
  p.skills.push({ id: "kitchen", name: "全部入り", description: "", cooldown: 1, manaCost: 1, trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [], actions: all });
  for (const t of ["SWING", "DEATH", "TAKE_DAMAGE", "WEAR", "PERIODIC", "PLAYER_JOIN", "BREAK_BLOCK", "ATTACK_ENTITY"] as const)
    p.skills.push({ id: `t_${t.toLowerCase()}`, name: t, description: "", cooldown: 0, manaCost: 0, trigger: { type: t, intervalSec: 5, heldItem: t === "WEAR" ? `${id}:mythril_helmet` : "" }, conditions: [], actions: [newAction("message")] });
  const staff = p.items.find((x) => x.id === "fire_staff");
  if (staff) { staff.shiftSkillId = "dash"; staff.leftClickSkillId = "kitchen"; }
  return p;
}

let failed = 0;
const cases: [string, ModProject][] = [
  ["starter", starterProject("Verify Starter")],
  ["ice", presetProject("Verify Ice", "ice")],
  ["holy", presetProject("Verify Holy", "holy")],
  ["ninja", presetProject("Verify Ninja", "ninja")],
  ["knight", presetProject("Verify Knight", "knight")],
  ["kitchen", kitchen()],
];
for (const [name, base] of cases) {
  for (const profile of Object.keys(PROFILES) as ProfileId[]) {
    const p = withProfile(base, profile);
    const r = runPipeline(p);
    const errs = r.diagnostics.filter((d) => d.severity === "error");
    console.log(`${errs.length ? "✖" : "✔"} ${name.padEnd(8)} ${profile.padEnd(18)} errors=${errs.length} warnings=${r.warnings} files=${r.files.length}`);
    for (const d of errs.slice(0, 8)) console.log(`     ${(d.file ?? "").split("/").pop()}:${d.line} ${d.message.slice(0, 160)}`);
    failed += errs.length;
    if (outDir && name === "kitchen" && profile === "mc1_21_11_mojmap") {
      fs.rmSync(outDir, { recursive: true, force: true });
      for (const f of r.files) {
        const dest = path.join(outDir, f.path);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, f.encoding === "base64" ? Buffer.from(f.content, "base64") : f.content);
        if (f.executable) fs.chmodSync(dest, 0o755);
      }
      console.log(`   → ${outDir} に書き出しました (cd ${outDir} && ./gradlew build)`);
    }
  }
}
// 方言の生成順によって結果が変わらないことを保証 (旧グローバルDIALECTへの回帰を検出)
const fingerprint = (p: ModProject) => createHash("sha256")
  .update(generateProject(p).map((f) => `${f.path}\0${f.encoding ?? "text"}\0${f.content}`).sort().join("\n"))
  .digest("hex");
const deterministicBase = starterProject("Determinism Verify");
const mojA = fingerprint(withProfile(deterministicBase, "mc1_21_11_mojmap"));
fingerprint(withProfile(deterministicBase, "mc1_21_1_yarn"));
const mojB = fingerprint(withProfile(deterministicBase, "mc1_21_11_mojmap"));
if (mojA !== mojB) {
  failed += 1;
  console.log("✖ 生成順序によってMojang出力が変化しました (グローバル状態リーク)");
} else {
  console.log("✔ 方言を交互に生成しても出力は決定的 (状態リークなし)");
}

console.log(failed ? `\n✖ ${failed} 件のエラー` : "\n✔ すべて検証OK");
process.exit(failed ? 1 : 0);
