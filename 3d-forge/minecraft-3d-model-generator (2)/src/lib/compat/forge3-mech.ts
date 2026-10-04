import type { ArchetypeParams, CuboidElement, ElementMotion } from "../compat/forge3-types";
import type { BoxGroup, RawBoxSpec } from "./forge3-voxel";

type Vec3 = [number, number, number];
type Role = CuboidElement["materialRole"];

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildGunbladeDrafts(
  cx: number,
  cz: number,
  params: ArchetypeParams
): RawBoxSpec[] {
  const drafts: RawBoxSpec[] = [];
  const depth = Math.max(0.8, Math.min(3.0, params.voxelDepth));
  const halfD = depth / 2;
  const bladeLen = Math.max(12, params.bladeLength);
  const bladeW = Math.max(2.4, params.bladeWidth);

  const add = (spec: RawBoxSpec) => {
    drafts.push({
      ...spec,
      from: [r2(spec.from[0]), r2(spec.from[1]), r2(spec.from[2])],
      to: [r2(spec.to[0]), r2(spec.to[1]), r2(spec.to[2])],
      origin: spec.origin
        ? [r2(spec.origin[0]), r2(spec.origin[1]), r2(spec.origin[2])]
        : [
            r2((spec.from[0] + spec.to[0]) / 2),
            r2((spec.from[1] + spec.to[1]) / 2),
            r2((spec.from[2] + spec.to[2]) / 2),
          ],
      rotation: spec.rotation ?? { axis: "z", angle: 0 },
    });
  };

  // 1. Pistol-Grip & Trigger Handle (Offset angle for gunblade feel)
  const gripStartY = 2.0;
  const gripH = 4.2;
  add({
    id: "gb_grip_frame",
    name: "Gunblade Grip Frame",
    group: "grip",
    from: [cx - 0.7, gripStartY, cz - halfD * 0.8],
    to: [cx + 0.7, gripStartY + gripH, cz + halfD * 0.8],
    origin: [cx, gripStartY + gripH / 2, cz],
    rotation: { axis: "z", angle: -10 },
    materialRole: "handle",
  });

  // Grip finger indent plates & metallic backstrap
  add({
    id: "gb_backstrap",
    name: "Ergonomic Backstrap",
    group: "grip",
    from: [cx - 0.95, gripStartY + 0.4, cz - halfD * 0.9],
    to: [cx - 0.55, gripStartY + gripH - 0.4, cz + halfD * 0.9],
    origin: [cx, gripStartY + gripH / 2, cz],
    rotation: { axis: "z", angle: -10 },
    materialRole: "trim",
  });

  // Trigger Guard & Trigger
  add({
    id: "gb_trigger_guard",
    name: "Trigger Guard Bow",
    group: "guard",
    from: [cx + 0.5, gripStartY + 1.2, cz - 0.35],
    to: [cx + 1.8, gripStartY + 3.2, cz + 0.35],
    materialRole: "trim",
  });
  add({
    id: "gb_trigger",
    name: "Mechanical Trigger",
    group: "detail",
    from: [cx + 0.7, gripStartY + 2.0, cz - 0.25],
    to: [cx + 1.3, gripStartY + 2.7, cz + 0.25],
    rotation: { axis: "z", angle: 15 },
    materialRole: "edge",
  });

  // 2. Revolver Cylinder Mechanism (Transforms / Rotates during fire)
  const cylY = gripStartY + gripH + 0.4;
  const cylR = 1.6;
  add({
    id: "gb_cylinder_core",
    name: "Revolver Cylinder Core",
    group: "detail",
    from: [cx - cylR, cylY - cylR, cz - halfD * 1.3],
    to: [cx + cylR, cylY + cylR, cz + halfD * 1.3],
    origin: [cx, cylY, cz],
    rotation: { axis: "z", angle: 45 },
    materialRole: "primary",
    motion: {
      rig: "transform_slide",
      orbitTurns: 0,
      bob: 0,
      phase: 0,
      pulse: true,
      loopSeconds: 3,
      transformDelta: {
        rotation: [0, 0, 180], // Cylinder spins on transform!
      },
    },
  });

  // 6 Cylinder Chamber Flutes
  for (let c = 0; c < 6; c++) {
    const ang = (c / 6) * Math.PI * 2;
    const fx = cx + Math.cos(ang) * (cylR * 0.65);
    const fy = cylY + Math.sin(ang) * (cylR * 0.65);
    add({
      id: `gb_cylinder_chamber_${c + 1}`,
      name: `Chamber Cell #${c + 1}`,
      group: "detail",
      from: [fx - 0.32, fy - 0.32, cz - halfD * 1.4],
      to: [fx + 0.32, fy + 0.32, cz + halfD * 1.4],
      origin: [cx, cylY, cz],
      materialRole: c === 0 ? "core" : "edge",
      motion: {
        rig: "transform_slide",
        orbitTurns: 0,
        bob: 0,
        phase: 0,
        pulse: false,
        loopSeconds: 3,
        transformDelta: {
          rotation: [0, 0, 180],
        },
      },
    });
  }

  // 3. Receiver & Breech Block
  const receiverH = 3.6;
  add({
    id: "gb_receiver_block",
    name: "Reinforced Breech Receiver",
    group: "guard",
    from: [cx - 1.9, cylY - 0.5, cz - halfD * 1.15],
    to: [cx + 2.0, cylY + receiverH, cz + halfD * 1.15],
    materialRole: "trim",
  });

  // 4. Kinetic Gun Barrel (Transforms: Slides Forward in Gun Mode!)
  const barrelStartY = cylY + receiverH - 0.2;
  const barrelLen = bladeLen * 0.75;
  add({
    id: "gb_rifle_barrel",
    name: "Heavy Caliber Rifled Barrel",
    group: "blade",
    from: [cx - 0.6, barrelStartY, cz - 0.6],
    to: [cx + 0.6, barrelStartY + barrelLen, cz + 0.6],
    origin: [cx, barrelStartY, cz],
    materialRole: "edge",
    motion: {
      rig: "transform_barrel",
      orbitTurns: 0,
      bob: 0,
      phase: 0,
      pulse: true,
      loopSeconds: 3,
      transformDelta: {
        translation: [0, 2.2, 0], // Slides forward 2.2 voxels!
      },
    },
  });

  // Muzzle Brake / Flash Hider
  add({
    id: "gb_muzzle_brake",
    name: "Aggressive Muzzle Brake",
    group: "blade",
    from: [cx - 0.85, barrelStartY + barrelLen - 0.4, cz - 0.85],
    to: [cx + 0.85, barrelStartY + barrelLen + 1.2, cz + 0.85],
    origin: [cx, barrelStartY + barrelLen, cz],
    rotation: { axis: "y", angle: 45 },
    materialRole: "core",
    motion: {
      rig: "transform_barrel",
      orbitTurns: 0,
      bob: 0,
      phase: 0,
      pulse: true,
      loopSeconds: 3,
      transformDelta: {
        translation: [0, 2.2, 0],
      },
    },
  });

  // 5. Heavy Slashing Blade (Transforms: Upper vents pop out!)
  const bladeStartY = cylY + receiverH;
  const bHalfW = bladeW / 2;

  // Blade Main Spine & Cutting Edge
  add({
    id: "gb_blade_spine",
    name: "Reinforced Gunblade Spine",
    group: "blade",
    from: [cx - bHalfW * 0.4, bladeStartY, cz - halfD * 0.7],
    to: [cx + bHalfW * 0.4, bladeStartY + bladeLen, cz + halfD * 0.7],
    materialRole: "primary",
  });

  // Outer Razor Edge
  add({
    id: "gb_razor_edge",
    name: "Monofilament Edge Bevel",
    group: "blade",
    from: [cx + bHalfW * 0.35, bladeStartY + 0.4, cz - halfD * 0.4],
    to: [cx + bHalfW + 0.4, bladeStartY + bladeLen - 0.8, cz + halfD * 0.4],
    materialRole: "edge",
  });

  // Transformable Heat-Sink Radiator Fins (Vents pop open when transformed!)
  for (let f = 0; f < 3; f++) {
    const fy = bladeStartY + 1.5 + f * 2.8;
    add({
      id: `gb_heat_vent_${f + 1}`,
      name: `Heat Radiator Vent #${f + 1}`,
      group: "detail",
      from: [cx - bHalfW - 0.4, fy, cz - halfD * 0.85],
      to: [cx - bHalfW * 0.35, fy + 1.6, cz + halfD * 0.85],
      origin: [cx - bHalfW * 0.35, fy, cz],
      rotation: { axis: "z", angle: -12 },
      materialRole: "trim",
      motion: {
        rig: "transform_vent",
        orbitTurns: 0,
        bob: 0,
        phase: 0,
        pulse: true,
        loopSeconds: 3,
        transformDelta: {
          translation: [-0.9, 0, 0],
          rotation: [0, 0, -25], // Opens wide 25° for cooling!
        },
      },
    });
  }

  // Energy Power Conduit / Linear Plasma Rail
  add({
    id: "gb_plasma_core_rail",
    name: "Superheated Plasma Rail",
    group: "detail",
    from: [cx - 0.28, bladeStartY + 0.6, cz - halfD * 0.95],
    to: [cx + 0.28, bladeStartY + bladeLen * 0.85, cz + halfD * 0.95],
    materialRole: "core",
  });

  // Blade Point Apex
  add({
    id: "gb_blade_tip",
    name: "Tanto Armor-Piercer Tip",
    group: "blade",
    from: [cx - 0.5, bladeStartY + bladeLen - 0.5, cz - halfD * 0.4],
    to: [cx + bHalfW * 0.6, bladeStartY + bladeLen + 2.4, cz + halfD * 0.4],
    rotation: { axis: "z", angle: -25 },
    materialRole: "edge",
  });

  return drafts;
}

