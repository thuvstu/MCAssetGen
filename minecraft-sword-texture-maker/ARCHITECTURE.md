# AegisBlade Studio

The workbench separates generation policy, immutable editor state, and rasterization.

## Generation

- `src/generator/catalog.ts` defines blade proportions, compatible hardware, tonal palettes, themes, and the eight editable groups.
- `src/generator/generate.ts` is the pure generation pipeline. Its inputs are a document, a recipe, a seed, and an optional group scope.
- `GROUP_FIELDS` assigns every generated option to exactly one group. A group marked `keep`, or outside the generation scope, is never written.
- `pick` chooses a specific style; it does not freeze dimensions. `keep` preserves all owned values, including secondary colors and procedural detail seeds.
- Automatic parts adapt to explicit choices in either direction. A fixed guard can influence an automatic blade, not just the other way around.
- Locks and explicit choices take priority over theme preferences. Conflicting explicit choices are preserved and explained, not silently rewritten.
- Resolution, rendering style, and anti-aliasing are output settings and are never randomized.
- Surface and effect seeds have separate owners, so locking a finish also retains its noise pattern.

## Editor State

- `src/studio/history.ts` is a pure undo/redo reducer. A history entry includes the texture, name, tier, and generation report.
- Only consecutive changes to the same field within 450 ms are coalesced. Every new edit clears redo.
- `src/studio/useStudio.ts` coordinates recipes, variants, presets, and versioned browser storage. Persisted options are validated through `normalizeOptions`.
- Generation locks do not block deliberate manual editing or preset replacement. The interface labels this distinction.

## Variety

- 42 blade silhouettes are data-driven profiles in `src/engine/geometry.ts` (spine curve, width envelope, tip shape, edge bias), partitioned into 5 UI categories (`SILHOUETTE_CATEGORIES`).
- 49 surface materials live in `src/engine/surfaces.ts`, partitioned into 7 UI categories (`SURFACE_CATEGORIES`). The last group contains named pack/mod essences: Ultimate SkyBlock, FurfSky, Hypixel+, Spartan Forge, Dragonsteel, Dragonbone, and Simply Runic. Each pattern is aware of `c.fine` (enough device pixels across the blade) and the shading factor, so it can simplify itself on thin blades and during low-detail renders.
- 26 palette kits and 18 themes in `src/generator/catalog.ts` carry surface affinities; the generator intersects theme, palette, and blade preferences before it picks. All 42 silhouettes are reachable across the expanded theme set.
- Six additional style grammars distil the supplied pack/mod families without copying their assets: `ultimate_skyblock`, `furfsky`, `hypixel_plus`, `spartan_weaponry`, `dragonsteel`, and `simply_swords`. They select different weapon-role pools, surface essences, palette families, and attachment density.
- Geometry guarantees: guards always include a collar around the junction, pommels always overlap the grip end, and attachments are anchored on the blade surface. The self-check suite renders every silhouette x guard x pommel at 24 px and 48 px and asserts a single 8-connected component.

## Lighting and rendering

- A single source of truth for image-space lighting lives in `src/engine/lighting.ts`. All shaders (vanilla, hilt, pommel, surface patterns) share the same upper-left light direction, so a curved katana and a straight claymore both light from the upper-left of the icon.
- Edge bevel and rim shadow are produced from Gaussian profiles along the blade's lit and shadow rims, instead of a constant cross-axis stripe.
- For `minecraft` and small `rich` resolutions, an ordered 8x8 Bayer dither (in `src/engine/dither.ts`) is applied across solid mid-tones to break up diagonal stair-step banding.

## Surface "essences" library

The 42 patterns in `src/engine/surfaces.ts` cover:

