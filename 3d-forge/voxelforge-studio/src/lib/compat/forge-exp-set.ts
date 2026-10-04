import { applySet, generate, layoutAtlas, paintAtlas, type Params } from "./forge-index";
import type { SetDef } from "./forge-themes";
import { slug } from "./forge-util";
import { bbmodel, download } from "./forge-exp-formats";

/** 一式の全ての型を .bbmodel として順に書き出す */
export async function exportSet(base: Params, s: SetDef, onStep?: (name: string, i: number, n: number) => void) {
  const n = s.kinds.length;
  for (let i = 0; i < n; i++) {
    const p = applySet(base, s, s.kinds[i]);
    const gen = generate(p);
    const atlas = layoutAtlas(gen.boxes, p.tex, p.layout, p.share);
    const c = document.createElement("canvas");
    c.width = atlas.size;
    c.height = atlas.size;
    const ctx = c.getContext("2d");
    if (ctx)
      paintAtlas(ctx, atlas, p.seed, {
        mode: p.grad.mode,
        power: p.grad.power,
        glow: p.palette.glow,
        minY: gen.bounds.min[1],
        maxY: gen.bounds.max[1],
      });
    const json = bbmodel(p, gen, atlas, c.toDataURL("image/png"));
    download(`${slug(p.name)}.bbmodel`, new Blob([JSON.stringify(json)], { type: "application/json" }));
    onStep?.(p.name, i + 1, n);
    // ブラウザの連続ダウンロード抑制を避ける
    await new Promise((r) => setTimeout(r, 420));
  }
  return n;
}