export function buildRailCannonDrafts(
  cx: number,
  cz: number,
  params: ArchetypeParams
): RawBoxSpec[] {
  const drafts: RawBoxSpec[] = [];
  const depth = Math.max(1.2, Math.min(3.4, params.voxelDepth));
  const barrelLen = Math.max(14, params.bladeLength + 2.0);
  const railSpan = Math.max(3.6, params.bladeWidth * 1.1);

  const add = (spec: RawBoxSpec) => {
    drafts.push({
      ...spec,
      from: [r2(spec.from[0]), r2(spec.from[1]), r2(spec.from[2])],
      to: [r2(spec.to[0]), r2(spec.to[1]), r2(spec.to[2])],
      origin: spec.origin
        ? [r2(spec.origin[0]), r2(spec.origin[1]), r2(spec.origin[2])]
        : [
            r2((spec.from[0] + spec.to[0]) / 2),
            r2((spec.from[1] + spec.to[1]) / 2),
            r2((spec.from[2] + spec.to[2]) / 2),
          ],
      rotation: spec.rotation ?? { axis: "z", angle: 0 },
    });
  };

  // 1. Heavy Stock & Breech Engine
  const stockStartY = 1.5;
  add({
    id: "rc_stock_butt",
    name: "Counterweight Shock Stock",
    group: "shaft",
    from: [cx - 1.8, stockStartY, cz - depth * 0.7],
    to: [cx + 1.8, stockStartY + 3.5, cz + depth * 0.7],
    materialRole: "handle",
  });

  // Twin Grip Rails for 2-handed brace
  add({
    id: "rc_rear_grip",
    name: "Rear Heavy Grip",
    group: "grip",
    from: [cx - 0.7, stockStartY + 3.2, cz - 0.7],
    to: [cx + 0.7, stockStartY + 6.8, cz + 0.7],
    materialRole: "handle",
  });

  // Fusion Generator Chamber & Glowing Energy Coil
  const fusionY = stockStartY + 6.5;
  add({
    id: "rc_fusion_core_housing",
    name: "Fusion Accelerator Core",
    group: "head",
    from: [cx - 2.4, fusionY, cz - depth * 0.85],
    to: [cx + 2.4, fusionY + 4.2, cz + depth * 0.85],
    materialRole: "trim",
  });

  // Pulsing Plasma Reactor Window
  add({
    id: "rc_reactor_core",
    name: "Magnetic Containment Core",
    group: "detail",
    from: [cx - 1.4, fusionY + 0.8, cz - depth * 1.05],
    to: [cx + 1.4, fusionY + 3.4, cz + depth * 1.05],
    origin: [cx, fusionY + 2.1, cz],
    rotation: { axis: "z", angle: 45 },
    materialRole: "core",
  });

  // Forward Foregrip Assembly
  add({
    id: "rc_foregrip_bar",
    name: "Foregrip Handle Mount",
    group: "guard",
    from: [cx - 2.8, fusionY + 3.0, cz - 0.6],
    to: [cx - 1.8, fusionY + 5.2, cz + 0.6],
    materialRole: "handle",
  });

  // 2. Twin Superconducting Accelerator Rails (TRANSFORM: Spread outwards on overdrive!)
  const railStartY = fusionY + 4.0;
  const halfSpan = railSpan / 2;

  // Left Magnetic Rail
  add({
    id: "rc_accel_rail_left",
    name: "Accelerator Rail Alpha (Left)",
    group: "blade",
    from: [cx - halfSpan - 0.9, railStartY, cz - depth * 0.55],
    to: [cx - halfSpan + 0.9, railStartY + barrelLen, cz + depth * 0.55],
    origin: [cx - halfSpan, railStartY + 1.0, cz],
    materialRole: "primary",
    motion: {
      rig: "transform_slide",
      orbitTurns: 0,
      bob: 0,
      phase: 0,
      pulse: true,
      loopSeconds: 3.5,
      transformDelta: {
        translation: [-1.4, 0, 0], // Spreads left in Full-Burst Mode!
        rotation: [0, 0, -8],
      },
    },
  });

  // Right Magnetic Rail
  add({
    id: "rc_accel_rail_right",
    name: "Accelerator Rail Beta (Right)",
    group: "blade",
    from: [cx + halfSpan - 0.9, railStartY, cz - depth * 0.55],
    to: [cx + halfSpan + 0.9, railStartY + barrelLen, cz + depth * 0.55],
    origin: [cx + halfSpan, railStartY + 1.0, cz],
    materialRole: "primary",
    motion: {
      rig: "transform_slide",
      orbitTurns: 0,
      bob: 0,
      phase: 0,
      pulse: true,
      loopSeconds: 3.5,
      transformDelta: {
        translation: [1.4, 0, 0], // Spreads right!
        rotation: [0, 0, 8],
      },
    },
  });

  // Inner Electromagnetic Coils (Lining inside the rails)
  for (let c = 0; c < 4; c++) {
    const cy = railStartY + 1.5 + c * (barrelLen / 4.2);
    // Left Coil Node
    add({
      id: `rc_mag_node_l_${c + 1}`,
      name: `Magnetic Induction Node L#${c + 1}`,
      group: "detail",
      from: [cx - halfSpan + 0.5, cy, cz - depth * 0.35],
      to: [cx - halfSpan + 1.1, cy + 1.4, cz + depth * 0.35],
      origin: [cx - halfSpan, cy, cz],
      materialRole: "core",
      motion: {
        rig: "transform_slide",
        orbitTurns: 0,
        bob: 0,
        phase: 0,
        pulse: true,
        loopSeconds: 3.5,
        transformDelta: { translation: [-1.4, 0, 0] },
      },
    });
    // Right Coil Node
    add({
      id: `rc_mag_node_r_${c + 1}`,
      name: `Magnetic Induction Node R#${c + 1}`,
      group: "detail",
      from: [cx + halfSpan - 1.1, cy, cz - depth * 0.35],
      to: [cx + halfSpan - 0.5, cy + 1.4, cz + depth * 0.35],
      origin: [cx + halfSpan, cy, cz],
      materialRole: "core",
      motion: {
        rig: "transform_slide",
        orbitTurns: 0,
        bob: 0,
        phase: 0,
        pulse: true,
        loopSeconds: 3.5,
        transformDelta: { translation: [1.4, 0, 0] },
      },
    });
  }

  // 3. Central Hyper-Particle Linear Core (TRANSFORMS: Slides forward on full burst!)
  add({
    id: "rc_linear_emitter_core",
    name: "Linear Particle Emitter",
    group: "head",
    from: [cx - 0.65, railStartY + 0.5, cz - 0.65],
    to: [cx + 0.65, railStartY + barrelLen - 1.5, cz + 0.65],
    origin: [cx, railStartY, cz],
    materialRole: "core",
    motion: {
      rig: "transform_barrel",
      orbitTurns: 0,
      bob: 0,
      phase: 0,
      pulse: true,
      loopSeconds: 3.5,
      transformDelta: {
        translation: [0, 2.8, 0], // Thrusts forward through rails!
      },
    },
  });

  // 4. Overclock Heat-Sink Radiator Wings (Deploy laterally on transform)
  for (const side of [-1, 1] as const) {
    const sName = side === -1 ? "Left" : "Right";
    add({
      id: `rc_radiator_wing_${sName.toLowerCase()}`,
      name: `Radiator Cooling Wing (${sName})`,
      group: "guard",
      from: [
        side === -1 ? cx - halfSpan - 2.4 : cx + halfSpan + 0.6,
        railStartY + 1.2,
        cz - 0.3,
      ],
      to: [
        side === -1 ? cx - halfSpan - 0.6 : cx + halfSpan + 2.4,
        railStartY + 5.5,
        cz + 0.3,
      ],
      origin: [side === -1 ? cx - halfSpan : cx + halfSpan, railStartY + 1.5, cz],
      rotation: { axis: "y", angle: side * 15 },
      materialRole: "trim",
      motion: {
        rig: "transform_vent",
        orbitTurns: 0,
        bob: 0,
        phase: 0,
        pulse: true,
        loopSeconds: 3.5,
        transformDelta: {
          rotation: [0, side * 35, side * 15], // Wings fan out wide!
        },
      },
    });
  }

  // Muzzle Arc Stabilizer Ring at tip
  add({
    id: "rc_muzzle_corona",
    name: "Magnetic Corona Field Ring",
    group: "detail",
    from: [cx - halfSpan * 0.9, railStartY + barrelLen - 0.6, cz - depth * 0.45],
    to: [cx + halfSpan * 0.9, railStartY + barrelLen + 0.8, cz + depth * 0.45],
    materialRole: "gem",
  });

  return drafts;
}

