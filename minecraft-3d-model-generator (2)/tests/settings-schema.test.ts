import { describe, expect, it } from "vitest";
import { PNG } from "pngjs";
import { validateSettings, ValidationError } from "@/lib/settings-schema";
import { DEFAULT_SETTINGS } from "@/lib/model-types";

const base = { ...DEFAULT_SETTINGS };

function solidPng(width = 32, height = 32): string {
  const png = new PNG({ width, height });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 70;
    png.data[i + 1] = 130;
    png.data[i + 2] = 205;
    png.data[i + 3] = 255;
  }
  return "data:image/png;base64," + PNG.sync.write(png).toString("base64");
}

describe("validateSettings", () => {
  it("accepts a well formed payload", () => {
    const settings = validateSettings({
      ...base,
      name: "  Blade  ",
      kind: "axe",
    });
    expect(settings.name).toBe("Blade");
    expect(settings.kind).toBe("axe");
  });

  it("rejects unknown templates", () => {
    expect(() => validateSettings({ ...base, kind: "spaceship" })).toThrow(
      ValidationError,
    );
  });

  it("rejects non-object input", () => {
    expect(() => validateSettings(null)).toThrow(ValidationError);
  });

  it("clamps numeric fields into range", () => {
    const settings = validateSettings({
      ...base,
      width: 999,
      depth: -4,
      detail: 250,
      seed: -1,
    });
    expect(settings.width).toBe(32);
    expect(settings.depth).toBe(1);
    expect(settings.detail).toBe(100);
    expect(settings.seed).toBe(0);
  });

  it("rejects non numeric sizes", () => {
    expect(() => validateSettings({ ...base, width: "wide" })).toThrow(
      ValidationError,
    );
  });

  it("falls back to defaults for unknown enum values", () => {
    const settings = validateSettings({
      ...base,
      quality: "insane",
      floaters: "meteor",
      animation: "wobble",
    });
    expect(settings.quality).toBe("high");
    expect(settings.floaters).toBe("none");
    expect(settings.animation).toBe("none");
  });

  // Guards the allow-lists from drifting out of sync with the option types:
  // a missing entry silently rewrites a user's choice to the default.
  it("round-trips every option the editor can offer", () => {
    const cases: [keyof typeof base, unknown[]][] = [
      ["quality", ["standard", "high", "ultra"]],
      ["style", ["fantasy", "vanilla", "minimal"]],
      ["floaters", ["none", "crystal", "orbit", "swarm"]],
      ["effect", ["none", "glow", "sparkle", "magic"]],
      ["animation", ["none", "float", "spin", "sway"]],
      ["form", ["sealed", "base", "released"]],
      ["mode", ["normal", "charged"]],
      [
        "action",
        ["none", "slash", "thrust", "spin", "cast", "charge", "transform"],
      ],
    ];
    for (const [field, values] of cases) {
      for (const value of values) {
        expect(validateSettings({ ...base, [field]: value })[field]).toBe(
          value,
        );
      }
    }
  });

  it("truncates long names and prompts", () => {
    const settings = validateSettings({
      ...base,
      name: "x".repeat(200),
      prompt: "y".repeat(2000),
    });
    expect(settings.name).toHaveLength(80);
    expect(settings.prompt).toHaveLength(1000);
  });

  it("accepts a valid atlas", () => {
    const settings = validateSettings({
      ...base,
      atlas: { source: solidPng(), name: "tex.png" },
    });
    expect(settings.atlas).toMatchObject({
      width: 32,
      height: 32,
      name: "tex.png",
    });
  });

  it("rejects malformed and undersized atlases", () => {
    expect(() =>
      validateSettings({
        ...base,
        atlas: { source: "data:image/png;base64,zzz" },
      }),
    ).toThrow(ValidationError);
    expect(() =>
      validateSettings({ ...base, atlas: { source: solidPng(8, 8) } }),
    ).toThrow(ValidationError);
    expect(() =>
      validateSettings({
        ...base,
        atlas: { source: "https://example.com/a.png" },
      }),
    ).toThrow(ValidationError);
  });
});