- **Real temper lines (hamon 刃文)** — `suguha` (straight, the oldest), `gunome` (rolling hills), `choji` (clove buds, Bizen school), `notare` (irregular flow, Yamashiro school), `inazuma` (lightning streaks), `kinsuji` (golden lines along the grain). These use genuine Japanese swordsmithing terminology and produce distinct edge-band profiles.
- **Plain metals** — `polished`, `vanilla` (vanilla-faithful 3-band), `faithful` (32x pack style), `bevel` (aMidianborn-style light line), `warmith` (warm-aluminium), `hammered`.
- **Decorative metals** — `damascus`, `hamon` (katana temper line), `gilded`, `etched`, `circuit`, `gilded-band`.
- **Elemental** — `obsidian`, `ender` (volatile), `starfield`, `amethyst`, `amethyst-shard`, `frost` (crystalline fern), `magma` (glowing cracks), `prismarine` (tile + grout), `crystal`, `ifire` (ice-and-fire emissive), `stormforged` (lightning cracks), `skyblock` (heavy specular + gem pulse), `scales` (dragon/prismarine).
- **Organic** — `wood`, `bone` (porous), `jade` (warm carved), `worn` (battle-scratched), `banded` (strata).
- **RPG / anime / sci-fi essences** — `dualtone` (Night and Flame split), `helix` (Godslayer spiral), `whorl` (Velmorian woven metal), `divine` (Golden Order geometry), `nightflame` (cold void meets ember), `rengoku` (gold spine → crimson edge), `dragonscale` (borrowed from the monster), `luminous` (Sacred Relic, lit from within).

## Blade anatomy features

- `gradientBlade` — gradient along the blade's length (base → mid → tip).
- `edgeGradient` — gradient **across** the blade (spine → edge). This is the Rengoku / Flame Hashira essence: a cool spine flowing into an igniting edge. Implemented as a two-segment ramp so the midpoint stays the base colour.
- `ricasso` — an unsharpened squared shoulder just above the guard, with darkened boundary lines.
- `horimono` — a carved decorative groove running just inside the spine, distinct from the functional fuller.

## Weapon arsenal & Minecraft Vanilla fidelity

The studio unifies both high-end fantasy/RPG generator capabilities and 100% authentic Minecraft Vanilla 16x16 pixel-art standards:

- **Pure Minecraft Vanilla Lab (`src/vanilla/pixmaps.ts`, `src/vanilla/renderer.ts`, `src/vanilla/VanillaLab.tsx`)**:
  - Direct 16x16 pixel layouts for 13 items: **Sword, Short Blade (PvP Dagger), Axe, Pickaxe, Shovel, Hoe, Trident, Bow, Crossbow, 1.21 Heavy Core Mace, Fishing Rod, Shield, and Netherite Sword**.
  - Faithful 8-tone shading tier system across 11 material tiers: **Wood, Stone, Iron, Gold, Diamond, Netherite, Copper, Emerald, Amethyst, Prismarine, and 1.21 Breeze Rod**.
  - Zero mixels, zero disconnected islands, crisp 16/32/48/64/128/256px nearest-neighbour scaling, and live transfer into the main studio for advanced FX customization.

## Formless silhouettes (型に囚われない)

Nine beauty-first forms sit alongside the 33 historical ones — 42 total. They are
still driven by the same `Profile { curve, width, taper, tip }` contract, so every
surface finish, lighting model and FX pass works on them unchanged:

| form | idea |
|---|---|
| `essence` | a lens of pure energy, widest at the middle, no metal |
| `lotus` | slim shaft that blooms into petals before a rounded tip |
| `geode` | quantised facets — a crystal cluster grown along the axis |
| `ribbon` | flowing silk, a gentle S-curve that never breaks connectivity |
| `spine` | dragon vertebrae, periodic bulges |
| `fractured` | snapped twice but still held together by thin necks |
| `obelisk` | monolithic slab, almost no taper, flat crown |
| `fang` | extreme recurve hook, a beast's tooth |
| `sakura` | slender curve flaring into a single petal at the tip |

`applyFormRules()` in `engine/options.ts` keeps exotic forms legible: slim silhouettes
drop particles, orbiting shards, spurs and lightning (stray motes read as dirt at 16px),
1px blades lose inlaid grooves, and `fractured` never also gets shatter shards.