export function buildChainsawBladeDrafts(
  cx: number,
  cz: number,
  params: ArchetypeParams
): RawBoxSpec[] {
  const drafts: RawBoxSpec[] = [];
  const depth = Math.max(1.4, Math.min(3.2, params.voxelDepth));
  const barLen = Math.max(13, params.bladeLength);
  const barW = Math.max(3.2, params.bladeWidth * 1.05);

  const add = (spec: RawBoxSpec) => {
    drafts.push({
      ...spec,
      from: [r2(spec.from[0]), r2(spec.from[1]), r2(spec.from[2])],
      to: [r2(spec.to[0]), r2(spec.to[1]), r2(spec.to[2])],
      origin: spec.origin
        ? [r2(spec.origin[0]), r2(spec.origin[1]), r2(spec.origin[2])]
        : [
            r2((spec.from[0] + spec.to[0]) / 2),
            r2((spec.from[1] + spec.to[1]) / 2),
            r2((spec.from[2] + spec.to[2]) / 2),
          ],
      rotation: spec.rotation ?? { axis: "z", angle: 0 },
    });
  };

  // 1. Two-Handed Rear Grip & Throttle Handle
  const rearGripY = 1.2;
  add({
    id: "cs_throttle_grip",
    name: "Heavy Throttle Grip",
    group: "grip",
    from: [cx - 0.75, rearGripY, cz - 0.75],
    to: [cx + 0.75, rearGripY + 4.2, cz + 0.75],
    materialRole: "handle",
  });
  // Handguard Knuckle Loop
  add({
    id: "cs_handguard_cage",
    name: "Full Wrap Knuckle Cage",
    group: "guard",
    from: [cx - 1.6, rearGripY + 0.5, cz - 0.4],
    to: [cx - 0.6, rearGripY + 4.0, cz + 0.4],
    materialRole: "trim",
  });

  // 2. High-RPM Engine Block & Exhaust Stacks
  const engineY = rearGripY + 4.0;
  const engineW = 4.2;
  const engineH = 4.4;
  add({
    id: "cs_motor_crankcase",
    name: "Turbo Motor Crankcase",
    group: "head",
    from: [cx - engineW / 2, engineY, cz - depth * 0.8],
    to: [cx + engineW / 2, engineY + engineH, cz + depth * 0.8],
    materialRole: "primary",
  });

  // Twin Exhaust Pipes (Transforms: Vents plume smoke / glow!)
  add({
    id: "cs_exhaust_stack_l",
    name: "Exhaust Header Left",
    group: "detail",
    from: [cx - engineW / 2 - 0.8, engineY + 1.2, cz - 0.5],
    to: [cx - engineW / 2 + 0.1, engineY + 3.8, cz + 0.5],
    rotation: { axis: "z", angle: 25 },
    materialRole: "edge",
  });
  add({
    id: "cs_exhaust_stack_r",
    name: "Exhaust Header Right",
    group: "detail",
    from: [cx + engineW / 2 - 0.1, engineY + 1.2, cz - 0.5],
    to: [cx + engineW / 2 + 0.8, engineY + 3.8, cz + 0.5],
    rotation: { axis: "z", angle: -25 },
    materialRole: "edge",
  });

  // Starter Cord Pull Ring
  add({
    id: "cs_pull_cord_ring",
    name: "T-Handle Recoil Starter",
    group: "detail",
    from: [cx - 0.9, engineY + 0.6, cz + depth * 0.75],
    to: [cx + 0.9, engineY + 1.8, cz + depth * 1.15],
    materialRole: "trim",
  });

  // Top Bale Handle for Control
  add({
    id: "cs_top_bale_handle",
    name: "Tubular Top Bale Handle",
    group: "guard",
    from: [cx - engineW / 2 - 0.6, engineY + engineH - 0.4, cz - depth * 0.9],
    to: [cx + engineW / 2 + 0.6, engineY + engineH + 1.4, cz - depth * 0.4],
    materialRole: "handle",
  });

  // 3. Chain Guide Bar (TRANSFORMS: V-Split Jaw Expansion in Overdrive!)
  const barStartY = engineY + engineH;
  const halfBarW = barW / 2;

  // Central Guide Bar Core (Heavy Steel Plate)
  add({
    id: "cs_guide_bar_core",
    name: "Armor-Plate Guide Bar",
    group: "blade",
    from: [cx - halfBarW * 0.75, barStartY, cz - depth * 0.4],
    to: [cx + halfBarW * 0.75, barStartY + barLen, cz + depth * 0.4],
    materialRole: "primary",
  });

  // Guide Bar Center Lubrication Channel & Glowing Plasma Rail
  add({
    id: "cs_lube_groove_core",
    name: "Overclock Hyper-Coolant Channel",
    group: "detail",
    from: [cx - 0.35, barStartY + 0.8, cz - depth * 0.55],
    to: [cx + 0.35, barStartY + barLen - 1.2, cz + depth * 0.55],
    materialRole: "core",
  });

  // 4. Stepped Chainsaw Teeth (Serrated Teeth Running Around the Edge)
  // Left Teeth Track
  const toothCount = Math.max(5, Math.floor(barLen / 1.8));
  for (let t = 0; t < toothCount; t++) {
    const ty = barStartY + 0.6 + t * (barLen / toothCount);
    // Left Rip Tooth
    add({
      id: `cs_tooth_l_${t + 1}`,
      name: `Tungsten-Carbide Tooth L#${t + 1}`,
      group: "blade",
      from: [cx - halfBarW - 0.75, ty, cz - depth * 0.3],
      to: [cx - halfBarW + 0.1, ty + 1.0, cz + depth * 0.3],
      origin: [cx - halfBarW, ty + 0.5, cz],
      rotation: { axis: "z", angle: -25 }, // Angled ripping tooth
      materialRole: "edge",
      motion: {
        rig: "transform_slide",
        orbitTurns: 0,
        bob: 0,
        phase: 0,
        pulse: false,
        loopSeconds: 2.5,
        transformDelta: {
          translation: [-0.6, 0, 0], // Teeth fan outward in shredder mode!
        },
      },
    });

    // Right Rip Tooth
    add({
      id: `cs_tooth_r_${t + 1}`,
      name: `Tungsten-Carbide Tooth R#${t + 1}`,
      group: "blade",
      from: [cx + halfBarW - 0.1, ty, cz - depth * 0.3],
      to: [cx + halfBarW + 0.75, ty + 1.0, cz + depth * 0.3],
      origin: [cx + halfBarW, ty + 0.5, cz],
      rotation: { axis: "z", angle: 25 },
      materialRole: "edge",
      motion: {
        rig: "transform_slide",
        orbitTurns: 0,
        bob: 0,
        phase: 0,
        pulse: false,
        loopSeconds: 2.5,
        transformDelta: {
          translation: [0.6, 0, 0],
        },
      },
    });
  }

  // 5. Nose Sprocket Wheel (Tip Revolving Gear)
  const noseY = barStartY + barLen;
  add({
    id: "cs_nose_sprocket",
    name: "Ball-Bearing Nose Sprocket",
    group: "detail",
    from: [cx - 1.2, noseY - 0.6, cz - depth * 0.45],
    to: [cx + 1.2, noseY + 1.8, cz + depth * 0.45],
    origin: [cx, noseY + 0.6, cz],
    rotation: { axis: "z", angle: 45 },
    materialRole: "trim",
    motion: {
      rig: "transform_barrel",
      orbitTurns: 0,
      bob: 0,
      phase: 0,
      pulse: true,
      loopSeconds: 2.5,
      transformDelta: {
        rotation: [0, 0, 180], // Sprocket spins!
      },
    },
  });

  // Nose Armor Spike Tip
  add({
    id: "cs_nose_spike",
    name: "Bar Tip Piercing Claw",
    group: "blade",
    from: [cx - 0.55, noseY + 1.4, cz - 0.45],
    to: [cx + 0.55, noseY + 2.8, cz + 0.45],
    materialRole: "edge",
  });

  return drafts;
}

