import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const AI = path.resolve(root, "..");

if (typeof globalThis.ImageData === "undefined") {
  globalThis.ImageData = class {
    constructor(a, b, c) {
      if (typeof a === "number") {
        this.width = a; this.height = b;
        this.data = new Uint8ClampedArray(a * b * 4);
      } else {
        this.data = a; this.width = b; this.height = c ?? a.length / 4 / b;
      }
    }
  };
}

const STUDIOS = {
  sky: "skyblock/hypixel-skyblock-texture-generator (1)",
  vox: "3d-forge/voxelforge-studio",
  arcane: "weapons/minecraft-magic-staff-generator (1)",
  mythic: "mod/mythicforge-studio",
  mythiccraft: "mod/mythiccraft-studio",
};

// Resolve @/ imports per-studio (each Next app maps @/ to its own src/).
const aliasPlugin = {
  name: "studio-alias",
  setup(build) {
    build.onResolve({ filter: /^@\// }, (args) => {
      for (const dir of Object.values(STUDIOS)) {
        const base = path.join(AI, dir);
        if (args.importer.startsWith(base)) {
          const candidate = path.join(base, "src", args.path.slice(2));
          for (const probe of [candidate, `${candidate}.ts`, `${candidate}.tsx`, path.join(candidate, "index.ts")]) {
            try {
              if (fs.statSync(probe).isFile()) return { path: probe };
            } catch { /* try next */ }
          }
          return { path: `${candidate}.ts` };
        }
      }
      return null;
    });
  },
};

const nodePaths = [
  path.join(AI, "music/node_modules"),
  ...Object.values(STUDIOS).map((d) => path.join(AI, d, "node_modules")),
];

const [target, ...rest] = process.argv.slice(2);
const [studio, command] = (target ?? "").split(":");
const valid = ["sky", "vox", "arcane", "mythic", "mythiccraft", "tex"];
if (!command || !valid.includes(studio)) {
  console.log(`mcasset — MCAssetGen unified CLI
usage: npm run mcasset -- <studio>:<command> [options]
studios:
  tex    texture studio (delegates to texcraft CLI)
  sky    SkyForge texture generator
  vox    VoxelForge 3D model generator
  arcane Arcane Forge staff renderer
  mythic MythicForge Fabric mod generator
  mythiccraft MythicCraft mod generator
examples:
  npm run mcasset -- sky:items
  npm run mcasset -- sky:render --item hyperion --seed 7 --out mm/tex.png
  npm run mcasset -- arcane:render --random --out mm/staff.png
  npm run mcasset -- mythic:build --project proj.json --out moddev/mymod`);
  process.exit(command ? 1 : 0);
}

if (studio === "tex") {
  const r = spawnSync(process.execPath, ["../texture/texcraft/scripts/mcasset.mjs", command, ...rest], { cwd: root, stdio: "inherit", shell: false });
  process.exit(r.status ?? 1);
}

await build({
  entryPoints: [path.join(root, "src", `${studio}.ts`)],
  bundle: true,
  format: "cjs",
  platform: "node",
  packages: "external",
  outfile: path.join(AI, STUDIOS[studio], ".cli", `${studio}.cjs`),
  logLevel: "warning",
  plugins: [aliasPlugin],
});

const result = spawnSync(process.execPath, [path.join(AI, STUDIOS[studio], ".cli", `${studio}.cjs`)], {
  stdio: "inherit",
  env: { ...process.env, MCASSET_CMD: command, MCASSET_ARGS: JSON.stringify(rest) },
});
process.exit(result.status ?? 1);