### Vanilla lattice & symmetry invariant

Mojang's 16×16 weapon and tool icons are aligned to the main anti-diagonal `x + y = 15`
(pommel at `(0, 15)` to tip at `(15, 0)`) and mirror-symmetric under
`T(x, y) = (15 - y, 15 - x)`. All 13 maps in `src/vanilla/pixmaps.ts` use all 9 palette
roles (blade highlight `1`, mid `2`, dark `3`, outer outline `4`, handle light/dark `5/6`,
guard light/dark `7/8`, and string/glint accent `9`), and are verified by the
`Vanilla maps sit on the 16x16 lattice with exact sword symmetry` check in
`src/generator/checks.ts`.

### Connectivity invariant

Every silhouette must render as **one 8-connected component with no floating pixels**
(a pixel with no neighbour in any of the 8 directions). Verified at both 16px and 32px
across all 42 silhouettes by the `Silhouettes stay connected` check in
`generator/checks.ts`.

8-connectivity is the correct test, not 4. At 16px each logical cell is exactly one
pixel, so a diagonal blade is a chain of pixels touching only at their corners — which
is precisely how vanilla Minecraft draws a sword. Judging that with 4-connectivity
flags every silhouette in the game, including Mojang's own.

What *is* a real defect, and what the earlier audits caught: features narrower than one
cell. The tassel and chain pommels were built at ~0.34 cells wide, which at 48px
(3px per cell) degenerated into genuinely isolated single pixels. Those are now at least
one full cell wide, and slim silhouettes drop particles, orbiting shards, spurs and
lightning through `applyFormRules()` because stray motes read as dirt at 16px.

## Server-pack presets (`category: "serverpack"`)

19 presets in the naming language of Japanese multiplayer servers — gem-named dungeon
drops (Garnet / Sapphire / Amethyst / Sardonyx / Tourmaline / Morganite) and compound
legendaries (氷律剣 ReVerence Code, 大威太刀 天零, 業鉄, 彗棘天淵, 金剛撃盾 TitanShield,
終焉の宝剣, 星の導き, 思念の業火, 絶幻の氷, 黒魔剣グラン, 宝剣レーヴァテイン, 星瞭海,
天衣無縫斬). These are the items a CIT-driven server pack actually needs to cover.

## Resource pack & mod pipeline (`src/vanilla/`)

A fully self-contained subsystem, independent from the procedural engine:

- **`pixmaps.ts`** — Mojang-faithful 16×16 9-index pixel maps for 13 vanilla items
  (sword, short blade, axe, pickaxe, shovel, hoe, trident, bow, crossbow, 1.21 mace,
  fishing rod, shield, netherite sword), aligned to `x + y = 15` with full 4-tone blade
  shading and outer borders. Also resolves Minecraft's irregular material prefixes
  (`gold` -> `golden_sword`, `wood` -> `wooden_axe`) via `vanillaTexturePath()`.
- **`renderer.ts`** — zero-interpolation renderer: palette lookup + nearest-neighbour
  upscale only. 11 authentic tier palettes (wood … netherite, plus copper, emerald,
  amethyst, prismarine and the 1.21 breeze rod).
- **`packBuilder.ts`** — assembles a drop-in `.zip`:
  - `pack.mcmeta` with the right `pack_format` for 10 supported MC versions
  - direct vanilla texture replacement
  - `CustomModelData` item models — legacy `overrides` **and** the 1.21.4+
    `range_dispatch` item-model-definition format
  - OptiFine **and** CIT Resewn `.properties` (both asset roots)
  - generated `README.txt` with give-commands and install steps
  - deduplicating stored-entry ZIP writer
  - procedural studio entries, saved presets, and server-pack preset entries can be mixed into the same zip
- **`VanillaLab.tsx` / `PackBuilderPanel.tsx`** — the two UI tabs.

## Preset families

`src/engine/presets.ts` ships 58 presets grouped into 12 families. The key insight:
**vanilla-faithful shapes + colour/decoration variation = infinite "系" (schools)**.

