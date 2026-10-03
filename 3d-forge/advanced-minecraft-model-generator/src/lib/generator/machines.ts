import { GenCtx, buildHilt, buildGuard, buildBlade, buildChains } from "./weapons";

/* =================================================================== */
/* CHAINSAW — 発動機・ガイドバー・循環する鋸歯チェーン                   */
/* =================================================================== */
function buildChainsaw(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const cx = b.centerX;
  const cz = b.centerZ;

  // --- rear grip + trigger assembly ---
  let y = 2;
  b.cxBox("saw_rear_grip", y, 3.4, Math.max(6, cfg.handleLength), 3.4, "cloth", {
    group: "Hilt",
    tint: -12,
  });
  b.mirror((side) => {
    b.box(
      `saw_grip_rib_${side}`,
      [cx + side * 1.7 - 0.3, y + 1, cz - 1.8],
      [cx + side * 1.7 + 0.3, y + cfg.handleLength - 1, cz + 1.8],
      "secondary",
      { group: "Hilt", tint: -6 }
    );
  });
  // trigger guard loop
  b.box("saw_trigger_guard", [cx - 1, y - 1.6, cz - 1], [cx + 1, y - 0.4, cz + 3.2], "primary", {
    group: "Hilt",
    tint: -18,
  });
  b.box("saw_trigger", [cx - 0.5, y - 0.2, cz + 1.4], [cx + 0.5, y + 1.4, cz + 2.2], "accent", {
    group: "Hilt",
  });

  y += Math.max(6, cfg.handleLength);

  // --- engine block ---
  const engY = y;
  const engH = 9;
  b.cxBox("engine_block", engY, 7.5, engH, 7, "primary", { group: "Head", tint: 4 });
  b.cxBox("engine_cowl", engY + engH - 2, 8.2, 2.6, 7.6, "secondary", { group: "Head", tint: -8 });

  // cooling fins
  for (let f = 0; f < 5; f++) {
    b.cxBox(`engine_fin_${f}`, engY + 1 + f * 1.5, 8.6, 0.7, 6.4, "secondary", {
      group: "Head",
      tint: 10,
    });
  }

  // recoil starter + pull cord
  b.box("saw_starter", [cx - 4.6, engY + 2, cz - 2.4], [cx - 3.2, engY + 7, cz + 2.4], "secondary", {
    group: "Gear",
    tint: -10,
  });
  b.strand(
    "saw_cord",
    Array.from({ length: 4 }, (_, i) => [cx - 5.2, engY + 6.4 - i * 1.5, cz] as [number, number, number]),
    0.6,
    "bone",
    { group: "Gear", emissive: false }
  );

  // exhaust stack
  b.box("saw_exhaust", [cx + 3.4, engY + 4, cz - 1.6], [cx + 5.6, engY + 9.5, cz + 1.6], "secondary", {
    group: "Head",
    tint: -22,
  });
  b.cxBox("saw_exhaust_mouth", engY + 9.5, 2.6, 1, 2.6, "accent", { group: "Head", cx: cx + 4.5 });

  // fuel / mana cell
  if (cfg.hasCoreGem) {
    const g = Math.max(2.5, cfg.coreGemSize * 0.8);
    b.box(
      "saw_fuel_cell",
      [cx - g / 2, engY + 2.5, cz - 4.4],
      [cx + g / 2, engY + 2.5 + g, cz - 3],
      "gem",
      { group: "Core" }
    );
  }

  // --- guide bar ---
  const barY = engY + engH * 0.5;
  const barLen = Math.max(14, cfg.bladeLength);
  const barH = Math.max(3.4, cfg.bladeWidth);
  const barStart = cx + 4;

  for (let i = 0; i < barLen; i += 2) {
    const t = i / barLen;
    const taper = 1 - t * 0.22;
    b.box(
      `guide_bar_${i}`,
      [barStart + i, barY - (barH / 2) * taper, cz - 0.9],
      [barStart + i + 2, barY + (barH / 2) * taper, cz + 0.9],
      i % 4 === 0 ? "primary" : "secondary",
      { group: "Blade", tint: i % 4 === 0 ? 0 : 8 }
    );
  }
  // bar nose sprocket
  b.cxBox("bar_nose", barY - 1.8, 3.6, 3.6, 2.2, "accent", { group: "Blade", cx: barStart + barLen + 1 });
  // bar groove highlight
  b.box(
    "bar_groove",
    [barStart, barY - 0.4, cz - 1.05],
    [barStart + barLen, barY + 0.4, cz + 1.05],
    "gem",
    { group: "Blade" }
  );

  // --- chain teeth looping around the bar (Chain bone) ---
  const teeth = Math.max(10, Math.round(barLen / 1.8));
  for (let i = 0; i < teeth; i++) {
    const t = i / teeth;
    const onTop = t < 0.5;
    const u = onTop ? t * 2 : (1 - t) * 2;
    const tx = barStart + u * barLen;
    const ty = barY + (onTop ? barH / 2 + 0.5 : -barH / 2 - 0.5);
    b.box(
      `chain_link_${i}`,
      [tx - 0.8, ty - 0.55, cz - 1.05],
      [tx + 0.8, ty + 0.55, cz + 1.05],
      i % 3 === 0 ? "accent" : "bone",
      { group: "Chain", tint: -4 }
    );
    // cutter tooth
    b.box(
      `chain_tooth_${i}`,
      [tx - 0.45, onTop ? ty + 0.55 : ty - 1.5, cz - 0.5],
      [tx + 0.45, onTop ? ty + 1.5 : ty - 0.55, cz + 0.5],
      "glow",
      { group: "Chain" }
    );
  }

  // drive sprocket cover
  b.cxBox("drive_cover", barY - 3.2, 5.2, 6.4, 5.4, "primary", { group: "Gear", cx: barStart - 0.5, tint: -14 });
  b.ring("drive_sprocket", barY - 1.2, 2.2, 0.8, "accent", {
    group: "Gear",
    segments: 8,
    height: 2.2,
    cx: barStart - 0.5,
  });
}

