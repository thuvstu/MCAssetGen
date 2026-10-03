import type { GeometryBuilder } from "./builder";

/** Upper share of the body that grows when a weapon is released. */
const RELEASE_THRESHOLD = 0.55;
const RELEASE_STRETCH = 1.35;
const RELEASE_WIDEN = 1.25;
const SEAL_BANDS = [0.2, 0.45, 0.7, 0.9];
const HALO_COUNT = 6;
const SPARK_COUNT = 6;
const GLOWING_MATERIALS = new Set([2, 3, 4]);

/** 形態変化: chains the weapon shut, or unleashes an enlarged head with spikes. */
export function applyForm(b: GeometryBuilder): void {
  const { form } = b.settings;
  if (form === "base") return;
  const { min, max } = b.bodyBounds();
  const height = max[1] - min[1];
  const centerX = (min[0] + max[0]) / 2;

  if (form === "sealed") {
    for (const cube of b.bodyCubes()) delete cube.emissive;
    for (const ratio of SEAL_BANDS) {
      const y = min[1] + height * ratio;
      const [low, high] = b.spanAt(y + 0.3);
      b.ornament(
        "seal_chain",
        [low - 0.3, y, min[2] - 0.25],
        [high + 0.3, y + 0.6, max[2] + 0.25],
        0,
      );
    }
    const sigilY = min[1] + height * 0.55;
    b.ornament(
      "seal_sigil",
      [centerX - 0.6, sigilY, max[2] + 0.25],
      [centerX + 0.6, sigilY + 1.2, max[2] + 0.5],
      6,
    );
    return;
  }

  const threshold = min[1] + height * RELEASE_THRESHOLD;
  const stretch = (y: number) =>
    y > threshold ? threshold + (y - threshold) * RELEASE_STRETCH : y;
  for (const cube of b.bodyCubes()) {
    const centerY = (cube.from[1] + cube.to[1]) / 2;
    if (centerY > threshold) {
      cube.from[0] = centerX + (cube.from[0] - centerX) * RELEASE_WIDEN;
      cube.to[0] = centerX + (cube.to[0] - centerX) * RELEASE_WIDEN;
    }
    cube.from[1] = stretch(cube.from[1]);
    cube.to[1] = stretch(cube.to[1]);
  }

  const top = stretch(max[1]);
  b.anchorLift = top - max[1];
  const [low, high] = b.spanAt(top - 3);
  for (const side of [-1, 1]) {
    const edge = side < 0 ? low : high;
    for (let i = 0; i < 3; i++) {
      const x = edge + side * (0.2 + i * 0.8);
      const y = top - 6 + i * 1.6;
      const [x0, x1] = side < 0 ? [x - 0.8, x] : [x, x + 0.8];
      b.ornament("release_spike", [x0, y, -0.5], [x1, y + 1.4, 0.5], 3, true);
    }
  }
}

