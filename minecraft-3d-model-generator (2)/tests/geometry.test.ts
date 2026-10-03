import { describe, expect, it } from "vitest";
import { buildGeometry, paletteForPrompt } from "@/lib/geometry";
import {
  DEFAULT_PALETTE,
  DEFAULT_SETTINGS,
  TEMPLATES,
  type ModelKind,
  type ModelSettings,
} from "@/lib/model-types";

const settingsFor = (
  overrides: Partial<ModelSettings> = {},
): ModelSettings => ({
  ...DEFAULT_SETTINGS,
  ...overrides,
});

const KINDS = TEMPLATES.map((template) => template.kind);

/**
 * Ornaments from upgrades are deliberately excluded from the size fit (so a
 * +5 weapon is not smaller than a +0 one), so the requested box is checked on
 * the body itself.
 */
function boundingBox(cubes: ReturnType<typeof buildGeometry>) {
  const body = cubes.some((cube) => !cube.ornament)
    ? cubes.filter((cube) => !cube.ornament)
    : cubes;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const cube of body) {
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], cube.from[axis]);
      max[axis] = Math.max(max[axis], cube.to[axis]);
    }
  }
  return max.map((value, axis) => value - min[axis]);
}

describe("buildGeometry", () => {
  it.each(KINDS)("builds a non-degenerate %s", (kind) => {
    const cubes = buildGeometry(settingsFor({ kind }));
    expect(cubes.length).toBeGreaterThan(10);
    for (const cube of cubes) {
      for (let axis = 0; axis < 3; axis++)
        expect(cube.to[axis]).toBeGreaterThan(cube.from[axis]);
    }
  });

  it("scales the model into the requested bounding box", () => {
    const settings = settingsFor({ width: 12, height: 20, depth: 6 });
    const [width, height, depth] = boundingBox(buildGeometry(settings));
    expect(width).toBeCloseTo(12, 3);
    expect(height).toBeCloseTo(20, 3);
    expect(depth).toBeCloseTo(6, 3);
  });

  it("is deterministic for identical settings", () => {
    const settings = settingsFor({ kind: "axe", seed: 7 });
    expect(buildGeometry(settings)).toEqual(buildGeometry(settings));
  });

  it("varies with the seed", () => {
    const a = buildGeometry(settingsFor({ seed: 1 }));
    const b = buildGeometry(settingsFor({ seed: 2 }));
    expect(a).not.toEqual(b);
  });

  it("gives every cube a unique name", () => {
    const cubes = buildGeometry(settingsFor({ kind: "shield" }));
    expect(new Set(cubes.map((cube) => cube.name)).size).toBe(cubes.length);
  });

  it("keeps UVs inside the fallback atlas", () => {
    for (const kind of KINDS) {
      for (const cube of buildGeometry(settingsFor({ kind }))) {
        expect(cube.uv[0]).toBeGreaterThanOrEqual(0);
        expect(cube.uv[1]).toBeGreaterThanOrEqual(0);
        expect(cube.uv[2]).toBeLessThanOrEqual(64);
        expect(cube.uv[3]).toBeLessThanOrEqual(64);
      }
    }
  });

  it("collapses the accent material in the minimal style", () => {
    const minimal = buildGeometry(
      settingsFor({ kind: "shield", style: "minimal" }),
    );
    expect(minimal.some((cube) => cube.material === 7)).toBe(false);
    const fantasy = buildGeometry(
      settingsFor({ kind: "shield", style: "fantasy" }),
    );
    expect(fantasy.some((cube) => cube.material === 7)).toBe(true);
  });

  it("adds decorative accents only for detailed fantasy models", () => {
    const plain = buildGeometry(
      settingsFor({ kind: "pickaxe", quality: "standard" }),
    );
    const detailed = buildGeometry(
      settingsFor({ kind: "pickaxe", quality: "ultra" }),
    );
    expect(detailed.length).toBeGreaterThan(plain.length);
  });
});

describe("floating structures", () => {
  const floaters = (kind: ModelKind, style: ModelSettings["floaters"]) =>
    buildGeometry(settingsFor({ kind, floaters: style })).filter(
      (cube) => cube.layer === "floater",
    );

  it("adds none by default", () => {
    expect(floaters("staff", "none")).toHaveLength(0);
  });

  it("builds a ring for the orbit style", () => {
    expect(floaters("staff", "orbit").length).toBe(9);
  });

  it("builds crystal and swarm clusters", () => {
    expect(floaters("staff", "crystal").length).toBeGreaterThanOrEqual(4);
    expect(floaters("sword", "swarm").length).toBeGreaterThanOrEqual(7);
  });

  it("marks glowing floaters as emissive", () => {
    expect(floaters("staff", "orbit").some((cube) => cube.emissive)).toBe(true);
  });
});

describe("paletteForPrompt", () => {
  it("falls back to the default palette", () => {
    expect(paletteForPrompt("ふつうのモデル")).toEqual(DEFAULT_PALETTE);
  });

  it("matches colour keywords", () => {
    expect(paletteForPrompt("紫のアメジスト")[2]).toBe("#9878d9");
    expect(paletteForPrompt("氷のように青い")[2]).toBe("#62afe6");
    expect(paletteForPrompt("emerald green blade")[2]).toBe("#58c48a");
  });

  it("lets a veto keyword fall through to the next rule", () => {
    expect(paletteForPrompt("紫のレザーと透き通るクリスタルの刀身")).toEqual(
      DEFAULT_PALETTE,
    );
  });
});