/* =================================================================== */
/* GUN — 魔導拳銃 / ライフル                                            */
/* =================================================================== */
function buildGun(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const cx = b.centerX;
  const cz = b.centerZ;

  const gripLen = Math.max(5, cfg.handleLength);
  const barrelLen = Math.max(10, cfg.bladeLength);

  // --- grip (angled back) ---
  for (let i = 0; i < gripLen; i++) {
    const lean = i * 0.28;
    b.box(
      `gun_grip_${i}`,
      [cx - 1.6, 2 + i, cz - 1.6 - lean],
      [cx + 1.6, 3 + i, cz + 1.4 - lean],
      i % 2 === 0 ? "cloth" : "secondary",
      { group: "Hilt", tint: -10 }
    );
  }
  const frameY = 2 + gripLen;

  // --- trigger group ---
  b.box("gun_trigger_guard", [cx - 1, frameY - 3.4, cz + 0.6], [cx + 1, frameY - 2.4, cz + 4], "primary", {
    group: "Hilt",
    tint: -16,
  });
  b.box("gun_trigger", [cx - 0.5, frameY - 3, cz + 1.6], [cx + 0.5, frameY - 1.4, cz + 2.4], "accent", {
    group: "Hilt",
  });

  // --- receiver / frame ---
  b.box(
    "gun_receiver",
    [cx - 2, frameY, cz - 3.5],
    [cx + 2, frameY + 4.4, cz + 5.5],
    "primary",
    { group: "Breech" }
  );
  b.box(
    "gun_slide",
    [cx - 2.3, frameY + 4.4, cz - 3.8],
    [cx + 2.3, frameY + 6.6, cz + 5.8],
    "secondary",
    { group: "Breech", tint: 6 }
  );
  // ejection port
  b.box(
    "gun_ejection_port",
    [cx + 1.6, frameY + 4.8, cz + 0.5],
    [cx + 2.5, frameY + 6.2, cz + 3.6],
    "primary",
    { group: "Breech", tint: -26 }
  );
  // slide serrations
  for (let s = 0; s < 5; s++) {
    b.box(
      `gun_serration_${s}`,
      [cx - 2.4, frameY + 4.6, cz - 3.4 + s * 0.8],
      [cx + 2.4, frameY + 6.4, cz - 3.1 + s * 0.8],
      "primary",
      { group: "Breech", tint: -18 }
    );
  }

  // --- magazine ---
  b.box(
    "gun_magazine",
    [cx - 1.4, 1, cz - 1.2],
    [cx + 1.4, frameY + 0.5, cz + 1.2],
    "secondary",
    { group: "Magazine", tint: -14 }
  );
  b.box(
    "gun_mag_window",
    [cx - 0.6, 2.5, cz + 1.2],
    [cx + 0.6, frameY - 1.5, cz + 1.6],
    "gem",
    { group: "Magazine" }
  );
  b.cxBox("gun_mag_base", 0.2, 3.4, 1.1, 3, "accent", { group: "Magazine" });

  // --- barrel ---
  const barrelY = frameY + 5.4;
  const barrelZ0 = cz + 5.8;
  for (let i = 0; i < barrelLen; i += 2) {
    b.box(
      `gun_barrel_${i}`,
      [cx - 1.4, barrelY - 1.4, barrelZ0 + i],
      [cx + 1.4, barrelY + 1.4, barrelZ0 + i + 2],
      i % 4 === 0 ? "primary" : "secondary",
      { group: "Barrel", tint: i % 4 === 0 ? 0 : 8 }
    );
  }

  // --- muzzle device ---
  const muzzleZ = barrelZ0 + barrelLen;
  buildMuzzle(ctx, cx, barrelY, muzzleZ);

  // --- top rail + scope ---
  b.box(
    "gun_rail",
    [cx - 1.2, frameY + 6.6, cz - 3.4],
    [cx + 1.2, frameY + 7.2, cz + 5.6],
    "primary",
    { group: "Breech", tint: -20 }
  );
  if (cfg.hasScope) {
    b.box(
      "gun_scope_body",
      [cx - 1.5, frameY + 7.2, cz - 1.5],
      [cx + 1.5, frameY + 10.2, cz + 4.5],
      "primary",
      { group: "Breech", tint: -10 }
    );
    b.box(
      "gun_scope_lens",
      [cx - 1.1, frameY + 7.6, cz + 4.5],
      [cx + 1.1, frameY + 9.8, cz + 5.1],
      "gem",
      { group: "Breech" }
    );
    b.cxBox("gun_scope_turret", frameY + 10.2, 1.6, 1.4, 1.6, "accent", {
      group: "Breech",
      cz: cz + 1.5,
    });
  }

  // --- mana core behind the breech ---
  if (cfg.hasCoreGem) {
    const g = Math.max(2.4, cfg.coreGemSize * 0.75);
    b.box(
      "gun_mana_core",
      [cx - g / 2, frameY + 1, cz - 4.6],
      [cx + g / 2, frameY + 1 + g, cz - 3.2],
      "gem",
      { group: "Core" }
    );
    b.ring("gun_core_ring", frameY + 1.4, g * 0.75, 0.6, "accent", {
      group: "Core",
      segments: 8,
      height: g * 0.7,
      cz: cz - 3.9,
    });
  }
}