/**
 * Super-detailed romantic sword features:
 * - Serration teeth (saw blade notches)
 * - Laser / photon edges (glowing energy monofilament)
 * - Heavy knuckle bow guard (wrapping from crossguard to grip)
 * - Blade heat-sink ventilation slitting
 * - Reinforced fuller conduit
 */
export function buildSwordRomanceDetails(opts: {
  cx: number;
  cz: number;
  params: ArchetypeParams;
  bladeStartY: number;
  mainBodyLen: number;
  bHalfW: number;
  halfD: number;
  guardY: number;
  gHeight: number;
  gHalfW: number;
}): RawBoxSpec[] {
  const {
    cx,
    cz,
    params,
    bladeStartY,
    mainBodyLen,
    bHalfW,
    halfD,
    guardY,
    gHeight,
    gHalfW,
  } = opts;
  const drafts: RawBoxSpec[] = [];

  const add = (spec: RawBoxSpec) => {
    drafts.push({
      ...spec,
      from: [r2(spec.from[0]), r2(spec.from[1]), r2(spec.from[2])],
      to: [r2(spec.to[0]), r2(spec.to[1]), r2(spec.to[2])],
      origin: spec.origin
        ? [r2(spec.origin[0]), r2(spec.origin[1]), r2(spec.origin[2])]
        : [
            r2((spec.from[0] + spec.to[0]) / 2),
            r2((spec.from[1] + spec.to[1]) / 2),
            r2((spec.from[2] + spec.to[2]) / 2),
          ],
      rotation: spec.rotation ?? { axis: "z", angle: 0 },
    });
  };

  // 1. Serration Saw-Teeth (Notched ripping teeth along lower blade forte)
  if (params.serration !== false) {
    const serrationCount = Math.max(3, Math.min(5, Math.floor(mainBodyLen * 0.4)));
    for (let s = 0; s < serrationCount; s++) {
      const sy = bladeStartY + 0.6 + s * 1.35;
      // Left tooth
      add({
        id: `blade_serration_l_${s + 1}`,
        name: `Serration Fang L#${s + 1}`,
        group: "blade",
        from: [cx - bHalfW - 0.75, sy, cz - halfD * 0.35],
        to: [cx - bHalfW * 0.7, sy + 0.9, cz + halfD * 0.35],
        origin: [cx - bHalfW * 0.8, sy + 0.45, cz],
        rotation: { axis: "z", angle: 30 },
        materialRole: "edge",
      });
      // Right tooth
      add({
        id: `blade_serration_r_${s + 1}`,
        name: `Serration Fang R#${s + 1}`,
        group: "blade",
        from: [cx + bHalfW * 0.7, sy, cz - halfD * 0.35],
        to: [cx + bHalfW + 0.75, sy + 0.9, cz + halfD * 0.35],
        origin: [cx + bHalfW * 0.8, sy + 0.45, cz],
        rotation: { axis: "z", angle: -30 },
        materialRole: "edge",
      });
    }
  }

  // 2. Photon / Laser Edge (Glow monofilament blade rim)
  if (params.laserEdge !== false) {
    // Left photon line
    add({
      id: "blade_laser_edge_left",
      name: "Photon Edge Core Left",
      group: "detail",
      from: [cx - bHalfW - 0.25, bladeStartY + 0.8, cz - 0.25],
      to: [cx - bHalfW + 0.25, bladeStartY + mainBodyLen * 0.92, cz + 0.25],
      materialRole: "core",
    });
    // Right photon line
    add({
      id: "blade_laser_edge_right",
      name: "Photon Edge Core Right",
      group: "detail",
      from: [cx + bHalfW - 0.25, bladeStartY + 0.8, cz - 0.25],
      to: [cx + bHalfW + 0.25, bladeStartY + mainBodyLen * 0.92, cz + 0.25],
      materialRole: "core",
    });
  }

  // 3. Heavy Knuckle Bow Guard (Wraps from crossguard down to grip base)
  if (params.knuckleGuard !== false) {
    const bowY = guardY - 2.8;
    add({
      id: "guard_knuckle_bow",
      name: "Heavy Knuckle Bow Guard",
      group: "guard",
      from: [cx + gHalfW * 0.65, bowY, cz - 0.4],
      to: [cx + gHalfW * 0.65 + 0.9, guardY + 0.2, cz + 0.4],
      materialRole: "trim",
    });
    add({
      id: "guard_knuckle_bar_lower",
      name: "Lower Knuckle Support",
      group: "guard",
      from: [cx + 0.8, bowY, cz - 0.4],
      to: [cx + gHalfW * 0.65 + 0.5, bowY + 0.7, cz + 0.4],
      materialRole: "trim",
    });
  }

  // 4. Heat-Sink Ventilation Slits along blade central fuller
  if (params.heatSinkVents !== false) {
    const ventCount = Math.max(2, Math.min(4, Math.floor(mainBodyLen * 0.35)));
    for (let v = 0; v < ventCount; v++) {
      const vy = bladeStartY + 1.2 + v * 2.2;
      add({
        id: `blade_heatsink_vent_${v + 1}`,
        name: `Blade Heat-Sink Fin #${v + 1}`,
        group: "detail",
        from: [cx - bHalfW * 0.35, vy, cz - halfD * 1.1],
        to: [cx + bHalfW * 0.35, vy + 0.8, cz + halfD * 1.1],
        materialRole: "trim",
      });
    }
  }

  return drafts;
}

