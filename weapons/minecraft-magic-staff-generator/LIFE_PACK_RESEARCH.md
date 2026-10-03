# Life Pack Structural Research

Reference: `azisaba/resourcepacks`, tag `action-v9967` (the tagged source for the requested `life.zip`).

The release ZIP itself exceeded the web reader's binary/size limit. The observations below come from the corresponding public **tagged source files**, not from inspecting or copying image pixels.

## Observed

- `life/assets/minecraft/models/item/blaze_rod.json` uses `item/handheld` and a large list of numeric `custom_model_data` overrides. IDs 2-4 point to `manarod_a`, `_b`, `_c`; IDs 6-12 include skull, earth, attack, defense, wind and thunder rods.
- `life/assets/minecraft/models/item/iron_sword.json` uses the same override pattern for many weapons. Several families have multiple numbered models, so upgrades can retain a recognizable identity while changing appearance.
- `life/assets/minecraft/models/item/manarod_a.json`, `_b.json`, `_c.json` reference separate textures in `items/`. Their third-person scale increases across the series (about 1.67, 2.03, 2.33), while their first-person presentation stays more consistent. Ground, head, fixed and left/right-hand transforms are explicitly specified.
- The source `life/pack.mcmeta` declares a legacy `pack_format`; matching the selected Minecraft version is therefore important when generating new packs.

## Applied Here

- Four-stage original item-family evolution in `src/engine/evolution.ts`, with progressively stronger metalwork, satellite gems and effects while preserving the base silhouette and element.
- A selectable pixel-material finish in `src/engine/render.ts`: constrained vanilla palette, forged, weathered, engraved, gilded and runic. All textures are generated from scratch.
- `src/engine/pack.ts` creates a server collection with one CustomModelData mapping per item and version-aware model definitions: legacy `models/item` overrides before 1.21.4, or `items/` range dispatch from 1.21.4 onward. Progression stages get progressively larger third-person/ground transforms, while first-person transforms remain stable.
- CIT remains an optional, name-matched export for OptiFine/CIT Resewn clients, separate from the vanilla model-dispatch export.

No texture or model assets from Life are included in the application or exported packs.