/** Shared muzzle treatment for guns / railguns / casters. */
function buildMuzzle(ctx: GenCtx, cx: number, y: number, z: number): void {
  const { cfg, b } = ctx;
  switch (cfg.muzzleStyle) {
    case "none":
      return;
    case "barrel":
      b.box(`muzzle_cap`, [cx - 1.6, y - 1.6, z], [cx + 1.6, y + 1.6, z + 2.4], "secondary", {
        group: "Muzzle",
        tint: -12,
      });
      b.box(`muzzle_bore`, [cx - 0.7, y - 0.7, z + 1.8], [cx + 0.7, y + 0.7, z + 2.6], "glow", {
        group: "Muzzle",
      });
      break;
    case "compensator":
      b.box(`comp_body`, [cx - 1.8, y - 1.8, z], [cx + 1.8, y + 1.8, z + 4], "primary", {
        group: "Muzzle",
        tint: -8,
      });
      for (let p = 0; p < 3; p++) {
        b.box(
          `comp_port_${p}`,
          [cx - 1.9, y + 1.2, z + 0.6 + p * 1.1],
          [cx + 1.9, y + 1.9, z + 1.2 + p * 1.1],
          "accent",
          { group: "Muzzle" }
        );
      }
      b.box(`comp_bore`, [cx - 0.8, y - 0.8, z + 3.4], [cx + 0.8, y + 0.8, z + 4.3], "glow", {
        group: "Muzzle",
      });
      break;
    case "coil_array":
      for (let c = 0; c < 4; c++) {
        b.ring(`muzzle_coil_${c}`, y - 1.3, 2.3 - c * 0.18, 0.75, c % 2 ? "accent" : "gem", {
          group: "Coil",
          segments: 8,
          height: 2.6,
          cx,
          cz: z + 0.8 + c * 1.9,
        });
      }
      b.box(`coil_bore`, [cx - 0.9, y - 0.9, z + 8], [cx + 0.9, y + 0.9, z + 9.4], "glow", {
        group: "Muzzle",
      });
      break;
    case "prism_lens":
      b.box(`prism_housing`, [cx - 2.4, y - 2.4, z], [cx + 2.4, y + 2.4, z + 2], "primary", {
        group: "Muzzle",
        tint: -6,
      });
      for (let p = 0; p < 6; p++) {
        const a = (p / 6) * Math.PI * 2;
        b.box(
          `prism_blade_${p}`,
          [cx + Math.cos(a) * 1.9 - 0.5, y + Math.sin(a) * 1.9 - 0.5, z + 1.8],
          [cx + Math.cos(a) * 1.9 + 0.5, y + Math.sin(a) * 1.9 + 0.5, z + 3.8],
          "gem",
          { group: "Muzzle" }
        );
      }
      b.box(`prism_core`, [cx - 1, y - 1, z + 2.4], [cx + 1, y + 1, z + 4.6], "glow", {
        group: "Muzzle",
      });
      break;
    case "quad_rail":
      for (const [ox, oy] of [
        [-1.8, 1.8],
        [1.8, 1.8],
        [-1.8, -1.8],
        [1.8, -1.8],
      ]) {
        b.box(
          `quad_rail_${ox}_${oy}`,
          [cx + ox - 0.7, y + oy - 0.7, z - 2],
          [cx + ox + 0.7, y + oy + 0.7, z + 4],
          "secondary",
          { group: "Rail", tint: 10 }
        );
        b.box(
          `quad_rail_tip_${ox}_${oy}`,
          [cx + ox - 0.5, y + oy - 0.5, z + 3.6],
          [cx + ox + 0.5, y + oy + 0.5, z + 5.4],
          "gem",
          { group: "Muzzle" }
        );
      }
      b.box(`quad_bore`, [cx - 1.1, y - 1.1, z + 2], [cx + 1.1, y + 1.1, z + 5.2], "glow", {
        group: "Muzzle",
      });
      break;
  }
}