| Family | Examples |
|---|---|
| `serverpack` | アジ鯖Life-style: 氷律剣, 天零, レーヴァテイン, Garnet/Sapphire/Amethyst |
| `skyblock` | Hyperion, AOTV, Dark Claymore, Astraea, Livid Dagger |
| `fantasy` | Excalibur, Calamity Claymore, Voidwalker |
| `gemtools` | Ruby, Sapphire, Emerald, Topaz, Onyx — faithful vanilla silhouettes recoloured |
| `dragon` | Fire/Ice/Lightning Dragonsteel, Dragonbone, Witherborn Scythe |
| `machine` | Chainsaw Blade, Ion Repeater, Steamwork Axe |
| `magic` | Arcane Focus Blade, Necronomicon, Elemental Trinity |
| `holy` | Holy Avenger, Seraph Blade |
| `cursed` | Cursed Murmur, Bloodhunger, Void Devourer |
| `simple` | Iron Guard, Bronze Age, Obsidian Edge — zero decoration, pure readability |
| `rainbow` | Prismatic Blade, Chromatic Fang — iridescent hue-shifting |

Each family pins a coherent combination of `silhouette + surface + guard + handle + gem + FX`,
so "Ruby Sword" and "Cursed Murmur" never blur together.

## Silhouettes, guards and pommels

42 silhouettes including 1.21 Heavy Core Mace, Bow, Pickaxe, Trident, Battleaxe, Warpick, the Chinese `jian` (double-edged, distal taper), `liuyedao` (willow-leaf saber), `nine_ring` (dao with a serrated spine), `uchigatana`, `whip` (ultra-thin flexible blade), and 9 formless/beauty-first forms (`essence`, `lotus`, `geode`, `ribbon`, `spine`, `fractured`, `obelisk`, `fang`, `sakura`). 17 guards including the Chinese crescent `jian` guard, the Golden Order `sigil`, the deliberately unbalanced `asymmetric` guard, and `none` (Zangetsu). 13 pommels including `tassel` (Chinese jian) and `chain` (Tensa Zangetsu).

## Rendering & UI Modularization

- `src/engine/lighting.ts` owns the light direction and edge bevel helpers.
- `src/engine/surfaces.ts` owns surface patterns (42 essences).
- `src/engine/dither.ts` owns Bayer dithering for low-detail modes.
- `src/engine/geometry.ts` uses a shared blade-axis coordinate system for the grip, guard, blade, attachments, and effect anchors.
- `src/engine/shading.ts` owns static surface shading and material patterns.
- `src/engine/render.ts` prepares and caches static pixels, applies periodic effects, and performs premultiplied-alpha supersampling when enabled. `renderPixels` has no DOM dependency.
- `src/components/tabs/` splits each editor tab (`PresetTab`, `BladeTab`, `HiltTab`, `SpursTab`, `FxTab`, `ColorsTab`, `ExportTab`) into its own focused module, re-exported via `src/components/Tabs.tsx`.
- `src/utils/zip.ts` is the single deduplicating ZIP and binary-download utility shared across the entire studio.

## Checks

Open **Generate > Seed and generation notes > Rule self-check** in the workbench. The framework-free suite in `src/generator/checks.ts` verifies deterministic seeds, ownership, locks, scoped rerolls, explicit requests, theme reachability across all 42 silhouettes, UI category partition completeness, preset rendering across all 31 presets, procedural-detail seeds, undo/redo, transparency, 8-connectedness at 16px/32px, and animation looping.

## Export

`src/studio/exports.ts` provides PNG, clipboard copy, size-batch ZIP, vertical animation sprite-sheet ZIP (`.png` + `.png.mcmeta`), vanilla sword replacement pack ZIP, and `exportServerItem` (multiplayer server item ZIP with OptiFine / CIT Resewn `.properties` + `CustomModelData` models across 10 Minecraft versions from 1.16 to 1.21.4+). `PackBuilderPanel` also bundles procedural studio weapons and the 19 server-pack presets directly into multi-item resource packs.