/**
 * Super-enhanced magical structures for Staff:
 * - Dual Sacred Magic Circles (Rotating geometric rune ring)
 * - Quad Elemental Orbs (Fire, Water, Earth, Air orbiting around the crown)
 */
export function buildStaffMagicAuraDrafts(opts: {
  cx: number;
  cz: number;
  crownY: number;
  span: number;
  params: ArchetypeParams;
}): RawBoxSpec[] {
  const { cx, cz, crownY, span, params } = opts;
  const drafts: RawBoxSpec[] = [];

  const add = (spec: RawBoxSpec) => {
    drafts.push({
      ...spec,
      from: [r2(spec.from[0]), r2(spec.from[1]), r2(spec.from[2])],
      to: [r2(spec.to[0]), r2(spec.to[1]), r2(spec.to[2])],
      origin: spec.origin
        ? [r2(spec.origin[0]), r2(spec.origin[1]), r2(spec.origin[2])]
        : [
            r2((spec.from[0] + spec.to[0]) / 2),
            r2((spec.from[1] + spec.to[1]) / 2),
            r2((spec.from[2] + spec.to[2]) / 2),
          ],
      rotation: spec.rotation ?? { axis: "z", angle: 0 },
    });
  };

  // 1. Dual Sacred Magic Circle (Octagram & Hexagram thin rune circle)
  if (params.magicCircleRings !== false) {
    const circleR = span * 1.45;
    const circleY = crownY + 0.5;
    const segs = 12;

    for (let s = 0; s < segs; s++) {
      const theta = (s / segs) * Math.PI * 2;
      const x = cx + Math.cos(theta) * circleR;
      const z = cz + Math.sin(theta) * circleR;

      add({
        id: `staff_magic_circle_outer_${s + 1}`,
        name: `Rune Circle Outer #${s + 1}`,
        group: "float",
        from: [x - 0.4, circleY - 0.15, z - 0.4],
        to: [x + 0.4, circleY + 0.15, z + 0.4],
        origin: [cx, circleY, cz],
        materialRole: "core",
        motion: {
          rig: "magic_circle",
          orbitTurns: 1, // Smoothly spins in viewport!
          bob: 0.25,
          phase: s / segs,
          pulse: true,
          loopSeconds: 6,
        },
      });

      // Inner Star Glyphs
      if (s % 2 === 0) {
        const inR = circleR * 0.65;
        const ix = cx + Math.cos(theta) * inR;
        const iz = cz + Math.sin(theta) * inR;
        add({
          id: `staff_magic_circle_inner_${s + 1}`,
          name: `Rune Star Vertex #${s + 1}`,
          group: "float",
          from: [ix - 0.3, circleY - 0.15, iz - 0.3],
          to: [ix + 0.3, circleY + 0.15, iz + 0.3],
          origin: [cx, circleY, cz],
          rotation: { axis: "y", angle: 45 },
          materialRole: "gem",
          motion: {
            rig: "magic_circle",
            orbitTurns: -1, // Reverse counter-rotating inner circle!
            bob: 0.25,
            phase: s / segs,
            pulse: true,
            loopSeconds: 6,
          },
        });
      }
    }
  }

  // 2. Quad Elemental Orbs (Fire, Water, Wind, Earth)
  if (params.elementalOrbs !== false) {
    const orbR = span * 1.85;
    const orbY = crownY + 1.8;
    const elementsMeta: Array<{ name: string; role: Role; phase: number }> = [
      { name: "Flame", role: "core", phase: 0 },
      { name: "Tide", role: "gem", phase: 0.25 },
      { name: "Gale", role: "edge", phase: 0.5 },
      { name: "Terra", role: "trim", phase: 0.75 },
    ];

    elementsMeta.forEach((elem, idx) => {
      const ang = (idx / 4) * Math.PI * 2;
      const ox = cx + Math.cos(ang) * orbR;
      const oz = cz + Math.sin(ang) * orbR;

      add({
        id: `staff_elemental_orb_${elem.name.toLowerCase()}`,
        name: `Elemental Orb (${elem.name})`,
        group: "float",
        from: [ox - 0.65, orbY - 0.65, oz - 0.65],
        to: [ox + 0.65, orbY + 0.65, oz + 0.65],
        origin: [cx, orbY, cz],
        rotation: { axis: "y", angle: 45 },
        materialRole: elem.role,
        motion: {
          rig: "orbit_a",
          orbitTurns: 2, // Fast revolving elemental sphere!
          bob: 0.6,
          phase: elem.phase,
          pulse: true,
          loopSeconds: 4,
        },
      });

      // Mini Corona Shards orbiting each elemental sphere
      add({
        id: `staff_elem_corona_${elem.name.toLowerCase()}`,
        name: `Orb Corona Halo (${elem.name})`,
        group: "float",
        from: [ox - 0.3, orbY + 0.8, oz - 0.3],
        to: [ox + 0.3, orbY + 1.4, oz + 0.3],
        origin: [ox, orbY, oz],
        rotation: { axis: "z", angle: 45 },
        materialRole: "core",
        motion: {
          rig: "orbit_a",
          orbitTurns: 2,
          bob: 0.7,
          phase: elem.phase,
          pulse: true,
          loopSeconds: 4,
        },
      });
    });
  }

  return drafts;
}