/* =================================================================== */
/* RAILGUN — 双軌条・蓄電コイル・加速砲                                   */
/* =================================================================== */
function buildRailgun(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const cx = b.centerX;
  const cz = b.centerZ;
  const railLen = Math.max(20, cfg.bladeLength);
  const axisY = 11;

  // --- shoulder stock ---
  b.box("rg_stock", [cx - 2.2, axisY - 3, cz - 13], [cx + 2.2, axisY + 2.4, cz - 7], "primary", {
    group: "Breech",
    tint: -10,
  });
  b.box("rg_buttplate", [cx - 2.6, axisY - 3.4, cz - 14], [cx + 2.6, axisY + 2.8, cz - 13], "cloth", {
    group: "Breech",
    tint: -16,
  });
  b.box("rg_cheek", [cx - 1.6, axisY + 2.4, cz - 12], [cx + 1.6, axisY + 3.6, cz - 7.5], "secondary", {
    group: "Breech",
    tint: -6,
  });

  // --- pistol grip ---
  for (let i = 0; i < 6; i++) {
    b.box(
      `rg_grip_${i}`,
      [cx - 1.5, axisY - 3 - i, cz - 6 - i * 0.3],
      [cx + 1.5, axisY - 2 - i, cz - 3.4 - i * 0.3],
      i % 2 ? "cloth" : "secondary",
      { group: "Hilt", tint: -12 }
    );
  }
  b.box("rg_trigger", [cx - 0.5, axisY - 4.4, cz - 3.4], [cx + 0.5, axisY - 3, cz - 2.6], "accent", {
    group: "Hilt",
  });

  // --- main housing / capacitor bank ---
  b.box("rg_housing", [cx - 3, axisY - 2.6, cz - 7], [cx + 3, axisY + 3.2, cz + 2], "primary", {
    group: "Breech",
  });
  for (let c = 0; c < 4; c++) {
    b.mirror((side) => {
      b.box(
        `rg_capacitor_${side}_${c}`,
        [cx + side * 3 - 0.2, axisY - 2 + (c % 2) * 2.6, cz - 6 + Math.floor(c / 2) * 3.6],
        [cx + side * 4.8, axisY + 0.2 + (c % 2) * 2.6, cz - 3.4 + Math.floor(c / 2) * 3.6],
        c % 2 ? "gem" : "secondary",
        { group: "Coil", tint: 6 }
      );
    });
  }

  // --- twin rails ---
  b.mirror((side) => {
    for (let i = 0; i < railLen; i += 2) {
      b.box(
        `rg_rail_${side}_${i}`,
        [cx + side * 2.2 - 0.9, axisY - 1, cz + 2 + i],
        [cx + side * 2.2 + 0.9, axisY + 1, cz + 4 + i],
        i % 4 === 0 ? "accent" : "secondary",
        { group: "Rail", tint: i % 4 === 0 ? 0 : 10 }
      );
    }
    // rail support struts
    for (let s = 0; s < 4; s++) {
      const sz = cz + 4 + (s * railLen) / 4;
      b.box(
        `rg_strut_${side}_${s}`,
        [cx + side * 1.2, axisY - 2.4, sz],
        [cx + side * 3.4, axisY - 1, sz + 1.4],
        "primary",
        { group: "Rail", tint: -12 }
      );
    }
  });

  // --- accelerator coils wrapping the rails ---
  const coilCount = 5;
  for (let i = 0; i < coilCount; i++) {
    const czp = cz + 4 + (i * (railLen - 2)) / coilCount;
    b.ring(`rg_coil_${i}`, axisY - 2.6, 3.6, 0.9, i % 2 ? "gem" : "accent", {
      group: "Coil",
      segments: 10,
      height: 5.2,
      cz: czp,
    });
  }

  // --- energy core between the rails ---
  if (cfg.hasCoreGem) {
    const g = Math.max(3, cfg.coreGemSize);
    b.box(
      "rg_core",
      [cx - g / 2, axisY - g / 2, cz - 2.5],
      [cx + g / 2, axisY + g / 2, cz + 2.5],
      "gem",
      { group: "Core" }
    );
    b.box("rg_core_glow", [cx - 0.8, axisY - 0.8, cz + 2], [cx + 0.8, axisY + 0.8, cz + 2 + railLen], "glow", {
      group: "Core",
    });
  }

  // --- muzzle aperture ---
  buildMuzzle(ctx, cx, axisY, cz + 2 + railLen);

  // --- scope ---
  if (cfg.hasScope) {
    b.box("rg_scope", [cx - 1.5, axisY + 3.2, cz - 5], [cx + 1.5, axisY + 6.4, cz + 1], "primary", {
      group: "Breech",
      tint: -14,
    });
    b.box("rg_scope_lens", [cx - 1.1, axisY + 3.6, cz + 1], [cx + 1.1, axisY + 6, cz + 1.6], "gem", {
      group: "Breech",
    });
  }

  // --- bipod ---
  b.mirror((side) => {
    b.box(
      `rg_bipod_${side}`,
      [cx + side * 2.6 - 0.5, 1, cz + 5],
      [cx + side * 4.4 + 0.5, axisY - 2.6, cz + 6.4],
      "secondary",
      { group: "Rail", tint: -18 }
    );
  });
}

