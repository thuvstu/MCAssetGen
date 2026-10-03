import { GeneratedModel, VoxelElement } from "../types";
import { atlasDataUrl, UV_ANCHORS } from "../atlas";
import { generateUUID, sanitizeIdentifier } from "../color";

const r2 = (v: number) => Math.round(v * 100) / 100;
const resScale = (model: GeneratedModel) =>
  (model.config.textureResolution || 16) / 16;

/** Per-face UV rect inside the texture, honouring the material anchor. */
export function faceUV(el: VoxelElement, scale = 1): [number, number, number, number] {
  const anchor: [number, number] = el.uv ?? UV_ANCHORS[el.material] ?? [0, 0];
  const size = 3.6;
  const u = r2((anchor[0] + 0.2) * scale);
  const v = r2((anchor[1] + 0.2) * scale);
  return [u, v, r2(u + size * scale), r2(v + size * scale)];
}

function buildBlockbenchAnimations(
  groups: Record<string, { uuid: string; elements: string[] }>,
  amp: number
) {
  const anims = [];

  // Helper to safely attach bone tracks only for groups present in the model
  const boneTrack = (
    groupName: string,
    track: {
      rotation?: Record<string, { post: [number, number, number]; lerp_mode?: string }>;
      position?: Record<string, { post: [number, number, number]; lerp_mode?: string }>;
      scale?: Record<string, { post: [number, number, number]; lerp_mode?: string }>;
    }
  ) => {
    const g = groups[groupName];
    if (!g) return {};
    return {
      [g.uuid]: {
        name: groupName,
        type: "bone",
        ...track,
      },
    };
  };

  // 1. idle_float
  anims.push({
    uuid: generateUUID(),
    name: "idle_float",
    loop: "loop",
    override: false,
    length: 2.0,
    snapping: 24,
    animators: {
      ...boneTrack("Floating", {
        rotation: {
          "0.0": { post: [0, 0, 0], lerp_mode: "linear" },
          "1.0": { post: [0, 180, 0], lerp_mode: "linear" },
          "2.0": { post: [0, 360, 0], lerp_mode: "linear" },
        },
        position: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "1.0": { post: [0, r2(1.6 * amp), 0], lerp_mode: "catmullrom" },
          "2.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("Halo", {
        rotation: {
          "0.0": { post: [0, 0, 0], lerp_mode: "linear" },
          "2.0": { post: [0, 0, -360], lerp_mode: "linear" },
        },
      }),
      ...boneTrack("Funnel", {
        position: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "1.0": { post: [0, r2(-1.4 * amp), 0], lerp_mode: "catmullrom" },
          "2.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
      }),
    },
  });

  // 2. combo_slash (3-hit combo attack)
  anims.push({
    uuid: generateUUID(),
    name: "combo_slash",
    loop: "loop",
    override: false,
    length: 1.8,
    snapping: 24,
    animators: {
      ...boneTrack("Blade", {
        rotation: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "0.35": { post: [65, -25, 45], lerp_mode: "catmullrom" },
          "0.85": { post: [-55, 30, -50], lerp_mode: "catmullrom" },
          "1.35": { post: [85, 180, 0], lerp_mode: "catmullrom" },
          "1.8": { post: [0, 360, 0], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("Funnel", {
        position: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "0.4": { post: [2.5, 4, 3], lerp_mode: "catmullrom" },
          "0.9": { post: [-2.5, 6, -3], lerp_mode: "catmullrom" },
          "1.4": { post: [0, 8, 5], lerp_mode: "catmullrom" },
          "1.8": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
      }),
    },
  });

  // 3. charge_cleave (Split-blade charge & overhead dimensional cleave)
  anims.push({
    uuid: generateUUID(),
    name: "charge_cleave",
    loop: "loop",
    override: false,
    length: 2.4,
    snapping: 24,
    animators: {
      ...boneTrack("BladeL", {
        position: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "0.8": { post: [-2.4, 0.8, 0], lerp_mode: "catmullrom" },
          "1.5": { post: [-2.8, 1.5, 0], lerp_mode: "catmullrom" },
          "2.4": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("BladeR", {
        position: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "0.8": { post: [2.4, 0.8, 0], lerp_mode: "catmullrom" },
          "1.5": { post: [2.8, 1.5, 0], lerp_mode: "catmullrom" },
          "2.4": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("Core", {
        scale: {
          "0.0": { post: [1, 1, 1], lerp_mode: "catmullrom" },
          "1.0": { post: [1.45, 1.6, 1.45], lerp_mode: "catmullrom" },
          "1.6": { post: [1.8, 2.1, 1.8], lerp_mode: "catmullrom" },
          "2.4": { post: [1, 1, 1], lerp_mode: "catmullrom" },
        },
      }),
    },
  });

  // 4. magic_cast (Grand magic circle invocation)
  anims.push({
    uuid: generateUUID(),
    name: "magic_cast",
    loop: "loop",
    override: false,
    length: 2.4,
    snapping: 24,
    animators: {
      ...boneTrack("Halo", {
        rotation: {
          "0.0": { post: [0, 0, 0], lerp_mode: "linear" },
          "1.2": { post: [0, 0, 360], lerp_mode: "linear" },
          "2.4": { post: [0, 0, 720], lerp_mode: "linear" },
        },
        scale: {
          "0.0": { post: [1, 1, 1], lerp_mode: "catmullrom" },
          "1.2": { post: [1.4, 1.4, 1.4], lerp_mode: "catmullrom" },
          "2.4": { post: [1, 1, 1], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("Floating", {
        rotation: {
          "0.0": { post: [0, 0, 0], lerp_mode: "linear" },
          "2.4": { post: [0, -720, 0], lerp_mode: "linear" },
        },
        position: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "1.2": { post: [0, 4.5, 0], lerp_mode: "catmullrom" },
          "2.4": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("Funnel", {
        rotation: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "1.2": { post: [45, 0, 0], lerp_mode: "catmullrom" },
          "2.4": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
      }),
    },
  });

  // 5. form_morph (Mechanical/Arcane transformation sequence)
  anims.push({
    uuid: generateUUID(),
    name: "form_morph",
    loop: "loop",
    override: false,
    length: 2.8,
    snapping: 24,
    animators: {
      ...boneTrack("Seal", {
        scale: {
          "0.0": { post: [1, 1, 1], lerp_mode: "catmullrom" },
          "0.8": { post: [1.25, 0.2, 1.25], lerp_mode: "catmullrom" },
          "2.0": { post: [1.25, 0.2, 1.25], lerp_mode: "catmullrom" },
          "2.8": { post: [1, 1, 1], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("BladeL", {
        position: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "1.0": { post: [-2.2, 1.2, 0], lerp_mode: "catmullrom" },
          "2.0": { post: [-2.2, 1.2, 0], lerp_mode: "catmullrom" },
          "2.8": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("BladeR", {
        position: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "1.0": { post: [2.2, 1.2, 0], lerp_mode: "catmullrom" },
          "2.0": { post: [2.2, 1.2, 0], lerp_mode: "catmullrom" },
          "2.8": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("Astral", {
        scale: {
          "0.0": { post: [0.4, 0.4, 0.4], lerp_mode: "catmullrom" },
          "1.2": { post: [1.15, 1.15, 1.15], lerp_mode: "catmullrom" },
          "2.0": { post: [1.15, 1.15, 1.15], lerp_mode: "catmullrom" },
          "2.8": { post: [0.4, 0.4, 0.4], lerp_mode: "catmullrom" },
        },
      }),
    },
  });

  // 6. limit_burst (Limit Break Awakening radial burst)
  anims.push({
    uuid: generateUUID(),
    name: "limit_burst",
    loop: "loop",
    override: false,
    length: 2.6,
    snapping: 24,
    animators: {
      ...boneTrack("Halo", {
        rotation: {
          "0.0": { post: [0, 0, 0], lerp_mode: "linear" },
          "0.8": { post: [0, 0, -90], lerp_mode: "catmullrom" },
          "2.6": { post: [0, 0, 720], lerp_mode: "catmullrom" },
        },
        scale: {
          "0.0": { post: [0.7, 0.7, 0.7], lerp_mode: "catmullrom" },
          "1.2": { post: [1.5, 1.5, 1.5], lerp_mode: "catmullrom" },
          "2.6": { post: [1, 1, 1], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("Funnel", {
        position: {
          "0.0": { post: [0, -1, 0], lerp_mode: "catmullrom" },
          "1.1": { post: [0, 5.5, 0], lerp_mode: "catmullrom" },
          "2.6": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
        rotation: {
          "0.0": { post: [0, 0, 0], lerp_mode: "linear" },
          "2.6": { post: [0, -360, 0], lerp_mode: "linear" },
        },
      }),
      ...boneTrack("Astral", {
        scale: {
          "0.0": { post: [0.5, 0.5, 0.5], lerp_mode: "catmullrom" },
          "1.1": { post: [1.35, 1.35, 1.35], lerp_mode: "catmullrom" },
          "2.6": { post: [1, 1, 1], lerp_mode: "catmullrom" },
        },
      }),
    },
  });

  // 7. chainsaw_rev — chain travel + engine shake
  anims.push({
    uuid: generateUUID(),
    name: "chainsaw_rev",
    loop: "loop",
    override: false,
    length: 1.2,
    snapping: 48,
    animators: {
      ...boneTrack("Chain", {
        position: {
          "0.0": { post: [0, 0, 0], lerp_mode: "linear" },
          "0.3": { post: [3.6, 0, 0], lerp_mode: "linear" },
          "0.6": { post: [0, 0, 0], lerp_mode: "linear" },
          "0.9": { post: [3.6, 0, 0], lerp_mode: "linear" },
          "1.2": { post: [0, 0, 0], lerp_mode: "linear" },
        },
      }),
      ...boneTrack("Gear", {
        rotation: {
          "0.0": { post: [0, 0, 0], lerp_mode: "linear" },
          "0.6": { post: [0, 0, -360], lerp_mode: "linear" },
          "1.2": { post: [0, 0, -720], lerp_mode: "linear" },
        },
      }),
      ...boneTrack("Piston", {
        position: {
          "0.0": { post: [0, 0, 0], lerp_mode: "linear" },
          "0.15": { post: [0, 0.5, 0], lerp_mode: "linear" },
          "0.3": { post: [0, 0, 0], lerp_mode: "linear" },
          "0.45": { post: [0, 0.5, 0], lerp_mode: "linear" },
          "0.6": { post: [0, 0, 0], lerp_mode: "linear" },
        },
      }),
    },
  });

  // 8. gun_recoil — slide blow-back + muzzle flash
  anims.push({
    uuid: generateUUID(),
    name: "gun_recoil",
    loop: "loop",
    override: false,
    length: 0.6,
    snapping: 48,
    animators: {
      ...boneTrack("Breech", {
        position: {
          "0.0": { post: [0, 0, 0], lerp_mode: "linear" },
          "0.08": { post: [0, 0, -2.9], lerp_mode: "linear" },
          "0.26": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("Muzzle", {
        scale: {
          "0.0": { post: [2.8, 2.8, 2.8], lerp_mode: "linear" },
          "0.1": { post: [1, 1, 1], lerp_mode: "linear" },
        },
      }),
      ...boneTrack("Magazine", {
        position: {
          "0.0": { post: [0, 0, 0], lerp_mode: "linear" },
          "0.08": { post: [0, 0.3, 0], lerp_mode: "linear" },
          "0.2": { post: [0, 0, 0], lerp_mode: "linear" },
        },
      }),
    },
  });

  // 9. reload_cycle — magazine drop, insert, charge
  anims.push({
    uuid: generateUUID(),
    name: "reload_cycle",
    loop: "loop",
    override: false,
    length: 3.2,
    snapping: 24,
    animators: {
      ...boneTrack("Magazine", {
        position: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "0.6": { post: [0, -14, 0], lerp_mode: "catmullrom" },
          "1.5": { post: [0, -14, 0], lerp_mode: "catmullrom" },
          "2.3": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "3.2": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
        rotation: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "0.6": { post: [0, 0, 32], lerp_mode: "catmullrom" },
          "2.3": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("Breech", {
        position: {
          "2.3": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "2.7": { post: [0, 0, -3.4], lerp_mode: "catmullrom" },
          "3.2": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("Gear", {
        rotation: {
          "2.3": { post: [0, 0, 0], lerp_mode: "linear" },
          "3.2": { post: [0, 0, -360], lerp_mode: "linear" },
        },
      }),
    },
  });

  // 10. railgun_charge — coil spool-up then discharge recoil
  anims.push({
    uuid: generateUUID(),
    name: "railgun_charge",
    loop: "loop",
    override: false,
    length: 3.4,
    snapping: 24,
    animators: {
      ...boneTrack("Coil", {
        scale: {
          "0.0": { post: [1, 1, 1], lerp_mode: "catmullrom" },
          "1.0": { post: [1.08, 1.08, 1], lerp_mode: "catmullrom" },
          "2.0": { post: [1.02, 1.02, 1], lerp_mode: "catmullrom" },
          "2.1": { post: [1.3, 1.3, 1], lerp_mode: "catmullrom" },
          "2.6": { post: [1, 1, 1], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("Core", {
        scale: {
          "0.0": { post: [1, 1, 1], lerp_mode: "catmullrom" },
          "2.1": { post: [1.6, 1.6, 1.6], lerp_mode: "catmullrom" },
          "2.3": { post: [1.1, 1.1, 1.1], lerp_mode: "catmullrom" },
          "3.4": { post: [1, 1, 1], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("Muzzle", {
        scale: {
          "2.1": { post: [1, 1, 1], lerp_mode: "catmullrom" },
          "2.2": { post: [3.6, 3.6, 3.6], lerp_mode: "catmullrom" },
          "2.6": { post: [1, 1, 1], lerp_mode: "catmullrom" },
        },
      }),
    },
  });

  // 11. mace_smash — overhead wind-up and slam
  anims.push({
    uuid: generateUUID(),
    name: "mace_smash",
    loop: "loop",
    override: false,
    length: 2.2,
    snapping: 24,
    animators: {
      ...boneTrack("Head", {
        rotation: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "1.0": { post: [-72, 0, 0], lerp_mode: "catmullrom" },
          "1.3": { post: [68, 0, 0], lerp_mode: "catmullrom" },
          "2.2": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
        position: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "1.0": { post: [0, 4.6, -2.4], lerp_mode: "catmullrom" },
          "1.3": { post: [0, -1.8, 1.2], lerp_mode: "catmullrom" },
          "2.2": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
      }),
    },
  });

  // 12. spear_thrust — triple jab
  anims.push({
    uuid: generateUUID(),
    name: "spear_thrust",
    loop: "loop",
    override: false,
    length: 1.8,
    snapping: 48,
    animators: {
      ...boneTrack("Blade", {
        position: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "0.2": { post: [0, 0, 6.5], lerp_mode: "catmullrom" },
          "0.4": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "0.6": { post: [0, 0, 6.5], lerp_mode: "catmullrom" },
          "0.8": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "1.1": { post: [0, 0, 10.5], lerp_mode: "catmullrom" },
          "1.8": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("Banner", {
        rotation: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "0.45": { post: [-18, 0, 9], lerp_mode: "catmullrom" },
          "1.1": { post: [-26, 0, -9], lerp_mode: "catmullrom" },
          "1.8": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
      }),
    },
  });

  // 13. mech_deploy — gears, pistons and rails unfold
  anims.push({
    uuid: generateUUID(),
    name: "mech_deploy",
    loop: "loop",
    override: false,
    length: 3.6,
    snapping: 24,
    animators: {
      ...boneTrack("Gear", {
        rotation: {
          "0.0": { post: [0, 0, 0], lerp_mode: "linear" },
          "3.6": { post: [0, 0, -1080], lerp_mode: "linear" },
        },
      }),
      ...boneTrack("Piston", {
        position: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "1.4": { post: [0, 2.6, 0], lerp_mode: "catmullrom" },
          "2.6": { post: [0, 2.6, 0], lerp_mode: "catmullrom" },
          "3.6": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("Rail", {
        scale: {
          "0.0": { post: [1, 1, 1], lerp_mode: "catmullrom" },
          "1.4": { post: [1.22, 1.22, 1], lerp_mode: "catmullrom" },
          "2.6": { post: [1.22, 1.22, 1], lerp_mode: "catmullrom" },
          "3.6": { post: [1, 1, 1], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("BladeL", {
        position: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "1.4": { post: [-2.4, 0, 0], lerp_mode: "catmullrom" },
          "2.6": { post: [-2.4, 0, 0], lerp_mode: "catmullrom" },
          "3.6": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("BladeR", {
        position: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "1.4": { post: [2.4, 0, 0], lerp_mode: "catmullrom" },
          "2.6": { post: [2.4, 0, 0], lerp_mode: "catmullrom" },
          "3.6": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
      }),
    },
  });

  // 14. blood_drain — systolic pulse
  anims.push({
    uuid: generateUUID(),
    name: "blood_drain",
    loop: "loop",
    override: false,
    length: 2.6,
    snapping: 24,
    animators: {
      ...boneTrack("Core", {
        scale: {
          "0.0": { post: [1, 1, 1], lerp_mode: "catmullrom" },
          "0.5": { post: [1.55, 1.55, 1.55], lerp_mode: "catmullrom" },
          "1.0": { post: [1, 1, 1], lerp_mode: "catmullrom" },
          "1.3": { post: [1.3, 1.3, 1.3], lerp_mode: "catmullrom" },
          "2.6": { post: [1, 1, 1], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("Piston", {
        scale: {
          "0.0": { post: [1, 1, 1], lerp_mode: "catmullrom" },
          "0.5": { post: [1, 1.3, 1], lerp_mode: "catmullrom" },
          "1.0": { post: [1, 1, 1], lerp_mode: "catmullrom" },
          "2.6": { post: [1, 1, 1], lerp_mode: "catmullrom" },
        },
      }),
      ...boneTrack("Floating", {
        position: {
          "0.0": { post: [0, 0, 0], lerp_mode: "catmullrom" },
          "0.6": { post: [0, -2.2, 0], lerp_mode: "catmullrom" },
          "2.6": { post: [0, 0, 0], lerp_mode: "catmullrom" },
        },
      }),
    },
  });

  return anims;
}

export function toBBModel(model: GeneratedModel): string {
  const { config, elements, palette } = model;
  const s = resScale(model);
  const textureUuid = generateUUID();
  const modelId = sanitizeIdentifier(config.name);

  const groups: Record<string, { uuid: string; elements: string[] }> = {};
  const bbElements = elements.map((el) => {
    const uuid = generateUUID();
    const group = el.group || "Ornament";
    (groups[group] ??= { uuid: generateUUID(), elements: [] }).elements.push(uuid);

    const from = [r2(el.from[0]), r2(el.from[1]), r2(el.from[2])];
    const to = [r2(el.to[0]), r2(el.to[1]), r2(el.to[2])];
    const origin = [
      r2((from[0] + to[0]) / 2),
      r2((from[1] + to[1]) / 2),
      r2((from[2] + to[2]) / 2),
    ];
    const uv = faceUV(el, s);

    return {
      name: el.name,
      box_uv: false,
      rescale: false,
      locked: false,
      light_emission: el.emissive ? 15 : 0,
      render_order: el.emissive ? "after" : undefined,
      from,
      to,
      autouv: 0,
      color: el.emissive ? 4 : 1,
      origin,
      faces: Object.fromEntries(
        ["north", "east", "south", "west", "up", "down"].map((f) => [
          f,
          { uv, texture: 0, faces: undefined },
        ])
      ),
      uuid,
    };
  });

  const outliner = Object.entries(groups).map(([name, g]) => ({
    name,
    origin: [8, 8, 8],
    color: 0,
    uuid: g.uuid,
    export: true,
    isOpen: true,
    locked: false,
    visibility: true,
    children: g.elements,
  }));

  const animations = buildBlockbenchAnimations(groups, config.floatAmplitude || 0.8);

  return JSON.stringify(
    {
      meta: { format_version: "4.10", model_format: "java_block", box_uv: false },
      name: config.name,
      model_identifier: modelId,
      elements: bbElements,
      outliner,
      textures: [
        {
          path: "",
          name: `${modelId}_texture.png`,
          folder: "item",
          namespace: "",
          id: "0",
          particle: false,
          render_mode: "default",
          visible: true,
          mode: "bitmap",
          saved: true,
          uuid: textureUuid,
          source: atlasDataUrl(palette, config.textureResolution, config.atlasPattern),
        },
      ],
      animations,
      display: DISPLAY_POSES,
    },
    null,
    2
  );
}

export const DISPLAY_POSES = {
  thirdperson_righthand: { rotation: [0, -90, 55], translation: [0, 4, 0.5], scale: [0.85, 0.85, 0.85] },
  thirdperson_lefthand: { rotation: [0, 90, -55], translation: [0, 4, 0.5], scale: [0.85, 0.85, 0.85] },
  firstperson_righthand: { rotation: [0, -90, 25], translation: [1.13, 3.2, 1.13], scale: [0.68, 0.68, 0.68] },
  firstperson_lefthand: { rotation: [0, 90, -25], translation: [1.13, 3.2, 1.13], scale: [0.68, 0.68, 0.68] },
  ground: { rotation: [0, 0, 0], translation: [0, 3, 0], scale: [0.5, 0.5, 0.5] },
  gui: { rotation: [30, 225, 0], translation: [0, 0, 0], scale: [0.9, 0.9, 0.9] },
  fixed: { rotation: [0, 180, 0], translation: [0, 0, 0], scale: [1, 1, 1] },
  head: { rotation: [0, 180, 0], translation: [0, 14, 0], scale: [1, 1, 1] },
};
