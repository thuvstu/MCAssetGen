import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { packs, textures } from "@/db/schema";
import { getItem } from "@/lib/catalog";
import { DEFAULT_PALETTE, DEFAULT_SIGNATURE } from "@/lib/generate";
import { nid } from "@/lib/ids";
import { isRarity } from "@/lib/rarity";
import { toTextureDTO, type MixDTO } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function cleanMix(raw: unknown, fallback: string): MixDTO[] {
  if (!Array.isArray(raw) || !raw.length) return [{ id: fallback, weight: 1 }];
  return raw
    .map((m) => ({ id: String((m as MixDTO).id), weight: Number((m as MixDTO).weight) || 1 }))
    .filter((m) => m.id)
    .slice(0, 3);
}

export async function POST(request: Request, ctx: Ctx) {
  const { id: packId } = await ctx.params;
  const [pack] = await db.select().from(packs).where(eq(packs.id, packId)).limit(1);
  if (!pack) return Response.json({ error: "pack not found" }, { status: 404 });

  const body = (await request.json()) as {
    itemId?: string;
    rarity?: string;
    styleMix?: MixDTO[];
    signatureMix?: MixDTO[];
    seed?: number;
    resolution?: number;
    pixels?: number[];
    hueShift?: number;
    glow?: number;
    metallic?: number;
    chaos?: number;
    templateId?: string;
  };

  const item = body.itemId ? getItem(body.itemId) : undefined;
  if (!item) return Response.json({ error: "unknown item" }, { status: 400 });

  const resolution = body.resolution === 64 ? 64 : body.resolution === 32 ? 32 : 16;
  const pixels = Array.isArray(body.pixels) ? body.pixels : [];
  if (pixels.length !== resolution * resolution * 4) {
    return Response.json({ error: "pixels の長さが解像度と一致しません" }, { status: 400 });
  }

  const rarity = body.rarity && isRarity(body.rarity) ? body.rarity : item.rarity;
  const styleMix = cleanMix(body.styleMix, pack.styleId || DEFAULT_PALETTE);
  const signatureMix = cleanMix(body.signatureMix, pack.signatureId || DEFAULT_SIGNATURE);

  const payload = {
    itemId: item.id,
    name: item.name,
    category: item.category,
    rarity,
    styleMix,
    signatureMix,
    seed: Number.isFinite(body.seed) ? Math.floor(Number(body.seed)) : 1,
    resolution,
    pixels: pixels.map((n) => Math.max(0, Math.min(255, Math.round(Number(n) || 0)))),
    hueShift: Math.max(-180, Math.min(180, Math.round(body.hueShift ?? 0))),
    glow: Math.max(0, Math.min(100, Math.round(body.glow ?? 40))),
    metallic: Math.max(0, Math.min(100, Math.round(body.metallic ?? 45))),
    chaos: Math.max(0, Math.min(100, Math.round(body.chaos ?? 25))),
    templateId: body.templateId || item.templates[0]!,
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select()
    .from(textures)
    .where(and(eq(textures.packId, packId), eq(textures.itemId, item.id)))
    .limit(1);

  if (existing) {
    await db.update(textures).set(payload).where(eq(textures.id, existing.id));
    const [updated] = await db.select().from(textures).where(eq(textures.id, existing.id)).limit(1);
    return Response.json(toTextureDTO(updated!));
  }

  const row = { id: nid("tex"), packId, createdAt: new Date(), ...payload };
  await db.insert(textures).values(row);
  return Response.json(toTextureDTO(row), { status: 201 });
}