/* =================================================================== */
/* MACE — 戦槌・八枚フランジ                                             */
/* =================================================================== */
function buildMace(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const cx = b.centerX;
  const cz = b.centerZ;
  const grip = Math.max(8, cfg.handleLength);

  let y = buildHilt(ctx, { grip, width: 3 });

  // reinforced collar
  b.cxBox("mace_collar", y, 5, 2.4, 5, "accent", { group: "Guard" });
  y += 2.4;

  // --- head core ---
  const headH = Math.max(8, cfg.bladeLength * 0.7);
  const headR = Math.max(3.4, cfg.bladeWidth * 0.55 + 1.5);
  b.cxBox("mace_head_core", y, headR * 1.5, headH, headR * 1.5, "primary", {
    group: "Head",
    tint: 4,
  });

  // --- 8 radial flanges ---
  const flanges = 8;
  for (let i = 0; i < flanges; i++) {
    const a = (i / flanges) * Math.PI * 2;
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    for (let s = 1; s <= 3; s++) {
      const reach = headR * 0.75 + s * 1.2;
      const shrink = 1 - s * 0.18;
      b.box(
        `mace_flange_${i}_${s}`,
        [cx + dx * reach - 1.1 * shrink, y + 1 + s * 0.3, cz + dz * reach - 1.1 * shrink],
        [cx + dx * reach + 1.1 * shrink, y + headH - 1 - s * 0.3, cz + dz * reach + 1.1 * shrink],
        s === 3 ? "accent" : "secondary",
        { group: "Head", tint: s * 5 }
      );
    }
    // piercing spike at the flange tip
    b.spike(
      `mace_spike_${i}`,
      cx + dx * (headR * 0.75 + 4.4),
      y + headH * 0.45,
      cz + dz * (headR * 0.75 + 4.4),
      2,
      3.6,
      "bone",
      { group: "Head", layers: 3 }
    );
  }

  // --- gem bands ---
  if (cfg.hasCoreGem) {
    b.ring("mace_gem_band", y + headH * 0.42, headR * 0.95, 1.2, "gem", {
      group: "Core",
      segments: 10,
      height: 2.2,
    });
  }

  // --- crown spike ---
  b.cxBox("mace_crown", y + headH, headR * 1.2, 1.6, headR * 1.2, "secondary", { group: "Head" });
  b.spike("mace_apex", cx, y + headH + 1.6, cz, 3.4, 6.5, "accent", { group: "Head", layers: 5 });

  buildChains(ctx, y - 1);
}

