import { build } from "esbuild";

// Node has no ImageData; stub it for ImageData-based generators.
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

// Bundle the CLI (browser libs stay out: cli.ts only touches DOM-free modules).
await build({
  entryPoints: ["src/lib/cli.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: ".cli/mcasset.mjs",
  logLevel: "warning",
  banner: {
    js: `if(typeof globalThis.ImageData==="undefined"){globalThis.ImageData=class{constructor(a,b,c){if(typeof a==="number"){this.width=a;this.height=b;this.data=new Uint8ClampedArray(a*b*4)}else{this.data=a;this.width=b;this.height=c??a.length/4/b}}};}`,
  },
});

const { spawnSync } = await import("node:child_process");
const result = spawnSync(process.execPath, [".cli/mcasset.mjs", ...process.argv.slice(2)], { stdio: "inherit" });
process.exit(result.status ?? 1);