/** 段階強化: every level adds gems, then a crest, fins, a halo and a core. */
export function applyTier(b: GeometryBuilder): void {
  const tier = b.settings.tier;
  if (!tier) return;
  const { min, max } = b.bodyBounds();
  const height = max[1] - min[1];
  const centerX = (min[0] + max[0]) / 2;
  const front = max[2];

  if (["staff", "elderstaff", "bloodstaff"].includes(b.settings.kind)) {
    // Staffs get the gems in a ring circling their floating crystal.
    for (let i = 0; i < tier; i++) {
      const angle = (i / tier) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * 3.1;
      const z = Math.sin(angle) * 3.1;
      const y = max[1] - 3 + (i % 2) * 1.4;
      b.ornament(
        "tier_gem",
        [x - 0.45, y, z - 0.45],
        [x + 0.45, y + 0.9, z + 0.45],
        i % 2 ? 3 : 4,
        tier >= 2,
      );
    }
  } else {
    for (let i = 0; i < tier; i++) {
      const y = min[1] + height * (0.3 + i * 0.1);
      b.ornament(
        "tier_gem",
        [centerX - 0.45, y, front],
        [centerX + 0.45, y + 0.9, front + 0.3],
        i % 2 ? 3 : 4,
        tier >= 2,
      );
    }
  }
  if (tier >= 2) {
    b.ornament(
      "tier_crest",
      [centerX - 0.8, max[1], -0.5],
      [centerX + 0.8, max[1] + 0.8, 0.5],
      6,
    );
  }
  if (tier >= 3) {
    const y = min[1] + height * 0.7;
    const [low, high] = b.spanAt(y);
    b.ornament("tier_fin", [low - 1.4, y, -0.4], [low, y + 2.4, 0.4], 3, true);
    b.ornament(
      "tier_fin",
      [high, y, -0.4],
      [high + 1.4, y + 2.4, 0.4],
      3,
      true,
    );
  }
  if (tier >= 4) {
    for (let i = 0; i < HALO_COUNT; i++) {
      const angle = (i / HALO_COUNT) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * 2.6;
      const z = Math.sin(angle) * 2.6;
      const y = max[1] + 2.4;
      b.ornament(
        "tier_halo",
        [x - 0.35, y - 0.35, z - 0.35],
        [x + 0.35, y + 0.35, z + 0.35],
        6,
        true,
        true,
      );
    }
  }
  if (tier >= 5) {
    const y = min[1] + height * 0.5;
    b.ornament(
      "tier_core",
      [centerX - 0.6, y, front + 0.3],
      [centerX + 0.6, y + 1.2, front + 0.7],
      4,
      true,
    );
  }
}

/** 限界突破: crystal wings, twin crown shards and glowing gold trim. */
export function applyLimitBreak(b: GeometryBuilder): void {
  if (!b.settings.limitBreak) return;
  const { min, max } = b.bodyBounds();
  const height = max[1] - min[1];
  const centerX = (min[0] + max[0]) / 2;

  for (const cube of b.bodyCubes())
    if (cube.material === 6) cube.emissive = true;

  const wingY = min[1] + height * 0.58;
  const [low, high] = b.spanAt(wingY);
  for (const side of [-1, 1]) {
    const edge = side < 0 ? low : high;
    for (let i = 0; i < 4; i++) {
      const x = edge + side * (0.3 + i * 1.0);
      const y = wingY + i * 0.8;
      const length = 3.2 - i * 0.5;
      const [x0, x1] = side < 0 ? [x - 1, x] : [x, x + 1];
      b.ornament("limit_wing", [x0, y, -0.25], [x1, y + length, 0.25], 4, true);
    }
    const crownX = centerX + side * 2.2;
    b.ornament(
      "limit_crown",
      [crownX - 0.5, max[1] + 2, -0.5],
      [crownX + 0.5, max[1] + 3.6, 0.5],
      3,
      true,
      true,
    );
  }
}

/** 一時的モード変化 (overdrive): crystals ignite and sparks circle the weapon. */
export function applyMode(b: GeometryBuilder): void {
  if (b.settings.mode !== "charged") return;
  const { min, max } = b.bodyBounds();
  const height = max[1] - min[1];
  const centerX = (min[0] + max[0]) / 2;
  const radius = (max[0] - min[0]) / 2 + 1.5;

  for (const cube of b.bodyCubes())
    if (GLOWING_MATERIALS.has(cube.material)) cube.emissive = true;

  for (let i = 0; i < SPARK_COUNT; i++) {
    const angle = (i / SPARK_COUNT) * Math.PI * 2 + b.noise(i, 99) / 50;
    const x = centerX + Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius * 0.6;
    const y = min[1] + height * (0.25 + i * 0.1);
    b.ornament(
      "overdrive_spark",
      [x - 0.25, y - 0.25, z - 0.25],
      [x + 0.25, y + 0.25, z + 0.25],
      4,
      true,
      true,
    );
  }
}