/* =================================================================== */
/* ORNATE SPEAR — めちゃくちゃ装飾を付けた儀礼大槍                        */
/* =================================================================== */
function buildOrnateSpear(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const cx = b.centerX;
  const cz = b.centerZ;
  const shaftLen = Math.max(16, cfg.handleLength);

  // --- butt spike & counterweight ---
  b.spike("os_butt", cx, -2.5, cz, 3.2, 4.5, "secondary", { group: "Shaft", layers: 3 });
  b.cxBox("os_counterweight", 1.5, 4.2, 3.2, 4.2, "accent", { group: "Shaft" });
  b.ring("os_butt_ring", 1.2, 2.6, 0.7, "gem", { group: "Shaft", segments: 8, height: 0.9 });

  // --- shaft with layered decorative rings ---
  let y = 4.7;
  const shaftEnd = y + shaftLen;
  for (let sy = y; sy < shaftEnd; sy += 2) {
    const idx = Math.round((sy - y) / 2);
    b.cxBox(`os_shaft_${idx}`, sy, 2.6, 2, 2.6, idx % 2 ? "wood" : "cloth", {
      group: "Shaft",
      tint: idx % 2 ? -8 : -2,
    });
    // ornate ring every other segment
    if (idx % 2 === 0) {
      b.cxBox(`os_ring_${idx}`, sy + 0.4, 3.9, 1.2, 3.9, "accent", { group: "Shaft" });
      // four studs on the ring
      for (let p = 0; p < 4; p++) {
        const a = (p / 4) * Math.PI * 2 + idx * 0.4;
        b.box(
          `os_stud_${idx}_${p}`,
          [cx + Math.cos(a) * 2.1 - 0.45, sy + 0.5, cz + Math.sin(a) * 2.1 - 0.45],
          [cx + Math.cos(a) * 2.1 + 0.45, sy + 1.4, cz + Math.sin(a) * 2.1 + 0.45],
          "gem",
          { group: "Ornament" }
        );
      }
    }
    // engraved filigree
    if (cfg.hasRunicEngravings && idx % 3 === 1) {
      b.cxBox(`os_filigree_${idx}`, sy + 0.3, 3.1, 1.4, 3.1, "bone", {
        group: "Shaft",
        tint: -12,
      });
    }
  }
  y = shaftEnd;

  // --- grand collar assembly (3 stacked tiers) ---
  const collarW = Math.max(7, cfg.crossguardWidth);
  for (let t = 0; t < 3; t++) {
    const w = collarW * (1 - t * 0.2);
    b.cxBox(`os_collar_${t}`, y + t * 2.2, w, 2, w * 0.45, t === 1 ? "accent" : "primary", {
      group: "Guard",
      tint: t * 6,
    });
  }
  // lateral wing fins
  b.mirror((side) => {
    for (let f = 0; f < 4; f++) {
      b.box(
        `os_wing_${side}_${f}`,
        [cx + side * (2.4 + f * 1.5), y + 1 + f * 1.2, cz - 0.6],
        [cx + side * (3.9 + f * 1.7), y + 4.4 + f * 1.5, cz + 0.6],
        f === 3 ? "gem" : "bone",
        { group: "Guard", tint: -f * 5 }
      );
    }
    // curved side prongs
    b.spike(
      `os_prong_${side}`,
      cx + side * (collarW * 0.46),
      y + 6,
      cz,
      2.4,
      7,
      "accent",
      { group: "Guard", layers: 5 }
    );
  });

  // central gem throne
  if (cfg.hasCoreGem) {
    const g = Math.max(3, cfg.coreGemSize);
    b.cxBox("os_throne_gem", y + 2, g, g, g * 0.8, "gem", { group: "Core" });
    b.ring("os_throne_ring", y + 2.2, g * 0.9, 0.8, "glow", {
      group: "Core",
      segments: 10,
      height: g * 0.7,
    });
  }

  y += 7;

  // --- leaf spearhead ---
  const headLen = Math.max(10, cfg.bladeLength);
  const halfW = Math.max(2, cfg.bladeWidth * 0.75);
  const segs = Math.max(5, Math.round(headLen / 2));
  const segH = headLen / segs;

  for (let s = 0; s < segs; s++) {
    const t = s / (segs - 1);
    const swell = Math.sin(Math.PI * (0.16 + t * 0.78));
    const w = Math.max(0.9, halfW * swell * 1.2);
    b.box(
      `os_head_${s}`,
      [cx - w, y + s * segH, cz - 1],
      [cx + w, y + (s + 1) * segH, cz + 1],
      s % 2 ? "primary" : "secondary",
      { group: "Blade", tint: s % 2 ? 0 : 8 }
    );
    // central ridge
    b.box(
      `os_ridge_${s}`,
      [cx - 0.45, y + s * segH, cz - 1.3],
      [cx + 0.45, y + (s + 1) * segH, cz + 1.3],
      "gem",
      { group: "Blade" }
    );
    // side barbs
    if (s % 2 === 1 && s < segs - 2) {
      b.mirror((side) => {
        b.box(
          `os_barb_${side}_${s}`,
          [cx + side * w, y + s * segH + 0.3, cz - 0.4],
          [cx + side * (w + 1.5), y + s * segH + segH * 0.7, cz + 0.4],
          "accent",
          { group: "Blade" }
        );
      });
    }
  }
  b.spike("os_apex", cx, y + headLen, cz, halfW * 1.6, 6, "glow", { group: "Blade", layers: 5 });

  buildChains(ctx, y - 3);
}

