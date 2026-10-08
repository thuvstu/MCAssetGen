import type { Element, RGB } from "./types";

export const ELEMENT_COLORS: Record<Element, { main: RGB; glow: RGB }> = {
  none: { main: [200, 211, 224], glow: [227, 237, 249] },
  flame: { main: [245, 151, 95], glow: [255, 209, 157] },
  frost: { main: [135, 216, 232], glow: [204, 248, 255] },
  void: { main: [164, 130, 214], glow: [207, 180, 246] },
  holy: { main: [231, 202, 135], glow: [255, 239, 187] },
  lightning: { main: [162, 179, 251], glow: [217, 227, 255] },
  poison: { main: [157, 208, 127], glow: [214, 244, 184] },
  shadow: { main: [159, 121, 171], glow: [200, 169, 222] },
  blood: { main: [213, 128, 147], glow: [244, 183, 193] },
  arcane: { main: [173, 152, 223], glow: [216, 199, 253] },
  nature: { main: [138, 196, 118], glow: [204, 240, 170] },
  ocean: { main: [96, 178, 190], glow: [178, 232, 236] },
};
