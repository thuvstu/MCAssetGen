/* Shaft — cylinder bands H→B→S→C→R, sub-pixel thin, material + wrap + detail */
import { INK, RGB, WHITE, clamp01, hexToRgb, mixRgb, shadeRgb } from '../color';
import type { RenderCtx } from './context';

export function drawShaft(c: RenderCtx) {
  const { cfg, buf, geo, pal, anim, S, rng } = c;
  if (geo.shaftless) return;                       // free-floating relic: no handle
  const { L, perp, baseThick, posAt, lightDot } = geo;
  const { shaftC, shaftD, wrapC, collarC, gemC } = pal;
  const detail = cfg.shaftDetail;
  const sh = cfg.shading;

  for (let s = 0; s <= L; s += 0.4) {
    const t = s / L;
    const [cx, cy] = posAt(t);
    let thick = baseThick * (1.2 - 0.38 * t);
    if (cfg.shaftStyle === 'royal') thick *= 1 + 0.09 * Math.sin(t * Math.PI);
    if (cfg.shaftStyle === 'ivory' || cfg.shaftStyle === 'bone') thick *= 1 + 0.2 * Math.pow(Math.max(0, Math.sin(t * Math.PI * 5)), 6);
    if (cfg.shaftStyle === 'bamboo') thick *= 1 + 0.1 * Math.pow(Math.max(0, Math.sin(t * Math.PI * 14)), 8);
    const r = thick / 2;
    const rr = Math.ceil(r) + 1;

    // material base
    let matBase = shaftC, matShadow = shaftD;
    if (cfg.shaftStyle === 'obsidian') { matBase = shaftC; matShadow = shadeRgb(matBase, -0.7); }
    else if (cfg.shaftStyle === 'crystal') { matBase = mixRgb(shaftC, gemC, 0.45); matShadow = shadeRgb(matBase, -0.45); }
    else if (cfg.shaftStyle === 'ivory') { matBase = mixRgb(shaftC, WHITE, 0.2); matShadow = shadeRgb(matBase, -0.3); }
    const cHi = shadeRgb(matBase, 0.3 * sh);
    const cBaseHi = shadeRgb(matBase, 0.14 * sh);
    const cSh = mixRgb(matShadow, matBase, 0.25);
    const cCore = mixRgb(matShadow, INK, 0.35);
    const cRim = mixRgb(matShadow, INK, 0.6);

    for (let k = -rr; k <= rr; k++) {
      const cov = clamp01(r - Math.abs(k) + 0.5);
      if (cov <= 0.02) continue;
      const uu = r > 0 ? (k * lightDot) / r : 0;   // −1 dark … +1 light
      let col: RGB;
      if (uu > 0.82) col = shadeRgb(cHi, 0.22);
      else if (uu > 0.34) col = cHi;
      else if (uu > 0.06) col = cBaseHi;
      else if (uu > -0.26) col = matBase;
      else if (uu > -0.6) col = cSh;
      else if (uu > -0.86) col = cCore;
      else col = cRim;
      if (uu < -0.93) col = mixRgb(cRim, cSh, 0.32);   // bounce light

      /* material styles */
      switch (cfg.shaftStyle) {
        case 'twisted': col = shadeRgb(col, Math.sin((s + k * 2.1) * 0.9 + cfg.seed) > 0.08 ? 0.2 : -0.22); break;
        case 'bone':
        case 'ivory': {
          const seg = Math.abs(((t * 5) % 1) - 0.5);
          if (seg > 0.44) col = shadeRgb(col, -0.26);
          else if (seg < 0.1) col = shadeRgb(col, 0.12);
          if (cfg.shaftStyle === 'ivory' && Math.abs(k) < r * 0.22) col = mixRgb(col, WHITE, 0.1);
          break;
        }
        case 'gnarled': if (Math.sin(t * 43 + cfg.seed * 0.02) > 0.94 && Math.abs(k) < r * 0.4) col = shadeRgb(col, -0.38); break;
        case 'royal':
          if (Math.abs(k) < Math.max(0.8 * S, r * 0.22)) {
            col = mixRgb(wrapC, WHITE, uu > 0 ? 0.4 : 0);
            if (Math.abs(uu) < 0.1) col = mixRgb(col, WHITE, 0.28);
          }
          break;
        case 'bamboo': {
          const seg = Math.abs(((t * 14) % 1) - 0.5);
          if (seg > 0.47) col = shadeRgb(col, -0.22);
          if (Math.abs(k) < r * 0.16) col = shadeRgb(col, 0.18);
          break;
        }
        case 'ornate': {
          const spiral = Math.sin(s * 0.55 + k * 0.9) > 0.55;
          if (spiral && Math.abs(k) < r * 0.55) col = mixRgb(collarC, WHITE, 0.25);
          else if (spiral) col = shadeRgb(col, -0.2);
          break;
        }
        case 'segmented': {
          const seg = (t * 8) % 1;
          if (seg > 0.86) col = shadeRgb(col, -0.4);
          else if (seg < 0.12) col = shadeRgb(col, 0.2);
          break;
        }
        case 'crystal': if (Math.sin(k * 1.4 + s * 0.1) > 0.6) col = mixRgb(col, WHITE, 0.3); break;
        case 'leather': if (rng() < 0.35) col = shadeRgb(col, rng() > 0.5 ? 0.1 : -0.14); break;
        case 'obsidian': if (uu > 0.3 && uu < 0.75) col = mixRgb(col, gemC, 0.35); break;
        case 'ebony': {
          col = shadeRgb(col, -0.3);
          if (uu > 0.68) col = mixRgb(col, [184, 132, 54], 0.42);
          if (Math.abs(((t * 7) % 1) - 0.5) < 0.06) col = mixRgb(col, mixRgb(collarC, WHITE, 0.4), 0.7);
          break;
        }
        case 'porcelain': {
          col = mixRgb(col, WHITE, 0.72);
          if (rng() < 0.08) col = shadeRgb(col, -0.06);
          if (Math.sin(s * 0.9 + Math.sin(t * 5.3) * 2.4 + k * 1.35) > 0.965) col = mixRgb(collarC, WHITE, 0.28);
          break;
        }
        case 'alloy': {
          if ((t * 12) % 1 > 0.82) col = shadeRgb(col, -0.22);
          else if ((t * 12) % 1 < 0.1) col = mixRgb(col, WHITE, 0.22);
          if (((t * 6) % 1) < 0.05 && Math.abs(k) < r * 0.3) col = mixRgb(col, mixRgb(collarC, WHITE, 0.5), 0.6);
          if (rng() < 0.04) col = shadeRgb(col, 0.13);
          break;
        }

        /* ══════════════════ WOOD PLANKS (vanilla family) ══════════════════
           Every plank shaft inherits a unique grain direction and colour palette. */
        case 'oak':
        case 'birch':
        case 'dark-oak':
        case 'spruce':
        case 'jungle':
        case 'cherry':
        case 'mangrove':
        case 'azalea': {
          const oakWood: RGB[] = [[115, 92, 61], [89, 69, 43], [197, 157, 98]];
          const birchWood: RGB[] = [[190, 165, 125], [214, 217, 215], [238, 196, 140]];
          const darkWood: RGB[] = [[60, 38, 26], [46, 27, 19], [194, 110, 76]];
          const spruceWood: RGB[] = [[74, 54, 33], [62, 40, 25], [145, 96, 53]];
          const jungleWood: RGB[] = [[202, 158, 122], [188, 138, 102], [240, 184, 126]];
          const cherryWood: RGB[] = [[192, 130, 130], [148, 84, 84], [238, 184, 184]];
          const mangroveWood: RGB[] = [[92, 52, 42], [74, 35, 28], [146, 66, 50]];
          const azaleaWood: RGB[] = [[110, 90, 62], [88, 68, 50], [202, 158, 110]];
          const woodMap: Record<string, RGB[]> = {
            oak: oakWood, birch: birchWood, 'dark-oak': darkWood, spruce: spruceWood,
            jungle: jungleWood, cherry: cherryWood, mangrove: mangroveWood, azalea: azaleaWood,
          };
          const styl = woodMap[cfg.shaftStyle] ?? [hexToRgb(cfg.shaftColor), hexToRgb(cfg.shaftColor2), [0, 0, 0]];
          const base: RGB = styl[0];
          const dark: RGB = styl[1];
          const isBirch = cfg.shaftStyle === 'birch';
          const spr = cfg.shaftStyle === 'spruce';
          const jungle = cfg.shaftStyle === 'jungle';
          const cherry = cfg.shaftStyle === 'cherry';
          const mangroveM = cfg.shaftStyle === 'mangrove';
          const rings = isBirch ? 17 : jungle ? 7 : cherry ? 9 : mangroveM ? 11 : 13;
          const grow = (x: number, y: number) => {
            let g: RGB = base;
            const band = Math.abs(((y * rings) % 1) - 0.5);
            // growth rings: alternating dark tissue between lighter wood
            if (band > (isBirch ? 0.47 : 0.44) && rng() < 0.72) g = rng() < 0.55 ? dark : shadeRgb(base, 0.1);
            if (spr && (y % 5) < 2 && rng() < 0.32) g = shadeRgb(g, 0.12);
            // birch: broken parchment strips on pale ash
            if (isBirch && (Math.sin(x * 3.4 + y * 0.7) > 0.55 || Math.cos(y * 5.1) > 0.62)) g = shadeRgb(g, -0.25);
            // jungle: scattered cocoa emitters
            if (jungle && rng() < 0.16) g = mixRgb(g, [236, 190, 140], 0.3);
            // azalea: leafy tendrils with light-green speckle
            if (cfg.shaftStyle === 'azalea' && rng() < 0.2) g = mixRgb(g, [104, 134, 72], 0.42);
            g = shadeRgb(g, uu * -0.14);
            return g;
          };
          col = grow(Math.round(cx + perp[0] * k), Math.round(cy + perp[1] * k));
          break;
        }

        /* ── industrial ── */
        case 'mech-brass': {
          if (Math.abs(k) < r * 0.22) col = mixRgb([194, 152, 74], [214, 178, 106], 0.5);
          if (Math.abs(((t * 6) % 1) - 0.5) < 0.07) col = mixRgb(col, [216, 168, 82], 0.7);
          col = uu < -0.16 ? shadeRgb(col, -0.34) : uu > 0.5 ? shadeRgb(col, 0.22) : col;
          break;
        }
        case 'mech-iron': {
          col = mixRgb([176, 178, 182], [122, 126, 132], (k / (r > 0 ? r : 1) + 1) / 2);
          if (Math.abs(uu) > 0.8) col = shadeRgb(col, -0.18);
          if (((t * 8) % 1) < 0.11) col = mixRgb(col, [244, 244, 248], 0.3);
          break;
        }
        case 'copper': {
          col = mixRgb([200, 128, 82], [170, 90, 55], (t * 8) % 1 > 0.55 ? 0.3 : 0.6);
          if (rng() < 0.06) col = mixRgb(col, [110, 176, 110], 0.28);
          if (Math.abs(((t * 5) % 1) - 0.5) < 0.06) col = shadeRgb(col, -0.2);
          break;
        }
        case 'pipe': {
          if (Math.abs(k) < r * 0.3) col = mixRgb(col, [34, 36, 44], 0.78);
          if (Math.abs(k) > r * 0.62) col = mixRgb([198, 200, 206], col, 0.72);
          if (((t * 4) % 1) < 0.1 && Math.abs(k) < r * 0.6) col = mixRgb(col, [204, 168, 58], 0.55);
          break;
        }
        case 'conveyor': {
          if ((t * 14) % 1 > 0.86) col = mixRgb([222, 185, 70], [30, 26, 24], 0.75);
          if (rng() < 0.04) col = shadeRgb(col, -0.2);
          break;
        }

        /* ── jewel-encrusted ── */
        case 'gemmed': {
          if ((t * 5) % 1 < 0.09) col = mixRgb(col, uu < 0 ? shadeRgb(wrapC, -0.35) : shadeRgb(wrapC, 0.38), 0.6);
          if (rng() < 0.05) col = mixRgb(col, gemC, 0.5);
          break;
        }
        case 'gem-column': {
          if (Math.abs(k) < r * 0.36) col = mixRgb(col, gemC, 0.72);
          if (Math.abs(k) < r * 0.14) col = mixRgb(col, WHITE, 0.25);
          if (Math.abs(k) > r * 0.58) col = mixRgb(col, collarC, 0.5);
          break;
        }
        case 'gem-tube': {
          if (Math.abs(k) > r * 0.58) col = mixRgb(col, collarC, 0.55);
          else col = mixRgb(col, gemC, 0.58 + Math.sin(t * 30) * 0.08);
          if (Math.abs(k) < r * 0.16) col = mixRgb(col, mixRgb(gemC, WHITE, 0.55), 0.4);
          break;
        }
        case 'embedding': {
          if (rng() < 0.3) col = mixRgb(col, collarC, 0.5);
          if (Math.abs(((t * 4) % 1) - 0.5) < 0.07) col = mixRgb(col, gemC, 0.6);
          if (((t * 8) % 1) < 0.05 && Math.abs(k) < r * 0.42) col = mixRgb(col, gemC, 0.85);
          break;
        }

        /* ── aquatic ── */
        case 'prismarine': {
          if (rng() < 0.32) col = mixRgb(col, [76, 146, 150], 0.75);
          if (rng() < 0.12) col = mixRgb(col, [34, 70, 68], 0.55);
          if (Math.abs(k) < r * 0.16 && rng() < 0.5) col = mixRgb(col, WHITE, 0.3);
          break;
        }
        case 'kelp-rope': {
          col = mixRgb([88, 132, 88], [58, 94, 50], clamp01((k / (r || 1) + 1) / 2));
          if (rng() < 0.18) col = mixRgb(col, [160, 180, 110], 0.5);
          if (((t * 9) % 1) < 0.12) col = shadeRgb(col, -0.18);
          break;
        }
        case 'anchor-chain': {
          const linkShade = (t * 4) % 1 < 0.3 ? mixRgb(collarC, WHITE, 0.35) : shadeRgb(collarC, -0.3);
          if ((t * 4) % 1 < 0.3) col = mixRgb(col, linkShade, 0.7);
          else col = shadeRgb(col, -0.22);
          if (((t * 2) % 1) < 0.08) col = mixRgb(col, WHITE, 0.22);
          break;
        }
        case 'sponge': {
          col = mixRgb([204, 190, 96], [170, 154, 74], clamp01((k / (r || 1) + 1) / 2));
          if (rng() < 0.38) col = mixRgb(col, [16, 38, 44], 0.24);
          if (rng() < 0.16) col = mixRgb(col, [124, 168, 94], 0.3);
          break;
        }
        case 'glass': {
          if (rng() < 0.55) col = mixRgb([214, 236, 242], col, 0.75);
          if (Math.abs(k) < r * 0.28) col = mixRgb(col, gemC, 0.35);
          if (Math.abs(k) < r * 0.1) col = mixRgb(col, WHITE, 0.5);
          col = mixRgb(col, WHITE, uu > 0.5 ? 0.25 : 0.08);
          break;
        }
        case 'bamboo-woven': {
          col = mixRgb([186, 158, 94], [154, 134, 86], clamp01((k / (r || 1) + 1) / 2));
          if (((t * 12) % 1) < 0.42) col = shadeRgb(col, -0.14);
          else col = mixRgb(col, [142, 114, 74], 0.22);
          if (rng() < 0.05) col = mixRgb(col, [114, 96, 44], 0.32);
          break;
        }
      }

      /* wrap overlay */
      if (cfg.wrapStyle !== 'none') {
        const cnt = cfg.wrapDensity;
        let frac = (t * cnt) % 1;
        let inWrap = false;
        switch (cfg.wrapStyle) {
          case 'spiral': frac = ((t * cnt + k * 0.1) % 1 + 1) % 1; inWrap = frac < 0.3; break;
          case 'rings': inWrap = frac < 0.16; break;
          case 'vine': inWrap = frac < 0.2 + 0.08 * Math.sin(t * 30); break;
          case 'chain': inWrap = frac < 0.17 || (frac > 0.5 && frac < 0.67); break;
          case 'rune-band': inWrap = frac < 0.46; break;
          case 'stitch': inWrap = frac < 0.1 && Math.abs(k) > r * 0.45; break;
          case 'scale': inWrap = ((s + k * 2) % 4) < 2; break;
        }
        if (inWrap) {
          let wc: RGB = uu < -0.5 ? shadeRgb(wrapC, -0.42) : uu < 0.3 ? wrapC : shadeRgb(wrapC, 0.42);
          if (cfg.wrapStyle === 'chain') wc = shadeRgb(wc, Math.sin(s * 2.2) > 0 ? 0.15 : -0.15);
          if (cfg.wrapStyle === 'rune-band' && Math.abs(k) < r * 0.45) {
            const baseRune = (s % 3.2) < 1.4;
            let pulse = 0;
            if (anim.on && anim.type === 'rune-pulse') {
              const d = Math.abs(((t / L - anim.runePhase + 0.12) % 1) - 0.12);
              pulse = d < 0.12 ? (1 - d / 0.12) * anim.intensity : 0;
            }
            const gemCol = mixRgb(gemC, WHITE, 0.55);
            wc = baseRune ? (pulse > 0 ? mixRgb(gemCol, WHITE, pulse * 0.4) : gemCol) : shadeRgb(wrapC, -0.15);
            if (pulse > 0) wc = mixRgb(wc, WHITE, pulse * 0.35);
          }
          if (cfg.wrapStyle === 'vine' && rng() < 0.12) wc = shadeRgb(wc, 0.32);
          if (cfg.wrapStyle === 'scale') wc = shadeRgb(wc, ((s + k * 2) % 8) < 4 ? 0.2 : -0.2);
          col = wc;
        }
      }

      /* engraved grooves + rivets */
      if (detail > 0.25 && r > 2.2 * S) {
        if (Math.abs(uu - 0.16) < 0.05 * detail) col = shadeRgb(col, -0.3 * detail);
        if (detail > 0.6 && Math.abs(k) < r * 0.9 && (t * 6) % 1 < 0.06) col = shadeRgb(col, -0.22);
      }
      if (detail > 0.7 && r > 2.6 * S && ((t * 8) % 1) < 0.05 && Math.abs(k) < r * 0.35) col = mixRgb(collarC, WHITE, 0.5);

      /* ── Mod Essence Shaft Inlays & Channels ── */
      if (cfg.modEssence === 'thaumcraft') {
        // Vis channels glowing in dark purple
        const channel = Math.abs(uu - 0.1) < 0.18;
        if (channel) {
          const visGlow = 0.5 + 0.5 * Math.sin(t * 18 - (anim.on ? anim.t * anim.TAU : 0));
          col = mixRgb(col, [168, 85, 247], visGlow * 0.75);
        }
      } else if (cfg.modEssence === 'botania') {
        // Livingwood moss / cyan mana vein
        if (Math.sin(t * 26 + k * 0.5) > 0.65) {
          col = mixRgb(col, [74, 222, 128], 0.65);
        }
        if (Math.abs(uu + 0.1) < 0.12) {
          col = mixRgb(col, [34, 211, 238], 0.7);
        }
      } else if (cfg.modEssence === 'astral-sorcery') {
        // Constellation starlight silver inlay
        if (Math.abs(uu) < 0.14) {
          col = mixRgb(WHITE, [147, 197, 253], 0.4);
        }
      } else if (cfg.modEssence === 'sculk-ancient') {
        // Deep dark tendril pulses
        if (Math.sin(t * 14 + k * 0.8) > 0.4) {
          const sculkPulse = 0.4 + 0.6 * (Math.sin(t * 10 + (anim.on ? anim.t * anim.TAU * 2 : 0)) > 0 ? 1 : 0);
          col = mixRgb([4, 30, 36], [6, 182, 212], sculkPulse);
        }
      } else if (cfg.modEssence === 'netherite-gilded') {
        // Gilded 24k gold inlay lines on heavy black
        if (Math.abs(uu - 0.25) < 0.1 || ((t * 10) % 1 < 0.1 && Math.abs(k) < r * 0.8)) {
          col = [234, 179, 8];
        }
      } else if (cfg.modEssence === 'sakura-oneiric') {
        // Drifting blossom inlay: warm blush band + soft petal glints.
        if (Math.abs(uu) < 0.13) col = mixRgb(col, [248, 169, 208], 0.55);
        if (Math.sin(t * 34 + k * 1.1 + cfg.seed * 0.03) > 0.93) {
          col = mixRgb(col, [253, 207, 232], 0.75);
        }
      } else if (cfg.modEssence === 'forge-master') {
        // Quench lines of forged gold + ember core.
        if (Math.abs(uu - 0.35) < 0.12) col = mixRgb(col, [245, 158, 11], 0.6);
        if (Math.abs(uu + 0.6) < 0.1) col = mixRgb(col, [249, 115, 22], 0.7);
      } else if (cfg.modEssence === 'industrial') {
        // Steam exhaust: slow-moving brass bands with dark exhaust voids.
        if (Math.abs(uu - 0.3) < 0.1) col = mixRgb(col, [194, 152, 74], 0.66);
        if (((t * 5 + (anim.on ? anim.t * anim.TAU : 0)) % 1) < 0.08 && Math.abs(k) < r * 0.4) col = mixRgb(col, [30, 26, 22], 0.72);
      } else if (cfg.modEssence === 'wildwood') {
        // Moss creeps along the bark grain and dusts lichen onto the handle.
        if (Math.sin(t * 24 + k * 2) > 0.55) col = mixRgb(col, [76, 125, 58], 0.58);
        if (rng() < 0.2) col = mixRgb(col, [168, 198, 148], 0.32);
      } else if (cfg.modEssence === 'aquatic') {
        // Rising foam: light cyan bubbles and dark water shadows.
        if (Math.abs(uu - 0.2) < 0.1) col = mixRgb(col, [94, 234, 212], 0.55);
        if (Math.sin(t * 32 + k * 1.5) > 0.92) col = mixRgb(col, WHITE, 0.55);
      } else if (cfg.modEssence === 'masterwork') {
        // Fine jewelled seams set inside pale channels.
        if (Math.abs(uu) < 0.11) col = mixRgb(col, [232, 121, 249], 0.58);
        if (Math.abs(uu - 0.5) < 0.08) col = mixRgb(col, gemC, 0.4);
      }

      /* grain / dither / finish */
      if (rng() < cfg.grain * 0.26) col = shadeRgb(col, rng() > 0.5 ? 0.09 : -0.12);
      if (cfg.dither && (Math.round(cx) + Math.round(cy)) % 2 === 0 && rng() < 0.3) col = shadeRgb(col, -0.07);
      if (cfg.finish === 'glossy' && uu > 0.1 && uu < 0.5) col = mixRgb(col, WHITE, 0.26);
      else if (cfg.finish === 'metallic') { if (uu > 0.5 && uu < 0.74) col = mixRgb(col, WHITE, 0.5); else if (uu < -0.5) col = shadeRgb(col, -0.12); }
      else if (cfg.finish === 'enchanted' && rng() < 0.05) col = mixRgb(col, gemC, 0.45);
      else if (cfg.finish === 'weathered' && rng() < 0.08) col = shadeRgb(col, -0.25);

      buf.blend(cx + perp[0] * k, cy + perp[1] * k, col, cov * 255);
    }
  }
}