/* =================================================================== */
/* SCEPTER — 王笏（宝冠の爪が巨大宝玉を抱く）                             */
/* =================================================================== */
function buildScepter(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const cx = b.centerX;
  const cz = b.centerZ;

  let y = buildHilt(ctx, { grip: Math.max(7, cfg.handleLength), width: 2.6, wrapColor: "accent" });

  // tiered collar
  for (let t = 0; t < 3; t++) {
    b.cxBox(`sc_collar_${t}`, y + t * 1.5, 5.4 - t * 0.9, 1.4, 5.4 - t * 0.9, t === 1 ? "gem" : "accent", {
      group: "Guard",
      tint: t * 5,
    });
  }
  y += 4.5;

  // --- crown claws cradling the orb ---
  const orbR = Math.max(3, cfg.coreGemSize * 0.85);
  const orbY = y + orbR + 2.5;
  const claws = 5;
  for (let i = 0; i < claws; i++) {
    const a = (i / claws) * Math.PI * 2;
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    for (let s = 0; s < 4; s++) {
      const curl = Math.sin((s / 3) * Math.PI * 0.6);
      const r = orbR * 1.05 + 0.4 - curl * 1.4;
      b.box(
        `sc_claw_${i}_${s}`,
        [cx + dx * r - 0.6, y + s * 2, cz + dz * r - 0.6],
        [cx + dx * r + 0.6, y + s * 2 + 2.2, cz + dz * r + 0.6],
        s === 3 ? "gem" : "primary",
        { group: "Head", tint: s * 4 }
      );
    }
    b.spike(
      `sc_claw_tip_${i}`,
      cx + dx * orbR * 0.55,
      y + 8,
      cz + dz * orbR * 0.55,
      1.4,
      3,
      "accent",
      { group: "Head", layers: 3 }
    );
  }

  // --- the great orb ---
  b.cxBox("sc_orb", orbY - orbR, orbR * 1.7, orbR * 1.7, orbR * 1.7, "gem", { group: "Core" });
  b.cxBox("sc_orb_core", orbY - orbR * 0.45, orbR * 0.9, orbR * 0.9, orbR * 0.9, "glow", {
    group: "Core",
    tint: 12,
  });

  // --- prism array orbiting the orb ---
  if (cfg.hasPrismArray) {
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * Math.PI * 2;
      const px = cx + Math.cos(a) * (orbR + 2.8);
      const pz = cz + Math.sin(a) * (orbR + 2.8);
      b.box(
        `sc_prism_${p}`,
        [px - 0.7, orbY - 2.2, pz - 0.7],
        [px + 0.7, orbY + 2.2, pz + 0.7],
        p % 2 ? "glow" : "gem",
        { group: "Floating" }
      );
      b.spike(`sc_prism_tip_${p}`, px, orbY + 2.2, pz, 1.2, 2, "accent", {
        group: "Floating",
        layers: 2,
      });
    }
  }

  // --- halo ring + apex finial ---
  b.ring("sc_halo", orbY + orbR + 1.5, orbR + 2, 0.8, "glow", {
    group: "Halo",
    segments: 14,
    height: 0.8,
  });
  b.spike("sc_finial", cx, orbY + orbR + 2.4, cz, 2.6, 6, "accent", { group: "Head", layers: 4 });

  buildChains(ctx, y);
}

