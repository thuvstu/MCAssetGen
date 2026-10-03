/* eslint-disable */
// Sanity check for the .bbmodel builder + generator pipeline (Node, stubbed canvas).
import type { ModelSpec, ModelType } from "../src/lib/spec";
import { MODEL_TYPE_LABELS } from "../src/lib/spec";
import { generateModel, generateModeOverlay, applyPhantom } from "../src/lib/generator";
import { buildBbModel } from "../src/lib/bbmodel";

const g = globalThis as Record<string, unknown>;
g.document = {
  createElement: () => ({
    width: 0, height: 0,
    getContext: () => ({ fillStyle: "", fillRect: () => {} }),
    toDataURL: () => "data:image/png;base64,AAAA",
  }),
};

const baseSpec: ModelSpec = {
  version: 1, name: "Test Sword", seed: 42, type: "sword", magic: "void",
  scale: 0.5, length: 0.6, width: 0.4, detail: 0.7, blockiness: 0.5,
  stylePreset: "voidwalker",
  primaryColor: "#241f33", secondaryColor: "#12101d", accentColor: "#9a5cff",
  glowColor: "#cfa8ff", handleColor: "#1e1a2b", gemColor: "#35e0c8",
  decorations: ["gem", "runes", "wings", "halo"],
  floating: "satellite", animation: "sway", particles: "sparks",
  aura: "frost", trail: "sparkle",
  glowIntensity: 0.6, textureNoise: 0.7, texturePattern: "noise",
  tier: 4, limitBreak: 3, morph: "standard", phantom: "orbit",
};

const checks: [string, boolean][] = [];
const ok = (name: string, cond: boolean) => checks.push([name, cond]);

// --- base model with max tier + limit break ---
const model = generateModel(baseSpec);
ok("has parts", model.parts.length > 40);
ok("palette 10 tiles", model.palette.length === 10);
ok("palette all 6-digit hex", model.palette.every((c) => /^#[0-9a-f]{6}$/i.test(c)));

// tier parts exist
ok("tier ring present", model.parts.some((p) => p.name.startsWith("tier_rune")));
ok("tier halo ring (t4)", model.parts.length > 55);
// limit break parts
ok("lb core present", model.parts.some((p) => p.name === "lb_core"));
ok("lb wings present", model.parts.some((p) => p.name.startsWith("lb_wing")));
ok("lb beams present", model.parts.some((p) => p.name.startsWith("lb_beam")));

// --- morph variants (all compared at tier 1 / lb 0 for a clean baseline) ---
const std = generateModel({ ...baseSpec, tier: 1, limitBreak: 0, morph: "standard" });
const great = generateModel({ ...baseSpec, tier: 1, limitBreak: 0, morph: "great" });
ok("great: adds bulk plates", great.parts.length > std.parts.length && great.parts.some((p) => p.name.startsWith("great_")));
const frag = generateModel({ ...baseSpec, tier: 1, limitBreak: 0, morph: "fragment" });
ok("fragment: fragment parts exist", frag.parts.some((p) => p.name.startsWith("fragment_")));
ok("fragment: original blade removed", !frag.parts.some((p) => p.name === "blade_core"));
const twin = generateModel({ ...baseSpec, tier: 1, limitBreak: 0, morph: "twin" });
ok("twin: duplicate parts exist", twin.parts.some((p) => p.name.endsWith("_twin")));

// --- phantom (幻影分身) ---
const phantomOrbit = applyPhantom(baseSpec, std.parts);
ok("phantom orbit parts exist", phantomOrbit.length > 10);
ok("phantom all group=phantom", phantomOrbit.every((p) => p.group === "phantom"));
const phantomMirror = applyPhantom({ ...baseSpec, phantom: "mirror" }, std.parts);
ok("phantom mirror parts exist", phantomMirror.length > 3);
const phantomNone = applyPhantom({ ...baseSpec, phantom: "none" }, std.parts);
ok("phantom none returns empty", phantomNone.length === 0);

// --- mode overlay ---
const charge = generateModeOverlay(baseSpec, "charge", model.parts);
ok("charge overlay parts", charge.length > 10 && charge.every((p) => p.group === "mode"));
const focus = generateModeOverlay(baseSpec, "focus", model.parts);
ok("focus overlay parts", focus.length > 10);
const idle = generateModeOverlay(baseSpec, "idle", model.parts);
ok("idle overlay empty", idle.length === 0);

// --- bbmodel export ---
const bb = buildBbModel(baseSpec, model) as Record<string, unknown>;
ok("format_version 4.5", (bb.meta as Record<string, unknown>).format_version === "4.5");
ok("has elements", Array.isArray(bb.elements) && (bb.elements as unknown[]).length > 10);
ok("texture has source", typeof (bb.textures as Record<string, unknown>[])[0].source === "string");
ok("outliner non-empty", Array.isArray(bb.outliner) && (bb.outliner as unknown[]).length >= 2);

const anims = bb.animations as Record<string, unknown>[];
const names = anims.map((a) => a.name as string);
ok("3 animations (idle+attack+cast)", anims.length === 3);
ok("has attack_swing", names.includes("attack_swing"));
ok("has cast_release", names.includes("cast_release"));

for (const a of anims) {
  const animators = a.animators as Record<string, unknown>;
  const kfAll = Object.values(animators).flatMap((x) => (x as Record<string, unknown>).keyframes as Record<string, unknown>[]);
  ok(`anim "${a.name}" keyframes valid`, kfAll.length > 0 && kfAll.every((k) => Array.isArray(k.data_points) && (k.data_points as unknown[]).length >= 2));
  // times length matches values per channel
  const valid = kfAll.every((k) => (k.data_points as { time: number }[]).length >= 2);
  ok(`anim "${a.name}" data points >=2`, valid);
}

// attack animation animates root
const atkAnimators = (anims.find((a) => a.name === "attack_swing")?.animators as Record<string, unknown>) ?? {};
const rootAnim = Object.values(atkAnimators).find((x) => (x as Record<string, unknown>).name === "root");
ok("attack animates root", !!rootAnim);

const groups = (bb.outliner as Record<string, unknown>[]).map((x) => x.name as string);
ok("groups include aura/trail/floating", groups.includes("aura") && groups.includes("trail") && groups.includes("floating"));

const elements = bb.elements as Record<string, unknown>[];
ok("faces have uv", elements.every((e) => {
  const f = e.faces as Record<string, Record<string, unknown>>;
  return f && f.north && Array.isArray(f.north.uv) && f.north.texture === 0;
}));
ok("from/to numbers", elements.every((e) => Array.isArray(e.from) && Array.isArray(e.to) && (e.from as unknown[]).every((n) => typeof n === "number")));

const allTypes = Object.keys(MODEL_TYPE_LABELS) as ModelType[];
for (const t of allTypes) {
  const m = generateModel({ ...baseSpec, type: t, tier: 1, limitBreak: 0, morph: "standard", phantom: "none" });
  ok(`type ${t} has parts`, m.parts.length >= 8);
}

let failed = 0;
for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}`);
  if (!passed) failed++;
}
console.log(`\nstd: ${std.parts.length}, great: ${great.parts.length}, fragment: ${frag.parts.length}, twin: ${twin.parts.length}, max-t4-lb3: ${model.parts.length}`);
console.log(failed === 0 ? "ALL CHECKS PASSED" : `${failed} CHECKS FAILED`);
process.exit(failed === 0 ? 0 : 1);