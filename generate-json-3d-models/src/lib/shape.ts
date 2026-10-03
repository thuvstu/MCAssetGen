import type { Blueprint } from "./prompt";
import type { Vec3, VoxelCube } from "./model-types";

const rounded = (number: number) => Math.round(number * 10000) / 10000;
const decorative = /gem|rune|shard|rivet|bolt|mud|grain|leaf_detail|spot|shine|binding/;

/** Every supported modifier changes actual cuboid coordinates, parts or materials; not only the name. */
export function applyShape(cubes: VoxelCube[], blueprint: Blueprint): VoxelCube[] {
  const b = blueprint;
  let result = cubes.map(cube => ({ ...cube, from: [...cube.from] as Vec3, to: [...cube.to] as Vec3 }));
  const handheld = ["sword", "pickaxe", "axe", "hammer", "scythe", "shovel", "staff", "trident", "bow", "chainsaw", "drill", "nailgun", "circularsaw", "flamethrower", "jackhammer"].includes(b.kind ?? "");
  if (b.style === "plain") result = result.filter(cube => !decorative.test(cube.name));
  if (b.kind === "sword" && b.profile !== "standard") {
    if (b.profile === "curved") result = result.filter(cube => !/guard_wing|blade_ridge/.test(cube.name));
    if (b.profile === "katana") result = result.filter(cube => !/guard_wing|blade_ridge/.test(cube.name));
    result.forEach(cube => {
      if (cube.name.startsWith("blade") || cube.name === "rune") {
        if (b.profile === "dagger") {
          cube.from[1] = 3.5 + (cube.from[1] - 3.5) * .5;
          cube.to[1] = 3.5 + (cube.to[1] - 3.5) * .5;
        }
        if (b.profile === "broad") {
          cube.from[0] = 8 + (cube.from[0] - 8) * 1.8;
          cube.to[0] = 8 + (cube.to[0] - 8) * 1.8;
        }
        if (b.profile === "katana") {
          const height = (cube.from[1] + cube.to[1]) / 2;
          const curve = ((Math.max(0, height - 3.5)) / 15.5) ** 2 * 2.8;
          cube.from[0] = 8 + (cube.from[0] - 8) * .65 + curve;
          cube.to[0] = 8 + (cube.to[0] - 8) * .65 + curve;
          cube.color = cube.color === 2 ? 0 : cube.color;
        }
        if (b.profile === "curved") {
          const height = (cube.from[1] + cube.to[1]) / 2;
          const curve = -(((Math.max(0, height - 3.5)) / 15.5) ** 2 * 2.6);
          cube.from[0] = 8 + (cube.from[0] - 8) * .62 + curve;
          cube.to[0] = 8 + (cube.to[0] - 8) * .62 + curve;
          cube.color = cube.color === 2 ? 0 : cube.color;
        }
      }
      if (cube.name.startsWith("guard") && b.profile === "katana") {
        cube.from[0] = 8 + (cube.from[0] - 8) * .4;
        cube.to[0] = 8 + (cube.to[0] - 8) * .4;
        cube.color = 6;
      }
    });
  }
  if (b.kind === "trident" && b.profile === "spear") {
    result = result.filter(cube => !/side|crossbar|barb/.test(cube.name));
  }
  const add = (name: string, x: number, y: number, z: number, w: number, h: number, d: number, color: number, glow = false) => {
    result.push({ name, from: [x, y, z], to: [x + w, y + h, z + d], color, ...(glow ? { glow: true } : {}) });
  };
  // New embellishments are located in front of the object; all remain legal cuboids.
  const anchorX = b.kind === "bow" ? 4.4 : 8;
  const bodyY = handheld ? ["chainsaw", "drill", "nailgun", "circularsaw", "flamethrower", "jackhammer"].includes(b.kind ?? "") ? 6 : b.kind === "bow" ? 8 : 12 : 6;
  const frontZ = handheld ? 6.82 : Math.min(...result.map(cube => cube.from[2])) - .18;
  if (b.style === "ornate") {
    add("ornament_gem", anchorX - .55, bodyY, frontZ, 1.1, 1.5, .35, 1, b.glow === true);
    add("ornament_gold", anchorX - .9, bodyY - .35, frontZ + .09, 1.8, .35, .25, 4);
    add("ornament_gold", anchorX - .9, bodyY + 1.5, frontZ + .09, 1.8, .35, .25, 4);
  }
  if (b.style === "ancient") {
    for (let i = 0; i < 4; i++) {
      add("ancient_rune", anchorX - .4 + (i % 2) * .3, bodyY - 4 + i * 1.2, frontZ, .5, .65, .22, i % 2 ? 4 : 6, b.glow === true);
    }
  }
  if (b.style === "elven") {
    for (let i = 0; i < 3; i++) {
      add("elven_leaf", anchorX - 1.1 + i * .4, bodyY - .3 + i * .7, frontZ, 1.5 - i * .25, .55, .2, i % 2 ? 1 : 4);
    }
  }
  if (b.style === "mechanical") {
    for (const x of [anchorX - 1, anchorX + .6]) {
      for (const y of [bodyY, bodyY + 1.6]) add("mechanical_rivet", x, y, frontZ, .45, .45, .3, 4);
    }
  }
  if (b.spikes) {
    for (let i = 0; i < 4; i++) {
      const x = b.kind === "axe" ? 1 : b.kind === "bow" ? 4 : 9.5;
      const y = handheld ? 6 + i * 1.7 : 4 + i * 1.2;
      add("spike_base", x, y, 7.5, 1.2, .8, 1, 2);
      add("spike_tip", x + .8, y + .2, 7.7, .9, .4, .6, 1, b.glow === true);
    }
  }
  if (b.material === "wood" && !b.color) {
    result.forEach(cube => { if (/blade|head|limb|prong|orb/.test(cube.name) && cube.color < 4) cube.color = cube.color === 1 ? 0 : 5; });
  }
  if (b.glow === false) result.forEach(cube => { delete cube.glow; });
  if (b.glow === true) {
    result.forEach(cube => {
      if (cube.color === 1 || /gem|rune|orb|light|crystal/.test(cube.name)) cube.glow = true;
    });
  }
  const anchorY = handheld ? -3.2 : 0;
  result.forEach(cube => {
    for (const point of [cube.from, cube.to]) {
      point[0] = rounded(8 + (point[0] - 8) * b.width * b.scale);
      point[1] = rounded(anchorY + (point[1] - anchorY) * b.length * b.scale);
      point[2] = rounded(8 + (point[2] - 8) * b.thickness * b.scale);
    }
  });
  // Minecraft cuboid endpoints must stay in [-16, 32]. Scale down only if that limit is exceeded.
  let fit = 1;
  result.forEach(cube => {
    for (const point of [cube.from, cube.to]) {
      point.forEach((value, axis) => {
        const center = axis === 1 ? anchorY : 8;
        const delta = value - center;
        if (value > 31.8) fit = Math.min(fit, (31.8 - center) / delta);
        if (value < -15.8) fit = Math.min(fit, (-15.8 - center) / delta);
      });
    }
  });
  if (fit < 1) result.forEach(cube => {
    for (const point of [cube.from, cube.to]) point.forEach((value, axis) => {
      const center = axis === 1 ? anchorY : 8;
      point[axis] = rounded(center + (value - center) * fit);
    });
  });
  return result;
}