/* =================================================================== */
/* CROSSBOW — 機械式魔導弩                                               */
/* =================================================================== */
function buildCrossbow(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const cx = b.centerX;
  const cz = b.centerZ;
  const axisY = 10;
  const stockLen = Math.max(16, cfg.bladeLength);

  // --- stock ---
  for (let i = 0; i < stockLen; i += 2) {
    b.box(
      `cb_stock_${i}`,
      [cx - 1.8, axisY - 1.8, cz - 8 + i],
      [cx + 1.8, axisY + 1.8, cz - 6 + i],
      i % 4 === 0 ? "wood" : "secondary",
      { group: "Breech", tint: i % 4 === 0 ? 0 : -8 }
    );
  }
  // butt plate
  b.box("cb_butt", [cx - 2.4, axisY - 3.4, cz - 9.4], [cx + 2.4, axisY + 2.6, cz - 8], "cloth", {
    group: "Breech",
    tint: -14,
  });

  // --- grip + trigger ---
  for (let i = 0; i < 6; i++) {
    b.box(
      `cb_grip_${i}`,
      [cx - 1.4, axisY - 2 - i, cz - 4 - i * 0.25],
      [cx + 1.4, axisY - 1 - i, cz - 1.6 - i * 0.25],
      i % 2 ? "cloth" : "wood",
      { group: "Hilt", tint: -10 }
    );
  }
  b.box("cb_trigger", [cx - 0.5, axisY - 3.6, cz - 1.8], [cx + 0.5, axisY - 2.2, cz - 1], "accent", {
    group: "Hilt",
  });

  // --- prod (limbs) ---
  const limbSpan = Math.max(9, cfg.crossguardWidth);
  const limbZ = cz + stockLen - 9;
  b.box("cb_riser", [cx - 3, axisY - 2.4, limbZ - 1.6], [cx + 3, axisY + 2.4, limbZ + 1.6], "primary", {
    group: "Head",
  });
  b.mirror((side) => {
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      const lx = cx + side * (3 + t * limbSpan);
      const lz = limbZ - t * t * 3.5;
      const w = 1.5 * (1 - t * 0.45);
      b.box(
        `cb_limb_${side}_${i}`,
        [lx - w, axisY - 1.2 + t * 0.4, lz - 0.9],
        [lx + w, axisY + 1.2 - t * 0.4, lz + 0.9],
        i % 2 ? "accent" : "secondary",
        { group: "Head", tint: -i * 3 }
      );
    }
    b.spike(
      `cb_limb_tip_${side}`,
      cx + side * (3 + limbSpan),
      axisY,
      limbZ - 3.5,
      1.8,
      2.6,
      "gem",
      { group: "Head", layers: 2 }
    );
  });

  // --- string (drawn back to the nut) ---
  const nutZ = cz + 1;
  b.strand(
    "cb_string_L",
    Array.from({ length: 7 }, (_, i) => {
      const t = i / 6;
      return [
        cx - (3 + limbSpan) * (1 - t),
        axisY,
        limbZ - 3.5 + (nutZ - (limbZ - 3.5)) * t,
      ] as [number, number, number];
    }),
    0.5,
    "glow",
    { group: "Chain" }
  );
  b.strand(
    "cb_string_R",
    Array.from({ length: 7 }, (_, i) => {
      const t = i / 6;
      return [
        cx + (3 + limbSpan) * (1 - t),
        axisY,
        limbZ - 3.5 + (nutZ - (limbZ - 3.5)) * t,
      ] as [number, number, number];
    }),
    0.5,
    "glow",
    { group: "Chain" }
  );

  // --- loaded bolt ---
  b.box("cb_bolt", [cx - 0.5, axisY + 1.8, nutZ], [cx + 0.5, axisY + 2.8, limbZ + 3], "bone", {
    group: "Magazine",
  });
  b.spike("cb_bolt_head", cx, axisY + 1.9, limbZ + 3, 1.6, 2.6, "accent", {
    group: "Magazine",
    layers: 2,
  });
  b.mirror((side) => {
    b.box(
      `cb_fletch_${side}`,
      [cx + side * 0.5, axisY + 1.6, nutZ + 0.4],
      [cx + side * 1.6, axisY + 3, nutZ + 2.4],
      "cloth",
      { group: "Magazine", tint: 10 }
    );
  });

  // --- mana core / windlass ---
  if (cfg.hasCoreGem) {
    const g = Math.max(2.4, cfg.coreGemSize * 0.8);
    b.box(
      "cb_core",
      [cx - g / 2, axisY + 1.8, cz - 5],
      [cx + g / 2, axisY + 1.8 + g, cz - 2.6],
      "gem",
      { group: "Core" }
    );
  }

  if (cfg.hasScope) {
    b.box("cb_scope", [cx - 1.3, axisY + 2.2, cz - 4], [cx + 1.3, axisY + 5, cz + 1.6], "primary", {
      group: "Breech",
      tint: -14,
    });
    b.box("cb_scope_lens", [cx - 1, axisY + 2.6, cz + 1.6], [cx + 1, axisY + 4.6, cz + 2.2], "gem", {
      group: "Breech",
    });
  }
}

export const MACHINE_BUILDERS: Record<string, (ctx: GenCtx) => void> = {
  chainsaw: buildChainsaw,
  gun: buildGun,
  railgun: buildRailgun,
  mace: buildMace,
  spear_ornate: buildOrnateSpear,
  scepter: buildScepter,
  crossbow: buildCrossbow,
};
